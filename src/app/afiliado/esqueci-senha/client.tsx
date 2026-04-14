"use client";

import { useState } from "react";
import Link from "next/link";
import { requestAffiliatePasswordReset } from "@/lib/affiliates/affiliate-actions";
import { CheckCircle2 } from "lucide-react";

export function EsqueciSenhaClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await requestAffiliatePasswordReset(email, window.location.origin);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto mb-4">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Email enviado</h1>
          <p className="text-sm text-gray-600 mt-3">
            Se existe uma conta de afiliado com{" "}
            <span className="font-medium">{email}</span>, você receberá um link de recuperação em breve.
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Verifique também a pasta de spam.
          </p>
          <Link
            href="/afiliado/login"
            className="mt-6 inline-block text-sm text-gray-900 underline"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Recuperar senha</h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Informe seu email pra receber o link de recuperação
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Lembrou a senha?{" "}
          <Link href="/afiliado/login" className="text-gray-900 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
