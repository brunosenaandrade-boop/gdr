"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { formatCurrency } from "@/lib/utils";
import type { CashFlowEntry } from "@/types";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

type Props = {
  data: CashFlowEntry[];
  currentDays: number;
};

export function FluxoCaixaClient({ data, currentDays }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changePeriod(days: string) {
    startTransition(() => router.push(`/dashboard/fluxo-caixa?days=${days}`));
  }

  const totalReceitas = data.reduce((s, d) => s + d.receitas, 0);
  const totalDespesas = data.reduce((s, d) => s + d.despesas, 0);
  const saldoFinal = totalReceitas - totalDespesas;

  return (
    <>
      <AppHeader title="Fluxo de Caixa" description="Visualize entradas e saidas ao longo do tempo">
        <Select
          value={String(currentDays)}
          onChange={(e) => changePeriod(e.target.value)}
          options={[
            { value: "7", label: "7 dias" },
            { value: "15", label: "15 dias" },
            { value: "30", label: "30 dias" },
            { value: "60", label: "60 dias" },
            { value: "90", label: "90 dias" },
          ]}
        />
      </AppHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Entradas</p>
              <p className="text-lg font-semibold text-emerald-300 tabular-nums">{formatCurrency(totalReceitas)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Saidas</p>
              <p className="text-lg font-semibold text-red-400 tabular-nums">{formatCurrency(totalDespesas)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Saldo Período</p>
              <p className={`text-lg font-semibold tabular-nums ${saldoFinal >= 0 ? "text-emerald-300" : "text-red-400"}`}>
                {formatCurrency(saldoFinal)}
              </p>
            </div>
          </Card>
        </div>

        {isPending ? (
          <Card className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </Card>
        ) : (
          <CashFlowChart data={data} />
        )}
      </div>
    </>
  );
}
