import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCurrency } from "@/lib/utils";
import { generateResponse } from "@/lib/openai/generate-response";
import { calculateTenantScore } from "@/lib/score/calculate";

/**
 * Detecta se a mensagem é uma consulta financeira (não um lançamento).
 * Retorna true se for uma pergunta sobre dados existentes.
 */
export function isQuery(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return QUERY_PATTERNS.some((p) => p.test(lower));
}

const QUERY_PATTERNS: RegExp[] = [
  /^quanto\s+(gastei|recebi|paguei|tenho|devo|sobr)/i,
  /^qual\s+(meu\s+saldo|o\s+saldo|o\s+total|meu\s+score)/i,
  /^tenho\s+contas?\s+(a\s+pagar|vencid|pendent)/i,
  /^(me\s+)?mostr[ae]\s+(meu|minha|o|a|os|as)/i,
  /^(me\s+)?pass[ae]\s+(meu|o|a|um)/i,
  /^list[ae]\s+(meus|minhas|as|os|todas)/i,
  /^relat[oó]rio/i,
  /^resumo/i,
  /^como\s+(est[aá]|anda|t[aá])\s+(meu|minha)/i,
  /^como\s+(melhor(ar|o)|subir|aumentar)\s+(meu\s+)?score/i,
  /^estou\s+no\s+(positivo|negativo|vermelho|azul)/i,
  /^onde\s+(est[oó]u|eu)\s+(gastando|perdendo)/i,
  /^quanto\s+falta/i,
  /saldo\s*(atual|total|do\s*m[eê]s)?[\s?]*$/i,
  /\bmeu\s+score\b/i,
  /\bscore\s+financeiro\b/i,
  // Removido: /\?([\s]*)$/ capturava TUDO com ? ("Qual seu nome?" virava query financeira)
];

type QueryType =
  | "resumo_mes"
  | "saldo"
  | "receitas"
  | "despesas"
  | "contas_pagar"
  | "contas_vencidas"
  | "categoria"
  | "score"
  | "score_melhorar"
  | "geral";

function classifyQuery(text: string): { type: QueryType; categoryFilter?: string } {
  const lower = text.trim().toLowerCase();

  if (/como\s+(melhor|subir|aumentar)/i.test(lower) && /score/i.test(lower)) {
    return { type: "score_melhorar" };
  }
  if (/\bscore\b/i.test(lower)) return { type: "score" };
  if (/saldo/i.test(lower)) return { type: "saldo" };
  if (/contas?\s*(a\s+pagar|pendent)/i.test(lower)) return { type: "contas_pagar" };
  if (/contas?\s*vencid/i.test(lower)) return { type: "contas_vencidas" };
  if (/recebi|receit|entr(ou|ada)|ganh/i.test(lower)) return { type: "receitas" };
  if (/gastei|despes|sa[ií](u|da)|paguei/i.test(lower)) return { type: "despesas" };
  if (/resumo|relat[oó]rio|como\s+(est|anda|t[aá])|positivo|negativo/i.test(lower)) return { type: "resumo_mes" };

  // Detectar categoria na pergunta: "quanto gastei de alimentação"
  const catMatch = lower.match(/(?:gastei|paguei|recebi)\s+(?:de|em|com|no|na|nos|nas)\s+(.+?)[\s?]*$/);
  if (catMatch) {
    return { type: "categoria", categoryFilter: catMatch[1].trim() };
  }

  return { type: "geral" };
}

/**
 * Executa a consulta financeira e retorna a resposta formatada.
 * Os dados são buscados do banco e passados pela persona para resposta natural.
 */
export async function handleQuery(
  tenantId: string,
  text: string,
  supabase: SupabaseClient,
): Promise<string> {
  const rawData = await buildQueryData(tenantId, text, supabase);

  return generateResponse({
    action: "query_response",
    query: text,
    data: rawData,
  });
}

/**
 * Busca os dados reais do banco e retorna como texto estruturado (fallback-safe).
 */
