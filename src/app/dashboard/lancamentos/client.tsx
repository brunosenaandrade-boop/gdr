"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LancamentoForm } from "@/components/lancamentos/lancamento-form";
import { deleteTransaction } from "@/lib/supabase/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Category, TransactionStatus } from "@/types";
import {
  Plus, ArrowUpRight, ArrowDownRight, Pencil, Trash2, Search,
  MessageSquare, Globe, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";

const statusConfig: Record<TransactionStatus, { variant: "success" | "warning" | "danger" | "default"; label: string }> = {
  pago: { variant: "success", label: "Pago" },
  pendente: { variant: "warning", label: "Pendente" },
  atrasado: { variant: "danger", label: "Atrasado" },
  cancelado: { variant: "default", label: "Cancelado" },
};

type Props = {
  transactions: Transaction[];
  categories: Category[];
  tenantId: string;
  totalCount: number;
  currentPage: number;
  filters: { type?: string; status?: string; search?: string };
};

export function LancamentosClient({ transactions, categories, tenantId, totalCount, currentPage, filters }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; description: string } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalCount / 25));

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams();
    const current = { type: filters.type ?? "", status: filters.status ?? "", q: filters.search ?? "" };
    if (key === "type") current.type = value;
    if (key === "status") current.status = value;
    if (key === "q") current.q = value;

    if (current.type) params.set("type", current.type);
    if (current.status) params.set("status", current.status);
    if (current.q) params.set("q", current.q);

    startTransition(() => router.push(`/dashboard/lancamentos?${params.toString()}`));
  }

  function clearFilters() {
    startTransition(() => router.push("/dashboard/lancamentos"));
  }

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("q", filters.search);
    if (page > 1) params.set("page", String(page));
    startTransition(() => router.push(`/dashboard/lancamentos?${params.toString()}`));
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError("");
    const result = await deleteTransaction(confirmDelete.id);
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setConfirmDelete(null);
    startTransition(() => router.refresh());
  }

  const hasFilters = !!(filters.type || filters.status || filters.search);

  return (
    <>
      <AppHeader title="Lançamentos" description={`${totalCount} lançamento${totalCount !== 1 ? "s" : ""}`}>
        <Button size="sm" onClick={() => { setEditData(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </AppHeader>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar descrição..."
                defaultValue={filters.search ?? ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateFilters("q", (e.target as HTMLInputElement).value);
                }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-40">
              <Select
                value={filters.type ?? ""}
                onChange={(e) => updateFilters("type", e.target.value)}
                placeholder="Tipo"
                options={[
                  { value: "receita", label: "Receita" },
                  { value: "despesa", label: "Despesa" },
                ]}
              />
            </div>
            <div className="w-40">
              <Select
                value={filters.status ?? ""}
                onChange={(e) => updateFilters("status", e.target.value)}
                placeholder="Status"
                options={[
                  { value: "pendente", label: "Pendente" },
                  { value: "pago", label: "Pago" },
                  { value: "atrasado", label: "Atrasado" },
                  { value: "cancelado", label: "Cancelado" },
                ]}
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {isPending ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Filter className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-500">Nenhum lançamento encontrado</p>
              <Button size="sm" onClick={() => { setEditData(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" /> Criar primeiro lançamento
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const st = statusConfig[tx.status];
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                            tx.type === "receita" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {tx.type === "receita" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">{tx.description}</TableCell>
                        <TableCell>
                          {tx.category ? (
                            <Badge variant="outline">{tx.category.name}</Badge>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </TableCell>
                        <TableCell>{tx.due_date ? formatDate(tx.due_date) : "-"}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {tx.source === "whatsapp" ? (
                            <MessageSquare className="h-4 w-4 text-emerald-500/60" />
                          ) : (
                            <Globe className="h-4 w-4 text-slate-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium tabular-nums ${
                            tx.type === "receita" ? "text-emerald-300" : "text-red-400"
                          }`}>
                            {tx.type === "receita" ? "+" : "-"}{formatCurrency(tx.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditData({
                                  id: tx.id, type: tx.type, description: tx.description,
                                  amount: tx.amount, category_id: tx.category_id,
                                  due_date: tx.due_date, paid_date: tx.paid_date,
                                  status: tx.status, notes: tx.notes,
                                });
                                setFormOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
                              aria-label="Editar lançamento"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setConfirmDelete({ id: tx.id, description: tx.description }); setDeleteError(""); }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              aria-label="Excluir lançamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
                  <span className="text-xs text-slate-500">
                    Página {currentPage} de {totalPages} ({totalCount} itens)
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <LancamentoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSuccess={() => startTransition(() => router.refresh())}
        categories={categories}
        tenantId={tenantId}
        editData={editData}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="Excluir lançamento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja excluir{" "}
            <span className="font-semibold text-white">
              &quot;{confirmDelete?.description}&quot;
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirmed}
              loading={deleting}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
