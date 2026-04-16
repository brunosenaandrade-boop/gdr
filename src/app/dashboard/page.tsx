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
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const [stats, transactions, cashFlow, categoryData, score] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(10),
    getCashFlow(30),
    getCategoryBreakdown(),
    getDashboardScore(),
  ]);

  return (
    <>
      <AppHeader title="Dashboard" description="Visão geral do mês atual" />

      <div className="p-6 space-y-6">
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
