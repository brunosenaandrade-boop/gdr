import { redirect } from "next/navigation";
import { getCurrentAffiliate } from "@/lib/affiliates/auth";
import { getAffiliateCoupons } from "@/lib/affiliates/queries";
import { AfiliadoShell } from "../layout";
import { MateriaisClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AfiliadoMateriaisPage() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/afiliado/login");

  const coupons = await getAffiliateCoupons(affiliate.affiliateId);
  const activeCoupons = coupons.filter((c) => c.active);

  return (
    <AfiliadoShell>
      <MateriaisClient
        affiliateName={affiliate.name}
        coupons={activeCoupons.map((c) => ({
          code: c.code,
          discountPct: c.discountPct,
        }))}
      />
    </AfiliadoShell>
  );
}
