"use client";

import { useState } from "react";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { comoFuncionaFAQs } from "@/data/faqs";

type Slide = {
  icon: string;
  title: string;
  content: React.ReactNode;
};

const slides: Slide[] = [
  {
    icon: "💸",
    title: "Registro de transações",
    content: (
      <>
        <p>
          Você pode registrar transações de gastos, recebimentos, contas a pagar
          e contas a receber de forma muito simples pelo WhatsApp e eu irei
          registrar pra você! Veja alguns exemplos:
        </p>
        <ul className="space-y-2 mt-4">
          <li>✅ &quot;Paguei 120 reais no mercado&quot;</li>
          <li>✅ &quot;Recebi 5 mil de salário&quot;</li>
          <li>✅ &quot;Tenho pra pagar 2 mil da faculdade no dia 22&quot;</li>
          <li>✅ &quot;Tenho pra receber 3 mil no dia 25&quot;</li>
          <li>
            ✅ &quot;Tenho pra pagar 150 reais de luz da casa na quarta que
            vem&quot;
          </li>
          <li>
            ✅ &quot;Tenho pra pagar 2 mil de aluguel no dia 10 e 5 mil da
            parcela do carro no dia 12&quot;
          </li>
        </ul>
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm">
            🚨 Lembre-se sempre de me informar minimamente as informações
            necessárias como valor e descrição em uma única mensagem para que eu
            possa registrar corretamente.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: "✅",
    title: "Boas práticas de uso",
    content: (
      <>
        <p>
          Além do seu acesso ao painel web com suas informações
          (guardadinheiro.com.br/dashboard), para que possamos ter a melhor
          experiência juntos, veja algumas recomendações:
        </p>
        <div className="space-y-5 mt-4">
          <div>
            <p className="font-semibold">
              1 - Você pode me enviar mensagens ou áudio, como ficar mais
              prático pra você!
            </p>
          </div>
          <div>
            <p className="font-semibold">
              2 - Acesse o painel com as suas informações
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Você pode acessar o dashboard com suas informações, editar ou
              excluir transações, criar novas categorias e visualizar sua agenda
              pelo painel (ou pode me perguntar o que quiser, é claro)
            </p>
          </div>
          <div>
            <p className="font-semibold">
              3 - Sempre envie todas as informações em uma única mensagem.
            </p>
            <div className="text-sm mt-1 space-y-1">
              <p>✅ &quot;Gastei 35 reais no mercado&quot;</p>
              <p>
                ❌ &quot;Gastei&quot;, &quot;35 reais no mercado&quot; (em duas
                mensagens separadas)
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">
              4 - Lembre-se de detalhar minimamente o que você deseja registrar
            </p>
            <div className="text-sm mt-1 space-y-1">
              <p>
                ✅ &quot;Tenho reunião com a empresa X amanhã às 15 horas&quot;
              </p>
              <p>
                ❌ &quot;Paguei 10 reais&quot; (sem informar referente ao que é)
              </p>
              <p>
                ❌ &quot;Tenho reunião com a empresa X&quot; (sem informar a
                data e horário)
              </p>
              <p>
                ❌ &quot;Tenho reunião amanhã&quot; (sem informar a descrição)
              </p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    icon: "🔄",
    title: "Edição e exclusão de registros",
    content: (
      <>
        <p>
          Você pode pedir para que eu remova/edite alguma transação ou
          compromisso pra você. Veja alguns exemplos de uso:
        </p>
        <ul className="space-y-2 mt-4">
          <li>
            - &quot;Cancele o meu compromisso de amanhã às 16 horas no
            cabeleireiro&quot;
          </li>
          <li>- &quot;Exclua a transação do mercado de hoje&quot;</li>
          <li>
            - &quot;Altere o valor da compra no mercado hoje para 25 reais&quot;
          </li>
          <li>
            - &quot;Altere a categoria da compra no posto hoje para
            Transporte&quot;
          </li>
        </ul>
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm">
            🚨 Lembre-se de informar detalhadamente o registro para que eu possa
            saber referente a qual registro você quer editar ou excluir.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: "🚀",
    title: "Categorias personalizadas",
    content: (
      <>
        <p>
          Por padrão, eu já cadastro no momento da criação da sua conta
          categorias essenciais para suas finanças, porém, se você quiser ter um
          controle mais detalhado como por exemplo, quanto você gasta de café no
          mês, você pode acessar o painel do guardadinheiro.com.br no seu celular
          ou computador e criar categorias personalizadas para você na aba de
          categorias.
        </p>
        <p className="mt-4">
          Basta criar uma categoria chamada &quot;Café&quot;.
        </p>
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-sm">
            Sempre que você registrar um gasto como &quot;Paguei 25 reais de
            café&quot; eu irei registrar esse gasto na categoria
            &quot;Café&quot;.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: "📅",
    title: "Registro de compromissos e afazeres",
    content: (
      <>
        <p>
          Você pode registrar compromissos e afazeres mandando mensagens no meu
          WhatsApp para que você não esqueça de nada e tenha uma rotina
          organizada. Veja alguns exemplos de uso:
        </p>
        <ul className="space-y-2 mt-4">
          <li>- &quot;Tenho médico amanhã às 16 horas&quot;</li>
          <li>
            - &quot;Tenho que ir no dentista terça que vem às 11 horas&quot;
          </li>
          <li>
            - &quot;Me lembre de buscar meu filho na escola hoje às 16:30&quot;
          </li>
          <li>
            - &quot;Me lembre de ligar para minha namorada em 3 horas&quot;
          </li>
          <li>
            - &quot;Me lembre de emitir a nota fiscal para o cliente amanhã à
            tarde&quot;
          </li>
          <li>
            - &quot;Tenho reunião amanhã às 14:30 com o cliente X&quot;
          </li>
          <li>
            - &quot;Me lembre de falar com meu chefe sobre meu aumento segunda
            feira às 11&quot;
          </li>
          <li>
            - &quot;Me lembre do aniversário da minha mãe no dia 25&quot;
          </li>
        </ul>
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm">
            🚨 Caso você não me informar o horário irei registrar o compromisso
            às 00:00 horas do dia.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: "☁️",
    title: "Lembretes diários",
    content: (
      <>
        <p>
          Não esqueça de mais nada! Todos os dias às 08:00 horas da manhã irei
          lhe enviar uma mensagem no WhatsApp com um resumo do que você tem pra
          fazer, compromissos, contas a pagar e a receber no dia.
        </p>
        <p className="mt-4">
          Além disso, irei lhe enviar um lembrete 30 minutos antes de cada
          compromisso marcado para que você não esqueça de nada e possa se
          organizar.
        </p>
      </>
    ),
  },
  {
    icon: "📅",
    title: "Receitas ou gastos recorrentes",
    content: (
      <>
        <p>
          Você pode registrar gastos ou receitas recorrentes, ou seja, transações
          que se repetem mais vezes e eu irei organizar tudo pra você. Veja
          alguns exemplos de uso:
        </p>
        <ul className="space-y-2 mt-4">
          <li>
            - &quot;Tenho pra pagar 2 mil de aluguel todo dia 5&quot;
          </li>
          <li>
            - &quot;Tenho pra receber 5 mil de salário todo dia 6&quot;
          </li>
          <li>
            - &quot;Tenho pra pagar 25 reais de estacionamento toda quarta
            feira&quot;
          </li>
          <li>
            - &quot;Tenho pra pagar 1400 reais faculdade todo mês até
            dezembro&quot;
          </li>
          <li>
            - &quot;Todo dia eu tenho pra pagar 3,50 de passagem de ônibus para
            ir pro trabalho&quot;
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-400">
          Caso você não informar a data final da transação, eu irei registrar as
          transações por padrão para os próximos 6 meses.
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          As transações recorrentes podem ter intervalos diários, semanais,
          mensais, trimestrais, semestrais, anuais ou personalizadas com o tempo
          que você definir.
        </p>
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm">
            🚨 Lembre-se sempre de me informar minimamente as informações
            necessárias como valor e descrição em uma única mensagem para que eu
            possa registrar corretamente.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: "🎙️",
    title: "Pergunte o que quiser e como quiser",
    content: (
      <>
        <p>
          Nada de mensagens estáticas, você pode me perguntar o que quiser e como
          quiser sobre as suas informações. Veja alguns exemplos de uso:
        </p>
        <ul className="space-y-2 mt-4">
          <li>- &quot;Quanto gastei esse mês?&quot;</li>
          <li>- &quot;Quanto gastei ontem?&quot;</li>
          <li>- &quot;Quanto gastei de iFood essa semana?&quot;</li>
          <li>
            - &quot;Me passe a lista dos meus gastos com percentuais desse
            mês&quot;
          </li>
          <li>
            - &quot;Quanto em média eu gastei por dia de alimentação nesse
            mês?&quot;
          </li>
          <li>
            - &quot;Quanto em média eu gastei de combustível por dia essa
            semana?&quot;
          </li>
          <li>
            - &quot;Liste todas as minhas despesas com compras esse mês&quot;
          </li>
          <li>- &quot;O que eu tenho pra fazer amanhã?&quot;</li>
          <li>
            - &quot;Quais horários eu tenho disponível no dia 22?&quot;
          </li>
          <li>
            - &quot;Onde eu estou gastando mais? Preciso economizar&quot;
          </li>
          <li>- &quot;Quanto gastei de combustível esse mês?&quot;</li>
          <li>
            - &quot;Eu posso ir viajar no final de semana que vem ou tenho algum
            compromisso?&quot;
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-400">
          Você pode perguntar literalmente tudo da forma que quiser que eu irei
          lhe responder.
        </p>
      </>
    ),
  },
  {
    icon: "❓",
    title: "Dúvidas comuns",
    content: (
      <>
        <p className="mb-5">
          Antes de começar, as perguntas que mais recebemos de quem tá
          conhecendo o Guarda Dinheiro:
        </p>
        <FAQAccordion items={comoFuncionaFAQs} page="como-funciona" />
      </>
    ),
  },
];

export function ComoFuncionaClient() {
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const progress = ((current + 1) / total) * 100;
  const isLast = current === total - 1;

  function handleNext() {
    if (isLast) {
      // Redirecionar para o WhatsApp do Guarda Dinheiro
      window.location.href =
        "https://wa.me/554820270106?text=Pronto%20para%20come%C3%A7ar!";
      return;
    }
    setCurrent((prev) => prev + 1);
  }

  function handleBack() {
    if (current > 0) setCurrent((prev) => prev - 1);
  }

  const slide = slides[current];

  return (
    <div className="min-h-dvh bg-zinc-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Voltar
          </button>
          <span className="text-sm text-zinc-500">
            {current + 1} de {total}
          </span>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-6">
          <span className="text-4xl">{slide.icon}</span>
          <h1 className="text-xl font-bold mt-3">{slide.title}</h1>
        </div>

        <div className="text-zinc-300 leading-relaxed text-[15px]">
          {slide.content}
        </div>
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 p-4">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-base"
        >
          {isLast ? "Finalizar e começar a usar" : "Continuar explicação"}
        </button>
      </div>
    </div>
  );
}
