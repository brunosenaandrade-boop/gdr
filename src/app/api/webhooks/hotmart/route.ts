import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { handleHotmartEvent, type HotmartWebhookPayload } from "@/lib/hotmart/webhook-handler";

export const dynamic = "force-dynamic";

// Rate limiter simples por IP (60s window)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // Hotmart pode enviar múltiplos eventos em rajada
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

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

const ALLOWED_EVENTS = new Set([
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_PROTEST",
  "PURCHASE_DELAYED",
  "PURCHASE_CANCELED",
  "SUBSCRIPTION_CANCELLATION",
]);

/**
 * Webhook Hotmart v2 — recebe eventos de compra/assinatura.
 * Autenticação: header `x-hotmart-hottok` deve bater com env HOTMART_HOTTOK.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  // HOTTOK authentication
  const expectedHottok = process.env.HOTMART_HOTTOK;
  if (!expectedHottok) {
    console.error("[hotmart] HOTMART_HOTTOK não configurado");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const providedHottok =
    request.headers.get("x-hotmart-hottok") ??
    request.headers.get("X-HOTMART-HOTTOK") ??
    null;

  if (providedHottok !== expectedHottok) {
    console.warn("[hotmart] HOTTOK inválido");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: HotmartWebhookPayload;
  try {
    const raw = await request.text();
    if (raw.length > 100_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch (err) {
    console.error("[hotmart] JSON inválido:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validar produto (só aceita eventos do nosso produto)
  const expectedProductId = process.env.HOTMART_PRODUCT_ID;
  if (expectedProductId && body.data?.product?.id) {
    const productId = String(body.data.product.id);
    if (productId !== expectedProductId) {
      // Evento de outro produto (afiliação cruzada?) — ignora silenciosamente
      return NextResponse.json({ status: "ignored", reason: "other_product" });
    }
  }

  // Validar tipo de evento
  if (!body.event || !ALLOWED_EVENTS.has(body.event)) {
    return NextResponse.json({ status: "ignored", reason: "unknown_event" });
  }

  // Processar
  try {
    const result = await handleHotmartEvent(body);
    if (!result.ok) {
      console.error(`[hotmart] Falha ao processar ${body.event}: ${result.error}`);
      // Retorna 200 pra Hotmart não ficar retentando indefinidamente em casos como tenant_not_found
      // mas loga o erro pra investigação manual
      return NextResponse.json({ status: "error", error: result.error }, { status: 200 });
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[hotmart] Erro inesperado:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// GET: healthcheck + verificação inicial do webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "hotmart-webhook",
    version: "v2",
  });
}
