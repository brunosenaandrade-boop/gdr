import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago/client";
import { parseExternalReference } from "@/lib/mercadopago/checkout";

export const dynamic = "force-dynamic";

/**
 * API para processar pagamento via Checkout Transparente.
 * Recebe o formData do Payment Brick e cria o pagamento no Mercado Pago.
 */
export async function POST(request: NextRequest) {
  try {
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
        transaction_amount: Number(transaction_amount),
        installments: Number(installments) || 1,
        payer: {
          email: payer.email,
          identification: payer.identification || undefined,
        },
        external_reference: external_reference || undefined,
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.guardadinheiro.com.br"}/api/webhooks/mercadopago`,
        description: "Guarda Dinheiro — Assistente Financeiro",
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
