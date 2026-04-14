import { createServiceClient } from "@/lib/supabase/server";

export type AffiliateDashboardStats = {
  totalSalesCount: number;
  totalCommissionCents: number;
  pendingCommissionCents: number;
  paidCommissionCents: number;
  monthSalesCount: number;
  monthCommissionCents: number;
  lastSaleAt: string | null;
  nextPayoutEstimate: string; // próxima data do dia 5 do mês
};

export type AffiliateSaleRow = {
  id: string;
  saleAmountCents: number;
  commissionAmountCents: number;
  status: "pending" | "paid" | "refunded" | "canceled";
  attributionSource: "coupon" | "hotmart_affiliate" | "manual";
  couponCode: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type AffiliateCouponRow = {
  code: string;
  discountPct: number;
  usesCount: number;
  maxUses: number | null;
  validUntil: string | null;
  active: boolean;
  description: string | null;
};

function nextPayoutDate(): string {
  const now = new Date();
  // Pagamento roda dia 5 de cada mês
  let target = new Date(now.getFullYear(), now.getMonth(), 5);
  if (now > target) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  }
  return target.toISOString();
}

/**
 * Stats do dashboard do afiliado.
 */
export async function getAffiliateStats(affiliateId: string): Promise<AffiliateDashboardStats> {
  const supabase = await createServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: sales } = await supabase
    .from("affiliate_sales")
    .select("status, commission_amount_cents, created_at")
    .eq("affiliate_id", affiliateId);

  const list = sales ?? [];

  let totalCommission = 0;
  let pendingCommission = 0;
  let paidCommission = 0;
  let monthSalesCount = 0;
  let monthCommission = 0;
  let lastSaleAt: string | null = null;

  for (const s of list) {
    if (s.status === "refunded" || s.status === "canceled") continue;
    totalCommission += s.commission_amount_cents;
    if (s.status === "pending") pendingCommission += s.commission_amount_cents;
    if (s.status === "paid") paidCommission += s.commission_amount_cents;
    if (s.created_at && s.created_at >= startOfMonth) {
      monthSalesCount++;
      monthCommission += s.commission_amount_cents;
    }
    if (s.created_at && (!lastSaleAt || s.created_at > lastSaleAt)) {
      lastSaleAt = s.created_at;
    }
  }

  return {
    totalSalesCount: list.filter((s) => s.status !== "refunded" && s.status !== "canceled").length,
    totalCommissionCents: totalCommission,
    pendingCommissionCents: pendingCommission,
    paidCommissionCents: paidCommission,
    monthSalesCount,
    monthCommissionCents: monthCommission,
    lastSaleAt,
    nextPayoutEstimate: nextPayoutDate(),
  };
}

/**
 * Lista de vendas do afiliado.
 */
export async function getAffiliateSales(
  affiliateId: string,
  opts: { status?: string; page?: number; perPage?: number } = {},
): Promise<{ data: AffiliateSaleRow[]; count: number }> {
  const supabase = await createServiceClient();
  const page = opts.page ?? 1;
  const perPage = Math.min(opts.perPage ?? 25, 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("affiliate_sales")
    .select("*", { count: "exact" })
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.status) query = query.eq("status", opts.status);

  const { data, count } = await query;

  const rows: AffiliateSaleRow[] = (data ?? []).map((r) => ({
    id: r.id,
    saleAmountCents: r.sale_amount_cents,
    commissionAmountCents: r.commission_amount_cents,
    status: r.status as AffiliateSaleRow["status"],
    attributionSource: r.attribution_source as AffiliateSaleRow["attributionSource"],
    couponCode: r.coupon_code,
    createdAt: r.created_at ?? "",
    paidAt: r.paid_at,
  }));

  return { data: rows, count: count ?? 0 };
}

/**
 * Cupons vinculados a um afiliado.
 */
export async function getAffiliateCoupons(affiliateId: string): Promise<AffiliateCouponRow[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => ({
    code: c.code,
    discountPct: c.discount_pct,
    usesCount: c.uses_count,
    maxUses: c.max_uses,
    validUntil: c.valid_until,
    active: c.active,
    description: c.description,
  }));
}

// ============================================================
// Admin queries (listagem + detalhe)
// ============================================================

export type AdminAffiliateRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended" | "blocked";
  commissionRate: number;
  salesCount: number;
  pendingCommissionCents: number;
  paidCommissionCents: number;
  createdAt: string;
};

export async function getAllAffiliates(opts: {
  search?: string;
  status?: string;
} = {}): Promise<AdminAffiliateRow[]> {
  const supabase = await createServiceClient();

  let query = supabase
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts.search) {
    query = query.or(`name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`);
  }
  if (opts.status) query = query.eq("status", opts.status);

  const { data: affiliates } = await query;
  const list = affiliates ?? [];

  if (list.length === 0) return [];

  // Agregar vendas por afiliado
  const ids = list.map((a) => a.id);
  const { data: sales } = await supabase
    .from("affiliate_sales")
    .select("affiliate_id, status, commission_amount_cents")
    .in("affiliate_id", ids);

  const statsByAffiliate = new Map<string, {
    count: number;
    pending: number;
    paid: number;
  }>();

  for (const s of sales ?? []) {
    if (!s.affiliate_id) continue;
    if (s.status === "refunded" || s.status === "canceled") continue;
    const curr = statsByAffiliate.get(s.affiliate_id) ?? { count: 0, pending: 0, paid: 0 };
    curr.count++;
    if (s.status === "pending") curr.pending += s.commission_amount_cents;
    if (s.status === "paid") curr.paid += s.commission_amount_cents;
    statsByAffiliate.set(s.affiliate_id, curr);
  }

  return list.map((a) => {
    const stats = statsByAffiliate.get(a.id) ?? { count: 0, pending: 0, paid: 0 };
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      status: a.status as AdminAffiliateRow["status"],
      commissionRate: Number(a.commission_rate),
      salesCount: stats.count,
      pendingCommissionCents: stats.pending,
      paidCommissionCents: stats.paid,
      createdAt: a.created_at ?? "",
    };
  });
}

export async function getAffiliateDetail(affiliateId: string) {
  const supabase = await createServiceClient();

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .maybeSingle();

  if (!affiliate) return null;

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  const stats = await getAffiliateStats(affiliateId);

  const { data: recentSales } = await supabase
    .from("affiliate_sales")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    affiliate,
    coupons: coupons ?? [],
    stats,
    recentSales: recentSales ?? [],
  };
}

export async function getAllCoupons(): Promise<Array<{
  code: string;
  affiliate_id: string | null;
  affiliate_name: string | null;
  discount_pct: number;
  uses_count: number;
  max_uses: number | null;
  valid_until: string | null;
  active: boolean;
  description: string | null;
  created_at: string | null;
}>> {
  const supabase = await createServiceClient();

  const { data } = await supabase
    .from("coupons")
    .select("*, affiliates(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((c: {
    code: string;
    affiliate_id: string | null;
    affiliates: { name: string } | { name: string }[] | null;
    discount_pct: number;
    uses_count: number;
    max_uses: number | null;
    valid_until: string | null;
    active: boolean;
    description: string | null;
    created_at: string | null;
  }) => {
    const affiliate = Array.isArray(c.affiliates) ? c.affiliates[0] : c.affiliates;
    return {
      code: c.code,
      affiliate_id: c.affiliate_id,
      affiliate_name: affiliate?.name ?? null,
      discount_pct: c.discount_pct,
      uses_count: c.uses_count,
      max_uses: c.max_uses,
      valid_until: c.valid_until,
      active: c.active,
      description: c.description,
      created_at: c.created_at,
    };
  });
}
