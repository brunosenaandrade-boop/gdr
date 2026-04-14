import Link from "next/link";
import { notFound } from "next/navigation";
import { getAffiliateDetail } from "@/lib/affiliates/queries";
import { AdminShell } from "../../layout";
import { AffiliateDetailClient } from "./detail-client";

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

export default async function AdminAffiliateDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAffiliateDetail(id);
  if (!detail) notFound();

  const { affiliate, coupons, stats, recentSales } = detail;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <Link href="/admin/affiliates" className="text-sm text-zinc-400 hover:text-white">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold mt-2">{affiliate.name}</h1>
          <p className="text-sm text-zinc-400">{affiliate.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Vendas ativas" value={stats.totalSalesCount.toString()} />
          <StatCard
            label="Comissão pendente"
            value={formatCurrency(stats.pendingCommissionCents)}
            accent="amber"
          />
          <StatCard
            label="Comissão paga"
            value={formatCurrency(stats.paidCommissionCents)}
            accent="emerald"
          />
          <StatCard
            label="Total ganho"
            value={formatCurrency(stats.totalCommissionCents)}
          />
        </div>

        <AffiliateDetailClient affiliate={affiliate} />

        {/* Cupons */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium">Cupons vinculados ({coupons.length})</h2>
            <Link href="/admin/coupons" className="text-xs text-red-400 hover:text-red-300">
              Gerenciar cupons →
            </Link>
          </div>
          {coupons.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              Sem cupons. Crie um em{" "}
              <Link href="/admin/coupons" className="text-red-400">Cupons</Link>.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="text-left p-3">Código</th>
                  <th className="text-right p-3">Desconto</th>
                  <th className="text-right p-3">Usos</th>
                  <th className="text-left p-3">Válido até</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.code} className="border-t border-zinc-800">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3 text-right">{c.discount_pct}%</td>
                    <td className="p-3 text-right">
                      {c.uses_count}
                      {c.max_uses ? ` / ${c.max_uses}` : ""}
                    </td>
                    <td className="p-3 text-xs text-zinc-400">{formatDate(c.valid_until)}</td>
                    <td className="p-3 text-xs">
                      {c.active ? (
                        <span className="text-emerald-400">Ativo</span>
                      ) : (
                        <span className="text-zinc-500">Inativo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Vendas recentes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-medium">Últimas vendas</h2>
          </div>
          {recentSales.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              Sem vendas registradas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Origem</th>
                  <th className="text-left p-3">Cupom</th>
                  <th className="text-right p-3">Venda</th>
                  <th className="text-right p-3">Comissão</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-800">
                    <td className="p-3 text-xs text-zinc-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-3 text-xs">{s.attribution_source}</td>
                    <td className="p-3 text-xs font-mono">{s.coupon_code ?? "—"}</td>
                    <td className="p-3 text-right text-xs font-mono">
                      {formatCurrency(s.sale_amount_cents)}
                    </td>
                    <td className="p-3 text-right text-xs font-mono text-emerald-300">
                      {formatCurrency(s.commission_amount_cents)}
                    </td>
                    <td className="p-3 text-xs uppercase">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: { label: string; value: string; accent?: "emerald" | "amber" }) {
  const color = accent === "emerald"
    ? "text-emerald-400"
    : accent === "amber"
      ? "text-amber-400"
      : "text-white";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-semibold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
