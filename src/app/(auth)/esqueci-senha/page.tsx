"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { requestPasswordReset } from "@/lib/supabase/actions";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(email);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-black" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">E-mail enviado</h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Enviamos um link de recuperação para <span className="text-emerald-400">{email}</span>.
            Verifique sua caixa de entrada e spam.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
          <Shield className="h-6 w-6 text-black" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Recuperar senha</h1>
        <p className="text-sm text-slate-400 mt-1">Informe seu e-mail para receber o link de recuperação</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="seu@email.com"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Enviar link de recuperação
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
