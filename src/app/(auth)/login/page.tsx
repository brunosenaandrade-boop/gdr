"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsConfirmation(false);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const msg = authError.message?.toLowerCase() ?? "";
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setNeedsConfirmation(true);
      } else if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
        setError("Email ou senha incorretos");
      } else {
        setError(authError.message || "Não foi possível entrar. Tente novamente.");
      }
      setLoading(false);
      return;
    }

    // setLoading(false) antes de navegar pra não travar o botão em caso
    // de redirect intermediário do middleware (ex.: /verificar-email).
    setLoading(false);
    router.replace("/dashboard");
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
          <Shield className="h-6 w-6 text-black" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Entrar no Guarda Dinheiro</h1>
        <p className="text-sm text-slate-400 mt-1">Bom te ver de volta</p>
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
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="Sua senha"
          icon={<Lock className="h-4 w-4" />}
          required
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        {needsConfirmation && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <p className="text-amber-300 font-medium mb-1">Confirme seu email antes de entrar</p>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Enviamos um link de confirmação para <span className="font-semibold">{email}</span>.
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <button
              type="button"
              onClick={async () => {
                setError("");
                setLoading(true);
                const supabase = createClient();
                const { error: resendErr } = await supabase.auth.resend({ type: "signup", email });
                setLoading(false);
                if (resendErr) {
                  setError("Não foi possível reenviar. Tente novamente em alguns minutos.");
                  setNeedsConfirmation(false);
                } else {
                  setError("");
                }
              }}
              className="mt-2 text-xs text-amber-200 underline underline-offset-2 hover:text-amber-100"
              disabled={loading || !email}
            >
              Reenviar email de confirmação
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <Link href="/esqueci-senha" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/planos" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          Ver planos
        </Link>
      </p>
    </Card>
  );
}
