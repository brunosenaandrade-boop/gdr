"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toggleRecurring, deleteRecurring } from "@/lib/supabase/recurring-actions";
import { Repeat, Pause, Play, Trash2, MessageSquare, Globe, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Recurrence = {
  id: string;
  type: "receita" | "despesa";
  description: string;
  amount: number;
  day_of_month: number;
  active: boolean;
  source: string;
  created_at: string;
  category: { name: string } | null;
};

type Props = {
  recurrences: Recurrence[];
};

export function RecorrenciasClient({ recurrences }: Props) {
  const [items, setItems] = useState(recurrences);
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleToggle(id: string, active: boolean) {
    setLoading(id);
    const result = await toggleRecurring(id, active);
    if (result.ok) {
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
    }
    setLoading(null);
  }

  async function handleDelete(id: string) {
    setLoading(id);
    const result = await deleteRecurring(id);
    if (result.ok) {
      setItems((prev) => prev.filter((r) => r.id !== id));
    }
    setLoading(null);
    setConfirmDelete(null);
  }

  const active = items.filter((r) => r.active);
  const inactive = items.filter((r) => !r.active);

  if (items.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Repeat className="h-12 w-12 text-emerald-500/30" />
            <div className="text-center">
              <p className="text-sm text-slate-400">Nenhuma recorrência cadastrada</p>
              <p className="text-xs text-slate-600 mt-1">
                Mande pelo WhatsApp: &quot;Tenho pra pagar 2 mil de aluguel todo dia 5&quot;
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Ativas</p>
          <p className="text-2xl font-bold text-white mt-1">{active.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total mensal (despesas)</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {formatCurrency(active.filter((r) => r.type === "despesa").reduce((s, r) => s + r.amount, 0))}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total mensal (receitas)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(active.filter((r) => r.type === "receita").reduce((s, r) => s + r.amount, 0))}
          </p>
        </Card>
      </div>

      {/* Lista ativas */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-300 mb-3">Recorrências ativas ({active.length})</h2>
          <div className="space-y-2">
            {active.map((r) => (
              <RecurrenceRow
                key={r.id}
                r={r}
                loading={loading === r.id}
                confirmDelete={confirmDelete === r.id}
                onToggle={() => handleToggle(r.id, false)}
                onDelete={() => handleDelete(r.id)}
                onConfirmDelete={() => setConfirmDelete(r.id)}
                onCancelDelete={() => setConfirmDelete(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista inativas */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Pausadas ({inactive.length})</h2>
          <div className="space-y-2 opacity-60">
            {inactive.map((r) => (
              <RecurrenceRow
                key={r.id}
                r={r}
                loading={loading === r.id}
                confirmDelete={confirmDelete === r.id}
                onToggle={() => handleToggle(r.id, true)}
                onDelete={() => handleDelete(r.id)}
                onConfirmDelete={() => setConfirmDelete(r.id)}
                onCancelDelete={() => setConfirmDelete(null)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecurrenceRow({
  r,
  loading,
  confirmDelete,
  onToggle,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  r: Recurrence;
  loading: boolean;
  confirmDelete: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            r.type === "receita" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {r.type === "receita" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200 truncate">{r.description}</span>
              {r.source === "whatsapp" ? (
                <MessageSquare className="h-3 w-3 text-emerald-500/50 shrink-0" />
              ) : (
                <Globe className="h-3 w-3 text-slate-600 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Dia {r.day_of_month} de cada mês</span>
              {r.category && <span>· {(r.category as { name: string }).name}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-sm font-semibold tabular-nums ${
            r.type === "receita" ? "text-emerald-400" : "text-red-400"
          }`}>
            {r.type === "receita" ? "+" : "-"}{formatCurrency(r.amount)}
          </span>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" onClick={onCancelDelete} disabled={loading}>
                Não
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={onDelete}
                loading={loading}
              >
                Sim
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onToggle} disabled={loading} title={r.active ? "Pausar" : "Reativar"}>
                {r.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onConfirmDelete} disabled={loading} title="Excluir">
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
