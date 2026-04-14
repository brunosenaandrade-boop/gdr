"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCoupon, toggleCouponActive, deleteCoupon } from "@/lib/affiliates/admin-actions";

type Coupon = {
  code: string;
  affiliate_id: string | null;
  affiliate_name: string | null;
  discount_pct: number;
  uses_count: number;
  max_uses: number | null;
  valid_until: string | null;
  active: boolean;
  description: string | null;
  created_at: string | null;
};

type Props = {
  coupons: Coupon[];
  affiliates: Array<{ id: string; name: string }>;
};

export function CouponsClient({ coupons, affiliates }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(formData: FormData) {
    setError("");
    const input = {
      code: String(formData.get("code") ?? ""),
      affiliate_id: String(formData.get("affiliate_id") ?? "") || null,
      discount_pct: parseInt(String(formData.get("discount_pct") ?? "0"), 10),
      max_uses: parseInt(String(formData.get("max_uses") ?? "0"), 10) || null,
      valid_until: String(formData.get("valid_until") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
    };

    startTransition(async () => {
      const res = await createCoupon(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleToggle(code: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleCouponActive(code, !currentlyActive);
      router.refresh();
    });
  }

  async function handleDelete(code: string) {
    if (!confirm(`Excluir cupom ${code}?`)) return;
    startTransition(async () => {
      await deleteCoupon(code);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Cupons de desconto ou tracking de afiliados. Código é case-insensitive.
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg"
          >
            + Novo cupom
          </button>
        )}
      </div>

      {showForm && (
        <form
          action={handleCreate}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4"
        >
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Código <span className="text-red-400">*</span>
              </label>
              <input
                name="code"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm uppercase"
                placeholder="TITTO10"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Desconto (%)</label>
              <input
                name="discount_pct"
                type="number"
                min={0}
                max={50}
                defaultValue={0}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Afiliado</label>
              <select
                name="affiliate_id"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
              >
                <option value="">Sem afiliado (promocional)</option>
                {affiliates.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Máx usos</label>
              <input
                name="max_uses"
                type="number"
                min={0}
                placeholder="Ilimitado"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Válido até</label>
              <input
                name="valid_until"
                type="date"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-zinc-400 mb-1">Descrição (interna)</label>
              <input
                name="description"
                placeholder="Ex: Campanha Instagram Felipe Titto"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              Criar cupom
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
            <tr>
              <th className="text-left p-3">Código</th>
              <th className="text-right p-3">Desconto</th>
              <th className="text-left p-3">Afiliado</th>
              <th className="text-right p-3">Usos</th>
              <th className="text-left p-3">Válido até</th>
              <th className="text-left p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code} className="border-t border-zinc-800">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3 text-right">{c.discount_pct}%</td>
                <td className="p-3 text-xs text-zinc-400">{c.affiliate_name ?? "—"}</td>
                <td className="p-3 text-right text-xs">
                  {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                </td>
                <td className="p-3 text-xs text-zinc-400">
                  {c.valid_until ? new Date(c.valid_until).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      c.active
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {c.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleToggle(c.code, c.active)}
                    disabled={pending}
                    className="text-xs text-zinc-400 hover:text-white mr-3"
                  >
                    {c.active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => handleDelete(c.code)}
                    disabled={pending}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
