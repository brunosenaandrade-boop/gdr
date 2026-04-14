import type { SupabaseClient } from "@supabase/supabase-js";
import type { HotmartWebhookPayload } from "@/lib/hotmart/webhook-handler";

/**
 * Tenta atribuir uma compra Hotmart a um afiliado.
 *
 * Caminhos de atribuição (em ordem de prioridade):
 * 1. Cupom usado no checkout → match com tabela coupons
 * 2. Afiliado nativo Hotmart (commissions[] com source AFFILIATE)
 * 3. Não atribui (venda direta ou afiliado não cadastrado)
 *
 * Idempotente: se já existe affiliate_sale com esse hotmart_transaction, ignora.
 */
export async function attributeAffiliateSale(params: {
  supabase: SupabaseClient;
  payload: HotmartWebhookPayload;
  subscriptionId: string | null;
  eventId: string | null;
}): Promise<void> {
  const { supabase, payload, subscriptionId, eventId } = params;

  const transaction = payload.data?.purchase?.transaction;
  if (!transaction) return;

  // Idempotência: já existe?
  const { data: existing } = await supabase
    .from("affiliate_sales")
    .select("id")
    .eq("hotmart_transaction", transaction)
    .maybeSingle();
  if (existing) return;

  // Valor da venda em centavos
  const saleAmountCents = extractSaleAmountCents(payload);
  if (saleAmountCents <= 0) return;

  // ===== Caminho 1: Cupom =====
  const couponCode = extractCouponCode(payload);
  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("code, affiliate_id, active")
      .eq("code", couponCode.toUpperCase())
      .maybeSingle();

    if (coupon && coupon.active && coupon.affiliate_id) {
      await createAffiliateSale({
        supabase,
        affiliateId: coupon.affiliate_id,
        subscriptionId,
        couponCode: coupon.code,
        saleAmountCents,
        attributionSource: "coupon",
        hotmartTransaction: transaction,
        eventId,
      });
      // Incrementar uses_count (read + write — não atômico, ok pra MVP)
      const { data: c2 } = await supabase
        .from("coupons")
        .select("uses_count")
        .eq("code", coupon.code)
        .maybeSingle();
      if (c2) {
        await supabase
          .from("coupons")
          .update({ uses_count: (c2.uses_count ?? 0) + 1 })
          .eq("code", coupon.code);
      }
      return;
    }
  }

  // ===== Caminho 2: Afiliado Hotmart nativo =====
  const affiliateInfo = extractHotmartAffiliate(payload);
  if (affiliateInfo) {
    // Tenta match por email Hotmart ou código de afiliado
    let matchedAffiliate: { id: string } | null = null;

    if (affiliateInfo.code) {
      const { data } = await supabase
        .from("affiliates")
        .select("id")
        .eq("hotmart_affiliate_code", affiliateInfo.code)
        .maybeSingle();
      matchedAffiliate = data;
    }

    if (!matchedAffiliate && affiliateInfo.email) {
      const { data } = await supabase
        .from("affiliates")
        .select("id")
        .eq("hotmart_email", affiliateInfo.email.toLowerCase())
        .maybeSingle();
      matchedAffiliate = data;
    }

    if (matchedAffiliate) {
      await createAffiliateSale({
        supabase,
        affiliateId: matchedAffiliate.id,
        subscriptionId,
        couponCode: null,
        saleAmountCents,
        attributionSource: "hotmart_affiliate",
        hotmartTransaction: transaction,
        eventId,
      });
      return;
    }
  }

  // Sem atribuição
}

async function createAffiliateSale(params: {
  supabase: SupabaseClient;
  affiliateId: string;
  subscriptionId: string | null;
  couponCode: string | null;
  saleAmountCents: number;
  attributionSource: "coupon" | "hotmart_affiliate" | "manual";
  hotmartTransaction: string;
  eventId: string | null;
}): Promise<void> {
  const { supabase, affiliateId, saleAmountCents } = params;

  // Buscar comissão do afiliado
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("commission_rate, status")
    .eq("id", affiliateId)
    .maybeSingle();

  if (!affiliate || affiliate.status !== "active") return;

  const rate = Number(affiliate.commission_rate);
  const commissionCents = Math.round((saleAmountCents * rate) / 100);

  await supabase.from("affiliate_sales").insert({
    affiliate_id: affiliateId,
    subscription_id: params.subscriptionId,
    coupon_code: params.couponCode,
    sale_amount_cents: saleAmountCents,
    commission_amount_cents: commissionCents,
    commission_rate_applied: rate,
    status: "pending",
    attribution_source: params.attributionSource,
    hotmart_transaction: params.hotmartTransaction,
    hotmart_event_id: params.eventId,
  });
}

/**
 * Marca affiliate_sale como reembolsada quando a transação Hotmart
 * vira REFUNDED ou CHARGEBACK.
 */
export async function refundAffiliateSale(params: {
  supabase: SupabaseClient;
  hotmartTransaction: string;
}): Promise<void> {
  const { supabase, hotmartTransaction } = params;

  await supabase
    .from("affiliate_sales")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("hotmart_transaction", hotmartTransaction)
    .in("status", ["pending", "paid"]);
}

// ===== Helpers de extração defensiva =====

function extractSaleAmountCents(payload: HotmartWebhookPayload): number {
  const data = payload.data as unknown as {
    purchase?: {
      price?: { value?: number; currency_value?: string };
      full_price?: { value?: number };
    };
  };

  // Hotmart geralmente envia value em decimal (ex: 358.80 reais)
  const value = data.purchase?.price?.value ?? data.purchase?.full_price?.value;
  if (typeof value !== "number" || value <= 0) return 0;

  // Converter pra centavos
  return Math.round(value * 100);
}

function extractCouponCode(payload: HotmartWebhookPayload): string | null {
  const data = payload.data as unknown as {
    purchase?: { offer?: { code?: string }; coupon?: { code?: string } };
    offer?: { code?: string };
  };

  // Tenta múltiplos caminhos possíveis no payload
  return (
    data.purchase?.coupon?.code ??
    data.purchase?.offer?.code ??
    data.offer?.code ??
    null
  );
}

function extractHotmartAffiliate(payload: HotmartWebhookPayload): { code?: string; email?: string } | null {
  const data = payload.data as unknown as {
    affiliates?: Array<{ affiliate_code?: string; email?: string; name?: string }>;
    commissions?: Array<{ source?: string; user?: { email?: string }; commission_type?: string }>;
  };

  // Caminho 1: array affiliates[]
  if (Array.isArray(data.affiliates) && data.affiliates.length > 0) {
    const first = data.affiliates[0];
    return {
      code: first.affiliate_code ?? undefined,
      email: first.email ?? undefined,
    };
  }

  // Caminho 2: commissions[] com source AFFILIATE
  if (Array.isArray(data.commissions)) {
    const affiliateCommission = data.commissions.find(
      (c) => c.source === "AFFILIATE" || c.commission_type === "AFFILIATE",
    );
    if (affiliateCommission?.user?.email) {
      return { email: affiliateCommission.user.email };
    }
  }

  return null;
}
