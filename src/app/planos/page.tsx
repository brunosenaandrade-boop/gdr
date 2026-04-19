import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shield, Check, Gift, MessageSquare, Mic, BrainCircuit, TrendingUp, Bell } from "lucide-react";

// Checkout via Mercado Pago — URLs serão geradas dinamicamente via server action
// Fallback: página /planos com botão que redireciona

export const metadata = {
  title: "Planos — Guarda Dinheiro",
  description:
    "Assistente financeiro no WhatsApp com IA. Plano mensal R$ 49,90 ou anual 12x R$ 29,90. Garantia de 7 dias.",
};

async function getCheckoutUrls(): Promise<{ anual: string; mensal: string }> {
  try {
    const { createCheckoutPreference } = await import("@/lib/mercadopago/checkout");
    let email: string | undefined;
    let tenantId: string | undefined;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email ?? undefined;
      if (user) {
        const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
        tenantId = tenant?.id;
      }
    } catch {
      // Usuário não logado
    }

    const [anualResult, mensalResult] = await Promise.all([
      createCheckoutPreference({ tenantId, planType: "anual", email }),
      createCheckoutPreference({ tenantId, planType: "mensal", email }),
    ]);

    return {
      anual: anualResult.ok ? anualResult.url : "/planos",
      mensal: mensalResult.ok ? mensalResult.url : "/planos",
    };
  } catch {
    return { anual: "/planos", mensal: "/planos" };
  }
}

