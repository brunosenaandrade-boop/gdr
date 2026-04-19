import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Atribui uma venda a um afiliado via cupom de desconto.
 *
 * Chamado pelo webhook do Mercado Pago quando um pagamento é aprovado.
 * O cupom é extraído do external_reference da preferência.
 *
 * Idempotente: se já existe affiliate_sale com esse gateway_transaction_id, ignora.
 */
export async function attributeAffiliateSale(params: {
  supabase: SupabaseClient;
  couponCode: string | null;
  subscriptionId: string | null;
  transactionId: string | null;
  saleAmountCents: number;
}): Promise<void> {
  const { supabase, couponCode, subscriptionId, transactionId, saleAmountCents } = params;

  if (!couponCode || !transactionId) return;

  // Idempotência
  const { data: existing } = await supabase
    .from("affiliate_sales")
    .select("id")
    .eq("gateway_transaction_id", transactionId)
    .maybeSingle();

  if (existing) return;

  // Buscar cupom e afiliado
  const { data: coupon } = await supabase
    .from("coupons")
    .select("affiliate_id, code, discount_pct")
    .eq("code", couponCode.toUpperCase())
    .eq("active", true)
    .maybeSingle();

  if (!coupon?.affiliate_id) return;

  // Buscar taxa de comissão do afiliado
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("commission_rate")
    .eq("id", coupon.affiliate_id)
    .maybeSingle();

  const commissionRate = affiliate?.commission_rate ?? 40;
  const commissionCents = Math.round(saleAmountCents * commissionRate / 100);

  await supabase.from("affiliate_sales").insert({
    affiliate_id: coupon.affiliate_id,
    subscription_id: subscriptionId,
    coupon_code: coupon.code,
    sale_amount_cents: saleAmountCents,
    commission_amount_cents: commissionCents,
    status: "pending",
    gateway_transaction_id: transactionId,
  });

  // Incrementar uses_count do cupom
  await supabase
    .from("coupons")
    .update({ uses_count: (coupon as Record<string, unknown>).uses_count as number + 1 })
    .eq("code", coupon.code);
}

/**
 * Revoga comissão de afiliado quando pagamento é reembolsado.
 */
export async function refundAffiliateSale(params: {
  supabase: SupabaseClient;
  transactionId: string;
}): Promise<void> {
  const { supabase, transactionId } = params;

  await supabase
    .from("affiliate_sales")
    .update({ status: "refunded" })
    .eq("gateway_transaction_id", transactionId)
    .eq("status", "pending");
}
