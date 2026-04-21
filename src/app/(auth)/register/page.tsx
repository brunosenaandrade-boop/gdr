"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, CheckCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const NAME_REGEX = /^[\p{L}\p{M}\s'\-.]{2,60}$/u;

const FRIENDLY_ERRORS: Record<string, string> = {
  "User already registered": "Este e-mail já está cadastrado. Faça login.",
  "Failed to fetch": "Erro de conexão. Verifique sua internet e tente novamente.",
  "Password should be at least 6 characters": "A senha deve ter ao menos 8 caracteres.",
  "Unable to validate email address: invalid format": "E-mail inválido.",
};

function friendlyError(msg: string): string {
  return FRIENDLY_ERRORS[msg] ?? "Não foi possível criar a conta. Tente novamente.";
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome é obrigatório");
      return;
    }

    if (!NAME_REGEX.test(trimmedName)) {
      setError("Nome inválido. Use apenas letras, espaços, apóstrofo ou hífen (2-60 caracteres).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas não conferem");
      return;
    }

    if (password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: trimmedName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.guardadinheiro.com.br"}/login?confirmed=1`,
      },
    });

    if (authError) {
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }

    // Defesa em profundidade: se o Supabase estiver com "Confirm email" OFF,
    // signUp retorna sessão automática. Deslogamos e forçamos tela de verificação.
    await supabase.auth.signOut();
    setAwaitingConfirmation(true);
    setLoading(false);
  }

  async function handleResend() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (resendErr) {
      setError("Não foi possível reenviar agora. Tente novamente em alguns minutos.");
    }
  }

  if (awaitingConfirmation) {
    return (
      <Card className="p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
          <CheckCircle className="h-6 w-6 text-black" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Verifique seu email</h1>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          Enviamos um link de confirmação para <span className="text-emerald-400">{email}</span>.
          Abra o email e clique no link para ativar sua conta.
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Não esqueça de verificar a pasta de spam.
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
          >
            {loading ? "Reenviando..." : "Reenviar email de confirmação"}
          </button>
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Voltar ao login
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size={48} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Criar Conta</h1>
        <p className="text-sm text-slate-400 mt-1">Em 1 minuto você assume o controle das suas finanças</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="Seu nome"
          icon={<User className="h-4 w-4" />}
          required
        />
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
          placeholder="Mínimo 8 caracteres"
          icon={<Lock className="h-4 w-4" />}
          required
        />
        <Input
          label="Confirmar Senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
          placeholder="Repita a senha"
          icon={<Lock className="h-4 w-4" />}
          required
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Criar Conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
