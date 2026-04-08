import { getPendingAccounts, getCategories, getTenant } from "@/lib/supabase/queries";
import { ContasReceberClient } from "./client";

export default async function ContasReceberPage() {
  const [transactions, categories, tenant] = await Promise.all([
    getPendingAccounts("receita"),
    getCategories("receita"),
    getTenant(),
  ]);

  return (
    <ContasReceberClient
      transactions={transactions}
      categories={categories}
      tenantId={tenant?.id ?? ""}
    />
  );
}
