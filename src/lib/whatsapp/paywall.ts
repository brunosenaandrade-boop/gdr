import { sendWhatsAppCTA } from "./meta-api";
import type { AccessDenialReason } from "@/lib/subscriptions/access";

const PLANOS_URL = "https://www.guardadinheiro.com.br/planos";

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
          "📋 *Escolha seu plano:*\n" +
          "💚 *Anual* — R$ 29,90/mês (12x) ← economiza 40%\n" +
          "💙 *Mensal* — R$ 49,90/mês\n\n" +
          "✅ Assistente 24h no WhatsApp (texto e áudio)\n" +
          "✅ Painel web completo\n" +
          "✅ Score financeiro + agenda\n" +
          "✅ *Garantia de 7 dias* — devolvemos 100%\n\n" +
          "Fique tranquilo: suas consultas (saldo, extrato) continuam funcionando. Seus dados ficam guardados por 90 dias.",
        displayText: "VER PLANOS E ASSINAR",
        footer: "Cancele quando quiser, sem burocracia.",
      };

    case "expired":
    case "canceled_expired":
      return {
        body:
          "Sua assinatura expirou, mas seus dados estão todos aqui! 🛡️\n\n" +
          "Pra voltar a lançar e receber lembretes:\n\n" +
          "💚 *Anual* — R$ 29,90/mês (12x) ← melhor custo\n" +
          "💙 *Mensal* — R$ 49,90/mês\n\n" +
          "Seus dados ficam guardados por 90 dias. Consultas de saldo e extrato continuam funcionando.",
        displayText: "VER PLANOS E REATIVAR",
        footer: "Garantia de 7 dias. Cancele quando quiser.",
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
 * Envia mensagem de paywall via WhatsApp com botão CTA para o checkout Mercado Pago.
 * Usado toda vez que um usuário sem acesso ativo tenta fazer escrita no sistema.
 */
export async function sendPaywallCTA(phone: string, reason: AccessDenialReason): Promise<void> {
  const msg = messageForReason(reason);

  const url = new URL(PLANOS_URL);
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
