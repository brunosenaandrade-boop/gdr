import { getTransactions, getCategories, getTenant } from "@/lib/supabase/queries";
import { LancamentosClient } from "./client";

type Props = {
  searchParams: Promise<{ type?: string; status?: string; q?: string; page?: string }>;
};

export default async function LancamentosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");

  const [{ data: transactions, count }, categories, tenant] = await Promise.all([
    getTransactions({
      type: params.type,
      status: params.status,
      search: params.q,
      page,
      perPage: 25,
    }),
    getCategories(),
    getTenant(),
  ]);

  return (
    <LancamentosClient
      transactions={transactions}
      categories={categories}
      tenantId={tenant?.id ?? ""}
      totalCount={count}
      currentPage={page}
      filters={{ type: params.type, status: params.status, search: params.q }}
    />
  );
}
