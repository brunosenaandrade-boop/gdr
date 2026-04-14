import { redirect } from "next/navigation";
import { getCurrentAffiliate } from "@/lib/affiliates/auth";
import { getAffiliateStats, getAffiliateCoupons } from "@/lib/affiliates/queries";
import { AfiliadoShell } from "./layout";
import { TrendingUp, Clock, CheckCircle2, ShoppingBag } from "lucide-react";

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

export default async function AfiliadoDashboardPage() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/afiliado/login");

  const [stats, coupons] = await Promise.all([
    getAffiliateStats(affiliate.affiliateId),
    getAffiliateCoupons(affiliate.affiliateId),
  ]);

  const activeCoupons = coupons.filter((c) => c.active);

  return (
    <AfiliadoShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {affiliate.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comissão de {affiliate.commissionRate.toFixed(0)}% por venda · Próximo pagamento em {formatDate(stats.nextPayoutEstimate)}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            icon={Clock}
            label="A receber"
            value={formatCurrency(stats.pendingCommissionCents)}
            accent="amber"
            help="Comissões pendentes de pagamento"
          />
          <Card
            icon={CheckCircle2}
            label="Já recebido"
            value={formatCurrency(stats.paidCommissionCents)}
            accent="emerald"
            help="Total já pago a você"
          />
          <Card
            icon={ShoppingBag}
            label="Vendas no mês"
            value={stats.monthSalesCount.toString()}
            help={`${formatCurrency(stats.monthCommissionCents)} em comissão`}
          />
          <Card
            icon={TrendingUp}
            label="Total de vendas"
            value={stats.totalSalesCount.toString()}
            help={`Última: ${stats.lastSaleAt ? formatDate(stats.lastSaleAt) : "—"}`}
          />
        </div>

        {/* Cupons ativos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Seus cupons ativos</h2>
              <p className="text-xs text-gray-500 mt-1">
                Compartilhe os códigos abaixo. Cada venda usando seu cupom é atribuída a você.
              </p>
            </div>
          </div>

          {activeCoupons.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              Você ainda não tem cupons ativos. Solicite ao administrador.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeCoupons.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <div>
                    <div className="font-mono text-lg font-semibold text-gray-900">{c.code}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {c.discountPct > 0 ? `${c.discountPct}% de desconto` : "Tracking apenas"}
                      {c.maxUses && ` · ${c.usesCount}/${c.maxUses} usos`}
                      {!c.maxUses && c.usesCount > 0 && ` · ${c.usesCount} usos`}
                    </div>
                  </div>
                  {c.discountPct > 0 && (
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                      -{c.discountPct}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AfiliadoShell>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  help,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  help?: string;
  accent?: "emerald" | "amber";
}) {
  const accentBg = accent === "emerald"
    ? "bg-emerald-100 text-emerald-700"
    : accent === "amber"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-700";
  const valueColor = accent === "emerald"
    ? "text-emerald-700"
    : accent === "amber"
      ? "text-amber-700"
      : "text-gray-900";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      {help && <div className="text-xs text-gray-500 mt-1">{help}</div>}
    </div>
  );
}