async function buildQueryData(
  tenantId: string,
  text: string,
  supabase: SupabaseClient,
): Promise<string> {
  const { type, categoryFilter } = classifyQuery(text);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const mesNome = now.toLocaleDateString("pt-BR", { month: "long" }).replace(/^\w/, (c) => c.toUpperCase());

  switch (type) {
    case "saldo": {
      const stats = await getMonthStats(supabase, tenantId, startOfMonth, endOfMonth);
      const saldo = stats.receitas - stats.despesas;
      return (
        `Saldo em ${mesNome}:\n` +
        `Receitas: ${formatCurrency(stats.receitas)}\n` +
        `Despesas: ${formatCurrency(stats.despesas)}\n` +
        `Saldo: ${formatCurrency(saldo)} (${saldo >= 0 ? "positivo" : "negativo"})`
      );
    }

    case "receitas": {
      const stats = await getMonthStats(supabase, tenantId, startOfMonth, endOfMonth);
      return `Receitas em ${mesNome}: ${formatCurrency(stats.receitas)}`;
    }

    case "despesas": {
      const stats = await getMonthStats(supabase, tenantId, startOfMonth, endOfMonth);
      return `Despesas em ${mesNome}: ${formatCurrency(stats.despesas)}`;
    }

    case "contas_pagar": {
      const { data } = await supabase
        .from("transactions")
        .select("description, amount, due_date")
        .eq("tenant_id", tenantId)
        .eq("type", "despesa")
        .in("status", ["pendente", "atrasado"])
        .order("due_date", { ascending: true })
        .limit(10);

      if (!data || data.length === 0) {
        return "Nenhuma conta a pagar pendente.";
      }

      const lines = data.map((t) => {
        const venc = t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "sem data";
        return `• ${t.description} — ${formatCurrency(t.amount)} (vence ${venc})`;
      });

      return `Contas a pagar (${data.length}):\n${lines.join("\n")}`;
    }

    case "contas_vencidas": {
      const { data } = await supabase
        .from("transactions")
        .select("description, amount, due_date")
        .eq("tenant_id", tenantId)
        .eq("status", "atrasado")
        .order("due_date", { ascending: true })
        .limit(10);

      if (!data || data.length === 0) {
        return "Nenhuma conta vencida. Tudo em dia.";
      }

      const lines = data.map((t) => {
        const venc = t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "";
        return `• ${t.description} — ${formatCurrency(t.amount)} (venceu ${venc})`;
      });

      return `Contas vencidas (${data.length}):\n${lines.join("\n")}`;
    }

    case "score": {
      const result = await calculateTenantScore(supabase, tenantId);
      return (
        `Score financeiro: ${result.score} (0 a 1000)\n` +
        `Faixa: ${result.label} ${result.emoji}\n` +
        `Dica: pergunte "como melhorar meu score" pra ver o detalhamento.`
      );
    }

    case "score_melhorar": {
      const result = await calculateTenantScore(supabase, tenantId);
      const max: Record<string, number> = {
        saldo_positivo: 250,
        pontualidade: 200,
        constancia: 150,
        recorrencias: 100,
        diversidade: 100,
        historico_positivo: 150,
        maturidade: 50,
      };
      const gaps = Object.entries(result.breakdown)
        .map(([key, val]) => ({ key, val, max: max[key] ?? 100, gap: (max[key] ?? 100) - val }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 3);

      const labels: Record<string, string> = {
        saldo_positivo: "Poupe ao menos 30% da sua renda mensal",
        pontualidade: "Pague as contas no prazo (quitar atrasados)",
        constancia: "Lance suas movimentações regularmente (meta: 1/dia)",
        recorrencias: "Cadastre suas contas recorrentes (aluguel, salário, etc.)",
        diversidade: "Use categorias diferentes pra organizar melhor",
        historico_positivo: "Mantenha saldo positivo em mais meses",
        maturidade: "Use o app consistentemente — maturidade aumenta com o tempo",
      };

      return (
        `Seu score: ${result.score} ${result.emoji} (${result.label})\n\n` +
        `Oportunidades de melhoria:\n` +
        gaps.map((g, i) => `${i + 1}. ${labels[g.key] ?? g.key} (+${g.gap} possíveis)`).join("\n")
      );
    }

    case "categoria": {
      if (!categoryFilter) return buildQueryData(tenantId, "resumo", supabase);

      const { data } = await supabase
        .from("transactions")
        .select("amount, category:categories(name)")
        .eq("tenant_id", tenantId)
        .eq("status", "pago")
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);

      const normalizedFilter = categoryFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      let total = 0;
      let count = 0;
      let matchedName = categoryFilter;

      for (const tx of data ?? []) {
        const cat = tx.category as unknown as { name: string } | null;
        if (!cat) continue;
        const normalizedCat = cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (normalizedCat.includes(normalizedFilter) || normalizedFilter.includes(normalizedCat)) {
          total += tx.amount;
          count++;
          matchedName = cat.name;
        }
      }

      if (count === 0) {
        return `Nenhum gasto encontrado em "${categoryFilter}" este mês.`;
      }

      return `${matchedName} em ${mesNome}: ${count} lançamento${count > 1 ? "s" : ""} totalizando ${formatCurrency(total)}`;
    }

    case "resumo_mes":
    case "geral":
    default: {
      const stats = await getMonthStats(supabase, tenantId, startOfMonth, endOfMonth);

      const { count: pendentes } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["pendente", "atrasado"]);

      const { count: vencidas } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "atrasado");

      const saldo = stats.receitas - stats.despesas;

      return (
        `Resumo de ${mesNome}:\n` +
        `Receitas: ${formatCurrency(stats.receitas)}\n` +
        `Despesas: ${formatCurrency(stats.despesas)}\n` +
        `Saldo: ${formatCurrency(saldo)} (${saldo >= 0 ? "positivo" : "negativo"})\n` +
        `Contas pendentes: ${pendentes ?? 0}\n` +
        `Contas vencidas: ${vencidas ?? 0}\n` +
        `Painel: https://www.guardadinheiro.com.br/dashboard`
      );
    }
  }
}

async function getMonthStats(
  supabase: SupabaseClient,
  tenantId: string,
  start: string,
  end: string,
): Promise<{ receitas: number; despesas: number }> {
  const { data } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("tenant_id", tenantId)
    .eq("status", "pago")
    .gte("created_at", start)
    .lte("created_at", end);

  let receitas = 0;
  let despesas = 0;
  for (const tx of data ?? []) {
    if (tx.type === "receita") receitas += tx.amount;
    else despesas += tx.amount;
  }
  return { receitas, despesas };
}
