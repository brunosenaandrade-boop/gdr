import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPayment } from "@/lib/mercadopago/client";
import { parseExternalReference, getPlanDetails } from "@/lib/mercadopago/checkout";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

export const dynamic = "force-dynamic";

// Rate limiter: max 10 req/min por IP (proteção contra DoS/spam)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

/**
 * Webhook Mercado Pago — recebe IPN (Instant Payment Notification).
 *
 * Segurança:
 * - Rate limiting por IP (10 req/min)
 * - Sanitização de payment ID (só números)
 * - Validação via payment.get() na API oficial do MP (nosso access token)
 * - Idempotência via gateway_event_id único no banco
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { type, data, action } = body;

    // MP pode enviar teste de conexão
    if (type === "test") {
      return NextResponse.json({ status: "ok" });
    }

    // Só processar pagamentos
    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ status: "ignored", type });
    }

    // Sanitizar payment ID: só aceitar números (previne injection)
    const rawId = String(data.id).replace(/\D/g, "");
    if (!rawId || rawId.length > 20) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }
    const paymentId = rawId;

    console.log("[mercadopago] Webhook: type=%s action=%s payment_id=%s", type, action, paymentId);

    const supabase = await createServiceClient();

    // Idempotência
    const { data: existing } = await supabase
      .from("subscription_events")
      .select("id")
      .eq("gateway_event_id", paymentId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: "already_processed" });
    }

    // Validação de segurança: buscar pagamento na API oficial do MP.
    // Se o ID for forjado, a API retorna erro — impossível ativar subscription falsa.
    const payment = getPayment();
    let paymentData;
    try {
      paymentData = await payment.get({ id: parseInt(paymentId, 10) });
    } catch (err) {
      console.error("[mercadopago] Falha ao verificar pagamento (possível fraude):", paymentId, err);
      return NextResponse.json({ error: "Payment verification failed" }, { status: 403 });
    }

    if (!paymentData || !paymentData.id) {
      console.error("[mercadopago] Pagamento não encontrado (possível ID forjado):", paymentId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const status = paymentData.status; // approved, pending, rejected, etc.
    const externalRef = paymentData.external_reference ?? "";
    const payerEmail = paymentData.payer?.email?.toLowerCase() ?? null;
    const amountPaid = paymentData.transaction_amount ?? 0;

    // Salvar evento (sempre, pra auditoria)
    const { tenantId: refTenantId, planType, couponCode } = parseExternalReference(externalRef);

    // Resolver tenant pelo external_reference ou email
    let tenantId = refTenantId;
    if (!tenantId && payerEmail) {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const user = authData?.users?.find((u) => u.email?.toLowerCase() === payerEmail);
      if (user) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        tenantId = tenant?.id ?? null;
      }
    }

    await supabase.from("subscription_events").insert({
      tenant_id: tenantId,
      event_type: `payment.${status}`,
      gateway_event_id: paymentId,
      buyer_email: payerEmail,
      payload: paymentData as unknown as import("@/types/supabase").Json,
      processed: false,
    });

    // Só processar se approved
    if (status !== "approved") {
      console.log(`[mercadopago] Pagamento ${paymentId} status=${status} — ignorado`);

      // Email de pagamento falhou (se temos email do pagador)
      if (payerEmail && (status === "rejected" || status === "cancelled")) {
        try {
          const { sendEmail } = await import("@/lib/email/resend");
          const { PaymentFailedEmail } = await import("@/lib/email/templates/payment-failed");
          await sendEmail({
            to: payerEmail,
            subject: "Problema no pagamento - Guarda Dinheiro",
            react: PaymentFailedEmail({
              planType: planType as "mensal" | "anual",
              retryUrl: "https://www.guardadinheiro.com.br/planos",
            }),
            idempotencyKey: `payment-failed-${paymentId}`,
            tags: [{ name: "category", value: "payment-failed" }],
          });
        } catch (err) {
          console.error("[mercadopago] Erro ao enviar email de pagamento falhou:", err);
        }
      }

      return NextResponse.json({ status: "ok", payment_status: status });
    }

    if (!tenantId) {
      console.warn(`[mercadopago] Pagamento aprovado sem tenant: payment_id=${paymentId} email=${payerEmail}`);
      // Será reconciliado quando o user criar conta pelo Flow
      return NextResponse.json({ status: "ok", warning: "tenant_not_found" });
    }

    // Ativar subscription
    const plan = getPlanDetails(planType);
    const periodEnd = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("subscriptions").upsert({
      tenant_id: tenantId,
      status: "active",
      gateway: "mercadopago",
      gateway_transaction_id: paymentId,
      buyer_email: payerEmail,
      plan_type: planType,
      current_period_end: periodEnd,
      canceled_at: null,
      refunded_at: null,
      past_due_since: null,
      renewal_link_sent_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });

    // Marcar evento como processado
    await supabase
      .from("subscription_events")
      .update({ processed: true })
      .eq("gateway_event_id", paymentId);

    // Atribuir afiliado via cupom
    if (couponCode) {
      try {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("affiliate_id, code")
          .eq("code", couponCode.toUpperCase())
          .eq("active", true)
          .maybeSingle();

        if (coupon?.affiliate_id) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("tenant_id", tenantId)
            .maybeSingle();

          const commissionRate = 40;
          const saleAmountCents = Math.round(amountPaid * 100);
          const commissionCents = Math.round(saleAmountCents * commissionRate / 100);

          await supabase.from("affiliate_sales").insert({
            affiliate_id: coupon.affiliate_id,
            subscription_id: sub?.id ?? null,
            coupon_code: coupon.code,
            sale_amount_cents: saleAmountCents,
            commission_amount_cents: commissionCents,
            commission_rate_applied: commissionRate,
            attribution_source: "coupon",
            status: "pending",
            gateway_transaction_id: paymentId,
          });
        }
      } catch (err) {
        console.error("[mercadopago] Erro ao atribuir afiliado:", err);
      }
    }

    // Notificar via WhatsApp
    const { data: link } = await supabase
      .from("whatsapp_links")
      .select("phone_number")
      .eq("tenant_id", tenantId)
      .eq("verified", true)
      .maybeSingle();

    if (link?.phone_number) {
      const planLabel = planType === "mensal" ? "Mensal" : "Anual";
      await sendWhatsAppMessage(
        link.phone_number,
        `Pagamento confirmado! 🎉\n\n` +
        `*Plano ${planLabel}* ativado com sucesso.\n` +
        `Acesso até: ${new Date(periodEnd).toLocaleDateString("pt-BR")}\n\n` +
        `Pode continuar usando o Guardinha normalmente! 💚`,
      );
    }

    // Email de pagamento confirmado
    try {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("name, user_id")
        .eq("id", tenantId)
        .maybeSingle();

      const recipientEmail = payerEmail ?? (tenantData?.user_id
        ? (await supabase.auth.admin.getUserById(tenantData.user_id)).data?.user?.email
        : null);

      if (recipientEmail) {
        const { sendEmail } = await import("@/lib/email/resend");
        const { PaymentConfirmedEmail } = await import("@/lib/email/templates/payment-confirmed");
        await sendEmail({
          to: recipientEmail,
          subject: "Pagamento confirmado - Guarda Dinheiro",
          react: PaymentConfirmedEmail({
            name: tenantData?.name,
            planType: planType as "mensal" | "anual",
            amount: amountPaid,
            periodEnd,
            transactionId: paymentId,
          }),
          idempotencyKey: `payment-confirmed-${paymentId}`,
          tags: [{ name: "category", value: "payment-confirmed" }],
        });
      }
    } catch (err) {
      console.error("[mercadopago] Erro ao enviar email de confirmação:", err);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mercadopago] Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET pra verificação do MP
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
