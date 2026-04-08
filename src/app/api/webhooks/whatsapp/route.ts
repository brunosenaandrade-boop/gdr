import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleIncomingMessage } from "@/lib/whatsapp/webhook-handler";

// Rate limiter simples em memoria (por IP, janela de 60s)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max requests por IP por minuto
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Limpa entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// Tipos permitidos de mensagem
const ALLOWED_MESSAGE_TYPES = new Set(["text", "audio"]);

// GET: Webhook verification (Meta sends a challenge)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Incoming messages
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Validar content-type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const body = await request.text();

  // Verificar assinatura HMAC (obrigatorio se app_secret configurado)
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expectedSig =
      "sha256=" +
      crypto.createHmac("sha256", appSecret).update(body).digest("hex");

    // Comparacao timing-safe para evitar timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Parse seguro do JSON
  let data: any;
  try {
    data = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validar estrutura basica do payload Meta
  if (!data?.entry || !Array.isArray(data.entry)) {
    return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
  }

  // Extrair e processar mensagens
  for (const entry of data.entry) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      if (change.field !== "messages") continue;

      const messages = change.value?.messages ?? [];
      for (const message of messages) {
        // Validar campos obrigatorios
        if (!message.from || typeof message.from !== "string") continue;
        if (!ALLOWED_MESSAGE_TYPES.has(message.type)) continue;

        // Sanitizar numero (so digitos, 10-15 chars)
        const cleanFrom = message.from.replace(/\D/g, "");
        if (cleanFrom.length < 10 || cleanFrom.length > 15) continue;

        handleIncomingMessage({
          from: cleanFrom,
          type: message.type,
          text: message.type === "text" ? message.text : undefined,
          audio: message.type === "audio" ? message.audio : undefined,
        }).catch((err) => {
          console.error("Error processing WhatsApp message:", err);
        });
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
