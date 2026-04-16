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
          "Opa! Pra eu registrar seus lançamentos e te mandar lembretes, precisa ter um plano ativo.\n\n" +
          "📋 *Plano Guarda Dinheiro*\n" +
          "💰 *R$ 29,90/mês* (12x no cartão, PIX ou boleto)\n\n" +
          "✅ Assistente 24h no WhatsApp (texto e áudio)\n" +
          "✅ Painel web completo\n" +
          "✅ Score financeiro + agenda\n" +
          "✅ *Garantia de 7 dias* — devolvemos 100% se não gostar\n\n" +
          "Fique tranquilo: suas consultas (saldo, extrato) continuam funcionando normalmente. Seus dados ficam guardados por 90 dias.",
        displayText: "ASSINAR POR R$ 29,90/MÊS",
        footer: "Cancele quando quiser, sem burocracia.",
      };

    case "expired":
    case "canceled_expired":
      return {
        body:
          "Sua assinatura expirou, mas seus dados estão todos aqui! 🛡️\n\n" +
          "Pra voltar a lançar e receber lembretes, é só reativar:\n\n" +
          "💰 *R$ 29,90/mês* — garantia de 7 dias\n\n" +
          "Fique tranquilo: seus dados ficam guardados por 90 dias. Você pode consultar saldo e extrato normalmente.",
        displayText: "REATIVAR POR R$ 29,90/MÊS",
        footer: "Cancele quando quiser.",
      };

    case "past_due":
      return {
        body:
          "⚠️ Sua última cobrança não foi aprovada.\n\n" +
          "Seu acesso de escrita será pausado em breve, mas seus dados estão seguros.\n\n" +
          "Atualize seu pagamento pra continuar sem interrupção:",
        displayText: "ATUALIZAR PAGAMENTO",
      };

    case "refunded":
      return {
        body:
          "Seu reembolso foi processado com sucesso. 💚\n\n" +
          "Seus dados ficam guardados por 90 dias. Se quiser voltar, é só assinar novamente — sem perder nada.",
        displayText: "ASSINAR NOVAMENTE",
      };

    case "chargeback":
      return {
        body:
          "Sua assinatura foi cancelada após contestação no cartão.\n\n" +
          "Se foi um engano, regularize e assine novamente. Seus dados ficam guardados por 90 dias.",
        displayText: "ASSINAR NOVAMENTE",
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
