"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LancamentoForm } from "@/components/lancamentos/lancamento-form";
import { markTransactionPaid } from "@/lib/supabase/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Category } from "@/types";
import { Plus, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

type Props = {
  transactions: Transaction[];
  categories: Category[];
  tenantId: string;
};

export function ContasReceberClient({ transactions, categories, tenantId }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleMarkReceived(id: string) {
    await markTransactionPaid(id);
    startTransition(() => router.refresh());
  }

  const vencidas = transactions.filter((t) => t.status === "atrasado");
  const pendentes = transactions.filter((t) => t.status === "pendente");
  const totalVencidas = vencidas.reduce((s, t) => s + t.amount, 0);
  const totalPendentes = pendentes.reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <AppHeader title="Contas a Receber" description="Receitas pendentes e vencidas">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
      </AppHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Vencidas</p>
              <p className="text-lg font-semibold text-red-400 tabular-nums">{formatCurrency(totalVencidas)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">A Receber</p>
              <p className="text-lg font-semibold text-emerald-400 tabular-nums">{formatCurrency(totalPendentes)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-semibold text-slate-200 tabular-nums">{formatCurrency(totalVencidas + totalPendentes)}</p>
            </div>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-500">Nenhuma conta a receber pendente</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-slate-200">{tx.description}</TableCell>
                    <TableCell>{tx.category?.name ?? "-"}</TableCell>
                    <TableCell>{tx.due_date ? formatDate(tx.due_date) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === "atrasado" ? "danger" : "warning"}>
                        {tx.status === "atrasado" ? "Vencida" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-emerald-300 font-medium tabular-nums">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleMarkReceived(tx.id)} disabled={isPending}>
                        Receber
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <LancamentoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => startTransition(() => router.refresh())}
        categories={categories}
        tenantId={tenantId}
      />
    </>
  );
}
