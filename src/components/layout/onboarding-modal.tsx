"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { maskCPF, maskCNPJ, maskPhone, isValidCPF, isValidCNPJ } from "@/lib/utils";
import type { TenantType } from "@/types";
import { User, Building2, Shield } from "lucide-react";

type OnboardingModalProps = {
  open: boolean;
  userId: string;
  onComplete: () => void;
};

export function OnboardingModal({ open, userId, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<"type" | "info">("type");
  const [type, setType] = useState<TenantType>("pf");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (loading) return; // Impede double-click
    setError("");

    if (!name.trim()) { setError("Nome obrigatorio"); return; }

    const cleanDoc = document.replace(/\D/g, "");
    if (type === "pf" && !isValidCPF(cleanDoc)) { setError("CPF invalido"); return; }
    if (type === "pj" && !isValidCNPJ(cleanDoc)) { setError("CNPJ invalido"); return; }
    if (type === "pj" && !tradeName.trim()) { setError("Razao social obrigatoria"); return; }

    setLoading(true);
    const supabase = createClient();

    // 1. Verifica se ja existe tenant para esse usuario
    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Ja existe - pula direto pro dashboard
      setLoading(false);
      onComplete();
      return;
    }

    // 2. Insere o tenant
    const { error: dbError } = await supabase.from("tenants").insert({
      user_id: userId,
      type,
      name: name.trim(),
      document: document.trim(),
      trade_name: type === "pj" ? tradeName.trim() : null,
      phone: phone.replace(/\D/g, "") || null,
    });

    if (dbError) {
      // Duplicate key = ja existe (race condition entre check e insert) -> sucesso
      if (dbError.code === "23505") {
        setLoading(false);
        onComplete();
        return;
      }
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onComplete();
  }

  return (
    <Modal open={open} onClose={() => {}} title="" size="md">
      <div className="text-center mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
          <Shield className="h-6 w-6 text-black" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Bem-vindo ao Guarda Dinheiro</h2>
        <p className="text-sm text-slate-400 mt-1">Vamos configurar sua conta em segundos</p>
      </div>

      {step === "type" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400 text-center mb-2">Qual o tipo da sua conta?</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setType("pf"); setStep("info"); }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:scale-[1.02]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Pessoa Fisica</p>
                <p className="text-xs text-slate-500 mt-1">CPF, orcamento pessoal</p>
              </div>
            </button>
            <button
              onClick={() => { setType("pj"); setStep("info"); }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:scale-[1.02]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Pessoa Juridica</p>
                <p className="text-xs text-slate-500 mt-1">CNPJ, razao social</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === "info" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setStep("type")}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-xs text-emerald-300">
              {type === "pf" ? "Pessoa Fisica" : "Pessoa Juridica"}
            </span>
          </div>

          <Input
            label="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "pf" ? "Seu nome" : "Nome fantasia"}
            disabled={loading}
          />

          {type === "pj" && (
            <Input
              label="Razao Social"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Razao social da empresa"
              disabled={loading}
            />
          )}

          <Input
            label={type === "pf" ? "CPF" : "CNPJ"}
            value={document}
            onChange={(e) =>
              setDocument(type === "pf" ? maskCPF(e.target.value) : maskCNPJ(e.target.value))
            }
            placeholder={type === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
            disabled={loading}
          />

          <Input
            label="Telefone (opcional)"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            disabled={loading}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button onClick={handleSubmit} loading={loading} disabled={loading} className="w-full">
            Comecar a usar
          </Button>
        </div>
      )}
    </Modal>
  );
}
