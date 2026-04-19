"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeAffiliatePassword, updateAffiliateProfile } from "@/lib/affiliates/affiliate-actions";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  email: string;
  mustChangePassword: boolean;
  commissionRate: number;
  profile: {
    name: string;
    phone: string;
    pix_key: string;
    cpf_cnpj: string;
    affiliate_email: string;
  };
};

export function ContaClient({ email, mustChangePassword, commissionRate, profile }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Profile state
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Password state
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  function handleProfileSave(formData: FormData) {
    setProfileErr("");
    setProfileMsg("");
    const input = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      pix_key: String(formData.get("pix_key") ?? ""),
      cpf_cnpj: String(formData.get("cpf_cnpj") ?? ""),
      affiliate_email: String(formData.get("affiliate_email") ?? ""),
    };
    startTransition(async () => {
      const res = await updateAffiliateProfile(input);
      if (!res.ok) {
        setProfileErr(res.error);
        return;
      }
      setProfileMsg("Dados atualizados com sucesso!");
      setTimeout(() => setProfileMsg(""), 4000);
      router.refresh();
    });
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdErr("");
    setPwdMsg("");
    startTransition(async () => {
      const res = await changeAffiliatePassword(currentPwd, newPwd, confirmPwd);
      if (!res.ok) {
        setPwdErr(res.error);
        return;
      }
      setPwdMsg("Senha alterada com sucesso!");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdMsg(""), 4000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minha conta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Atualize seus dados e troque sua senha
        </p>
      </div>

      {/* Banner senha temporária */}
      {mustChangePassword && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Você ainda está usando uma senha temporária
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Por segurança, troque sua senha agora mesmo no formulário abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados pessoais</h2>

        <form action={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome completo" name="name" required defaultValue={profile.name} />
            <Field label="Email (read-only)" name="email_readonly" defaultValue={email} disabled />
            <Field label="Telefone" name="phone" defaultValue={profile.phone} placeholder="Apenas números" />
            <Field label="CPF/CNPJ" name="cpf_cnpj" defaultValue={profile.cpf_cnpj} placeholder="Apenas números" />
            <Field
              label="Chave PIX"
              name="pix_key"
              defaultValue={profile.pix_key}
              placeholder="CPF, email, telefone ou aleatória"
              wide
            />
            <Field
              label="Email Mercado Pago (opcional)"
              name="affiliate_email"
              type="email"
              defaultValue={profile.affiliate_email}
              placeholder="Se for diferente do email de cadastro"
              wide
            />
          </div>

          <div className="text-xs text-gray-500">
            Sua comissão atual é de <strong className="text-gray-900">{commissionRate.toFixed(0)}%</strong> por venda.
            Pra alterar, fale com o admin.
          </div>

          {profileErr && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {profileErr}
            </div>
          )}
          {profileMsg && (
            <div className="text-sm text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {profileMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
          >
            Salvar alterações
          </button>
        </form>
      </div>

      {/* Trocar senha */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Alterar senha</h2>
        <p className="text-sm text-gray-500 mb-5">Mínimo 8 caracteres. Use uma senha forte e única.</p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field
            label="Senha atual"
            name="current_pwd"
            type="password"
            value={currentPwd}
            onChange={(v) => { setCurrentPwd(v); setPwdErr(""); }}
            required
            wide
          />
          <Field
            label="Nova senha"
            name="new_pwd"
            type="password"
            value={newPwd}
            onChange={(v) => { setNewPwd(v); setPwdErr(""); }}
            required
            placeholder="Mínimo 8 caracteres"
            wide
          />
          <Field
            label="Confirmar nova senha"
            name="confirm_pwd"
            type="password"
            value={confirmPwd}
            onChange={(v) => { setConfirmPwd(v); setPwdErr(""); }}
            required
            wide
          />

          {pwdErr && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {pwdErr}
            </div>
          )}
          {pwdMsg && (
            <div className="text-sm text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {pwdMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !currentPwd || !newPwd || !confirmPwd}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
          >
            Alterar senha
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  value,
  onChange,
  disabled,
  wide,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  const isControlled = value !== undefined;
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="block text-sm font-semibold text-gray-900 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {isControlled ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-900 focus:outline-none transition-colors"
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-900 focus:outline-none transition-colors"
        />
      )}
    </div>
  );
}
