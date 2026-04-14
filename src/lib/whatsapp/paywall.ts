import { sendWhatsAppCTA } from "./meta-api";
import type { AccessDenialReason } from "@/lib/subscriptions/access";

const CHECKOUT_URL =
  process.env.HOTMART_CHECKOUT_URL ?? "https://www.guardadinheiro.com.br/planos";

type PaywallMessage = {
  body: string;
  displayText: string;
  footer?: string;
};

function messageForReason(reason: AccessDenialReason): PaywallMessage {
  switch (reason) {
    case "no_subscription":
      return {
        body:
          "Pra lançar, organizar e receber lembretes, você precisa ativar sua assinatura. 🛡️\n\n" +
          "Plano Guarda Dinheiro: *R$ 29,90/mês* (12x no cartão)\n" +
          "✅ Garantia de 7 dias — devolvemos 100%\n" +
          "✅ Assistente 24h no WhatsApp\n" +
          "✅ Sem cartão? Paga no PIX!",
        displayText: "🎯 QUERO ASSINAR AGORA",
        footer: "Cancele quando quiser.",
      };

    case "expired":
    case "canceled_expired":
      return {
        body:
          "Sua assinatura do Guarda Dinheiro expirou. 😢\n\n" +
          "Reative agora pra continuar organizando suas finanças com o Guardinha!\n\n" +
          "*R$ 29,90/mês* — garantia de 7 dias.",
        displayText: "🔄 REATIVAR ASSINATURA",
      };

    case "past_due":
      return {
        body:
          "⚠️ Sua última cobrança não foi aprovada. Seu acesso será pausado em breve!\n\n" +
          "Atualize seu cartão pra continuar sem interrupção:",
        displayText: "💳 ATUALIZAR PAGAMENTO",
      };

    case "refunded":
      return {
        body:
          "Sua assinatura foi reembolsada. 💚\n\n" +
          "Se mudou de ideia e quer voltar, estou aqui! Basta assinar novamente:",
        displayText: "🎯 ASSINAR DE NOVO",
      };

    case "chargeback":
      return {
        body:
          "Sua assinatura foi cancelada após contestação no cartão.\n\n" +
          "Se foi um engano, regularize e assine novamente:",
        displayText: "🎯 ASSINAR",
      };
  }
}

/**
 * Envia mensagem de paywall via WhatsApp com botão CTA para o checkout Hotmart.
 * Usado toda vez que um usuário sem acesso ativo tenta fazer escrita no sistema.
 */
export async function sendPaywallCTA(phone: string, reason: AccessDenialReason): Promise<void> {
  const msg = messageForReason(reason);

  const url = new URL(CHECKOUT_URL);
  // Pré-preenche email quando possível (será feito em contexto logado, aqui não)

  await sendWhatsAppCTA(
    phone,
    msg.body,
    {
      displayText: msg.displayText,
      url: url.toString(),
    },
    msg.footer,
  );
}

/**
 * Retorna o conteúdo da mensagem sem enviar — útil pra montar logs.
 */
export function getPaywallMessage(reason: AccessDenialReason): PaywallMessage {
  return messageForReason(reason);
}
