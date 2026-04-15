"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBumpProduct } from "@/lib/delivery/admin-actions";

type Product = {
  id: string;
  hotmart_product_id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  active: boolean;
  files_count: number;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function BumpsClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSave(id: string, formData: FormData) {
    setError("");
    const input = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      hotmart_product_id: String(formData.get("hotmart_product_id") ?? ""),
      amount_cents: Math.round(parseFloat(String(formData.get("amount") ?? "0")) * 100),
    };
    startTransition(async () => {
      const res = await updateBumpProduct(id, input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  async function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await updateBumpProduct(id, { active: !currentlyActive });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium">Produtos cadastrados ({products.length})</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Pra criar um novo bump, use o script <code>seed-bump-product.mjs</code> ou adicione direto no Supabase.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nenhum bump cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {products.map((p) => (
              <div key={p.id} className="p-4">
                {editingId === p.id ? (
                  <form
                    action={(formData) => handleSave(p.id, formData)}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Nome</label>
                        <input
                          name="name"
                          defaultValue={p.name}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          ID Hotmart (obrigatório pra matching)
                        </label>
                        <input
                          name="hotmart_product_id"
                          defaultValue={p.hotmart_product_id}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Valor (R$)</label>
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          defaultValue={(p.amount_cents / 100).toFixed(2)}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={p.description ?? ""}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={pending}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded-lg"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setError(""); }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">{p.name}</span>
                        {p.active ? (
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                            Ativo
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 space-x-3">
                        <span>ID Hotmart: <code className="font-mono">{p.hotmart_product_id}</code></span>
                        <span>·</span>
                        <span>{formatCurrency(p.amount_cents)}</span>
                        <span>·</span>
                        <span>{p.files_count} arquivo{p.files_count !== 1 ? "s" : ""}</span>
                      </div>
                      {p.description && (
                        <p className="text-xs text-zinc-400 mt-2">{p.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(p.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(p.id, p.active)}
                        disabled={pending}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        {p.active ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
