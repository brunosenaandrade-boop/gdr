"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateTenant, changePassword } from "@/lib/supabase/actions";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/utils";
import type { Tenant } from "@/types";
import { User, Building2, Save, Lock, KeyRound } from "lucide-react";

type Props = {
  tenant: Tenant;
};

export function ConfiguracoesClient({ tenant }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [document, setDocument] = useState(tenant.document);
  const [tradeName, setTradeName] = useState(tenant.trade_name ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [message, setMessage] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const result = await updateTenant({
      name: name.trim(),
      document: document.trim(),
      trade_name: tenant.type === "pj" ? tradeName.trim() : null,
      phone: phone.replace(/\D/g, "") || null,
    });

    setSaving(false);
    setMessage(result.error ?? "Salvo com sucesso!");
    if (!result.error) setTimeout(() => setMessage(""), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMsg("");
    setPasswordErr("");

    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setChangingPassword(false);

    if (result.error) {
      setPasswordErr(result.error);
      return;
    }

    setPasswordMsg(result.success ?? "Senha alterada.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMsg(""), 4000);
  }

  return (
    <>
      <AppHeader title="Configurações" description="Gerencie os dados da sua conta" />

      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              tenant.type === "pf" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
            }`}>
              {tenant.type === "pf" ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle>Dados da Conta</CardTitle>
              <CardDescription>
                <Badge variant={tenant.type === "pf" ? "success" : "info"}>
                  {tenant.type === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                </Badge>
              </CardDescription>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label={tenant.type === "pf" ? "Nome completo" : "Nome fantasia"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />

            {tenant.type === "pj" && (
              <Input
                label="Razão Social"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                disabled={saving}
              />
            )}

            <Input
              label={tenant.type === "pf" ? "CPF" : "CNPJ"}
              value={document}
              onChange={(e) =>
                setDocument(tenant.type === "pf" ? maskCPF(e.target.value) : maskCNPJ(e.target.value))
              }
              disabled={saving}
            />

            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              disabled={saving}
            />

            {message && (
              <p className={`text-sm ${message.includes("sucesso") ? "text-emerald-400" : "text-red-400"}`}>
                {message}
              </p>
            )}

            <Button onClick={handleSave} loading={saving} disabled={saving}>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </Card>

        {/* Alterar senha */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>
                Troque sua senha de acesso. Você permanecerá logado.
              </CardDescription>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Senha atual"
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErr(""); }}
              icon={<KeyRound className="h-4 w-4" />}
              disabled={changingPassword}
              required
              autoComplete="current-password"
            />

            <Input
              label="Nova senha"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordErr(""); }}
              icon={<Lock className="h-4 w-4" />}
              placeholder="Mínimo 6 caracteres"
              disabled={changingPassword}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirmar nova senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErr(""); }}
              icon={<Lock className="h-4 w-4" />}
              placeholder="Repita a nova senha"
              disabled={changingPassword}
              required
              autoComplete="new-password"
            />

            {passwordErr && <p className="text-sm text-red-400">{passwordErr}</p>}
            {passwordMsg && <p className="text-sm text-emerald-400">{passwordMsg}</p>}

            <Button
              type="submit"
              loading={changingPassword}
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              <Lock className="h-4 w-4" />
              Alterar senha
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
