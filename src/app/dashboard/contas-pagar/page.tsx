import { getPendingAccounts, getCategories, getTenant } from "@/lib/supabase/queries";
import { ContasPagarClient } from "./client";

export default async function ContasPagarPage() {
  const [transactions, categories, tenant] = await Promise.all([
    getPendingAccounts("despesa"),
    getCategories("despesa"),
    getTenant(),
  ]);

  return (
    <ContasPagarClient
      transactions={transactions}
      categories={categories}
      tenantId={tenant?.id ?? ""}
    />
  );
}
