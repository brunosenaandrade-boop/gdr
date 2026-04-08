import Link from "next/link";
import {
  Shield, ArrowRight, MessageSquare, BarChart3, Zap, Lock, Smartphone, Brain,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Shield className="h-4 w-4 text-black" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Guarda Dinheiro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="group flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
            >
              Comecar gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24 pb-20">
        <div className="pointer-events-none absolute -top-24 left-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] opacity-50" />

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 backdrop-blur-md mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs tracking-tight text-emerald-300">Lance via WhatsApp com IA</span>
          </div>

          <h1 className="text-5xl font-normal tracking-tight text-white sm:text-6xl">
            <span className="block text-slate-400">Controle financeiro</span>
            <span className="block bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-100 bg-clip-text text-transparent animate-gradient-text">
              inteligente.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-lg font-light">
            Gerencie receitas e despesas da sua empresa ou vida pessoal.
            Lance por texto, audio no WhatsApp, ou pelo painel. A IA cuida do resto.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex h-11 min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-sm font-medium tracking-tight text-white aura-button-green-beam transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Criar conta gratis
                <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 text-sm text-slate-200 hover:bg-white/10 transition-all"
            >
              Ja tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent w-full mb-16" />

        <div className="mb-12">
          <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-300/70 mb-2">Funcionalidades</p>
          <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Tudo que voce precisa para <span className="text-emerald-400">guardar dinheiro</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Lance via WhatsApp",
              desc: "Envie texto ou audio. A IA identifica tipo, valor e categoria automaticamente.",
            },
            {
              icon: Brain,
              title: "IA que entende voce",
              desc: "GPT-4o-mini interpreta suas mensagens. Whisper transcreve audios com precisao.",
            },
            {
              icon: BarChart3,
              title: "Dashboard completo",
              desc: "Saldo, fluxo de caixa, graficos de categoria e lancamentos recentes em tempo real.",
            },
            {
              icon: Smartphone,
              title: "PF e PJ",
              desc: "Categorias e relatorios diferenciados para pessoa fisica e juridica.",
            },
            {
              icon: Lock,
              title: "Multitenant seguro",
              desc: "Row Level Security no banco. Seus dados sao isolados e protegidos.",
            },
            {
              icon: Zap,
              title: "Rapido e intuitivo",
              desc: "Interface dark mode elegante. Tudo a poucos cliques ou uma mensagem de distancia.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:bg-emerald-500/[0.03] hover:border-emerald-500/20 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-medium tracking-tight text-slate-50 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-12 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-medium tracking-tight text-white mb-4">
              Pronto para guardar seu dinheiro?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Comece agora gratuitamente. Sem cartao de credito.
            </p>
            <Link
              href="/register"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
            >
              Criar conta gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-slate-500">Guarda Dinheiro</span>
          </div>
          <p className="text-xs text-slate-600">2026 Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
