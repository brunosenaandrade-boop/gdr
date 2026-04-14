import Link from "next/link";
import { getAuditLog } from "@/lib/admin/queries";
import { AdminShell } from "../layout";

export const dynamic = "force-dynamic";

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    "admin.login": "Login admin",
    "admin.logout": "Logout admin",
    "admin.2fa_enabled": "2FA ativado",
    "admin.direct_message": "Msg direta enviada",
    "tenant.suspend": "Usuário suspenso",
    "tenant.unsuspend": "Usuário reativado",
    "tenant.rate_limit_set": "Rate limit atualizado",
    "subscription.force_renew": "Assinatura renovada manualmente",
  };
  return labels[action] ?? action;
}

export default async function AdminAuditPage() {
  const log = await getAuditLog(200);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-zinc-400">Registro de todas as ações administrativas</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3">Ação</th>
                <th className="text-left p-3">Alvo</th>
                <th className="text-left p-3">Detalhes</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">Quando</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry) => (
                <tr key={entry.id} className="border-t border-zinc-800 hover:bg-white/5">
                  <td className="p-3">
                    <span className="font-medium">{actionLabel(entry.action)}</span>
                    <div className="text-xs text-zinc-500 font-mono">{entry.action}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {entry.target_tenant_id ? (
                      <Link
                        href={`/admin/users/${entry.target_tenant_id}`}
                        className="text-red-400 hover:text-red-300 font-mono"
                      >
                        {entry.target_tenant_id.slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-xs text-zinc-400">
                    {entry.details ? (
                      <pre className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                        {JSON.stringify(entry.details)}
                      </pre>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-xs font-mono text-zinc-500">
                    {String(entry.ip_address ?? "—")}
                  </td>
                  <td className="p-3 text-xs text-zinc-500">
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
              {log.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Nenhuma ação registrada ainda.
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
