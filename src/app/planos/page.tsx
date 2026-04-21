import Link from "next/link";
import { Shield, Check, Gift, MessageSquare, Mic, BrainCircuit, TrendingUp, Bell } from "lucide-react";
import { SubscribeForm, SubscribeProvider } from "./subscribe-form";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { Logo } from "@/components/brand/logo";
import { planosFAQs, faqsToJsonLd } from "@/data/faqs";

export const metadata = {
  title: "Planos",
  description:
    "Assistente financeiro no WhatsApp com IA. Plano mensal R$ 79,90 ou anual 12x R$ 29,90. Garantia de 7 dias.",
  alternates: { canonical: "/planos" },
  openGraph: {
    title: "Planos | Guarda Dinheiro",
    description:
      "Plano Anual R$ 29,90/mês ou Mensal R$ 79,90. Assistente financeiro no WhatsApp com IA. Garantia de 7 dias.",
    url: "/planos",
    type: "website" as const,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Planos | Guarda Dinheiro",
    description:
      "Plano Anual R$ 29,90/mês ou Mensal R$ 79,90. Garantia de 7 dias.",
  },
};

export default async function PlanosPage() {
  return (
    <SubscribeProvider>
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <Logo size={24} withText />
          </Link>
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Entrar
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        {/* Hero */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs tracking-tight text-emerald-300">Garantia de 7 dias</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight">
            <span className="block text-slate-400">Escolha seu plano e</span>
            <span className="block bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-100 bg-clip-text text-transparent">
              assuma o controle.
            </span>
          </h1>

          <p className="mt-4 max-w-md mx-auto text-sm sm:text-base text-slate-400">
            Controle financeiro pelo WhatsApp com IA. Registre gastos por áudio, receba lembretes e
            veja tudo no painel — em segundos.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plano Anual — Destaque */}
            <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 p-6 sm:p-8 overflow-hidden">
              <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] opacity-80" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6 gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                    <Shield className="h-3 w-3 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-300">Mais escolhido</span>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider shrink-0">
                    -62%
                  </span>
                </div>

                <h2 className="text-2xl font-semibold">Plano Anual</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold">R$ 29,90</span>
                  <span className="text-base text-slate-400">/mês</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  12x sem juros · Total: <span className="text-emerald-300 font-semibold">R$ 358,80/ano</span>
                </p>

                <div className="mt-5 space-y-2 text-sm">
                  <Feature text="Tudo do plano mensal incluído" />
                  <Feature text="Economia de R$ 600 por ano" />
                  <Feature text="PIX à vista ou até 12x no cartão" />
                  <Feature text="Score financeiro semanal + agenda" />
                  <Feature text="Menos de R$ 1 por dia" />
                </div>

                <div className="mt-6">
                  <SubscribeForm
                    plan="anual"
                    planLabel="Anual"
                    monthlyPrice="R$ 29,90"
                    totalPrice="R$ 358,80"
                    buttonLabel="Quero o plano anual"
                    buttonClass="block w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm sm:text-base rounded-full text-center transition-all hover:scale-[1.02]"
                  />
                </div>
                <p className="text-center text-[11px] text-slate-500 mt-2">Cartão, PIX · Garantia 7 dias · Cancele quando quiser</p>
              </div>
            </div>

            {/* Plano Mensal */}
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 overflow-hidden">
              <div className="relative z-10">
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">
                    Sem compromisso
                  </span>
                </div>

                <h2 className="text-2xl font-semibold">Plano Mensal</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold">R$ 79,90</span>
                  <span className="text-base text-slate-400">/mês</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Cobrado mensalmente · Cancele quando quiser
                </p>

                <div className="mt-5 space-y-2 text-sm">
                  <Feature text="WhatsApp 24h com IA" />
                  <Feature text="Gastos por texto ou áudio" />
                  <Feature text="Consultas: saldo, gastos, categorias" />
                  <Feature text="Lembretes diários" />
                  <Feature text="Painel web completo" />
                  <Feature text="PF e PJ no mesmo plano" />
                </div>

                <div className="mt-6">
                  <SubscribeForm
                    plan="mensal"
                    planLabel="Mensal"
                    monthlyPrice="R$ 79,90"
                    totalPrice="R$ 79,90"
                    buttonLabel="Quero o plano mensal"
                    buttonClass="block w-full py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base rounded-full text-center transition-all hover:scale-[1.02] border border-white/10"
                  />
                </div>
                <p className="text-center text-[11px] text-slate-500 mt-2">Cartão, PIX · Garantia 7 dias · Cancele quando quiser</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bônus — mais claro que é opcional */}
        <section className="mb-12">
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Bônus opcional no checkout</h3>
                <p className="text-xs text-slate-500">Adicione por R$ 67 (avulso, não obrigatório)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-4">
              <BonusItem
                title="eBook Arquitetura da Liberdade"
                desc="57 páginas · 10 capítulos · FIRE, Investimentos"
              />
              <BonusItem
                title="Workbook Meu Dia Perfeito"
                desc="PDF interativo · Metas SMART · Plano de 4 meses"
              />
              <BonusItem
                title="Planilha Simulador de Cenários"
                desc="5 abas: Fôlego, Crise, Independência, Painel"
              />
            </div>
          </div>
        </section>

        {/* O que está incluso — reformulado como benefícios, não features */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-8">
            O que você consegue fazer com o Guardinha
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard
              icon={MessageSquare}
              title="Registrar gastos falando"
              desc={'"Gastei 80 no mercado" — por texto ou áudio. A IA entende e organiza.'}
            />
            <FeatureCard
              icon={Mic}
              title="Enviar áudio no WhatsApp"
              desc="Não precisa digitar. Manda um áudio de 3 segundos e pronto."
            />
            <FeatureCard
              icon={BrainCircuit}
              title="Perguntar sobre seu dinheiro"
              desc={'"Quanto gastei esse mês?", "Tem conta atrasada?" — resposta na hora.'}
            />
            <FeatureCard
              icon={Bell}
              title="Receber lembretes todo dia"
              desc="Todo dia de manhã: contas a pagar, vencidas e compromissos."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Ver tudo no painel web"
              desc="Gráficos, fluxo de caixa, categorias — acessa pelo celular ou PC."
            />
            <FeatureCard
              icon={Shield}
              title="PF e PJ no mesmo plano"
              desc="Serve pra autônomo, MEI, microempresa. A IA adapta as categorias."
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6">Perguntas frequentes</h2>
          <FAQAccordion items={planosFAQs} page="planos" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqsToJsonLd(planosFAQs)) }}
          />
        </section>

        {/* CTA final */}
        <section className="text-center py-10">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Daqui a 7 dias você vai saber pra onde vai cada centavo.
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Se não valer, devolvemos 100%. Ativação imediata. Cartão ou PIX.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SubscribeForm
              plan="anual"
              planLabel="Anual"
              monthlyPrice="R$ 29,90"
              totalPrice="R$ 358,80"
              buttonLabel="Anual — R$ 29,90/mês"
              buttonClass="w-full sm:w-auto inline-block px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-full transition-all hover:scale-105 text-center cursor-pointer"
            />
            <SubscribeForm
              plan="mensal"
              planLabel="Mensal"
              monthlyPrice="R$ 79,90"
              totalPrice="R$ 79,90"
              buttonLabel="Mensal — R$ 79,90/mês"
              buttonClass="w-full sm:w-auto inline-block px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-full transition-all hover:scale-105 border border-white/10 text-center cursor-pointer"
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-xs text-slate-500">
          <p>© 2026 Guarda Dinheiro · Pagamento seguro processado pela Mercado Pago</p>
          <p className="mt-2">
            <Link href="/termos" className="hover:text-slate-300">Termos</Link>
            <span className="mx-2">·</span>
            <Link href="/privacidade" className="hover:text-slate-300">Privacidade</Link>
          </p>
        </div>
      </footer>
    </div>
    </SubscribeProvider>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
      <span className="text-slate-300">{text}</span>
    </div>
  );
}

function BonusItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{desc}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

