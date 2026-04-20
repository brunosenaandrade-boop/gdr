import { AppHeader } from "@/components/layout/app-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { FinancialScoreCard } from "@/components/dashboard/financial-score-card";
import {
  getDashboardStats,
  getRecentTransactions,
  getCashFlow,
  getCategoryBreakdown,
} from "@/lib/supabase/queries";
import { getDashboardScore } from "@/lib/supabase/score-actions";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, MessageSquare } from "lucide-react";

export default async function DashboardPage() {
  let stats = { saldo: 0, total_receitas: 0, total_despesas: 0, contas_vencidas: 0 };
  let transactions: Awaited<ReturnType<typeof getRecentTransactions>> = [];
  let cashFlow: Awaited<ReturnType<typeof getCashFlow>> = [];
  let categoryData: Awaited<ReturnType<typeof getCategoryBreakdown>> = [];
  let score: Awaited<ReturnType<typeof getDashboardScore>> = null;

  try {
    [stats, transactions, cashFlow, categoryData, score] = await Promise.all([
      getDashboardStats(),
      getRecentTransactions(10),
      getCashFlow(30),
      getCategoryBreakdown(),
      getDashboardScore(),
    ]);
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
  }

  return (
    <>
      <AppHeader title="Dashboard" description="Visão geral do mês atual" />

      <div className="p-6 space-y-6">
        {stats.saldo === 0 && stats.total_receitas === 0 && stats.total_despesas === 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <MessageSquare className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white">Bem-vindo ao Guarda Dinheiro!</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Seu painel está pronto. Mande seu primeiro lançamento pelo WhatsApp pra começar a ver seus dados aqui.
            </p>
            <p className="mt-3 text-xs text-emerald-300">
              Exemplo: &quot;Gastei 50 no mercado&quot; ou &quot;Recebi 1500 do cliente&quot;
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Saldo" value={stats.saldo} icon={Wallet} glow />
          <StatCard title="Receitas" value={stats.total_receitas} icon={TrendingUp} />
          <StatCard title="Despesas" value={stats.total_despesas} icon={TrendingDown} />
          <StatCard title="Contas Vencidas" value={stats.contas_vencidas} icon={AlertTriangle} isCurrency={false} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FinancialScoreCard score={score} />
          <div className="lg:col-span-2">
            <CashFlowChart data={cashFlow} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions transactions={transactions} />
          <CategoryBreakdown data={categoryData} />
        </div>
      </div>
    </>
  );
}
