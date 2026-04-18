import Link from "next/link";
import {
  Shield, MessageSquare, Mic, BarChart3, Bell, Brain, Clock, Check,
  ArrowRight, Zap, Lock, Star, TrendingUp, CalendarDays,
} from "lucide-react";

const CHECKOUT_ANUAL = process.env.HOTMART_CHECKOUT_URL ?? "https://pay.hotmart.com/V105379736J";
const CHECKOUT_MENSAL = process.env.HOTMART_CHECKOUT_MENSAL_URL ?? CHECKOUT_ANUAL;

export const metadata = {
  title: "Guarda Dinheiro — Organize suas finanças pelo WhatsApp com IA",
  description:
    "Mande um áudio ou texto no WhatsApp e a IA organiza tudo. Receitas, despesas, lembretes, score financeiro. R$ 29,90/mês com garantia de 7 dias.",
};

export default function LandingInfoproduto() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-emerald-500/20 bg-black/90 backdrop-blur-xl p-3 sm:hidden">
        <a
          href={CHECKOUT_ANUAL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-emerald-500 text-black font-bold text-sm rounded-full text-center"
        >
          ASSINAR POR R$ 29,90/MES
        </a>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5">
            <Clock className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-300">Oferta por tempo limitado</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Cansado de{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
              perder o controle
            </span>{" "}
            do seu dinheiro?
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl mx-auto">
            O <strong className="text-emerald-300">Guardinha</strong> organiza suas finanças pelo WhatsApp.
            Manda um áudio, texto, e a IA faz o resto.{" "}
            <strong>24 horas por dia.</strong>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={CHECKOUT_ANUAL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-14 items-center gap-3 rounded-full bg-emerald-500 px-8 text-base font-bold text-black transition-all hover:scale-105 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
            >
              QUERO ORGANIZAR MINHAS FINANCAS
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <p className="text-xs text-slate-500">R$ 29,90/mes | Garantia 7 dias | Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* Dor */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Voce se identifica com algum desses problemas?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: "😰", title: "Nao sabe pra onde vai o dinheiro", desc: "Final do mes chega e voce nao sabe como gastou tudo. As contas se acumulam sem controle." },
              { icon: "😤", title: "Esquece de pagar contas", desc: "Multas, juros, nome sujo. Tudo porque esqueceu de pagar uma conta que venceu ontem." },
              { icon: "😩", title: "Planilha da preguica", desc: "Ja tentou planilha, app de financas, caderninho. Nada funciona porque da trabalho demais." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-center">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 text-sm font-bold text-red-200">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solucao */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300">A solucao</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Manda um audio no WhatsApp.{" "}
            <span className="text-emerald-300">A IA faz o resto.</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Sem app pra baixar. Sem planilha. Sem cadastro complicado.
            Voce fala, o Guardinha entende e organiza tudo automaticamente.
          </p>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Tudo que voce precisa num lugar so</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquare, title: "Lanca pelo WhatsApp", desc: "\"Gastei 50 no mercado\" — texto ou audio. A IA categoriza automaticamente." },
              { icon: Mic, title: "Funciona com audio", desc: "Grava um audio dizendo o gasto. O Guardinha transcreve e registra pra voce." },
              { icon: BarChart3, title: "Dashboard completo", desc: "Graficos, fluxo de caixa, categorias, contas a pagar e receber. Tudo visual." },
              { icon: Bell, title: "Lembretes diarios", desc: "Todo dia as 08h voce recebe um resumo: contas, compromissos, vencimentos." },
              { icon: CalendarDays, title: "Agenda inteligente", desc: "\"Tenho medico amanha as 16h\" — lembra 30 minutos antes automaticamente." },
              { icon: TrendingUp, title: "Score financeiro", desc: "Nota de 0 a 1000 que mostra como esta sua saude financeira. Atualiza toda semana." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos placeholder */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold mb-10">O que nossos clientes dizem</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Em breve", text: "Primeiros clientes sendo atendidos. Seus depoimentos aparecerao aqui.", stars: 5 },
              { name: "Em breve", text: "Estamos coletando feedback real dos nossos primeiros usuarios.", stars: 5 },
              { name: "Em breve", text: "Voce pode ser um dos primeiros a compartilhar sua experiencia!", stars: 5 },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: item.stars }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-400 italic mb-3">&quot;{item.text}&quot;</p>
                <p className="text-xs font-semibold text-slate-500">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garantia */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8 sm:p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold">Garantia incondicional de 7 dias</h2>
            <p className="mt-4 text-slate-400 max-w-md mx-auto">
              Assine, use por 7 dias. Se nao gostar por <strong>qualquer motivo</strong>,
              devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.
              E um direito do consumidor e a gente respeita.
            </p>
          </div>
        </div>
      </section>

      {/* Seguranca */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Seguranca de verdade</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Lock, title: "Criptografia bancaria", desc: "Dados protegidos em transito e em repouso com o mesmo padrao dos bancos." },
              { icon: Shield, title: "LGPD", desc: "100% em conformidade com a Lei Geral de Protecao de Dados. Exclua seus dados quando quiser." },
              { icon: Brain, title: "IA sem retencao", desc: "A IA processa seus dados pra categorizar, mas nunca armazena. Privacidade total." },
              { icon: Lock, title: "Somente registro", desc: "O Guardinha nao acessa suas contas bancarias. So registra o que voce manda." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precos */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Escolha seu plano</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Anual */}
            <div className="relative rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-black">
                MAIS POPULAR
              </span>
              <h3 className="text-xl font-bold mt-2">Plano Anual</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">R$ 29,90</span>
                <span className="text-slate-400">/mes</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">12x sem juros | Total R$ 358,80/ano</p>
              <div className="mt-6 space-y-2">
                {["Tudo incluido", "Economia de 40% vs mensal", "Score financeiro + agenda", "Bonus exclusivos no checkout"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
              <a
                href={CHECKOUT_ANUAL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base rounded-full text-center transition-all hover:scale-[1.02]"
              >
                ASSINAR ANUAL
              </a>
            </div>

            {/* Mensal */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-xl font-bold mt-2">Plano Mensal</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">R$ 49,90</span>
                <span className="text-slate-400">/mes</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Cobrado mensalmente | Cancele quando quiser</p>
              <div className="mt-6 space-y-2">
                {["WhatsApp 24/7 com IA", "Lancamentos por texto ou audio", "Dashboard web completo", "Lembretes diarios"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-slate-400">{f}</span>
                  </div>
                ))}
              </div>
              <a
                href={CHECKOUT_MENSAL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-base rounded-full text-center transition-all hover:scale-[1.02] border border-white/10"
              >
                ASSINAR MENSAL
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-3">
            {[
              { q: "Preciso baixar algum app?", a: "Nao. Funciona 100% no WhatsApp que voce ja usa. Tem tambem um painel web pra graficos e relatorios." },
              { q: "Como funciona a garantia?", a: "Assina, usa 7 dias. Se nao gostar, reembolso integral pela Hotmart. Sem perguntas." },
              { q: "A IA realmente entende o que eu falo?", a: "Sim. Usamos IA de ultima geracao com precisao acima de 95%. Entende texto, audio, e ate giriias." },
              { q: "E se eu cancelar?", a: "Cancela quando quiser pela Hotmart. Sem multa. Mantem acesso ate o fim do periodo pago." },
              { q: "Funciona pra empresa (PJ)?", a: "Sim! No cadastro voce escolhe PF ou PJ. Categorias e contexto se adaptam automaticamente." },
              { q: "O Guardinha acessa minha conta bancaria?", a: "Nao. Ele apenas registra o que voce manda. Nao temos acesso a contas, senhas ou dados bancarios." },
              { q: "Como faco pra comecar?", a: "Clica em 'Assinar', paga no Hotmart (cartao, PIX ou boleto), ativa pelo WhatsApp em 30 segundos e ja pode usar." },
              { q: "E seguro?", a: "Criptografia de ponta, LGPD, dados nunca compartilhados. A IA processa mas nao retém seus dados." },
            ].map((item) => (
              <details key={item.q} className="group rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-semibold pr-4">{item.q}</span>
                  <span className="text-emerald-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Pare de perder dinheiro.{" "}
            <span className="text-emerald-300">Comece hoje.</span>
          </h2>
          <p className="mt-4 text-slate-400">
            R$ 29,90/mes com garantia de 7 dias. Cancele quando quiser.
          </p>
          <a
            href={CHECKOUT_ANUAL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-10 py-5 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
          >
            QUERO COMECAR AGORA
            <ArrowRight className="h-5 w-5" />
          </a>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
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
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 pb-20 sm:pb-8">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-slate-600">
          <p>&copy; 2026 Guarda Dinheiro. Todos os direitos reservados.</p>
          <p className="mt-2">
            <Link href="/termos" className="hover:text-slate-400">Termos</Link>
            <span className="mx-2">|</span>
            <Link href="/privacidade" className="hover:text-slate-400">Privacidade</Link>
          </p>
          <p className="mt-2 text-slate-700">
            Este produto nao substitui consultoria financeira profissional. O Guardinha e um assistente de registro e organizacao.
          </p>
        </div>
      </footer>
    </div>
  );
}
