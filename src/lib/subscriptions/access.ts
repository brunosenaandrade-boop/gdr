import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

export type AccessDenialReason =
  | "no_subscription"
  | "expired"
  | "refunded"
  | "canceled_expired"
  | "past_due"
  | "chargeback";

export type AccessResult =
  | { ok: true; status: SubscriptionStatus; daysRemaining: number | null }
  | { ok: false; reason: AccessDenialReason; status: SubscriptionStatus | null };

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "refunded"
  | "chargeback";

const PAST_DUE_GRACE_DAYS = 3;

/**
 * Verifica se o tenant tem acesso ativo.
 * - active + dentro do período → ok
 * - canceled + dentro do período → ok (pagou o ciclo, usa até o fim)
 * - past_due há menos de 3 dias → ok (grace period)
 * - resto → bloqueado
 *
 * Se `supabase` não for fornecido, usa service client.
 */
export async function hasActiveAccess(
  tenantId: string,
  supabase?: SupabaseClient,
): Promise<AccessResult> {
  const client = supabase ?? (await createServiceClient());

  const { data, error } = await client
    .from("subscriptions")
    .select("status, current_period_end, past_due_since")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    console.error("[access] Erro ao buscar subscription:", error.message);
    return { ok: false, reason: "no_subscription", status: null };
  }

  if (!data) {
    return { ok: false, reason: "no_subscription", status: null };
  }

  const status = data.status as SubscriptionStatus;
  const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
  const now = new Date();

  // active: ok se ainda no período (ou sem período definido — Mercado Pago subscription ativa sem end date)
  if (status === "active") {
    if (!periodEnd || periodEnd > now) {
      const daysRemaining = periodEnd
        ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return { ok: true, status, daysRemaining };
    }
    // passou do período mas status não foi atualizado pelo cron ainda
    return { ok: false, reason: "expired", status };
  }

  // canceled: manter acesso até current_period_end
  if (status === "canceled") {
    if (periodEnd && periodEnd > now) {
      const daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { ok: true, status, daysRemaining };
    }
    return { ok: false, reason: "canceled_expired", status };
  }

  // past_due: grace period de 3 dias
  if (status === "past_due") {
    const pastDueSince = data.past_due_since ? new Date(data.past_due_since) : null;
    if (pastDueSince) {
      const daysPastDue = Math.floor(
        (now.getTime() - pastDueSince.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysPastDue < PAST_DUE_GRACE_DAYS) {
        return { ok: true, status, daysRemaining: PAST_DUE_GRACE_DAYS - daysPastDue };
      }
    }
    return { ok: false, reason: "past_due", status };
  }

  if (status === "refunded") {
    return { ok: false, reason: "refunded", status };
  }

  if (status === "chargeback") {
    return { ok: false, reason: "chargeback", status };
  }

  // expired
  return { ok: false, reason: "expired", status };
}

/**
 * Verifica se está em trial (não usado agora — sem trial — mas reservado pra eventual futuro).
 */
export function isInTrial(_status: SubscriptionStatus): boolean {
  return false;
}
