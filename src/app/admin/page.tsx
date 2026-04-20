import Link from "next/link";
import { getAdminMetrics } from "@/lib/admin/queries";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { AdminShell } from "./layout";
import { TrendingUp, Users, CreditCard, AlertCircle, TrendingDown, UserPlus, ShieldAlert, Brain, Mail, Database, Zap, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function Card({
  title,
  value,
  icon: Icon,
  subtitle,
  accent = "emerald",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
  accent?: "emerald" | "blue" | "red" | "amber";
}) {
  const accentColor = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    red: "bg-red-500/10 text-red-400",
    amber: "bg-amber-500/10 text-amber-400",
  }[accent];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [m, admin] = await Promise.all([getAdminMetrics(), getCurrentAdmin()]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-sm text-zinc-400">Métricas em tempo real do Guarda Dinheiro</p>
        </div>

        {/* 2FA warning */}
        {admin && !admin.totpEnabled && (
          <Link
            href="/admin/security"
            className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition"
          >
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-200">Ative a autenticação em 2 fatores</p>
              <p className="text-xs text-amber-200/70 mt-1">
                Recomendamos fortemente ativar o 2FA pra proteger seu acesso administrativo. Leva 1
                minuto.
              </p>
            </div>
            <span className="text-amber-400 text-sm">Configurar →</span>
          </Link>
        )}

        {/* Revenue */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Receita</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="MRR"
              value={formatCurrency(m.mrr)}
              subtitle={`${m.activeSubscriptions} assinaturas ativas`}
              icon={TrendingUp}
              accent="emerald"
            />
            <Card
              title="ARR"
              value={formatCurrency(m.arr)}
              subtitle="Projeção anual"
              icon={TrendingUp}
              accent="emerald"
            />
            <Card
              title="Churn mensal"
              value={`${m.churnRateMonth.toFixed(1)}%`}
              icon={TrendingDown}
              accent={m.churnRateMonth > 10 ? "red" : "amber"}
            />
          </div>
        </div>

        {/* Users */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Usuários</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              title="Total de Tenants"
              value={m.totalTenants.toString()}
              icon={Users}
              accent="blue"
            />
            <Card
              title="Novos hoje"
              value={m.newTenantsToday.toString()}
              icon={UserPlus}
              accent="emerald"
            />
            <Card
              title="Novos essa semana"
              value={m.newTenantsWeek.toString()}
              icon={UserPlus}
              accent="emerald"
            />
            <Card
              title="Novos esse mês"
              value={m.newTenantsMonth.toString()}
              icon={UserPlus}
              accent="emerald"
            />
          </div>
        </div>

        {/* Subscriptions Status */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Status de Assinaturas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Ativas"
              value={m.activeSubscriptions.toString()}
              icon={CreditCard}
              accent="emerald"
            />
            <Card
              title="Expiradas"
              value={m.expiredCount.toString()}
              icon={AlertCircle}
              accent="amber"
            />
            <Card
              title="Pagamento pendente"
              value={m.pastDueCount.toString()}
              icon={AlertCircle}
              accent="red"
            />
          </div>
        </div>
        {/* AI Cost */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Custo de IA</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              title="Custo hoje"
              value={formatCurrency(m.aiCostTodayCents)}
              subtitle={`${m.aiCallsToday} chamadas`}
              icon={Brain}
              accent="amber"
            />
            <Card
              title="Custo do mês"
              value={formatCurrency(m.aiCostMonthCents)}
              icon={Brain}
              accent="amber"
            />
            <Card
              title="Custo/assinante"
              value={m.activeSubscriptions > 0 ? formatCurrency(Math.round(m.aiCostMonthCents / m.activeSubscriptions)) : "N/A"}
              subtitle={m.activeSubscriptions > 0 ? "por assinante ativo" : "sem assinantes"}
              icon={Brain}
              accent={m.activeSubscriptions > 0 && m.aiCostMonthCents / m.activeSubscriptions > 500 ? "red" : "emerald"}
            />
          </div>
        </div>
        {/* OpenAI Tokens */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">OpenAI — Tokens</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              title="Tokens hoje"
              value={m.aiTokensToday.toLocaleString("pt-BR")}
              subtitle={`${m.aiCallsToday} chamadas`}
              icon={Zap}
              accent="amber"
            />
            <Card
              title="Tokens do mês"
              value={m.aiTokensMonth.toLocaleString("pt-BR")}
              subtitle={`${m.aiCallsMonth} chamadas`}
              icon={Zap}
              accent="amber"
            />
            <Card
              title="Média tokens/chamada"
              value={m.aiCallsMonth > 0 ? Math.round(m.aiTokensMonth / m.aiCallsMonth).toLocaleString("pt-BR") : "N/A"}
              icon={Brain}
              accent="blue"
            />
            <Card
              title="Falhas do bot hoje"
              value={m.botFailuresToday.toString()}
              subtitle="msgs não compreendidas"
              icon={Brain}
              accent={m.botFailuresToday > 5 ? "red" : m.botFailuresToday > 0 ? "amber" : "emerald"}
            />
          </div>
        </div>

        {/* Resend — Emails */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Resend — Emails</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <Card
              title="Emails enviados hoje"
              value={m.emailsSentToday.toString()}
              icon={Mail}
              accent="blue"
            />
            <Card
              title="Emails enviados no mês"
              value={m.emailsSentMonth.toString()}
              icon={Mail}
              accent="blue"
            />
          </div>
        </div>

        {/* Banco de Dados */}
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Banco de Dados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              title="Transações"
              value={m.totalTransactions.toLocaleString("pt-BR")}
              icon={Database}
              accent="blue"
            />
            <Card
              title="Compromissos"
              value={m.totalAppointments.toLocaleString("pt-BR")}
              icon={Database}
              accent="blue"
            />
            <Card
              title="Mensagens WhatsApp"
              value={m.totalWhatsAppMessages.toLocaleString("pt-BR")}
              icon={MessageSquare}
              accent="emerald"
            />
            <Card
              title="Total de rows (estimado)"
              value={(m.totalTransactions + m.totalAppointments + m.totalWhatsAppMessages + m.totalTenants).toLocaleString("pt-BR")}
              icon={Database}
              accent="blue"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
