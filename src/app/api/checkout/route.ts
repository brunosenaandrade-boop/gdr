import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Preços válidos por plano (em reais)
const VALID_AMOUNTS: Record<string, number> = {
  mensal: 49.90,
  anual: 358.80,
};

// Rate limiter: max 5 req/min por IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
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

/**
 * API para processar pagamento via Checkout Transparente.
 * Recebe o formData do Payment Brick e cria o pagamento no Mercado Pago.
 *
 * Segurança:
 * - Validação de amount server-side (impede manipulação de preço)
 * - Rate limiting por IP (5 req/min)
 * - Sanitização de inputs
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
    }

    const body = await request.json();
    const {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      payer,
      external_reference,
    } = body;

    if (!token || !payment_method_id || !transaction_amount || !payer?.email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Extrair planType do external_reference para validar amount
    const ref = String(external_reference ?? "");
    const parts = ref.split("_");
    const planType = parts[1] ?? "";

    const expectedAmount = VALID_AMOUNTS[planType];
    if (!expectedAmount) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // Validar que o amount enviado é o correto (tolerância de R$ 0,01 para arredondamento)
    if (Math.abs(Number(transaction_amount) - expectedAmount) > 0.01) {
      console.error(`[checkout] Amount mismatch: received=${transaction_amount} expected=${expectedAmount} plan=${planType}`);
      return NextResponse.json({ error: "Valor incorreto" }, { status: 400 });
    }

    const { MercadoPagoConfig, Payment } = await import("mercadopago");
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        token,
        issuer_id: issuer_id || undefined,
        payment_method_id,
        transaction_amount: expectedAmount, // Usar o valor server-side, não o do client
        installments: Number(installments) || 1,
        payer: {
          email: payer.email,
          identification: payer.identification || undefined,
        },
        external_reference: external_reference || undefined,
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.guardadinheiro.com.br"}/api/webhooks/mercadopago`,
        description: `Guarda Dinheiro — Plano ${planType === "mensal" ? "Mensal" : "Anual"}`,
      },
    });

    if (!result?.id) {
      return NextResponse.json({ error: "Pagamento não processado" }, { status: 500 });
    }

    return NextResponse.json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[checkout] Payment error:", err);
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 500 });
  }
}
