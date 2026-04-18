import { createServiceClient } from "@/lib/supabase/server";

export type AdminMetrics = {
  mrr: number;              // monthly recurring revenue (centavos)
  arr: number;              // annual recurring revenue (centavos)
  activeSubscriptions: number;
  totalTenants: number;
  newTenantsToday: number;
  newTenantsWeek: number;
  newTenantsMonth: number;
  churnRateMonth: number;   // percentual
  expiredCount: number;
  pastDueCount: number;
  aiCostTodayCents: number;
  aiCostMonthCents: number;
  aiCallsToday: number;
  botFailuresToday: number;
};

const PLAN_PRICE_CENTS = 29_90; // R$ 29,90/mês em centavos

/**
 * Métricas agregadas para o dashboard overview.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Subscriptions por status
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, canceled_at");

  const active = (subs ?? []).filter((s) => {
    if (s.status === "active") return true;
    if (s.status === "canceled" && s.current_period_end) {
      return new Date(s.current_period_end) > now;
    }
    return false;
  });

  const expiredCount = (subs ?? []).filter((s) => s.status === "expired").length;
  const pastDueCount = (subs ?? []).filter((s) => s.status === "past_due").length;
  const canceledInMonth = (subs ?? []).filter(
    (s) => s.canceled_at && new Date(s.canceled_at) >= new Date(startOfMonth),
  ).length;

  const mrr = active.length * PLAN_PRICE_CENTS;
  const arr = mrr * 12;

  // Tenants
  const { count: totalTenants = 0 } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: newTenantsToday = 0 } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay);

  const { count: newTenantsWeek = 0 } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo);

  const { count: newTenantsMonth = 0 } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  const churnBase = active.length + canceledInMonth;
  const churnRateMonth = churnBase > 0 ? (canceledInMonth / churnBase) * 100 : 0;

  // AI usage
  const { data: aiToday } = await supabase
    .from("ai_usage")
    .select("estimated_cost_cents")
    .gte("created_at", startOfDay);

  const { data: aiMonth } = await supabase
    .from("ai_usage")
    .select("estimated_cost_cents")
    .gte("created_at", startOfMonth);

  const aiCostTodayCents = (aiToday ?? []).reduce((s, r) => s + (r.estimated_cost_cents ?? 0), 0);
  const aiCostMonthCents = (aiMonth ?? []).reduce((s, r) => s + (r.estimated_cost_cents ?? 0), 0);

  // Bot failures today (fallback responses)
  const { count: botFailuresToday = 0 } = await supabase
    .from("whatsapp_conversation_log")
    .select("id", { count: "exact", head: true })
    .eq("direction", "out")
    .gte("created_at", startOfDay)
    .like("content", "%Não consegui identificar%");

  return {
    mrr,
    arr,
    activeSubscriptions: active.length,
    totalTenants: totalTenants ?? 0,
    newTenantsToday: newTenantsToday ?? 0,
    newTenantsWeek: newTenantsWeek ?? 0,
    newTenantsMonth: newTenantsMonth ?? 0,
    churnRateMonth,
    expiredCount,
    pastDueCount,
    aiCostTodayCents,
    aiCostMonthCents,
    aiCallsToday: (aiToday ?? []).length,
    botFailuresToday: botFailuresToday ?? 0,
  };
}

export type AdminUserRow = {
  tenantId: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: "pf" | "pj";
  createdAt: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  blocked: boolean;
  aiCostLast30dCents: number;
};

/**
 * Lista paginada de usuários para o admin.
 */
