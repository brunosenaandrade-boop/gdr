import Link from "next/link";
import { getAllAffiliates } from "@/lib/affiliates/queries";
import { AdminShell } from "../layout";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function statusBadge(status: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-emerald-500/20 text-emerald-300" },
    suspended: { label: "Suspenso", className: "bg-amber-500/20 text-amber-300" },
    blocked: { label: "Bloqueado", className: "bg-red-500/20 text-red-300" },
  };
  return map[status] ?? { label: status, className: "bg-zinc-800 text-zinc-400" };
}

type SearchParams = Promise<{ search?: string; status?: string }>;

export default async function AdminAffiliatesPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const params = await searchParams;
  const affiliates = await getAllAffiliates({
    search: params.search,
    status: params.status,
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Afiliados</h1>
            <p className="text-sm text-zinc-400">{affiliates.length} afiliados cadastrados</p>
          </div>
          <Link
            href="/admin/affiliates/new"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg"
          >
            + Novo afiliado
          </Link>
        </div>

        <form className="flex gap-2">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Buscar por nome ou email..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos status</option>
            <option value="active">Ativo</option>
            <option value="suspended">Suspenso</option>
            <option value="blocked">Bloqueado</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg"
          >
            Filtrar
          </button>
        </form>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Comissão</th>
                <th className="text-right p-3">Vendas</th>
                <th className="text-right p-3">Pendente</th>
                <th className="text-right p-3">Pago</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => {
                const badge = statusBadge(a.status);
                return (
                  <tr key={a.id} className="border-t border-zinc-800 hover:bg-white/5">
                    <td className="p-3">{a.name}</td>
                    <td className="p-3 text-zinc-400 text-xs">{a.email}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {a.commissionRate.toFixed(0)}%
                    </td>
                    <td className="p-3 text-right">{a.salesCount}</td>
                    <td className="p-3 text-right text-amber-300">
                      {a.pendingCommissionCents > 0 ? formatCurrency(a.pendingCommissionCents) : "—"}
                    </td>
                    <td className="p-3 text-right text-emerald-300">
                      {a.paidCommissionCents > 0 ? formatCurrency(a.paidCommissionCents) : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/affiliates/${a.id}`}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {affiliates.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    Nenhum afiliado cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
