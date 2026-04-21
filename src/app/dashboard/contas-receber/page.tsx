import { getPendingAccounts, getCategories, getTenant } from "@/lib/supabase/queries";
import { ContasReceberClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ContasReceberPage() {
  const results = await Promise.allSettled([
    getPendingAccounts("receita"),
    getCategories("receita"),
    getTenant(),
  ]);

  const transactions = results[0].status === "fulfilled" ? results[0].value : [];
  const categories = results[1].status === "fulfilled" ? results[1].value : [];
  const tenant = results[2].status === "fulfilled" ? results[2].value : null;

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[contas-receber] query failed:", r.reason);
    }
  }

  return (
    <ContasReceberClient
      transactions={transactions}
      categories={categories}
      tenantId={tenant?.id ?? ""}
    />
  );
}
