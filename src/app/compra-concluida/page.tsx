import Link from "next/link";
import { MessageSquare, UserPlus, Rocket, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const BOT_NUMBER = "554820270106";
const WA_LINK = `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent("Acabei de assinar! Quero ativar minha conta.")}`;

export const metadata = {
  title: "Compra concluída",
  description: "Sua compra foi confirmada. Ative sua conta pelo WhatsApp.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/compra-concluida" },
};

export default function CompraConcluida() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/">
            <Logo size={24} withText />
          </Link>
          <Link href="/login" className="text-xs text-slate-400 hover:text-slate-200">
            Já ativei minha conta →
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
        {/* Success */}
        <section className="text-center mb-16">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Sua compra foi confirmada!
          </h1>

          <p className="mt-4 text-lg text-slate-400 max-w-md mx-auto">
            Falta só um passo: ativar sua conta pelo WhatsApp.
          </p>

          <p className="mt-6 text-sm text-slate-400 max-w-md mx-auto">
            Clique no botão abaixo pra falar com o <strong className="text-emerald-300">Guardinha</strong> no WhatsApp
            e faça seu cadastro usando o <strong className="text-white">mesmo e-mail da sua compra</strong>.
          </p>

          <p className="mt-4 text-sm text-slate-500 max-w-md mx-auto">
            Você vai criar sua senha, acessar o painel e já começar a registrar seus gastos.
            Se precisar de ajuda, diga ao Guardinha: <em>&quot;quero falar com suporte&quot;</em>.
          </p>

          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-base font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <MessageSquare className="h-5 w-5" />
            Ativar conta pelo WhatsApp
          </a>

          <p className="mt-3 text-xs text-slate-600">
            Você será redirecionado para o WhatsApp oficial do Guarda Dinheiro.
          </p>
        </section>

        {/* Steps */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-center mb-2">
            Como funciona a ativação?
          </h2>
          <p className="text-sm text-slate-500 text-center mb-10">
            Em poucos passos você já começa a usar o Guardinha.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step
              icon={MessageSquare}
              title="Inicie contato"
              desc="Clique no botão e fale com o Guardinha no WhatsApp."
            />
            <Step
              icon={UserPlus}
              title="Cadastro rápido"
              desc="Informe seu e-mail da compra e crie sua senha de acesso ao painel."
            />
            <Step
              icon={Rocket}
              title="Ativação imediata"
              desc="Em segundos sua conta estará funcionando com IA + painel completo."
            />
          </div>
        </section>

        {/* Second CTA */}
        <section className="text-center py-8 border-t border-white/5">
          <p className="text-sm text-slate-400 mb-4">Pronto pra começar?</p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105"
          >
            <MessageSquare className="h-4 w-4" />
            Ativar conta
          </a>
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

function Step({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-slate-400">{desc}</p>
    </div>
  );
}
