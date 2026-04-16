import type { SupabaseClient } from "@supabase/supabase-js";

export type ScoreBreakdown = {
  saldo_positivo: number;
  pontualidade: number;
  constancia: number;
  recorrencias: number;
  diversidade: number;
  historico_positivo: number;
  maturidade: number;
};

export type ScoreTier = "muito_baixo" | "baixo" | "regular" | "bom" | "excelente";

export type ScoreResult = {
  score: number;
  tier: ScoreTier;
  emoji: string;
  label: string;
  breakdown: ScoreBreakdown;
};

const MAX = {
  saldo_positivo: 250,
  pontualidade: 200,
  constancia: 150,
  recorrencias: 100,
  diversidade: 100,
  historico_positivo: 150,
  maturidade: 50,
} as const;

export function classifyTier(score: number): { tier: ScoreTier; emoji: string; label: string } {
  if (score < 300) return { tier: "muito_baixo", emoji: "🔴", label: "Muito baixo" };
  if (score < 500) return { tier: "baixo", emoji: "🟠", label: "Baixo" };
  if (score < 700) return { tier: "regular", emoji: "🟡", label: "Regular" };
  if (score < 850) return { tier: "bom", emoji: "🟢", label: "Bom" };
  return { tier: "excelente", emoji: "💚", label: "Excelente" };
}

type Tx = {
  type: "receita" | "despesa";
  amount: number;
  status: string;
  category_id: string | null;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
};

type CalcInput = {
  tenantCreatedAt: string;
  transactionsLast30d: Tx[];
  transactionsLast6m: Tx[];
  overdueCount: number;
  recurringCount: number;
};

export function calculateFromData(input: CalcInput): ScoreResult {
  const breakdown: ScoreBreakdown = {
    saldo_positivo: 0,
    pontualidade: 0,
    constancia: 0,
    recorrencias: 0,
    diversidade: 0,
    historico_positivo: 0,
    maturidade: 0,
  };

  // 1. Saldo positivo (últimos 30 dias): % da receita que foi poupada
  const paid30 = input.transactionsLast30d.filter((t) => t.status === "pago");
  const receitas30 = paid30.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const despesas30 = paid30.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  if (receitas30 > 0) {
    const ratio = (receitas30 - despesas30) / receitas30;
    const clamped = Math.max(0, Math.min(0.3, ratio));
    breakdown.saldo_positivo = Math.round((clamped / 0.3) * MAX.saldo_positivo);
  }

  // 2. Pontualidade: 200 se nenhuma atrasada, -50 por atrasada até 0
  breakdown.pontualidade = Math.max(0, MAX.pontualidade - input.overdueCount * 50);

  // 3. Constância: média de lançamentos/semana nos últimos 30 dias
  const perWeek = input.transactionsLast30d.length / (30 / 7);
  const constanciaRatio = Math.min(1, perWeek / 7);
  breakdown.constancia = Math.round(constanciaRatio * MAX.constancia);

  // 4. Recorrências: >=5 = pontuação máxima
  breakdown.recorrencias = Math.round(Math.min(1, input.recurringCount / 5) * MAX.recorrencias);

  // 5. Diversidade: quantas categorias distintas usou nos últimos 30 dias
  const cats = new Set<string>();
  for (const t of input.transactionsLast30d) if (t.category_id) cats.add(t.category_id);
  breakdown.diversidade = Math.round(Math.min(1, cats.size / 5) * MAX.diversidade);

  // 6. Histórico positivo: quantos dos últimos 6 meses fecharam no positivo
  const monthsPositive = countPositiveMonths(input.transactionsLast6m, 6);
  breakdown.historico_positivo = Math.round((monthsPositive / 6) * MAX.historico_positivo);

  // 7. Maturidade: tempo de cadastro (12 meses = máximo)
  const ageMs = Date.now() - new Date(input.tenantCreatedAt).getTime();
  const ageMonths = ageMs / (30 * 24 * 3600 * 1000);
  breakdown.maturidade = Math.round(Math.min(1, ageMonths / 12) * MAX.maturidade);

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const score = Math.max(0, Math.min(1000, total));
  const { tier, emoji, label } = classifyTier(score);
  return { score, tier, emoji, label, breakdown };
}

function countPositiveMonths(txs: Tx[], months: number): number {
  const now = new Date();
  const buckets = new Map<string, { receitas: number; despesas: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthKey(d), { receitas: 0, despesas: 0 });
  }
  for (const tx of txs) {
    if (tx.status !== "pago") continue;
    const key = monthKey(new Date(tx.created_at));
    const b = buckets.get(key);
    if (!b) continue;
    if (tx.type === "receita") b.receitas += tx.amount;
    else b.despesas += tx.amount;
  }
  let positive = 0;
  for (const b of buckets.values()) {
    if (b.receitas > 0 && b.receitas - b.despesas > 0) positive++;
  }
  return positive;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Calcula o score financeiro de um tenant consultando o banco.
 */
export async function calculateTenantScore(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ScoreResult> {
  const now = Date.now();
  const d30 = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
  const d180 = new Date(now - 180 * 24 * 3600 * 1000).toISOString();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("created_at")
    .eq("id", tenantId)
    .maybeSingle();

  const tenantCreatedAt = tenant?.created_at ?? new Date().toISOString();

  const { data: txs30 } = await supabase
    .from("transactions")
    .select("type, amount, status, category_id, due_date, paid_date, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", d30);

  const { data: txs6m } = await supabase
    .from("transactions")
    .select("type, amount, status, category_id, due_date, paid_date, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", d180);

  const { count: overdueCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "atrasado");

  const { count: recurringCount } = await supabase
    .from("recurring_transactions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("active", true);

  return calculateFromData({
    tenantCreatedAt,
    transactionsLast30d: (txs30 ?? []) as Tx[],
    transactionsLast6m: (txs6m ?? []) as Tx[],
    overdueCount: overdueCount ?? 0,
    recurringCount: recurringCount ?? 0,
  });
}

export const SCORE_MAX = MAX;
