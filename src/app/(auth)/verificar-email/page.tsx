import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

export const metadata: Metadata = { title: "Verificar Email" };

export default function VerificarEmailPage() {
  return (
    <Card className="p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
        <Mail className="h-6 w-6 text-black" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-white">Confirme seu email</h1>
      <p className="text-sm text-slate-400 mt-3 leading-relaxed">
        Sua conta ainda não foi confirmada. Verifique sua caixa de entrada
        e clique no link que enviamos.
      </p>
      <p className="text-xs text-slate-500 mt-4">
        Não esqueça de verificar a pasta de spam. Depois de confirmar, faça login novamente.
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
