import { createClient } from "./server";
import type { Transaction, Category, Tenant, WhatsAppLink, CashFlowEntry, DashboardStats } from "@/types";

/** Retorna o tenant do usuario logado ou null */
export async function getTenant(): Promise<Tenant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tenants").select("*").maybeSingle();
  if (error) console.error("getTenant failed:", error.message);
  return data;
}

/** Categorias do tenant */
export async function getCategories(type?: "receita" | "despesa"): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").order("name");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) console.error("getCategories failed:", error.message);
  return data ?? [];
}

/** Lancamentos com paginacao */
export async function getTransactions(opts: {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{ data: Transaction[]; count: number }> {
  const supabase = await createClient();
  const page = opts.page ?? 1;
  const safePerPage = Math.min(opts.perPage ?? 25, 100);
  const from = (page - 1) * safePerPage;
  const to = from + safePerPage - 1;

  let query = supabase
    .from("transactions")
    .select("*, category:categories(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.type) query = query.eq("type", opts.type);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) query = query.ilike("description", `%${opts.search}%`);

  const { data, count, error } = await query;
  if (error) console.error("getTransactions failed:", error.message);
  return { data: (data ?? []) as Transaction[], count: count ?? 0 };
}

/** Contas pendentes/vencidas por tipo */
export async function getPendingAccounts(type: "receita" | "despesa"): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("type", type)
    .in("status", ["pendente", "atrasado"])
    .order("due_date", { ascending: true });
  if (error) console.error("getPendingAccounts failed:", error.message);
  return (data ?? []) as Transaction[];
}

/** Stats do dashboard (mês atual) */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: monthTx, error } = await supabase
    .from("transactions")
    .select("type, amount, status")
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);
  if (error) console.error("getDashboardStats failed:", error.message);

  let total_receitas = 0, total_despesas = 0, contas_vencidas = 0, contas_a_vencer = 0;

  for (const tx of monthTx ?? []) {
    if (tx.type === "receita" && tx.status === "pago") total_receitas += tx.amount;
    if (tx.type === "despesa" && tx.status === "pago") total_despesas += tx.amount;
    if (tx.status === "atrasado") contas_vencidas++;
    if (tx.status === "pendente") contas_a_vencer++;
  }

  return {
    total_receitas,
    total_despesas,
    saldo: total_receitas - total_despesas,
    contas_vencidas,
    contas_a_vencer,
  };
}

/** Últimos N lançamentos */
export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getRecentTransactions failed:", error.message);
  return (data ?? []) as Transaction[];
}

/** Breakdown por categoria (despesas pagas do mês) */
export async function getCategoryBreakdown(): Promise<{ name: string; value: number; color: string }[]> {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, category:categories(name, color)")
    .eq("type", "despesa")
    .eq("status", "pago")
    .gte("created_at", startOfMonth);
  if (error) console.error("getCategoryBreakdown failed:", error.message);

  const catMap: Record<string, { value: number; color: string }> = {};
  for (const tx of data ?? []) {
    const cat = tx.category as unknown as { name: string; color: string } | null;
    const catName = cat?.name ?? "Sem categoria";
    const catColor = cat?.color ?? "#64748b";
    if (!catMap[catName]) catMap[catName] = { value: 0, color: catColor };
    catMap[catName].value += tx.amount;
  }

  return Object.entries(catMap)
    .map(([name, { value, color }]) => ({ name, value, color }))
    .sort((a, b) => b.value - a.value);
}

/** Fluxo de caixa (ultimos N dias) */
export async function getCashFlow(days = 30): Promise<CashFlowEntry[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: flowTx, error } = await supabase
    .from("transactions")
    .select("type, amount, created_at")
    .eq("status", "pago")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) console.error("getCashFlow failed:", error.message);

  const byDate: Record<string, { receitas: number; despesas: number }> = {};
  for (let i = 0; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    byDate[d.toISOString().split("T")[0]] = { receitas: 0, despesas: 0 };
  }

  for (const tx of flowTx ?? []) {
    const key = tx.created_at.split("T")[0];
    if (byDate[key]) {
      if (tx.type === "receita") byDate[key].receitas += tx.amount;
      else byDate[key].despesas += tx.amount;
    }
  }

  let saldo = 0;
  return Object.entries(byDate).map(([date, vals]) => {
    saldo += vals.receitas - vals.despesas;
    return {
      date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      receitas: vals.receitas,
      despesas: vals.despesas,
      saldo,
    };
  });
}

/** WhatsApp link do tenant */
export async function getWhatsAppLink(): Promise<WhatsAppLink | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("whatsapp_links").select("*").maybeSingle();
  if (error) console.error("getWhatsAppLink failed:", error.message);
  return data;
}
