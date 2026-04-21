"use server";

import * as Sentry from "@sentry/nextjs";
import { createClient, createServiceClient } from "./server";
import { calculateTenantScore, type ScoreResult } from "@/lib/score/calculate";

export type ScoreHistoryEntry = {
  score: number;
  calculated_at: string;
};

export type DashboardScore = ScoreResult & {
  previous?: number;
  history: ScoreHistoryEntry[];
  isFresh: boolean; // true se recalculado agora (não tinha histórico do dia)
};

const DAY_MS = 24 * 3600 * 1000;

/**
 * Retorna o score atual do tenant logado.
 * Se o último cálculo foi há mais de 24h (ou nunca), recalcula on-demand e persiste.
 */
// Mínimo de lançamentos para considerar que há dados suficientes para um score representativo.
// Abaixo disso exibimos empty state (em vez de "200 - Muito baixo" que confunde o usuário).
const MIN_TRANSACTIONS_FOR_SCORE = 5;

export async function getDashboardScore(): Promise<DashboardScore | null> {
  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return null;

    const { count: txCount } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id);

    if ((txCount ?? 0) < MIN_TRANSACTIONS_FOR_SCORE) return null;

    const { data: history } = await supabase
      .from("financial_scores")
      .select("score, breakdown, calculated_at")
      .eq("tenant_id", tenant.id)
      .order("calculated_at", { ascending: false })
      .limit(12);

    const latest = history?.[0];
    const stale =
      !latest || Date.now() - new Date(latest.calculated_at).getTime() > DAY_MS;

    let current: ScoreResult;
    let isFresh = false;

    if (stale) {
      const service = await createServiceClient();
      current = await calculateTenantScore(service, tenant.id);
      await service
        .from("financial_scores")
        .insert({ tenant_id: tenant.id, score: current.score, breakdown: current.breakdown });
      isFresh = true;
    } else {
      const { classifyTier } = await import("@/lib/score/calculate");
      const { tier, emoji, label } = classifyTier(latest.score);
      current = {
        score: latest.score,
        tier,
        emoji,
        label,
        breakdown: latest.breakdown as ScoreResult["breakdown"],
      };
    }

    const previous = history && history.length > 1 ? history[1].score : undefined;

    return {
      ...current,
      previous,
      history: (history ?? []).map((h) => ({ score: h.score, calculated_at: h.calculated_at })),
      isFresh,
    };
  } catch (err) {
    Sentry.captureException(err);
    return null;
  }
}
