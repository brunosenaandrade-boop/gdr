import Link from "next/link";
import {
  Shield, ArrowRight, MessageSquare, BarChart3, Zap, Lock, Brain,
  Mic, DollarSign, PieChart, TrendingUp, Check,
  Wallet, Receipt,
} from "lucide-react";
import UnicornBackground from "@/components/landing/unicorn-background";
import MobileNav from "@/components/landing/mobile-nav";

const mesAtual = new Date().toLocaleString("pt-BR", { month: "long" }).replace(/^\w/, (c) => c.toUpperCase());

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Animated Background */}
      <UnicornBackground />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Shield className="h-3.5 w-3.5 text-black fill-black" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">Guarda Dinheiro</span>
            </Link>
            <div className="hidden md:flex mx-4 items-center gap-1">
              <a href="#painel" className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200">Dashboard</a>
              <a href="#funcionalidades" className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200">Funcionalidades</a>
              <a href="#inteligencia" className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200">Inteligência</a>
              <a href="#cta" className="hidden lg:block rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200">Começar</a>
            </div>
          </div>
          {/* Right: Actions */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/planos"
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 text-xs font-medium text-black transition-all hover:bg-emerald-400 hover:scale-105"
            >
              Criar conta
            </Link>
          </div>
          {/* Mobile hamburger menu */}
          <MobileNav />
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-20 sm:pt-20">
        {/* Hero Section */}
        <section className="animate-in delay-0 relative z-10 mb-24 mt-24">
          {/* Glow Effect */}
          <div className="pointer-events-none absolute -top-24 left-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] opacity-50" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 backdrop-blur-md transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30 cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs tracking-tight text-emerald-300">Lance via WhatsApp com IA</span>
              <span className="mx-1 text-emerald-500/30">|</span>
              <span className="text-xs tracking-tight text-slate-400">PF e PJ</span>
            </div>

            <h1 className="text-5xl font-normal tracking-tight text-white sm:text-6xl">
              <span className="block text-slate-400">Lança gasto</span>
              <span className="block bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-100 bg-clip-text text-transparent animate-gradient-text">
                falando no WhatsApp.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-slate-400">
              Manda um áudio ou texto pro Guardinha e ele registra tudo pra você.
              Receitas, despesas, contas a pagar — organizadas com IA, 24h por dia.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/planos"
                className="group relative inline-flex h-10 min-w-[140px] items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-medium tracking-tight text-white aura-button-green-beam transition-all hover:scale-105 active:scale-95"
              >
                <div className="points_wrapper">
                  <i className="point" /><i className="point" /><i className="point" /><i className="point" /><i className="point" />
                  <i className="point" /><i className="point" /><i className="point" /><i className="point" /><i className="point" />
                </div>
                <span className="relative z-10 flex items-center gap-2">
                  Assinar por R$ 29,90/mês
                  <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-sm text-slate-200 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          {/* Floating Financial Card */}
          <div className="absolute right-0 top-1/2 hidden h-[260px] w-[420px] -translate-y-1/2 translate-x-10 lg:block" style={{ perspective: "1200px", zIndex: 20 }}>
            <div className="animate-float-card relative h-full w-full transition-all duration-500 hover:scale-105" style={{ transformStyle: "preserve-3d", transform: "rotateY(-15deg) rotateX(5deg)" }}>
              {/* Glow behind */}
              <div className="absolute inset-8 -z-10 rounded-full bg-emerald-500/30 blur-[80px]" />
              {/* Card Face */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F1115]/95 via-[#13161C]/90 to-black/95 p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                {/* Texture */}
                <div className="absolute inset-0 rounded-2xl opacity-30" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[60px]" />
                {/* Content */}
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        <Shield className="h-5 w-5" />
                      </div>
                      <span className="text-lg font-semibold tracking-tight text-white">Guarda Dinheiro</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-400/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-200">Online</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">Saldo Total</p>
                      <p className="font-mono text-2xl tracking-tight text-slate-200" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>R$ 12.847,00</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-slate-500">Receitas</p>
                        <p className="text-sm font-medium text-emerald-300">+ R$ 15.200</p>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div>
                        <p className="text-[10px] text-slate-500">Despesas</p>
                        <p className="text-sm font-medium text-rose-300">- R$ 2.353</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Reflective Shine */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent mix-blend-overlay" />
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="animate-in delay-100 mb-12 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        {/* Dashboard Grid */}
        <div id="painel" className="grid gap-6 lg:grid-cols-2">
          {/* Card 1: Saldo Geral */}
          <section
            className="animate-in delay-200 hover-card-effect group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-6 shadow-[0_0_60px_rgba(16,185,129,0.15)] sm:p-8"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60">
              <div className="absolute -left-24 top-10 h-64 w-64 animate-pulse rounded-full bg-emerald-500/25 blur-3xl" />
              <div className="absolute -bottom-10 right-0 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-300/70">Saldo Total</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-4xl font-medium tracking-tight text-slate-50 tabular-nums">R$ 12.847</p>
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-normal tracking-tight text-emerald-200">+12.4%</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Últimos 30 dias • PF e PJ</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-normal tracking-tight text-emerald-300 border border-emerald-500/20">
                    <Zap className="h-3.5 w-3.5" />
                    Via WhatsApp ou Web
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="group/item cursor-pointer rounded-2xl border border-emerald-400/20 bg-black/40 p-3 backdrop-blur-sm transition-colors hover:bg-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-normal tracking-tight text-slate-200">Receitas do mês</p>
                    <span className="text-[0.7rem] font-normal tracking-tight text-emerald-300">+18.2%</span>
                  </div>
                  <p className="mt-2 text-xl font-medium tracking-tight text-slate-50 transition-transform group-hover/item:translate-x-1">R$ 15.200</p>
                  <div className="mt-3 h-14 overflow-hidden rounded-xl bg-gradient-to-tr from-emerald-500/20 via-emerald-400/10 to-transparent">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.9),_transparent_55%)] opacity-60 transition-opacity group-hover/item:opacity-80" />
                  </div>
                </div>
                <div className="group/item cursor-pointer rounded-2xl border border-emerald-400/20 bg-black/40 p-3 backdrop-blur-sm transition-colors hover:bg-rose-500/10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-normal tracking-tight text-slate-200">Despesas do mês</p>
                    <span className="text-[0.7rem] font-normal tracking-tight text-emerald-300">-5.1%</span>
                  </div>
                  <p className="mt-2 text-xl font-medium tracking-tight text-slate-50 transition-transform group-hover/item:translate-x-1">R$ 2.353</p>
                  <div className="mt-3 h-14 overflow-hidden rounded-xl bg-gradient-to-tr from-rose-500/20 via-emerald-400/10 to-transparent">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_bottom,_rgba(248,113,113,0.9),_transparent_55%)] opacity-70 transition-opacity group-hover/item:opacity-90" />
                  </div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Categorias automáticas • IA ativa</span>
                <span>Atualizado agora</span>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent opacity-70" />
            <div className="relative mt-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium tracking-tight text-slate-50">Painel Financeiro</h2>
                <p className="text-sm font-light text-slate-300">Visão completa das suas finanças em tempo real.</p>
              </div>
              <div className="hidden items-center gap-2 text-[0.7rem] text-slate-400 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Sincronizado
              </div>
            </div>
          </section>

          {/* Card 2: WhatsApp Integration */}
          <section
            className="animate-in delay-300 hover-card-effect relative overflow-hidden rounded-3xl bg-gradient-to-bl from-emerald-500/20 via-emerald-500/5 to-transparent p-6 sm:p-8"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute -translate-y-10 translate-x-10 right-0 top-0 h-60 w-60 rounded-full bg-emerald-500/25 blur-3xl" />
              <div className="absolute bottom-0 left-1/4 h-40 w-40 translate-y-1/3 rounded-full bg-emerald-400/20 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-200/80">Lançamento via WhatsApp</p>
                <div className="flex items-center gap-2 rounded-full border border-emerald-300/40 bg-black/40 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  <span className="text-[0.7rem] font-normal tracking-tight text-emerald-100">IA processando</span>
                </div>
              </div>
              <div className="space-y-4">
                {/* User message */}
                <div className="relative rounded-2xl border border-emerald-400/40 bg-black/60 p-4 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-sm transition-all hover:border-emerald-400/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 text-xs font-normal tracking-tight text-emerald-100">
                        <Mic className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-normal tracking-tight text-slate-200">Você disse</p>
                        <p className="mt-0.5 text-sm font-medium tracking-tight text-slate-50">&quot;Paguei 150 reais de luz&quot;</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.7rem] text-slate-400">Áudio: 3s</p>
                      <p className="text-[0.7rem] text-emerald-300">Transcrito por IA</p>
                    </div>
                  </div>
                </div>
                {/* Connector */}
                <div className="flex items-center justify-center">
                  <div className="relative flex items-center gap-2">
                    <div className="h-px w-20 overflow-hidden bg-gradient-to-r from-transparent via-emerald-400/60 to-emerald-400/10">
                      <div className="h-full w-1/2 animate-[shimmer_2s_infinite_linear] bg-emerald-400/80 blur-[1px]" style={{ transform: "translateX(-100%)" }} />
                    </div>
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/20 backdrop-blur-md transition-transform hover:scale-110">
                      <Brain className="h-4 w-4 text-emerald-300" />
                      <span className="absolute -bottom-4 w-max text-[0.6rem] font-normal tracking-tight text-emerald-200/80">IA Bridge</span>
                    </div>
                    <div className="h-px w-20 overflow-hidden bg-gradient-to-l from-transparent via-emerald-400/60 to-emerald-400/10">
                      <div className="h-full w-1/2 animate-[shimmer_2s_infinite_linear_0.5s] bg-emerald-400/80 blur-[1px]" style={{ transform: "translateX(200%)" }} />
                    </div>
                  </div>
                </div>
                {/* AI response */}
                <div className="relative rounded-2xl border border-emerald-400/40 bg-black/60 p-4 backdrop-blur-sm transition-all hover:border-emerald-400/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 text-xs font-normal tracking-tight text-emerald-100">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-normal tracking-tight text-slate-200">IA identificou</p>
                        <p className="mt-0.5 text-xl font-medium tracking-tight text-slate-50">Despesa: R$ 150,00</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.7rem] text-slate-400">Categoria: Moradia</p>
                      <p className="text-[0.7rem] text-emerald-300">Confirmar no chat</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                <span>
                  Precisão de <span className="font-normal tracking-tight text-emerald-300">98.5%</span>
                </span>
                <span className="text-[0.7rem] font-normal tracking-tight text-slate-500">Texto e áudio</span>
              </div>
            </div>
            <div className="relative mt-6">
              <h2 className="text-lg font-medium tracking-tight text-slate-50">Integração WhatsApp</h2>
              <p className="mt-1 text-sm font-light text-slate-300">Envie texto ou áudio. A IA identifica, categoriza e confirma automaticamente.</p>
            </div>
          </section>
        </div>

        {/* Bottom Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Card 3: Categorias IA */}
          <section
            className="animate-in delay-400 hover-card-effect relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-black to-black p-5 sm:p-6"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-emerald-500/30 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-200/80">Categorias</p>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.7rem] font-normal tracking-tight text-emerald-200">{mesAtual}</span>
              </div>
              <div className="mt-4 flex flex-grow flex-col rounded-2xl border border-emerald-400/25 bg-black/50 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                  <span>Gastos por categoria</span>
                  <span>Este mês</span>
                </div>
                {/* Mini chart bars */}
                <div className="flex flex-grow items-end gap-2 pt-4">
                  {[
                    { label: "Moradia", h: "h-16" },
                    { label: "Alimentação", h: "h-24" },
                    { label: "Transporte", h: "h-12" },
                    { label: "Saúde", h: "h-20" },
                    { label: "Outros", h: "h-8" },
                  ].map((bar) => (
                    <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                      <div className={`${bar.h} w-full rounded bg-gradient-to-t from-emerald-500/80 to-emerald-400/20 transition-all hover:from-emerald-400 hover:to-emerald-300/40`} />
                      <span className="text-[9px] text-slate-500">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-base font-medium tracking-tight text-slate-50">Visão por Categoria</h3>
                <p className="text-sm font-light text-slate-300">Categorias automáticas com IA e personalizáveis.</p>
              </div>
            </div>
          </section>

          {/* Card 4: Seguranca */}
          <section
            className="animate-in delay-500 hover-card-effect group relative overflow-hidden rounded-3xl bg-gradient-to-tr from-black via-slate-950 to-emerald-500/10 p-5 sm:p-6"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-500/30 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col">
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 transition-colors group-hover:border-emerald-400/80">
                  <div className="absolute inset-3 rounded-full bg-emerald-500/20 blur-md transition-all group-hover:blur-lg" />
                  <Lock className="relative h-8 w-8 text-emerald-400 transition-transform duration-700 group-hover:rotate-[360deg]" />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="font-normal tracking-tight">Proteção Ativa</span>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-center">
                <h3 className="text-base font-medium tracking-tight text-slate-50">Segurança Total</h3>
                <p className="text-sm font-light text-slate-300">Seus dados são isolados e protegidos por criptografia.</p>
              </div>
              <div className="mt-4 grid gap-3 text-[0.7rem] text-slate-300">
                <div className="flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-400/30 bg-black/40 px-3 py-2 transition-colors hover:border-emerald-400/80 hover:bg-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Isolamento de dados</span>
                  </div>
                  <span className="font-normal tracking-tight text-emerald-200">Total</span>
                </div>
                <div className="flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-400/30 bg-black/40 px-3 py-2 transition-colors hover:border-emerald-400/80 hover:bg-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Autenticação</span>
                  </div>
                  <span className="font-normal tracking-tight text-emerald-200">Multi-fator</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 5: Contas a Pagar/Receber */}
          <section
            className="animate-in delay-500 hover-card-effect relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-500/15 via-black to-black p-5 sm:p-6"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute bottom-0 right-0 h-44 w-44 translate-x-6 translate-y-10 rounded-full bg-emerald-500/30 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-200/80">Contas</p>
                <span className="text-[0.7rem] font-normal tracking-tight text-emerald-200">A pagar e receber</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="cursor-pointer rounded-2xl border border-emerald-400/30 bg-black/50 px-3 py-2.5 transition-all hover:border-emerald-400/60 hover:bg-black/70 hover:scale-[1.02]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-10 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 text-[0.7rem] font-normal tracking-tight text-emerald-100">
                        <Receipt className="h-3 w-3" />
                      </span>
                      <div>
                        <p className="text-xs font-normal tracking-tight text-slate-200">Conta de Luz</p>
                        <p className="text-[0.7rem] text-slate-400">Vence 15/04</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tracking-tight text-rose-300">R$ 280</p>
                      <p className="text-[0.7rem] text-slate-400">Pendente</p>
                    </div>
                  </div>
                </div>
                <div className="cursor-pointer rounded-2xl border border-emerald-400/30 bg-black/50 px-3 py-2.5 transition-all hover:border-emerald-400/60 hover:bg-black/70 hover:scale-[1.02]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-10 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 text-[0.7rem] font-normal tracking-tight text-emerald-100">
                        <Wallet className="h-3 w-3" />
                      </span>
                      <div>
                        <p className="text-xs font-normal tracking-tight text-slate-200">Cliente João</p>
                        <p className="text-[0.7rem] text-slate-400">PIX • Recebido</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tracking-tight text-emerald-200">+ R$ 1.500</p>
                      <p className="text-[0.7rem] text-slate-400">Pago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-base font-medium tracking-tight text-slate-50">Gestão de Contas</h3>
                <p className="text-sm font-light text-slate-300">Controle de vencimentos e recebimentos.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Feature Section (Neural Treasury style) */}
      <section
        id="funcionalidades"
        className="group/section relative mx-auto mb-44 mt-24 max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.02] to-black p-6 sm:p-10"
      >
        {/* Ambient Background */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-full max-w-3xl w-full -translate-x-1/2 bg-emerald-500/5 blur-[100px]" />
        {/* Grid Pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">Controle Inteligente</span>
              </div>
              <h2 className="text-4xl font-medium leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Finanças no piloto{" "}
                <span className="bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 bg-clip-text text-transparent">automático.</span>
              </h2>
              {/* Feature pills */}
              <div className="relative mt-10">
                <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {[
                    { icon: MessageSquare, label: "WhatsApp IA" },
                    { icon: PieChart, label: "Categorias Auto" },
                    { icon: BarChart3, label: "Fluxo de Caixa" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/50 py-2 pr-4 backdrop-blur-sm sm:border-none sm:bg-transparent sm:p-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-8 border-t border-white/5 pt-8 sm:grid-cols-2">
              <div>
                <p className="text-base font-light leading-relaxed text-slate-400">
                  Nossa IA monitora seus lançamentos, categoriza automaticamente e gera insights sobre seus gastos. Tudo via WhatsApp ou painel web.
                </p>
                <p className="mt-4 text-xs text-emerald-300/60">R$ 29,90/mês com garantia de 7 dias</p>
              </div>
              <div className="hidden border-l border-white/5 pl-8 sm:block">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-2xl font-medium tracking-tight text-white">24/7</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">WhatsApp Ativo</div>
                  </div>
                  <div>
                    <div className="text-2xl font-medium tracking-tight text-white">0.5s</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">Tempo de Resposta</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content: Card Grid */}
          <div className="relative grid grid-cols-2 gap-4">
            {[
              { icon: MessageSquare, title: "WhatsApp Bot", desc: "Lançamento por voz", badge: "Ativo", badgeColor: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300", img: "/images/card_whatsapp_bot.png" },
              { icon: Brain, title: "IA Financeira", desc: "Interpretação automática", badge: "Neural", badgeColor: "border-white/10 bg-black/40 text-slate-300", img: "/images/card_ia_financeira.png" },
              { icon: BarChart3, title: "Dashboard", desc: "Gráficos em tempo real", badge: "Live", badgeColor: "border-white/10 bg-black/40 text-slate-300", img: "/images/card_dashboard.png" },
              { icon: PieChart, title: "Categorias", desc: "Auto-classificação", badge: "Smart", badgeColor: "border-white/10 bg-black/40 text-slate-300", img: "/images/card_categorias.png" },
            ].map((card) => (
              <div key={card.title} className="group relative h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition-colors hover:border-emerald-500/30">
                {/* Background image */}
                <img
                  alt={card.title}
                  src={card.img}
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/50" />
                <div className="absolute left-3 top-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-emerald-400 backdrop-blur-md">
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute right-3 top-3">
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-medium backdrop-blur-md ${card.badgeColor}`}>{card.badge}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-medium tracking-tight text-white">{card.title}</h3>
                  <p className="mt-0.5 text-xs font-light text-slate-400">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover/section:opacity-60">
          <div className="absolute -left-24 top-10 h-64 w-64 animate-pulse rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>
      </section>

      {/* Operational Intelligence Section */}
      <div id="inteligencia" className="mx-auto mb-24 max-w-6xl px-4 pb-20">
        {/* Section Header */}
        <div className="mb-10 mt-4 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Inteligência Operacional</h2>
            <p className="mt-2 text-sm text-slate-400">Controles avançados para sua gestão financeira.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
            <span className="text-xs text-emerald-300">PF e PJ</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Transcrição de Áudio */}
          <div
            className="group relative overflow-hidden rounded-[2rem] bg-emerald-950/20 p-8 transition-all duration-500 hover:bg-emerald-950/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.2))", "--border-radius-before": "2rem" } as React.CSSProperties}
          >
            <div
              className="relative mb-8 flex h-64 items-center justify-center rounded-3xl bg-gradient-to-b from-white/5 to-transparent shadow-inner transition-colors duration-500 group-hover:bg-white/[0.07]"
              style={{ position: "relative", "--border-gradient": "linear-gradient(180deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
            >
              {/* Audio widget */}
              <div className="relative z-10 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F0F] p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur-md transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02]">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-2 w-2">
                      <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <div className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200 transition-colors group-hover:text-emerald-300">Transcrição IA</div>
                      <div className="text-[10px] text-slate-500">Áudio • PT-BR</div>
                    </div>
                  </div>
                </div>
                {/* Waveform visualization */}
                <div className="mb-6 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono font-medium">
                    <span className="text-slate-400">00:03</span>
                    <span className="text-slate-400">00:05</span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="absolute left-0 top-0 h-full w-3/5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-[2000ms] ease-in-out group-hover:w-4/5" />
                  </div>
                </div>
                {/* Transcription */}
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Transcrição:</p>
                  <p className="text-xs text-slate-200">&quot;Paguei cento e cinquenta reais de luz&quot;</p>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50 transition-colors group-hover:text-white">Transcrição de Áudio</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
              Envie áudios no WhatsApp e a IA transcreve com precisão em português. Sem digitar nada.
            </p>
          </div>

          {/* Card 2: Dashboard Inteligente */}
          <div
            className="group relative overflow-hidden rounded-[2rem] bg-emerald-950/20 p-8 transition-all duration-500 hover:bg-emerald-950/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.2))", "--border-radius-before": "2rem" } as React.CSSProperties}
          >
            <div
              className="relative mb-8 flex h-64 items-center justify-center rounded-3xl bg-gradient-to-b from-white/5 to-transparent shadow-inner transition-colors duration-500 group-hover:bg-white/[0.07]"
              style={{ position: "relative", "--border-gradient": "linear-gradient(180deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
            >
              {/* Chart widget */}
              <div className="relative z-10 w-64 rounded-2xl border border-white/10 bg-[#0F0F0F] p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur-md transition-transform duration-500 group-hover:scale-[1.02]">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-transparent transition-colors group-hover:border-emerald-500/30">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200">Fluxo de Caixa</div>
                      <div className="text-[10px] text-slate-500">30 dias</div>
                    </div>
                  </div>
                </div>
                {/* Mini bars */}
                <div className="flex items-end gap-1.5 h-20">
                  {[40, 65, 45, 80, 55, 70, 35, 90, 60, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/60 to-emerald-400/20 transition-all duration-500 group-hover:from-emerald-400/80 group-hover:to-emerald-300/30"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-300">+R$ 5.050 líquido</span>
                  <span className="text-slate-500">{mesAtual} {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50 transition-colors group-hover:text-white">Dashboard Inteligente</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
              Gráficos de fluxo de caixa, detalhamento por categoria e lançamentos recentes. Tudo atualizado em tempo real.
            </p>
          </div>

          {/* Card 3: Lançamento Rápido */}
          <div
            className="group relative overflow-hidden rounded-[2rem] bg-emerald-950/20 p-8 transition-all duration-500 hover:bg-emerald-950/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.2))", "--border-radius-before": "2rem" } as React.CSSProperties}
          >
            <div
              className="relative mb-8 flex h-64 items-center justify-center rounded-3xl bg-gradient-to-b from-white/5 to-transparent shadow-inner transition-colors duration-500 group-hover:bg-white/[0.07]"
              style={{ position: "relative", "--border-gradient": "linear-gradient(180deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
            >
              {/* Payment card widget */}
              <div className="relative z-10 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F0F] p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur-md transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">Novo Lançamento</div>
                    <div className="text-[10px] text-slate-500">Via painel web</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] text-slate-500">Descrição</p>
                    <p className="text-xs text-slate-200">Conta de luz</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                      <p className="text-[10px] text-slate-500">Valor</p>
                      <p className="text-xs text-emerald-300">R$ 150,00</p>
                    </div>
                    <div className="flex-1 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                      <p className="text-[10px] text-slate-500">Tipo</p>
                      <p className="text-xs text-rose-300">Despesa</p>
                    </div>
                  </div>
                </div>
                {/* Status pill */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#1A1A1A] py-1.5 pl-2 pr-3 shadow-lg transition-all duration-300 group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10">
                  <div className="h-4 w-4 animate-pulse rounded bg-gradient-to-br from-emerald-500 to-emerald-600" />
                  <div className="text-[10px] font-medium text-slate-300">Salvando...</div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50 transition-colors group-hover:text-white">Lançamento Rápido</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
              Formulário intuitivo no painel web. Categorias automáticas, vencimentos e status. Poucos cliques para lançar.
            </p>
          </div>

          {/* Card 4: Assistente IA */}
          <div
            className="group relative overflow-hidden rounded-[2rem] bg-emerald-950/20 p-8 transition-all duration-500 hover:bg-emerald-950/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            style={{ position: "relative", "--border-gradient": "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.2))", "--border-radius-before": "2rem" } as React.CSSProperties}
          >
            <div
              className="relative mb-8 flex h-64 items-center justify-center rounded-3xl bg-gradient-to-b from-white/5 to-transparent shadow-inner transition-colors duration-500 group-hover:bg-white/[0.07]"
              style={{ position: "relative", "--border-gradient": "linear-gradient(180deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0))", "--border-radius-before": "24px" } as React.CSSProperties}
            >
              {/* Chat interface */}
              <div className="relative z-10 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F0F] p-4 shadow-2xl ring-1 ring-white/5 backdrop-blur-md transition-transform duration-500 group-hover:scale-[1.02]">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                    <Brain className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-medium text-emerald-300">Guarda IA</span>
                </div>
                <div className="space-y-2">
                  {/* User message */}
                  <div className="ml-auto w-fit max-w-[80%] rounded-xl rounded-br-sm bg-emerald-500/20 px-3 py-2">
                    <p className="text-[10px] text-emerald-100">Paguei 150 de luz</p>
                  </div>
                  {/* AI response */}
                  <div className="w-fit max-w-[90%] rounded-xl rounded-bl-sm border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] text-slate-300">Lancei uma despesa de R$ 150,00 — Conta de luz (Moradia). Confirma?</p>
                  </div>
                  {/* User confirm */}
                  <div className="ml-auto w-fit rounded-xl rounded-br-sm bg-emerald-500/20 px-3 py-2">
                    <p className="text-[10px] text-emerald-100">Sim</p>
                  </div>
                  {/* AI confirm */}
                  <div className="w-fit max-w-[85%] rounded-xl rounded-bl-sm border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] text-slate-300">Lançamento confirmado! &#x2705;</p>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50 transition-colors group-hover:text-white">Assistente IA</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
              Converse com a IA pelo WhatsApp. Ela entende texto e áudio, categoriza e pede confirmação antes de salvar.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div id="cta" className="relative mt-20 overflow-hidden rounded-[2rem] border border-white/10">
          {/* Background glows */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-10 translate-y-10 rounded-full bg-emerald-500/5 blur-[80px]" />

          <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20 text-center">
            <h2 className="max-w-2xl text-4xl font-medium tracking-tight text-white sm:text-5xl">
              Pronto para guardar seu{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 bg-clip-text text-transparent">dinheiro?</span>
            </h2>
            <p className="mt-6 max-w-md text-lg font-light text-slate-400">
              R$ 29,90/mês — garantia incondicional de 7 dias. Cancele quando quiser.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/planos"
                className="group flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
              >
                <span>Quero assinar agora</span>
                <ArrowRight className="h-4 w-4 text-black/50 transition-transform group-hover:translate-x-1 group-hover:text-black" />
              </Link>
              <Link
                href="/login"
                className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Já tenho conta
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Garantia 7 dias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-500" />
                <span>WhatsApp + Web</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <Shield className="h-3.5 w-3.5 text-black fill-black" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-slate-100">Guarda Dinheiro</span>
              </Link>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                O sistema financeiro inteligente para pessoas físicas e jurídicas.
              </p>
              <p className="mt-4 text-[10px] text-slate-600">Dados protegidos conforme a LGPD</p>
            </div>
            <div className="col-span-2 md:col-span-3">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Produto</h4>
                  <ul className="mt-4 space-y-2.5 text-xs text-slate-500">
                    <li><a href="#painel" className="transition-colors hover:text-emerald-400">Dashboard</a></li>
                    <li><a href="#funcionalidades" className="transition-colors hover:text-emerald-400">Lançamentos</a></li>
                    <li><a href="#funcionalidades" className="transition-colors hover:text-emerald-400">Categorias</a></li>
                    <li><a href="#inteligencia" className="transition-colors hover:text-emerald-400">Fluxo de Caixa</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-white">Recursos</h4>
                  <ul className="mt-4 space-y-2.5 text-xs text-slate-500">
                    <li><a href="#funcionalidades" className="transition-colors hover:text-emerald-400">WhatsApp</a></li>
                    <li><a href="#painel" className="transition-colors hover:text-emerald-400">Contas a Pagar</a></li>
                    <li><a href="#painel" className="transition-colors hover:text-emerald-400">Contas a Receber</a></li>
                    <li><Link href="/login" className="transition-colors hover:text-emerald-400">Configurações</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-white">Conta</h4>
                  <ul className="mt-4 space-y-2.5 text-xs text-slate-500">
                    <li><Link href="/planos" className="transition-colors hover:text-emerald-400">Criar conta</Link></li>
                    <li><Link href="/login" className="transition-colors hover:text-emerald-400">Entrar</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 pb-8 sm:flex-row">
            <p className="text-[10px] text-slate-600">
              &copy; 2026 Guarda Dinheiro. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-[10px] text-slate-600">
              <Link href="/privacidade" className="hover:text-slate-400 transition-colors">Política de Privacidade</Link>
              <Link href="/termos" className="hover:text-slate-400 transition-colors">Termos de Uso</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
