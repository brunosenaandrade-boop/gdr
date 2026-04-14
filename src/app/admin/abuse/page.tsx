import Link from "next/link";
import { getTopAICostUsers, getTopMessageUsers } from "@/lib/admin/queries";
import { AdminShell } from "../layout";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function AdminAbusePage() {
  const [topCost, topMessages] = await Promise.all([
    getTopAICostUsers(25),
    getTopMessageUsers(25),
  ]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Detecção de Abuso</h1>
          <p className="text-sm text-zinc-400">Usuários com consumo acima do normal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top custo de IA 30d */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-sm font-medium">Top 25 — Custo de IA (30d)</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Considere bloquear/limitar usuários com custo muito alto
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-right p-3">Custo</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {topCost.map((u) => (
                  <tr key={u.tenantId} className="border-t border-zinc-800 hover:bg-white/5">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(u.costCents)}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/users/${u.tenantId}`}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
                {topCost.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500 text-xs">
                      Nenhum uso registrado nos últimos 30 dias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Top mensagens 7d */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-sm font-medium">Top 25 — Mensagens recebidas (7d)</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Muitas mensagens em pouco tempo = possível abuso
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-right p-3">Mensagens</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {topMessages.map((u) => (
                  <tr key={u.tenantId} className="border-t border-zinc-800 hover:bg-white/5">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3 text-right font-mono">{u.messageCount}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/users/${u.tenantId}`}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
                {topMessages.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500 text-xs">
                      Sem atividade nos últimos 7 dias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
