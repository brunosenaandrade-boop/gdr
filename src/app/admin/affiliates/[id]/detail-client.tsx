"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAffiliate, setAffiliateStatus, resetAffiliatePassword } from "@/lib/affiliates/admin-actions";
import { Copy, CheckCheck, KeyRound } from "lucide-react";
import type { Database } from "@/types/supabase";

type Affiliate = Database["public"]["Tables"]["affiliates"]["Row"];

export function AffiliateDetailClient({ affiliate }: { affiliate: Affiliate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetResult, setResetResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [copiedReset, setCopiedReset] = useState(false);

  function handleSave(formData: FormData) {
    setError("");
    setSuccess("");
    const input = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      pix_key: String(formData.get("pix_key") ?? ""),
      commission_rate: parseFloat(String(formData.get("commission_rate") ?? "40")),
      affiliate_email: String(formData.get("affiliate_email") ?? ""),
      affiliate_code: String(formData.get("affiliate_code") ?? ""),
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

  function handleResetPassword() {
    if (!confirm(
      `Gerar nova senha temporária para ${affiliate.name}?\n\n` +
      `A senha atual deixará de funcionar. O afiliado precisará ` +
      `usar a nova senha que você vai entregar a ele.`,
    )) return;
    setError("");
    startTransition(async () => {
      const res = await resetAffiliatePassword(affiliate.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResetResult(res.data);
    });
  }

  function copyResetCredentials() {
    if (!resetResult) return;
    const text = `Email: ${resetResult.email}\nNova senha: ${resetResult.tempPassword}\n\nAcesse: https://afiliado.guardadinheiro.com.br/afiliado/login`;
    navigator.clipboard.writeText(text);
    setCopiedReset(true);
    setTimeout(() => setCopiedReset(false), 2000);
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
              label="Email Mercado Pago"
              name="affiliate_email"
              defaultValue={affiliate.affiliate_email ?? ""}
            />
            <Input
              label="Código Mercado Pago"
              name="affiliate_code"
              defaultValue={affiliate.affiliate_code ?? ""}
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
          <Row label="Email Mercado Pago" value={affiliate.affiliate_email ?? "—"} />
          <Row label="Código Mercado Pago" value={affiliate.affiliate_code ?? "—"} />
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

        <div className="ml-auto">
          <button
            onClick={handleResetPassword}
            disabled={pending}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs rounded inline-flex items-center gap-1.5"
          >
            <KeyRound className="h-3 w-3" />
            Resetar senha
          </button>
        </div>
      </div>

      {/* Resultado do reset */}
      {resetResult && (
        <div className="border-t border-emerald-500/30 pt-4 mt-4 bg-emerald-500/5 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
          <h3 className="text-sm font-semibold text-emerald-300">Nova senha gerada</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Anote ou copie agora — não vai aparecer de novo.
          </p>
          <div className="mt-3 rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-sm space-y-1">
            <div>
              <span className="text-zinc-500">Email: </span>
              <span>{resetResult.email}</span>
            </div>
            <div>
              <span className="text-zinc-500">Senha: </span>
              <span>{resetResult.tempPassword}</span>
            </div>
          </div>
          <button
            onClick={copyResetCredentials}
            className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded inline-flex items-center gap-1.5"
          >
            {copiedReset ? (
              <>
                <CheckCheck className="h-3 w-3 text-emerald-400" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copiar credenciais
              </>
            )}
          </button>
        </div>
      )}
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
