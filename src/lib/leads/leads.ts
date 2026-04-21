import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/server";

export type PaymentMethod = "recurring" | "one-time";
export type PlanType = "mensal" | "anual";

type RecordOpts = {
  email: string;
  planType: PlanType;
  paymentMethod: PaymentMethod;
  hasBump: boolean;
  tenantId?: string | null;
  externalReference: string;
  mpPreferenceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Registra um lead de checkout antes do redirect pro Mercado Pago.
 * Non-blocking: falha de persistência não pode abortar o fluxo de compra.
 */
export async function recordCheckoutLead(opts: RecordOpts): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("checkout_leads").insert({
      email: opts.email.toLowerCase().trim(),
      plan_type: opts.planType,
      payment_method: opts.paymentMethod,
      has_bump: opts.hasBump,
      tenant_id: opts.tenantId ?? null,
      external_reference: opts.externalReference,
      mp_preference_id: opts.mpPreferenceId,
      ip_address: opts.ipAddress ?? null,
      user_agent: opts.userAgent ?? null,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[leads] recordCheckoutLead failed:", err);
  }
}

/**
 * Marca lead como completed quando webhook confirma pagamento aprovado.
 * Idempotente: só atualiza se ainda estiver pending.
 * Matching por external_reference (único por transação).
 */
export async function markLeadCompleted(externalReference: string): Promise<void> {
  if (!externalReference) return;
  try {
    const supabase = await createServiceClient();
    await supabase
      .from("checkout_leads")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("external_reference", externalReference)
      .eq("status", "pending");
  } catch (err) {
    Sentry.captureException(err);
    console.error("[leads] markLeadCompleted failed:", err);
  }
}