export default async function PlanosPage() {
  const checkoutUrl = await getCheckoutUrls();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Shield className="h-3.5 w-3.5 text-black fill-black" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Guarda Dinheiro</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Já sou cliente →
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        {/* Hero */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs tracking-tight text-emerald-300">Escolha seu plano — garantia de 7 dias</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-normal tracking-tight">
            <span className="block text-slate-400">Pare de perder dinheiro</span>
            <span className="block bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-100 bg-clip-text text-transparent">
              por falta de controle.
            </span>
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-lg text-slate-400">
            A maioria das pessoas perde ate 30% da renda por nao saber pra onde o dinheiro vai.
            Com o Guardinha, voce registra tudo em segundos pelo WhatsApp — e finalmente enxerga o problema.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plano Anual — Destaque */}
            <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 p-8 overflow-hidden">
              <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] opacity-80" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">Melhor custo-benefício</span>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                    -40% vs mensal
                  </span>
                </div>

                <h2 className="text-2xl font-semibold">Plano Anual</h2>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$ 29,90</span>
                  <span className="text-lg text-slate-400">/mês</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  12x sem juros · Total: <span className="text-emerald-300 font-semibold">R$ 358,80/ano</span>
                </p>

                <div className="mt-6 space-y-2 text-sm">
                  <Feature text="Tudo do plano mensal incluido" />
                  <Feature text="Voce economiza R$ 240/ano vs mensal" />
                  <Feature text="Score financeiro semanal + agenda" />
                  <Feature text="Bonus exclusivos no checkout" />
                  <Feature text="Menos de R$ 1 por dia pelo controle total" />
                </div>

                <a
                  href={checkoutUrl.anual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 block w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base rounded-full text-center transition-all hover:scale-[1.02]"
                >
                  Assinar anual por R$ 29,90/mês
                </a>
                <p className="text-center text-xs text-slate-500 mt-3">Garantia de 7 dias · Cartão, PIX ou Boleto</p>
              </div>
            </div>

            {/* Plano Mensal */}
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 overflow-hidden">
              <div className="relative z-10">
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-400">
                    Flexibilidade
                  </span>
                </div>

                <h2 className="text-2xl font-semibold">Plano Mensal</h2>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$ 49,90</span>
                  <span className="text-lg text-slate-400">/mês</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Cobrado mensalmente · Cancele quando quiser
                </p>

                <div className="mt-6 space-y-2 text-sm">
                  <Feature text="WhatsApp 24/7 com IA" />
                  <Feature text="Lançamentos por texto ou áudio" />
                  <Feature text="Consultas: saldo, gastos, categorias" />
                  <Feature text="Lembretes diários" />
                  <Feature text="Dashboard web completo" />
                  <Feature text="PF e PJ num só plano" />
                </div>

                <a
                  href={checkoutUrl.mensal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 block w-full py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-base rounded-full text-center transition-all hover:scale-[1.02] border border-white/10"
                >
                  Assinar mensal por R$ 49,90/mês
                </a>
                <p className="text-center text-xs text-slate-500 mt-3">Garantia de 7 dias · Cartão, PIX ou Boleto</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bônus */}
        <section className="mb-16">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Bônus exclusivo no checkout</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Adicione ao seu pedido por apenas <strong className="text-amber-300">R$ 67</strong> e ganhe:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <BonusItem
                title="eBook Arquitetura da Liberdade"
                desc="57 páginas · 10 capítulos · Dia Perfeito, 3 Baldes, FIRE, Investimentos"
              />
              <BonusItem
                title="Workbook Meu Dia Perfeito"
                desc="PDF interativo preenchível · Metas SMART · Plano de 4 meses"
              />
              <BonusItem
                title="Planilha Simulador de Cenários"
                desc="5 abas: Fôlego, Despesa Surpresa, Crise Mercado, Independência, Painel"
              />
            </div>

            <p className="text-xs text-slate-500 mt-6">
              ⚠️ Oferta válida apenas no momento do checkout. Disponível como &quot;produto adicional&quot; no pagamento.
            </p>
          </div>
        </section>

        {/* Features em detalhe */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-10">
            Tudo isso incluso no seu plano
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={MessageSquare}
              title="Conversar como um amigo"
              desc='"Gastei 80 no mercado" ou "paguei 250 de luz". A IA entende e categoriza.'
            />
            <FeatureCard
              icon={Mic}
              title="Falar no áudio"
              desc="Mandando áudio ou texto — o que for mais rápido. Transcrição automática."
            />
            <FeatureCard
              icon={BrainCircuit}
              title="Perguntar qualquer coisa"
              desc='"Qual meu saldo?", "Quanto gastei de alimentação?", "Tem conta atrasada?"'
            />
            <FeatureCard
              icon={Bell}
              title="Lembretes diários"
              desc="Todo dia de manhã recebe um resumo: contas a pagar, vencidas e compromissos."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Dashboard web"
              desc="Gráficos, relatórios, fluxo de caixa, categorias — tudo visual no painel."
            />
            <FeatureCard
              icon={Shield}
              title="PF e PJ"
              desc="Serve tanto pra pessoa física quanto pra quem tem CNPJ. Mesmo plano."
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-4">
            <FAQ
              q="E se eu nao gostar?"
              a="Voce tem 7 dias pra testar tudo. Se nao sentir que valeu cada centavo, pedimos reembolso integral pela Mercado Pago. Nenhuma pergunta, nenhum formulario. O risco e todo nosso — voce so tem a ganhar."
            />
            <FAQ
              q="Preciso baixar app?"
              a="Nao. Zero downloads. O cadastro acontece no proprio WhatsApp e o Guardinha funciona direto nele. Tem tambem um painel web completo pra graficos e relatorios — acessa pelo navegador."
            />
            <FAQ
              q="E se eu quiser cancelar depois?"
              a="Cancela com um clique na area do assinante Mercado Pago. Sem multa, sem ligacao, sem burocracia. Mantem acesso ate o fim do periodo pago."
            />
            <FAQ
              q="A IA erra?"
              a="Precisao media acima de 95% em testes reais com brasileiros. E toda transacao passa por confirmacao antes de ser registrada — voce sempre tem a ultima palavra. Nada e salvo sem seu OK."
            />
            <FAQ
              q="Serve pra empresa (PJ)?"
              a="Sim. Mesmo plano serve pra PF e PJ. No cadastro voce escolhe o tipo e a IA adapta categorias, linguagem e contexto automaticamente. Ideal pra MEI, autonomo e pequeno empresario."
            />
            <FAQ
              q="Posso mudar de plano depois?"
              a="Sim! Comece no mensal e migre pro anual quando quiser. A mudanca e simples, feita pela area do assinante na Mercado Pago."
            />
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-3">
            Daqui a 7 dias voce vai saber exatamente pra onde vai cada centavo.
          </h2>
          <p className="text-slate-400 mb-8">
            Se nao valer, devolvemos 100%. Ativacao imediata. Cartao, PIX ou Boleto.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={checkoutUrl.anual}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base rounded-full transition-all hover:scale-105"
            >
              Anual — R$ 29,90/mês
            </a>
            <a
              href={checkoutUrl.mensal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-medium text-base rounded-full transition-all hover:scale-105 border border-white/10"
            >
              Mensal — R$ 49,90/mês
            </a>
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
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
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
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="text-sm font-semibold pr-4">{q}</span>
        <span className="text-emerald-400 transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="text-sm text-slate-400 mt-3 leading-relaxed">{a}</p>
    </details>
  );
}
