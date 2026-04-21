import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "../layout";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

type LeadStatus = "pending" | "completed" | "abandoned";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    pending: { bg: "bg-amber-500/15 text-amber-300", label: "Pendente" },
    completed: { bg: "bg-emerald-500/15 text-emerald-300", label: "Completo" },
    abandoned: { bg: "bg-red-500/15 text-red-300", label: "Abandonado" },
  };
  const cfg = map[status] ?? { bg: "bg-zinc-500/15 text-zinc-300", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

type PageProps = {
  searchParams: Promise<{ status?: string; plan?: string }>;
};

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status as LeadStatus | undefined;
  const planFilter = params.plan as "mensal" | "anual" | undefined;

  const supabase = await createServiceClient();

  // Stats (últimos 30 dias)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalLast30 }, { count: completedLast30 }, { count: abandonedLast30 }, { count: pendingNow }] =
    await Promise.all([
      supabase.from("checkout_leads").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      supabase.from("checkout_leads").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", thirtyDaysAgo),
      supabase.from("checkout_leads").select("id", { count: "exact", head: true }).eq("status", "abandoned").gte("created_at", thirtyDaysAgo),
      supabase.from("checkout_leads").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const conversionRate = totalLast30 && totalLast30 > 0
    ? Math.round(((completedLast30 ?? 0) / totalLast30) * 100)
    : 0;

  // Listagem
  let query = supabase
    .from("checkout_leads")
    .select("id, email, plan_type, payment_method, has_bump, status, created_at, completed_at, tenant_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (planFilter) query = query.eq("plan_type", planFilter);

  const { data: leads } = await query;

  const exportHref = `/api/admin/leads/export${
    statusFilter || planFilter
      ? `?${new URLSearchParams({
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(planFilter ? { plan: planFilter } : {}),
        }).toString()}`
      : ""
  }`;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Leads de Checkout</h1>
            <p className="text-sm text-zinc-400">
              Emails capturados no modal /planos. Pendentes após 24h viram abandoned + email de recuperação.
            </p>
          </div>
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total 30d" value={totalLast30 ?? 0} />
          <StatCard label="Conversões 30d" value={completedLast30 ?? 0} accent="emerald" />
          <StatCard label="Abandonados 30d" value={abandonedLast30 ?? 0} accent="red" />
          <StatCard label="Conversão" value={`${conversionRate}%`} accent="blue" />
        </div>

        <div className="rounded-xl border border-zinc-500/30 bg-zinc-900/50 p-3">
          <p className="text-xs text-zinc-400">
            <strong className="text-amber-300">Pendentes agora:</strong> {pendingNow ?? 0} — podem virar compra ou abandonar nas próximas horas.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 text-xs">
          <FilterPill href="/admin/leads" active={!statusFilter && !planFilter} label="Todos" />
          <FilterPill href="/admin/leads?status=pending" active={statusFilter === "pending"} label="Pendentes" />
          <FilterPill href="/admin/leads?status=completed" active={statusFilter === "completed"} label="Completos" />
          <FilterPill href="/admin/leads?status=abandoned" active={statusFilter === "abandoned"} label="Abandonados" />
          <span className="mx-1 text-zinc-700">|</span>
          <FilterPill href="/admin/leads?plan=anual" active={planFilter === "anual"} label="Anual" />
          <FilterPill href="/admin/leads?plan=mensal" active={planFilter === "mensal"} label="Mensal" />
        </div>

        {/* Tabela */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Plano</th>
                  <th className="text-left p-3">Método</th>
                  <th className="text-left p-3">Bump</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Criado</th>
                  <th className="text-left p-3">Concluído</th>
                </tr>
              </thead>
              <tbody>
                {(leads ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500 text-sm">
                      Nenhum lead encontrado com esse filtro.
                    </td>
                  </tr>
                ) : (
                  (leads ?? []).map((lead) => (
                    <tr key={lead.id} className="border-t border-zinc-800 hover:bg-white/5">
                      <td className="p-3 font-mono text-xs">{lead.email}</td>
                      <td className="p-3 capitalize">{lead.plan_type}</td>
                      <td className="p-3 text-xs text-zinc-400">
                        {lead.payment_method === "recurring" ? "Assinatura" : "Pagamento único"}
                      </td>
                      <td className="p-3 text-xs">{lead.has_bump ? "✅" : "—"}</td>
                      <td className="p-3">{statusBadge(lead.status)}</td>
                      <td className="p-3 text-xs text-zinc-500">{formatDateTime(lead.created_at)}</td>
                      <td className="p-3 text-xs text-zinc-500">{formatDateTime(lead.completed_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          Exibindo os 200 leads mais recentes. Use CSV pra histórico completo.
        </p>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "emerald" | "red" | "blue";
}) {
  const color = accent === "emerald"
    ? "text-emerald-400"
    : accent === "red"
    ? "text-red-400"
    : accent === "blue"
    ? "text-blue-400"
    : "text-white";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition-colors ${
        active
          ? "bg-red-500/20 text-red-300 border border-red-500/30"
          : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:bg-zinc-800"
      }`}
    >
      {label}
    </Link>
  );
}
