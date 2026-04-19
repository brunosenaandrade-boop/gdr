import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "../layout";
import { BumpsClient } from "./client";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function AdminBumpsPage() {
  const supabase = await createServiceClient();

  const { data: products } = await supabase
    .from("bump_products")
    .select("*")
    .order("created_at", { ascending: false });

  // Últimas 50 compras com dados do produto e tenant
  const { data: recentPurchases } = await supabase
    .from("purchase_bumps")
    .select(`
      id, product_id, bump_name, amount_cents,
      delivery_status, delivery_error, delivered_at, created_at,
      tenants(id, name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Order Bumps</h1>
          <p className="text-sm text-zinc-400">
            Catálogo de produtos extras vendidos no checkout Mercado Pago
          </p>
        </div>

        <BumpsClient
          products={(products ?? []).map((p) => ({
            id: p.id,
            product_id: p.product_id,
            name: p.name,
            description: p.description,
            amount_cents: p.amount_cents,
            active: p.active,
            files_count: Array.isArray(p.files) ? p.files.length : 0,
          }))}
        />

        {/* Compras recentes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-medium">Últimas compras de bumps</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Produto</th>
                <th className="text-right p-3">Valor</th>
                <th className="text-left p-3">Entrega</th>
                <th className="text-left p-3">Quando</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(recentPurchases ?? []).map((p: {
                id: string;
                bump_name: string;
                amount_cents: number;
                delivery_status: string;
                delivery_error: string | null;
                delivered_at: string | null;
                created_at: string | null;
                tenants: { id: string; name: string } | { id: string; name: string }[] | null;
              }) => {
                const t = Array.isArray(p.tenants) ? p.tenants[0] : p.tenants;
                return (
                  <tr key={p.id} className="border-t border-zinc-800 hover:bg-white/5">
                    <td className="p-3">{t?.name ?? "—"}</td>
                    <td className="p-3 text-xs">{p.bump_name}</td>
                    <td className="p-3 text-right font-mono text-xs">
                      {formatCurrency(p.amount_cents)}
                    </td>
                    <td className="p-3 text-xs">
                      {p.delivery_status === "delivered" && (
                        <span className="text-emerald-400">✅ Entregue</span>
                      )}
                      {p.delivery_status === "pending" && (
                        <span className="text-amber-400">⏳ Pendente</span>
                      )}
                      {p.delivery_status === "failed" && (
                        <span className="text-red-400" title={p.delivery_error ?? ""}>
                          ❌ {p.delivery_error ?? "Falhou"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-zinc-500">
                      {p.created_at ? new Date(p.created_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="p-3 text-right">
                      {p.delivery_status !== "delivered" && (
                        <form action={async () => {
                          "use server";
                          const { redeliverBump } = await import("@/lib/delivery/admin-actions");
                          await redeliverBump(p.id);
                        }}>
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Reenviar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(recentPurchases ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    Nenhuma compra de bump ainda.
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
