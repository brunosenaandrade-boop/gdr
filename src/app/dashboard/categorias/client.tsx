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
import { createCategory, updateCategory, deleteCategory } from "@/lib/supabase/actions";
import type { Category, CategoryType } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

const COLORS = [
  "#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa",
  "#fb923c", "#22d3ee", "#f87171", "#4ade80", "#e879f9",
];

type Props = {
  categories: Category[];
  tenantId: string;
};

export function CategoriasClient({ categories, tenantId }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("despesa");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setEditId(null);
    setName("");
    setType("despesa");
    setColor(COLORS[0]);
    setError("");
    setFormOpen(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color ?? COLORS[0]);
    setError("");
    setFormOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) { setError("Nome obrigatório"); return; }
    setSaving(true);
    setError("");

    const payload = { name: name.trim(), type, color };
    const result = editId
      ? await updateCategory(editId, payload)
      : await createCategory(payload);

    setSaving(false);
    if (result.error) { setError(result.error); return; }

    setFormOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (!result.error) startTransition(() => router.refresh());
  }

  const receitas = categories.filter((c) => c.type === "receita");
  const despesas = categories.filter((c) => c.type === "despesa");

  return (
    <>
      <AppHeader title="Categorias" description="Organize seus lançamentos por categoria">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </AppHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-emerald-300">Receitas</h3>
              <Badge variant="success">{receitas.length}</Badge>
            </div>
            <div className="space-y-1">
              {receitas.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color ?? "#34d399" }} />
                    <span className="text-sm text-slate-200">{cat.name}</span>
                    {cat.is_default && <Badge variant="default">Padrão</Badge>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="rounded-lg p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!cat.is_default && (
                      <button onClick={() => handleDelete(cat.id)} className="rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {receitas.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-600">Nenhuma categoria de receita</p>
              )}
            </div>
          </Card>

          {/* Despesas */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-red-300">Despesas</h3>
              <Badge variant="danger">{despesas.length}</Badge>
            </div>
            <div className="space-y-1">
              {despesas.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color ?? "#f87171" }} />
                    <span className="text-sm text-slate-200">{cat.name}</span>
                    {cat.is_default && <Badge variant="default">Padrão</Badge>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="rounded-lg p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!cat.is_default && (
                      <button onClick={() => handleDelete(cat.id)} className="rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {despesas.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-600">Nenhuma categoria de despesa</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Editar Categoria" : "Nova Categoria"} size="sm">
        <div className="space-y-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alimentação" disabled={saving} />
          <Select
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType)}
            options={[
              { value: "receita", label: "Receita" },
              { value: "despesa", label: "Despesa" },
            ]}
          />
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Cor</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-all ${
                    color === c ? "ring-2 ring-white/30 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
