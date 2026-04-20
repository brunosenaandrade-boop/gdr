"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, Lock, User, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nome é obrigatório");
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
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.guardadinheiro.com.br"}/login?confirmed=1`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Se retornou user sem session, email confirmation está ativo
    if (data.user && !data.session) {
      setAwaitingConfirmation(true);
      setLoading(false);
      return;
    }

    // Fallback: confirmation desativado → vai direto ao dashboard
    router.push("/dashboard");
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
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Voltar ao login
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
          <Shield className="h-6 w-6 text-black" />
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
