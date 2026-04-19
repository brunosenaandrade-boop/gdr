"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAffiliate } from "@/lib/affiliates/admin-actions";
import { CheckCheck, Copy } from "lucide-react";

export function NewAffiliateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    affiliateId: string;
    tempPassword: string;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    const input = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      cpf_cnpj: String(formData.get("cpf_cnpj") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      pix_key: String(formData.get("pix_key") ?? ""),
      commission_rate: parseFloat(String(formData.get("commission_rate") ?? "40")),
      affiliate_email: String(formData.get("affiliate_email") ?? ""),
      affiliate_code: String(formData.get("affiliate_code") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };

    startTransition(async () => {
      const res = await createAffiliate(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess({
        affiliateId: res.data.affiliateId,
        tempPassword: res.data.tempPassword,
        email: input.email,
      });
    });
  }

  function handleCopyCredentials() {
    if (!success) return;
    const text = `Email: ${success.email}\nSenha: ${success.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-emerald-300 text-lg">✅ Afiliado criado!</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Envie as credenciais abaixo pro afiliado. Ele pode trocar a senha depois de entrar.
          </p>
        </div>

        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm space-y-1">
          <div>
            <span className="text-zinc-500">Email: </span>
            <span>{success.email}</span>
          </div>
          <div>
            <span className="text-zinc-500">Senha: </span>
            <span>{success.tempPassword}</span>
          </div>
          <div>
            <span className="text-zinc-500">Painel: </span>
            <span>afiliado.guardadinheiro.com.br</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyCredentials}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2"
          >
            {copied ? <CheckCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            Copiar credenciais
          </button>
          <Link
            href={`/admin/affiliates/${success.affiliateId}`}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg text-center"
          >
            Ver detalhes
          </Link>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-200">
          ⚠️ A senha só aparece <strong>agora</strong>. Copie e envie pro afiliado antes de sair desta página.
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome completo" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="CPF ou CNPJ" name="cpf_cnpj" placeholder="Apenas números" />
        <Field label="Telefone" name="phone" placeholder="Apenas números" />
        <Field label="Chave PIX" name="pix_key" placeholder="CPF, email, celular ou chave aleatória" />
        <Field
          label="Comissão (%)"
          name="commission_rate"
          type="number"
          defaultValue="40"
          placeholder="0-100"
        />
      </div>

      <div className="border-t border-zinc-800 pt-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300">Mercado Pago (opcional)</h3>
        <p className="text-xs text-zinc-500">
          Preencha se o afiliado for cadastrado como afiliado oficial do produto na Mercado Pago.
          Isso permite atribuir vendas automaticamente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email Mercado Pago" name="affiliate_email" type="email" />
          <Field label="Código afiliado Mercado Pago" name="affiliate_code" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Observações internas</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          placeholder="Notas visíveis só pra você"
        />
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/affiliates"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
        >
          {pending ? "Criando..." : "Criar afiliado"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
