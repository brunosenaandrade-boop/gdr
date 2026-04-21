"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import type { Category, TransactionType, TransactionStatus } from "@/types";
import { createTransaction, updateTransaction } from "@/lib/supabase/actions";

type EditData = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category_id: string | null;
  due_date: string | null;
  paid_date: string | null;
  status: TransactionStatus;
  notes: string | null;
};

type LancamentoFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  tenantId: string;
  editData?: EditData | null;
};

export function LancamentoForm({ open, onClose, onSuccess, categories, tenantId, editData }: LancamentoFormProps) {
  const isEditing = editData && editData.id !== "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<TransactionType>(editData?.type ?? "despesa");
  const [description, setDescription] = useState(editData?.description ?? "");
  const [amount, setAmount] = useState(isEditing ? String((editData?.amount ?? 0) / 100) : "");
  const [categoryId, setCategoryId] = useState(editData?.category_id ?? "");
  const [dueDate, setDueDate] = useState(editData?.due_date ?? "");
  const [paidDate, setPaidDate] = useState(editData?.paid_date ?? "");
  const [status, setStatus] = useState<TransactionStatus>(editData?.status ?? "pendente");
  const [notes, setNotes] = useState(editData?.notes ?? "");

  // Sincroniza state quando modal abre com editData diferente (BUG #4 QA Round 2).
  // `useState(editData?.x ?? default)` só roda uma vez; editar registros diferentes
  // em sequência deixaria o form com dados da edição anterior.
  useEffect(() => {
    if (!open) return;
    setType(editData?.type ?? "despesa");
    setDescription(editData?.description ?? "");
    setAmount(editData && editData.id !== "" ? String((editData.amount ?? 0) / 100) : "");
    setCategoryId(editData?.category_id ?? "");
    setDueDate(editData?.due_date ?? "");
    setPaidDate(editData?.paid_date ?? "");
    setStatus(editData?.status ?? "pendente");
    setNotes(editData?.notes ?? "");
    setError("");
  }, [open, editData]);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Valor deve ser positivo");
      return;
    }
    if (amountCents > 9_999_999_999) {
      setError("Valor máximo: R$ 99.999.999,99");
      return;
    }
    if (!description.trim()) {
      setError("Descrição obrigatória");
      return;
    }

    setLoading(true);
    const payload = {
      type,
      description: description.trim(),
      amount: amountCents,
      category_id: categoryId || null,
      due_date: dueDate || null,
      paid_date: paidDate || null,
      status,
      notes: notes || null,
    };

    if (isEditing && !editData) return;

    const result = isEditing
      ? await updateTransaction(editData!.id, payload)
      : await createTransaction(payload);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Editar Lançamento" : "Novo Lançamento"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setType("receita"); setCategoryId(""); }}
            disabled={loading}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
              type === "receita"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            Receita
          </button>
          <button
            type="button"
            onClick={() => { setType("despesa"); setCategoryId(""); }}
            disabled={loading}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
              type === "despesa"
                ? "bg-red-500/15 text-red-300 border border-red-500/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            Despesa
          </button>
        </div>

        <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Conta de luz" disabled={loading} />
        <Input label="Valor (R$)" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" disabled={loading} />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Selecione..."
          options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Vencimento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={loading} />
          <Input label="Data Pagamento" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} disabled={loading} />
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TransactionStatus)}
          options={[
            { value: "pendente", label: "Pendente" },
            { value: "pago", label: "Pago" },
            { value: "atrasado", label: "Atrasado" },
            { value: "cancelado", label: "Cancelado" },
          ]}
        />

        <Textarea label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações opcionais..." disabled={loading} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} disabled={loading} className="flex-1">{isEditing ? "Salvar" : "Lançar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
