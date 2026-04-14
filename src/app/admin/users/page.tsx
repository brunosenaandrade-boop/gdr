import Link from "next/link";
import { getAdminUsers } from "@/lib/admin/queries";
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
    active: { label: "Ativa", className: "bg-emerald-500/20 text-emerald-300" },
    canceled: { label: "Cancelada", className: "bg-amber-500/20 text-amber-300" },
    expired: { label: "Expirada", className: "bg-zinc-700 text-zinc-300" },
    past_due: { label: "Pagto falhou", className: "bg-red-500/20 text-red-300" },
    refunded: { label: "Reembolsada", className: "bg-purple-500/20 text-purple-300" },
    chargeback: { label: "Chargeback", className: "bg-red-500/20 text-red-300" },
    no_subscription: { label: "Sem assinatura", className: "bg-zinc-800 text-zinc-400" },
  };
  return map[status] ?? { label: status, className: "bg-zinc-800 text-zinc-400" };
}

type SearchParams = Promise<{ page?: string; search?: string; status?: string; blocked?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const { data: users, count } = await getAdminUsers({
    search: params.search,
    status: params.status,
    blocked: params.blocked === "1" ? true : params.blocked === "0" ? false : undefined,
    page,
    perPage: 25,
  });

  const totalPages = Math.ceil(count / 25);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-zinc-400">{count} tenants cadastrados</p>
        </div>

        {/* Filtros */}
        <form className="flex gap-2">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Buscar por nome..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos status</option>
            <option value="active">Ativa</option>
            <option value="expired">Expirada</option>
            <option value="canceled">Cancelada</option>
            <option value="past_due">Pagto falhou</option>
            <option value="refunded">Reembolsada</option>
            <option value="no_subscription">Sem assinatura</option>
          </select>
          <select
            name="blocked"
            defaultValue={params.blocked ?? ""}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Bloqueio</option>
            <option value="1">Só bloqueados</option>
            <option value="0">Só ativos</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
          >
            Filtrar
          </button>
        </form>

        {/* Tabela */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Contato</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">IA 30d</th>
                <th className="text-left p-3">Criado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const badge = statusBadge(u.subscriptionStatus);
                return (
                  <tr key={u.tenantId} className="border-t border-zinc-800 hover:bg-white/5">
                    <td className="p-3">
                      <div className="font-medium">{u.name}</div>
                      {u.blocked && (
                        <span className="text-xs text-red-400">🚫 Bloqueado</span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-400">
                      <div>{u.email ?? "—"}</div>
                      <div className="text-xs">{u.phone ?? "sem whatsapp"}</div>
                    </td>
                    <td className="p-3 uppercase text-xs">{u.type}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.aiCostLast30dCents > 0 ? formatCurrency(u.aiCostLast30dCents) : "—"}
                    </td>
                    <td className="p-3 text-xs text-zinc-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/users/${u.tenantId}`}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/users?page=${page - 1}`}
                  className="px-3 py-1.5 border border-zinc-800 rounded-lg hover:bg-white/5"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/users?page=${page + 1}`}
                  className="px-3 py-1.5 border border-zinc-800 rounded-lg hover:bg-white/5"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