export async function getAdminUsers(opts: {
  search?: string;
  status?: string;
  blocked?: boolean;
  page?: number;
  perPage?: number;
}): Promise<{ data: AdminUserRow[]; count: number }> {
  const supabase = await createServiceClient();
  const page = opts.page ?? 1;
  const perPage = Math.min(opts.perPage ?? 25, 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Buscar email + WhatsApp pra poder filtrar por qualquer campo
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailByUserId = new Map<string, string>();
  const userIdByEmail = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    if (u.id && u.email) {
      emailByUserId.set(u.id, u.email);
      userIdByEmail.set(u.email.toLowerCase(), u.id);
    }
  }

  const { data: allLinks } = await supabase
    .from("whatsapp_links")
    .select("tenant_id, phone_number")
    .eq("verified", true);
  const phoneByTenant = new Map<string, string>();
  for (const l of allLinks ?? []) phoneByTenant.set(l.tenant_id, l.phone_number);

  let query = supabase
    .from("tenants")
    .select(`
      id, user_id, name, phone, type, created_at,
      subscriptions(status, current_period_end),
      user_rate_limits(blocked)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Busca por nome (padrão) — busca por email/telefone é feita client-side após query
  const searchDigitsOnly = opts.search?.replace(/\D/g, "");
  const isPhoneSearch = searchDigitsOnly && searchDigitsOnly.length >= 8;
  const isEmailSearch = opts.search?.includes("@");

  if (opts.search && !isPhoneSearch && !isEmailSearch) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data, count } = await query;

  // Agregar custo de IA últimos 30d por tenant
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("tenant_id, estimated_cost_cents")
    .gte("created_at", thirtyDaysAgo);

  const costByTenant = new Map<string, number>();
  for (const u of usage ?? []) {
    if (!u.tenant_id) continue;
    costByTenant.set(u.tenant_id, (costByTenant.get(u.tenant_id) ?? 0) + u.estimated_cost_cents);
  }

  let rows: AdminUserRow[] = (data ?? []).map((t: {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    type: string;
    created_at: string | null;
    subscriptions: { status: string; current_period_end: string | null } | { status: string; current_period_end: string | null }[] | null;
    user_rate_limits: { blocked: boolean | null } | { blocked: boolean | null }[] | null;
  }) => {
    const sub = Array.isArray(t.subscriptions) ? t.subscriptions[0] : t.subscriptions;
    const rl = Array.isArray(t.user_rate_limits) ? t.user_rate_limits[0] : t.user_rate_limits;
    return {
      tenantId: t.id,
      userId: t.user_id,
      name: t.name,
      email: emailByUserId.get(t.user_id) ?? null,
      phone: phoneByTenant.get(t.id) ?? t.phone,
      type: t.type as "pf" | "pj",
      createdAt: t.created_at ?? "",
      subscriptionStatus: sub?.status ?? "no_subscription",
      subscriptionEnd: sub?.current_period_end ?? null,
      blocked: rl?.blocked ?? false,
      aiCostLast30dCents: costByTenant.get(t.id) ?? 0,
    };
  });

  // Filtro client-side por telefone ou email (quando Supabase query não filtrou)
  if (isPhoneSearch && searchDigitsOnly) {
    rows = rows.filter((r) => r.phone?.includes(searchDigitsOnly));
  } else if (isEmailSearch && opts.search) {
    const emailSearch = opts.search.toLowerCase();
    rows = rows.filter((r) => r.email?.toLowerCase().includes(emailSearch));
  }

  // Filtros client-side (RLS + joins dificultam fazer server-side)
  let filtered = rows;
  if (opts.status) filtered = filtered.filter((r) => r.subscriptionStatus === opts.status);
  if (opts.blocked !== undefined) filtered = filtered.filter((r) => r.blocked === opts.blocked);

  return { data: filtered, count: count ?? 0 };
}

export async function getTenantDetail(tenantId: string) {
  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const { data: rateLimit } = await supabase
    .from("user_rate_limits")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const { data: whatsappLink } = await supabase
    .from("whatsapp_links")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("function_name, estimated_cost_cents, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", thirtyDaysAgo);

  const { count: transactionCount = 0 } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { data: authUser } = await supabase.auth.admin.getUserById(tenant.user_id);

  return {
    tenant,
    subscription,
    rateLimit,
    whatsappLink,
    usage: usage ?? [],
    transactionCount: transactionCount ?? 0,
    email: authUser?.user?.email ?? null,
    lastSignIn: authUser?.user?.last_sign_in_at ?? null,
  };
}

/**
 * Top usuários por custo de IA (últimos 30 dias).
 */
export async function getTopAICostUsers(limit = 20) {
  const supabase = await createServiceClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: usage } = await supabase
    .from("ai_usage")
    .select("tenant_id, estimated_cost_cents")
    .gte("created_at", thirtyDaysAgo);

  const costByTenant = new Map<string, number>();
  for (const u of usage ?? []) {
    if (!u.tenant_id) continue;
    costByTenant.set(u.tenant_id, (costByTenant.get(u.tenant_id) ?? 0) + u.estimated_cost_cents);
  }

  const sorted = Array.from(costByTenant.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const tenantIds = sorted.map(([id]) => id);
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .in("id", tenantIds);

  const nameById = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  return sorted.map(([tenantId, cents]) => ({
    tenantId,
    name: nameById.get(tenantId) ?? "?",
    costCents: cents,
  }));
}

/**
 * Top usuários por número de mensagens (últimos 7 dias).
 */
export async function getTopMessageUsers(limit = 20) {
  const supabase = await createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: msgs } = await supabase
    .from("whatsapp_conversation_log")
    .select("tenant_id")
    .eq("direction", "in")
    .gte("created_at", weekAgo);

  const countByTenant = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (!m.tenant_id) continue;
    countByTenant.set(m.tenant_id, (countByTenant.get(m.tenant_id) ?? 0) + 1);
  }

  const sorted = Array.from(countByTenant.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const tenantIds = sorted.map(([id]) => id);
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .in("id", tenantIds);

  const nameById = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  return sorted.map(([tenantId, count]) => ({
    tenantId,
    name: nameById.get(tenantId) ?? "?",
    messageCount: count,
  }));
}

export async function getAuditLog(limit = 100) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
