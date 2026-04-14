import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantDetail } from "@/lib/admin/queries";
import { AdminShell } from "../../layout";
import { UserActions } from "./actions-client";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTenantDetail(id);
  if (!detail) notFound();

  const { tenant, subscription, rateLimit, whatsappLink, usage, transactionCount, email, lastSignIn } = detail;

  const totalAICost = usage.reduce((sum, u) => sum + u.estimated_cost_cents, 0);
  const costByFunction = usage.reduce<Record<string, number>>((acc, u) => {
    acc[u.function_name] = (acc[u.function_name] ?? 0) + u.estimated_cost_cents;
    return acc;
  }, {});

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <Link href="/admin/users" className="text-sm text-zinc-400 hover:text-white">
            ← Voltar para usuários
          </Link>
          <h1 className="text-2xl font-semibold mt-2">{tenant.name}</h1>
          <p className="text-sm text-zinc-400">{email ?? "—"}</p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Perfil */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Perfil</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Tenant ID</dt><dd className="font-mono text-xs">{tenant.id.slice(0, 8)}…</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Tipo</dt><dd className="uppercase">{tenant.type}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Documento</dt><dd>{tenant.document || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Telefone</dt><dd>{tenant.phone || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Criado em</dt><dd>{formatDate(tenant.created_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Último login</dt><dd>{formatDate(lastSignIn)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Transações</dt><dd>{transactionCount}</dd></div>
            </dl>
          </div>

          {/* WhatsApp */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">WhatsApp</h2>
            {whatsappLink ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-500">Número</dt><dd className="font-mono">{whatsappLink.phone_number}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Verificado</dt><dd>{whatsappLink.verified ? "✅" : "❌"}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Vinculado em</dt><dd>{formatDate(whatsappLink.created_at)}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">Sem WhatsApp vinculado.</p>
            )}
            {whatsappLink && (
              <Link
                href={`/admin/users/${id}/conversations`}
                className="inline-block mt-3 text-xs text-red-400 hover:text-red-300"
              >
                Ver conversas →
              </Link>
            )}
          </div>

          {/* Subscription */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Assinatura</h2>
            {subscription ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-500">Status</dt><dd className="uppercase">{subscription.status}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Válida até</dt><dd>{formatDate(subscription.current_period_end)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Cancelada em</dt><dd>{formatDate(subscription.canceled_at)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Hotmart code</dt><dd className="font-mono text-xs">{subscription.hotmart_subscriber_code ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Email Hotmart</dt><dd className="text-xs">{subscription.hotmart_buyer_email ?? "—"}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">Sem assinatura.</p>
            )}
          </div>

          {/* AI Usage */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Uso de IA (30d)</h2>
            <div className="text-2xl font-semibold mb-3">{formatCurrency(totalAICost)}</div>
            <dl className="space-y-1 text-xs">
              {Object.entries(costByFunction).map(([fn, cost]) => (
                <div key={fn} className="flex justify-between">
                  <dt className="text-zinc-500">{fn}</dt>
                  <dd>{formatCurrency(cost)}</dd>
                </div>
              ))}
              {Object.keys(costByFunction).length === 0 && (
                <p className="text-zinc-500">Sem uso registrado.</p>
              )}
            </dl>
          </div>
        </div>

        {/* Ações */}
        <UserActions
          tenantId={tenant.id}
          blocked={rateLimit?.blocked ?? false}
          limits={{
            max_messages_per_day: rateLimit?.max_messages_per_day ?? 500,
            max_audio_seconds_per_day: rateLimit?.max_audio_seconds_per_day ?? 1800,
            ai_cost_limit_cents_per_day: rateLimit?.ai_cost_limit_cents_per_day ?? 500,
          }}
          hasPhone={!!whatsappLink?.phone_number}
        />
      </div>
    </AdminShell>
  );
}
