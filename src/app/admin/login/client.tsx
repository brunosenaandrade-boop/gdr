"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, KeyRound } from "lucide-react";
import { adminSignIn, adminVerify2FA } from "@/lib/admin/actions";

type Step = "credentials" | "2fa";

export function LoginClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await adminSignIn(email, password);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    if (res.requires2FA) {
      setUserId(res.userId);
      setStep("2fa");
    } else {
      router.push("/admin");
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await adminVerify2FA(userId, code);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      setCode("");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-red-500/10 blur-[100px] opacity-50" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {step === "credentials" ? "Super Admin" : "Autenticação 2FA"}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {step === "credentials"
                ? "Acesso restrito aos administradores"
                : "Digite o código do seu autenticador"}
            </p>
          </div>

          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                    placeholder="admin@guardadinheiro.com.br"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FA} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-lg font-mono tracking-[0.3em] text-center text-white focus:border-red-500 focus:outline-none"
                    placeholder="000000"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Ou use um código de recuperação.
                </p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? "Verificando..." : "Confirmar"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setCode(""); setError(""); }}
                className="w-full text-xs text-zinc-500 hover:text-zinc-300"
              >
                ← Voltar
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Tentativas de login são registradas e monitoradas.
        </p>
      </div>
    </div>
  );
}
