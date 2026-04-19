import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPayment } from "@/lib/mercadopago/client";
import { parseExternalReference, getPlanDetails } from "@/lib/mercadopago/checkout";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

export const dynamic = "force-dynamic";

/**
 * Webhook Mercado Pago — recebe IPN (Instant Payment Notification).
 *
 * Eventos tratados:
 * - payment → verifica se approved → ativa subscription
 *
 * O MP envia: { action, data: { id }, type }
 * Precisamos buscar os detalhes do pagamento via API.
 */
export async function POST(request: NextRequest) {
  try {
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

    const paymentId = String(data.id);
    console.log(`[mercadopago] Webhook: type=${type} action=${action} payment_id=${paymentId}`);

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
