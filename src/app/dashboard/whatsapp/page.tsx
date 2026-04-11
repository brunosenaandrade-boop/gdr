"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppLink } from "@/types";
import { MessageSquare, CheckCircle2, Unlink, ExternalLink, Copy, CheckCheck } from "lucide-react";

const BOT_NUMBER = "554820270106";
const BOT_DISPLAY = "+55 48 2027-0106";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GD-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function WhatsAppPage() {
  const [link, setLink] = useState<WhatsAppLink | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState("");
  const [step, setStep] = useState<"idle" | "waiting" | "linked">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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
      if (existingLink.verified) {
        setStep("linked");
      } else if (existingLink.verification_code) {
        setLinkCode(existingLink.verification_code);
        setStep("waiting");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Polling: verifica a cada 3s se o número foi vinculado
  useEffect(() => {
    if (step !== "waiting" || !tenantId) return;

    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("whatsapp_links")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (data?.verified) {
        setLink(data);
        setStep("linked");
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, tenantId, supabase]);

  async function handleGenerateCode() {
    setError("");
    setSaving(true);

    const code = generateCode();

    // phone_number é único e NOT NULL, então uso um placeholder único com o código
    const placeholderPhone = `pending_${code}`;

    const { error: dbError } = await supabase.from("whatsapp_links").upsert({
      tenant_id: tenantId,
      phone_number: placeholderPhone,
      verified: false,
      verification_code: code,
    }, { onConflict: "tenant_id" });

    if (dbError) {
      setError("Erro ao gerar código. Tente novamente.");
      setSaving(false);
      return;
    }

    setLinkCode(code);
    setStep("waiting");
    setSaving(false);
  }

  async function handleUnlink() {
    if (!link) return;
    await supabase.from("whatsapp_links").delete().eq("id", link.id);
    setLink(null);
    setLinkCode("");
    setStep("idle");
  }

  async function handleCancel() {
    if (!tenantId) return;
    await supabase.from("whatsapp_links").delete().eq("tenant_id", tenantId);
    setLink(null);
    setLinkCode("");
    setStep("idle");
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waLink = `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent(linkCode)}`;

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
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                    <p className="text-xs text-emerald-200 leading-relaxed">
                      Ao clicar em Gerar Código, você receberá um código único.
                      Envie esse código do seu WhatsApp para o nosso número para vincular sua conta.
                    </p>
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button onClick={handleGenerateCode} loading={saving}>
                    <MessageSquare className="h-4 w-4" />
                    Gerar Código de Vinculação
                  </Button>
                </div>
              )}

              {step === "waiting" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Seu código</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-lg font-mono tracking-[0.2em] text-emerald-300 text-center">
                          {linkCode}
                        </code>
                        <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                          {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Como vincular</p>
                      <ol className="space-y-2 text-sm text-slate-300">
                        <li className="flex gap-2">
                          <span className="text-emerald-400 font-semibold">1.</span>
                          <span>Abra o WhatsApp no seu celular</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-emerald-400 font-semibold">2.</span>
                          <span>Envie o código acima para <span className="font-mono text-emerald-300">{BOT_DISPLAY}</span></span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-emerald-400 font-semibold">3.</span>
                          <span>Aguarde a confirmação automática aqui</span>
                        </li>
                      </ol>
                    </div>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-black transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-95"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir no WhatsApp
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Aguardando sua mensagem...</span>
                  </div>

                  <Button variant="secondary" onClick={handleCancel} className="w-full">
                    Cancelar
                  </Button>
                </div>
              )}
            </Card>

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
