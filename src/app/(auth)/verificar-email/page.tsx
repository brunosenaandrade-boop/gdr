"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";

export default function VerificarEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      if (data.user.email_confirmed_at) {
        router.replace("/dashboard");
        return;
      }
      setEmail(data.user.email ?? null);
    });
  }, [router]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setMessage("");
    setIsError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      setIsError(true);
      setMessage("Não foi possível reenviar. Tente novamente em alguns minutos.");
      return;
    }
    setMessage("Email reenviado. Verifique sua caixa de entrada e o spam.");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-4">
        <Logo size={48} />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto mb-4">
        <Mail className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-white">Confirme seu email</h1>
      <p className="text-sm text-slate-400 mt-3 leading-relaxed">
        Enviamos um link de ativação para{" "}
        <span className="text-emerald-400">{email ?? "seu email"}</span>.
        Abra o email e clique no link para acessar sua conta.
      </p>
      <p className="text-xs text-slate-500 mt-4">Não esqueça de verificar a pasta de spam.</p>

      {message && (
        <p className={`mt-4 text-sm ${isError ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
        >
          {resending ? "Reenviando..." : "Reenviar email de confirmação"}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Usar outro email
        </button>
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Voltar ao site
        </Link>
      </div>
    </Card>
  );
}
