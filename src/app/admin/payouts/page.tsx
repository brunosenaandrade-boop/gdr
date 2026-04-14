import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "../layout";
import { PayoutsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const supabase = await createServiceClient();

  const { data: pendingSales } = await supabase
    .from("affiliate_sales")
    .select(`
      id, sale_amount_cents, commission_amount_cents, coupon_code,
      attribution_source, hotmart_transaction, created_at,
      affiliates(id, name, email, pix_key, phone)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  type Row = {
    id: string;
    affiliateId: string;
    affiliateName: string;
    affiliateEmail: string;
    pixKey: string | null;
    phone: string | null;
    saleAmountCents: number;
    commissionAmountCents: number;
    couponCode: string | null;
    attributionSource: string;
    hotmartTransaction: string | null;
    createdAt: string;
  };

  const sales: Row[] = (pendingSales ?? []).flatMap((s) => {
    const aff = Array.isArray(s.affiliates) ? s.affiliates[0] : s.affiliates;
    if (!aff) return [];
    return [{
      id: s.id,
      affiliateId: aff.id,
      affiliateName: aff.name,
      affiliateEmail: aff.email,
      pixKey: aff.pix_key,
      phone: aff.phone,
      saleAmountCents: s.sale_amount_cents,
      commissionAmountCents: s.commission_amount_cents,
      couponCode: s.coupon_code,
      attributionSource: s.attribution_source,
      hotmartTransaction: s.hotmart_transaction,
      createdAt: s.created_at ?? "",
    }];
  });

  // Agregar por afiliado
  const byAffiliate = new Map<string, {
    affiliateId: string;
    name: string;
    email: string;
    pixKey: string | null;
    phone: string | null;
    sales: Row[];
    totalCommission: number;
  }>();

  for (const s of sales) {
    const curr = byAffiliate.get(s.affiliateId) ?? {
      affiliateId: s.affiliateId,
      name: s.affiliateName,
      email: s.affiliateEmail,
      pixKey: s.pixKey,
      phone: s.phone,
      sales: [],
      totalCommission: 0,
    };
    curr.sales.push(s);
    curr.totalCommission += s.commissionAmountCents;
    byAffiliate.set(s.affiliateId, curr);
  }

  const groups = Array.from(byAffiliate.values()).sort(
    (a, b) => b.totalCommission - a.totalCommission,
  );

  const grandTotal = sales.reduce((sum, s) => sum + s.commissionAmountCents, 0);

  return (
    <AdminShell>
      <PayoutsClient groups={groups} grandTotalCents={grandTotal} />
    </AdminShell>
  );
}
