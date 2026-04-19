import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "../layout";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function AdminSubscriptionsPage() {
  const supabase = await createServiceClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, tenants(id, name)")
    .order("updated_at", { ascending: false })
    .limit(100);

  // Eventos recentes
  const { data: events } = await supabase
    .from("subscription_events")
    .select("event_type, buyer_email, processed, processing_error, received_at")
    .order("received_at", { ascending: false })
    .limit(20);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Assinaturas</h1>
          <p className="text-sm text-zinc-400">Estado atual das assinaturas e eventos recentes</p>
        </div>

        {/* Lista */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-medium">Últimas subscriptions atualizadas</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Válida até</th>
                <th className="text-left p-3">Email Mercado Pago</th>
                <th className="text-left p-3">Atualizada</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(subs ?? []).map((s: {
                id: string;
                status: string;
                current_period_end: string | null;
                buyer_email: string | null;
                updated_at: string | null;
                tenants: { id: string; name: string } | null;
              }) => (
                <tr key={s.id} className="border-t border-zinc-800 hover:bg-white/5">
                  <td className="p-3">{s.tenants?.name ?? "—"}</td>
                  <td className="p-3 uppercase text-xs">{s.status}</td>
                  <td className="p-3">{formatDate(s.current_period_end)}</td>
                  <td className="p-3 text-xs text-zinc-400">{s.buyer_email ?? "—"}</td>
                  <td className="p-3 text-xs text-zinc-500">{formatDate(s.updated_at)}</td>
                  <td className="p-3 text-right">
                    {s.tenants?.id && (
                      <Link
                        href={`/admin/users/${s.tenants.id}`}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Ver →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Eventos recentes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-medium">Últimos eventos Mercado Pago</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3">Evento</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((e, i) => (
                <tr key={i} className="border-t border-zinc-800 hover:bg-white/5">
                  <td className="p-3 font-mono text-xs">{e.event_type}</td>
                  <td className="p-3 text-xs text-zinc-400">{e.buyer_email ?? "—"}</td>
                  <td className="p-3 text-xs">
                    {e.processed ? (
                      <span className="text-emerald-400">✅ processado</span>
                    ) : (
                      <span className="text-amber-400">
                        ⏭️ {e.processing_error ?? "pendente"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-zinc-500">
                    {e.received_at ? new Date(e.received_at).toLocaleString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
