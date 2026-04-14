"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          {step === "credentials" ? "Login Admin" : "Autenticação 2FA"}
        </h1>

        {step === "credentials" ? (
          <form onSubmit={handleCredentials} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="E-mail admin"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                required
                autoFocus
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg font-mono tracking-[0.3em] text-center text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ou use um código de recuperação.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? "Verificando..." : "Confirmar"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("credentials"); setCode(""); setError(""); }}
              className="w-full text-xs text-gray-500 hover:text-gray-900"
            >
              ← Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
