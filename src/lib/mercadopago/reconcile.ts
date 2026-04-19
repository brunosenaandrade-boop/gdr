import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reconcilia pagamentos Mercado Pago pendentes com um tenant recém-criado.
 * Mesmo conceito da reconciliação anterior: webhook pode chegar antes do cadastro.
 */
export async function reconcilePendingPurchase(
  supabase: SupabaseClient,
  email: string,
  tenantId: string,
): Promise<{ reconciled: boolean }> {
  const normalizedEmail = email.toLowerCase();

  const { data: events } = await supabase
    .from("subscription_events")
    .select("id, event_type, payload")
    .is("tenant_id", null)
    .eq("processed", false)
    .in("event_type", ["payment.approved"])
    .order("received_at", { ascending: false })
    .limit(10);

  if (!events || events.length === 0) return { reconciled: false };

  for (const evt of events) {
    const payload = evt.payload as Record<string, unknown>;
    const evtEmail = (
      (payload?.payer as Record<string, unknown>)?.email as string ??
      (payload?.data as Record<string, unknown>)?.buyer_email as string ??
      (payload as Record<string, unknown>)?.buyer_email as string
    )?.toLowerCase();

    if (!evtEmail || evtEmail !== normalizedEmail) continue;

    // Extrair plan_type do external_reference
    const extRef = (payload?.external_reference as string) ?? "";
    const planType = extRef.includes("mensal") ? "mensal" : "anual";
    const days = planType === "mensal" ? 30 : 365;
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("subscriptions").upsert({
      tenant_id: tenantId,
      status: "active",
      gateway: "mercadopago",
      gateway_transaction_id: (payload?.id as string) ?? null,
      buyer_email: normalizedEmail,
      plan_type: planType,
      current_period_end: periodEnd,
    }, { onConflict: "tenant_id" });

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    await supabase
      .from("subscription_events")
      .update({ tenant_id: tenantId, subscription_id: sub?.id ?? null, processed: true, processing_error: null })
      .eq("id", evt.id);

    console.log(`[reconcile] Compra MP reconciliada: email=${normalizedEmail} tenant=${tenantId}`);
    return { reconciled: true };
  }

  return { reconciled: false };
}
