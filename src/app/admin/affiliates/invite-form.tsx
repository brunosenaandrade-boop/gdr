"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, CheckCircle } from "lucide-react";
import { createAffiliate } from "@/lib/affiliates/admin-actions";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const result = await createAffiliate({
      name,
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(`Convite enviado para ${email}`);
    setEmail("");
    router.refresh();

    setTimeout(() => setSuccess(""), 5000);
  }

  return (
    <form onSubmit={handleInvite} className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="email@afiliado.com"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Send className="h-3.5 w-3.5" />
        {loading ? "Enviando..." : "Convidar"}
      </button>
      {success && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          {success}
        </span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}
