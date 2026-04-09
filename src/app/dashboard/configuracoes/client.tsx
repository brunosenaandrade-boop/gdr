"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateTenant } from "@/lib/supabase/actions";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/utils";
import type { Tenant } from "@/types";
import { User, Building2, Save } from "lucide-react";

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
      </div>
    </>
  );
}
