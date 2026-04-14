import { getAllCoupons } from "@/lib/affiliates/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "../layout";
import { CouponsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [coupons, supabase] = await Promise.all([
    getAllCoupons(),
    createServiceClient(),
  ]);

  // Lista de afiliados pra select do form
  const { data: affiliatesData } = await supabase
    .from("affiliates")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  const affiliates = (affiliatesData ?? []).map((a) => ({ id: a.id, name: a.name }));

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Cupons</h1>
          <p className="text-sm text-zinc-400">{coupons.length} cupons cadastrados</p>
        </div>

        <CouponsClient coupons={coupons} affiliates={affiliates} />
      </div>
    </AdminShell>
  );
}
