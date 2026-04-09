"use client";

import { useEffect, useState, useCallback } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { maskPhone } from "@/lib/utils";
import type { WhatsAppLink } from "@/types";
import { MessageSquare, Phone, CheckCircle2, Unlink, Send } from "lucide-react";

export default function WhatsAppPage() {
  const [link, setLink] = useState<WhatsAppLink | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "verify" | "linked">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) { setLoading(false); return; }
    setTenantId(tenant.id);

    const { data: existingLink } = await supabase
      .from("whatsapp_links")
      .select("*")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (existingLink) {
      setLink(existingLink);
      setStep(existingLink.verified ? "linked" : "verify");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSendCode() {
    setError("");
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) { setError("Número inválido"); return; }

    setSaving(true);
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

    // Save to database
    const { error: dbError } = await supabase.from("whatsapp_links").upsert({
      tenant_id: tenantId,
      phone_number: "55" + cleaned,
      verified: false,
      verification_code: verificationCode,
    }, { onConflict: "tenant_id" });

    if (dbError) { setError(dbError.message); setSaving(false); return; }

    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "55" + cleaned,
        text: `Seu código de verificação do Guarda Dinheiro: ${verificationCode}`,
      }),
    });

    if (!res.ok) {
      setError("Erro ao enviar código. Tente novamente.");
      setSaving(false);
      return;
    }

    setStep("verify");
    setSaving(false);
  }

  async function handleVerify() {
    setError("");
    if (code.length !== 6) { setError("Código deve ter 6 dígitos"); return; }

    setSaving(true);
    const { data: updated, error: updateError } = await supabase
      .from("whatsapp_links")
      .update({ verified: true, verification_code: null })
      .eq("tenant_id", tenantId)
      .eq("verification_code", code)
      .eq("verified", false)
      .select("*")
      .maybeSingle();

    if (updateError || !updated) {
      setError("Código inválido");
      setSaving(false);
      return;
    }

    setLink({ ...updated, verified: true });
    setStep("linked");
    setSaving(false);
  }

  async function handleUnlink() {
    if (!link) return;
    await supabase.from("whatsapp_links").delete().eq("id", link.id);
    setLink(null);
    setStep("idle");
    setPhone("");
    setCode("");
  }

  return (
    <>
      <AppHeader title="WhatsApp" description="Vincule seu número para lançar via WhatsApp" />

      <div className="p-6 max-w-2xl space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Status Card */}
            <Card glow={step === "linked"}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  step === "linked" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-slate-400"
                }`}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Integração WhatsApp</CardTitle>
                  <CardDescription>
                    {step === "linked"
                      ? "Seu WhatsApp está vinculado. Envie mensagens para lançar!"
                      : "Vincule seu número para lançar receitas e despesas por mensagem ou áudio."}
                  </CardDescription>
                </div>
              </div>

              {step === "linked" && link && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm text-emerald-200">Número vinculado</p>
                      <p className="text-xs text-slate-400 font-mono">+{link.phone_number}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleUnlink}>
                    <Unlink className="h-4 w-4" />
                    Desvincular
                  </Button>
                </div>
              )}

              {step === "idle" && (
                <div className="space-y-4">
                  <Input
                    label="Número do WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    icon={<Phone className="h-4 w-4" />}
                  />
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button onClick={handleSendCode} loading={saving}>
                    <Send className="h-4 w-4" />
                    Enviar Código
                  </Button>
                </div>
              )}

              {step === "verify" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Enviamos um código de 6 dígitos para seu WhatsApp. Digite abaixo:
                  </p>
                  <Input
                    label="Código de Verificação"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-[0.3em] font-mono"
                  />
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep("idle")} className="flex-1">Voltar</Button>
                    <Button onClick={handleVerify} loading={saving} className="flex-1">Verificar</Button>
                  </div>
                </div>
              )}
            </Card>

            {/* How it works */}
            <Card>
              <CardTitle className="mb-4">Como funciona</CardTitle>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Envie uma mensagem ou áudio",
                    desc: 'Exemplo: "Paguei 150 reais de luz" ou grave um áudio dizendo o lançamento.',
                  },
                  {
                    step: "2",
                    title: "A IA interpreta automaticamente",
                    desc: "O sistema identifica tipo (receita/despesa), valor, descrição e sugere uma categoria.",
                  },
                  {
                    step: "3",
                    title: "Confirme o lançamento",
                    desc: 'O sistema mostra o que entendeu e pede confirmação. Responda "Sim" para lançar.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
