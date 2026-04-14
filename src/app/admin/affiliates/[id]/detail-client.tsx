"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAffiliate, setAffiliateStatus } from "@/lib/affiliates/admin-actions";
import type { Database } from "@/types/supabase";

type Affiliate = Database["public"]["Tables"]["affiliates"]["Row"];

export function AffiliateDetailClient({ affiliate }: { affiliate: Affiliate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSave(formData: FormData) {
    setError("");
    setSuccess("");
    const input = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      pix_key: String(formData.get("pix_key") ?? ""),
      commission_rate: parseFloat(String(formData.get("commission_rate") ?? "40")),
      hotmart_email: String(formData.get("hotmart_email") ?? ""),
      hotmart_affiliate_code: String(formData.get("hotmart_affiliate_code") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    startTransition(async () => {
      const res = await updateAffiliate(affiliate.id, input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess("Salvo");
      setEditing(false);
      router.refresh();
    });
  }

  function handleStatus(status: "active" | "suspended" | "blocked") {
    if (status !== "active" && !confirm(`Confirmar mudança para ${status}?`)) return;
    startTransition(async () => {
      const res = await setAffiliateStatus(affiliate.id, status);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Dados do afiliado</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Editar
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      {editing ? (
        <form action={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Nome" name="name" defaultValue={affiliate.name} />
            <Input label="Telefone" name="phone" defaultValue={affiliate.phone ?? ""} />
            <Input label="PIX" name="pix_key" defaultValue={affiliate.pix_key ?? ""} />
            <Input
              label="Comissão (%)"
              name="commission_rate"
              type="number"
              defaultValue={String(affiliate.commission_rate)}
            />
            <Input
              label="Email Hotmart"
              name="hotmart_email"
              defaultValue={affiliate.hotmart_email ?? ""}
            />
            <Input
              label="Código Hotmart"
              name="hotmart_affiliate_code"
              defaultValue={affiliate.hotmart_affiliate_code ?? ""}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notas</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={affiliate.notes ?? ""}
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
              onClick={() => { setEditing(false); setError(""); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="space-y-2 text-sm">
          <Row label="Telefone" value={affiliate.phone ?? "—"} />
          <Row label="CPF/CNPJ" value={affiliate.cpf_cnpj ?? "—"} />
          <Row label="PIX" value={affiliate.pix_key ?? "—"} />
          <Row label="Comissão" value={`${Number(affiliate.commission_rate).toFixed(0)}%`} />
          <Row label="Email Hotmart" value={affiliate.hotmart_email ?? "—"} />
          <Row label="Código Hotmart" value={affiliate.hotmart_affiliate_code ?? "—"} />
          <Row label="Status" value={affiliate.status} />
          {affiliate.notes && <Row label="Notas" value={affiliate.notes} />}
        </dl>
      )}

      <div className="border-t border-zinc-800 pt-4 flex flex-wrap gap-2">
        {affiliate.status !== "active" && (
          <button
            onClick={() => handleStatus("active")}
            disabled={pending}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs rounded"
          >
            Ativar
          </button>
        )}
        {affiliate.status !== "suspended" && (
          <button
            onClick={() => handleStatus("suspended")}
            disabled={pending}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs rounded"
          >
            Suspender
          </button>
        )}
        {affiliate.status !== "blocked" && (
          <button
            onClick={() => handleStatus("blocked")}
            disabled={pending}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs rounded"
          >
            Bloquear
          </button>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  defaultValue,
}: { label: string; name: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
