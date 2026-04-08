import { AppHeader } from "@/components/layout/app-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import {
  getDashboardStats,
  getRecentTransactions,
  getCashFlow,
  getCategoryBreakdown,
} from "@/lib/supabase/queries";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const [stats, transactions, cashFlow, categoryData] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(10),
    getCashFlow(30),
    getCategoryBreakdown(),
  ]);

  return (
    <>
      <AppHeader title="Dashboard" description="Visao geral do mes atual" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Saldo" value={stats.saldo} icon={Wallet} />
          <StatCard title="Receitas" value={stats.total_receitas} icon={TrendingUp} />
          <StatCard title="Despesas" value={stats.total_despesas} icon={TrendingDown} />
          <StatCard title="Contas Vencidas" value={stats.contas_vencidas} icon={AlertTriangle} isCurrency={false} />
        </div>

        <CashFlowChart data={cashFlow} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions transactions={transactions} />
          <CategoryBreakdown data={categoryData} />
        </div>
      </div>
    </>
  );
}
