"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import type { Transaction } from "@/types";
import { ArrowUpRight, ArrowDownRight, MessageSquare, Globe } from "lucide-react";

type RecentTransactionsProps = {
  transactions: Transaction[];
};

const statusBadge: Record<string, { variant: "success" | "warning" | "danger" | "default"; label: string }> = {
  pago: { variant: "success", label: "Pago" },
  pendente: { variant: "warning", label: "Pendente" },
  atrasado: { variant: "danger", label: "Atrasado" },
  cancelado: { variant: "default", label: "Cancelado" },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos Lançamentos</CardTitle>
      </CardHeader>
      <div className="space-y-1">
        {transactions.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Nenhum lançamento ainda</p>
        )}
        {transactions.map((tx) => {
          const badge = statusBadge[tx.status];
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    tx.type === "receita" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {tx.type === "receita" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-200">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.7rem] text-slate-500">
                      {formatRelativeDate(tx.created_at)}
                    </span>
                    {tx.source === "whatsapp" ? (
                      <MessageSquare className="h-3 w-3 text-emerald-500/50" />
                    ) : (
                      <Globe className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    tx.type === "receita" ? "text-emerald-300" : "text-red-400"
                  }`}
                >
                  {tx.type === "receita" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
