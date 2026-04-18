import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reconcilia compras Hotmart pendentes com um tenant recém-criado.
 *
 * Cenário: webhook PURCHASE_APPROVED chegou ANTES do usuário criar conta
 * pelo Flow do WhatsApp. O evento foi salvo com tenant_id=null.
 * Agora que o tenant existe, buscamos o evento pelo buyer_email e
 * criamos a subscription.
 */
export async function reconcilePendingPurchase(
  supabase: SupabaseClient,
  email: string,
  tenantId: string,
): Promise<{ reconciled: boolean }> {
  const normalizedEmail = email.toLowerCase();

  // Buscar eventos de compra sem tenant vinculado
  const { data: events } = await supabase
    .from("subscription_events")
    .select("id, event_type, payload")
    .is("tenant_id", null)
    .eq("processed", false)
    .in("event_type", ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"])
    .order("received_at", { ascending: false })
    .limit(10);

  if (!events || events.length === 0) return { reconciled: false };

  for (const evt of events) {
    const buyerEmail = (
      (evt.payload as Record<string, unknown>)?.data as Record<string, unknown>
    )?.buyer as Record<string, unknown>;
    const evtEmail = (buyerEmail?.email as string)?.toLowerCase();

    if (evtEmail !== normalizedEmail) continue;

    // Match! Extrair dados da compra
    const purchase = (
      (evt.payload as Record<string, unknown>)?.data as Record<string, unknown>
    )?.purchase as Record<string, unknown> | undefined;

    const subscription = (
      (evt.payload as Record<string, unknown>)?.data as Record<string, unknown>
    )?.subscription as Record<string, unknown> | undefined;

    const hotmartTransaction = (purchase?.transaction as string) ?? null;
    const subscriberCode = (
      (subscription?.subscriber as Record<string, unknown>)?.code as string
    ) ?? null;

    // Calcular período
    const endDate = (subscription?.end_date as string) ??
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Criar subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .upsert({
        tenant_id: tenantId,
        status: "active",
        hotmart_transaction: hotmartTransaction,
        hotmart_subscriber_code: subscriberCode,
        hotmart_buyer_email: normalizedEmail,
        current_period_end: endDate,
      }, { onConflict: "tenant_id" })
      .select("id")
      .maybeSingle();

    // Atualizar evento como processado + vincular tenant e subscription
    await supabase
      .from("subscription_events")
      .update({
        tenant_id: tenantId,
        subscription_id: sub?.id ?? null,
        processed: true,
        processing_error: null,
      })
      .eq("id", evt.id);

    console.log(`[reconcile] Compra reconciliada: email=${normalizedEmail} tenant=${tenantId}`);
    return { reconciled: true };
  }

  return { reconciled: false };
}
