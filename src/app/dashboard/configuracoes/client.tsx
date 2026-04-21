"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateTenant, changePassword, deleteAccount } from "@/lib/supabase/actions";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/utils";
import type { Tenant } from "@/types";
import { User, Building2, Save, Lock, KeyRound, Trash2, CreditCard, ExternalLink } from "lucide-react";

export type SubscriptionInfo = {
  status: string;
  planType: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  gateway: string | null;
};

type Props = {
  tenant: Tenant;
  subscription: SubscriptionInfo | null;
};

function describeStatus(status: string): { label: string; variant: "success" | "info" | "warning" | "danger" } {
  switch (status) {
    case "active":
      return { label: "Ativa", variant: "success" };
    case "canceled":
      return { label: "Cancelada (acesso até o fim do ciclo)", variant: "warning" };
    case "past_due":
      return { label: "Pagamento em atraso", variant: "warning" };
    case "expired":
      return { label: "Expirada", variant: "danger" };
    case "refunded":
      return { label: "Reembolsada", variant: "danger" };
    case "chargeback":
      return { label: "Contestada", variant: "danger" };
    default:
      return { label: status, variant: "info" };
  }
}

function describePlan(plan: string | null): string {
  if (!plan) return "—";
  if (plan.toLowerCase().includes("anual")) return "Anual (R$ 29,90/mês · 12x)";
  if (plan.toLowerCase().includes("mensal")) return "Mensal (R$ 79,90/mês)";
  return plan;
}

export function ConfiguracoesClient({ tenant, subscription }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [document, setDocument] = useState(tenant.document ?? "");
  const [tradeName, setTradeName] = useState(tenant.trade_name ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [message, setMessage] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
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
              placeholder="Mínimo 8 caracteres"
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

        {/* Assinatura */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>Plano ativo e próximos ciclos</CardDescription>
            </div>
          </div>

          {!subscription ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
              <p className="text-slate-400">Você ainda não tem uma assinatura ativa.</p>
              <Link
                href="/planos"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Ver planos
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <Badge variant={describeStatus(subscription.status).variant}>
                  {describeStatus(subscription.status).label}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Plano</span>
                <span className="text-slate-200 font-medium">{describePlan(subscription.planType)}</span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {subscription.status === "canceled" ? "Acesso até" : "Próxima cobrança"}
                  </span>
                  <span className="text-slate-200 font-medium tabular-nums">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {subscription.canceledAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Cancelada em</span>
                  <span className="text-slate-200 font-medium tabular-nums">
                    {new Date(subscription.canceledAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {subscription.gateway === "mercadopago" && subscription.status === "active" && (
                <a
                  href="https://www.mercadopago.com.br/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Gerenciar no Mercado Pago
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </Card>

        {/* Excluir conta */}
        <Card>
          <CardTitle className="text-red-400">Excluir minha conta</CardTitle>
          <CardDescription className="mt-1">
            Ao excluir sua conta, todos os seus dados serão removidos permanentemente em até 30 dias, conforme a LGPD.
            Essa ação não pode ser desfeita.
          </CardDescription>

          {!showDeleteConfirm ? (
            <Button
              variant="secondary"
              className="mt-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Quero excluir minha conta
            </Button>
          ) : (
            <div className="mt-4 space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-300">
                Digite <strong>EXCLUIR</strong> pra confirmar a exclusão permanente:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Digite "EXCLUIR"'
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={deleteConfirmText !== "EXCLUIR" || deleting}
                  loading={deleting}
                  onClick={async () => {
                    if (!confirm("Tem certeza? Todos os seus dados serão excluídos permanentemente. Esta ação não pode ser desfeita.")) return;
                    setDeleting(true);
                    const result = await deleteAccount();
                    if (result.ok) {
                      window.location.href = "/login";
                    } else {
                      setMessage(result.error ?? "Erro ao excluir conta");
                      setDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Confirmar exclusão
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
