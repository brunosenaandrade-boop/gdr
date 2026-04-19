import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAffiliate } from "@/lib/affiliates/auth";
import { getAffiliateSales } from "@/lib/affiliates/queries";
import { AfiliadoShell } from "../layout";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function statusBadge(status: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
    paid: { label: "Pago", className: "bg-emerald-100 text-emerald-700" },
    refunded: { label: "Reembolsado", className: "bg-gray-100 text-gray-600" },
    canceled: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
  };
  return map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
}

type SearchParams = Promise<{ status?: string; page?: string }>;

export default async function AfiliadoVendasPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/afiliado/login");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const { data: sales, count } = await getAffiliateSales(affiliate.affiliateId, {
    status: params.status,
    page,
    perPage: 25,
  });

  const totalPages = Math.ceil(count / 25);

  return (
    <AfiliadoShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {count} venda{count !== 1 ? "s" : ""} atribuída{count !== 1 ? "s" : ""} a você
          </p>
        </div>

        {/* Filtros */}
        <form className="flex gap-2">
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos status</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagas</option>
            <option value="refunded">Reembolsadas</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg"
          >
            Filtrar
          </button>
        </form>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Origem</th>
                <th className="text-left p-3">Cupom</th>
                <th className="text-right p-3">Venda</th>
                <th className="text-right p-3">Sua comissão</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const badge = statusBadge(s.status);
                return (
                  <tr key={s.id} className="border-t border-gray-200">
                    <td className="p-3 text-xs text-gray-600">{formatDate(s.createdAt)}</td>
                    <td className="p-3 text-xs text-gray-600">
                      {s.attributionSource === "coupon" ? "Cupom" :
                        s.attributionSource === "mercadopago_affiliate" ? "Afiliado Mercado Pago" :
                        "Manual"}
                    </td>
                    <td className="p-3 font-mono text-xs">{s.couponCode ?? "—"}</td>
                    <td className="p-3 text-right text-xs font-mono">
                      {formatCurrency(s.saleAmountCents)}
                    </td>
                    <td className="p-3 text-right text-xs font-mono font-semibold text-emerald-700">
                      {formatCurrency(s.commissionAmountCents)}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{formatDate(s.paidAt)}</td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/afiliado/vendas?page=${page - 1}${params.status ? `&status=${params.status}` : ""}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/afiliado/vendas?page=${page + 1}${params.status ? `&status=${params.status}` : ""}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AfiliadoShell>
  );
}
