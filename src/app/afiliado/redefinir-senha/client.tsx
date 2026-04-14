"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetAffiliatePassword } from "@/lib/affiliates/affiliate-actions";
import { CheckCircle2 } from "lucide-react";

export function RedefinirSenhaClient() {
  const router = useRouter();
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await resetAffiliatePassword(newPwd, confirmPwd);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/afiliado"), 2000);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto mb-4">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Senha alterada!</h1>
          <p className="text-sm text-gray-600 mt-3">
            Sua nova senha foi salva com sucesso. Redirecionando…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Nova senha</h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Defina sua nova senha (mínimo 8 caracteres)
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nova senha</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => { setNewPwd(e.target.value); setError(""); }}
              required
              autoFocus
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Confirmar senha</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => { setConfirmPwd(e.target.value); setError(""); }}
              required
              autoComplete="new-password"
              placeholder="Repita a senha"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || newPwd.length < 8 || newPwd !== confirmPwd}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/afiliado/login" className="text-gray-900 font-medium hover:underline">
            ← Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
