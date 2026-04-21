import { getPendingAccounts, getCategories, getTenant } from "@/lib/supabase/queries";
import { ContasPagarClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ContasPagarPage() {
  // Promise.allSettled garante que uma query travada/lenta não prende a página
  // inteira em loading infinito — cai no error boundary ou renderiza com defaults.
  const results = await Promise.allSettled([
    getPendingAccounts("despesa"),
    getCategories("despesa"),
    getTenant(),
  ]);

  const transactions = results[0].status === "fulfilled" ? results[0].value : [];
  const categories = results[1].status === "fulfilled" ? results[1].value : [];
  const tenant = results[2].status === "fulfilled" ? results[2].value : null;

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[contas-pagar] query failed:", r.reason);
    }
  }

  return (
    <ContasPagarClient
      transactions={transactions}
      categories={categories}
      tenantId={tenant?.id ?? ""}
    />
  );
}
