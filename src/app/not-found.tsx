import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] opacity-50" />
      <div className="relative w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size={56} withText />
        </div>
        <p className="text-7xl font-bold bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-100 bg-clip-text text-transparent tracking-tight">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-black transition-colors"
          >
            <Home className="h-4 w-4" />
            Voltar para o início
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-2.5 text-sm font-medium text-slate-200 transition-colors"
          >
            Ir para o painel
          </Link>
        </div>
      </div>
    </div>
  );
}
