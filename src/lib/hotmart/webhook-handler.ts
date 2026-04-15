import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";
import { logConversation } from "@/lib/whatsapp/conversation-log";
import { emitirNFE } from "@/lib/nfe/enotas";
import { attributeAffiliateSale, refundAffiliateSale } from "@/lib/affiliates/webhook-attribution";
import { registerBumpsFromPayload, deliverBumpToCustomer } from "@/lib/delivery/bump-delivery";

// Eventos Hotmart que processamos
export type HotmartEventType =
  | "PURCHASE_APPROVED"
  | "PURCHASE_COMPLETE"
  | "PURCHASE_REFUNDED"
  | "PURCHASE_CHARGEBACK"
  | "PURCHASE_PROTEST"
  | "PURCHASE_DELAYED"
  | "PURCHASE_CANCELED"
  | "SUBSCRIPTION_CANCELLATION";

export type HotmartWebhookPayload = {
  id?: string;
  event: HotmartEventType;
  creation_date?: number;
  version?: string;
  data: {
    product?: { id?: number | string; name?: string };
    buyer?: { email?: string; name?: string; checkout_phone?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      payment?: { type?: string; installments_number?: number };
      recurrence_number?: number;
    };
    subscription?: {
      status?: string;
      plan?: { name?: string };
      subscriber?: { code?: string };
      anniversary_date?: number;
      end_accession_date?: number;
    };
    commissions?: Array<{ value?: number; source?: string; commission_type?: string }>;
  };
  hottok?: string;
};

type HandlerResult = { ok: true } | { ok: false; error: string };

/**
 * Processa um evento do webhook Hotmart.
 * Idempotente via subscription_events.hotmart_event_id.
 */
export async function handleHotmartEvent(
  payload: HotmartWebhookPayload,
): Promise<HandlerResult> {
  const supabase = await createServiceClient();

  const eventId = payload.id;
  const eventType = payload.event;
  const buyerEmail = payload.data?.buyer?.email?.toLowerCase();
  const hotmartTransaction = payload.data?.purchase?.transaction;

  // Idempotência: se já processamos esse event_id, retorna ok
  if (eventId) {
    const { data: existing } = await supabase
      .from("subscription_events")
      .select("id, processed")
      .eq("hotmart_event_id", eventId)
      .maybeSingle();

    if (existing?.processed) {
      return { ok: true };
    }
  }

  // Match tenant pelo email
  let tenantId: string | null = null;
  let userId: string | null = null;

  if (buyerEmail) {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find((u) => u.email?.toLowerCase() === buyerEmail);
    if (user) {
      userId = user.id;
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      tenantId = tenant?.id ?? null;
    }
  }

  // Salvar evento (mesmo sem match, pra auditoria)
  const { data: savedEvent } = await supabase
    .from("subscription_events")
    .insert({
      tenant_id: tenantId,
      event_type: eventType,
      hotmart_event_id: eventId ?? null,
      hotmart_transaction: hotmartTransaction ?? null,
      buyer_email: buyerEmail ?? null,
      payload: payload as unknown as import("@/types/supabase").Json,
      processed: false,
    })
    .select("id")
    .maybeSingle();

  // Se não achou tenant, loga erro no evento salvo e tenta notificar via WhatsApp
  if (!tenantId) {
    if (savedEvent?.id) {
      await supabase
        .from("subscription_events")
        .update({ processing_error: "tenant_not_found" })
        .eq("id", savedEvent.id);
    }
    if (payload.data?.buyer?.checkout_phone) {
      await notifyEmailMismatch(payload.data.buyer.checkout_phone, buyerEmail);
    }
    return { ok: false, error: "tenant_not_found" };
  }

  // Processar evento
  const result = await processEvent(supabase, tenantId, eventType, payload, savedEvent?.id ?? null);

  // Marcar evento como processado
  if (savedEvent?.id) {
    await supabase
      .from("subscription_events")
      .update({
        processed: result.ok,
        processing_error: result.ok ? null : result.error,
      })
      .eq("id", savedEvent.id);
  }

  return result;
}

async function processEvent(
  supabase: SupabaseClient,
  tenantId: string,
  eventType: HotmartEventType,
  payload: HotmartWebhookPayload,
  eventId: string | null,
): Promise<HandlerResult> {
  const now = new Date().toISOString();
  const anniversaryMs = payload.data?.subscription?.anniversary_date;
  const endAccessionMs = payload.data?.subscription?.end_accession_date;
  const periodEnd = anniversaryMs
    ? new Date(anniversaryMs).toISOString()
    : endAccessionMs
      ? new Date(endAccessionMs).toISOString()
      : // fallback: 1 ano a partir de agora
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const hotmartTransaction = payload.data?.purchase?.transaction ?? null;
  const subscriberCode = payload.data?.subscription?.subscriber?.code ?? null;
  const buyerEmail = payload.data?.buyer?.email?.toLowerCase() ?? null;

  switch (eventType) {
    case "PURCHASE_APPROVED":
    case "PURCHASE_COMPLETE": {
      const { data: upserted, error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            tenant_id: tenantId,
            status: "active",
            hotmart_transaction: hotmartTransaction,
            hotmart_subscriber_code: subscriberCode,
            hotmart_buyer_email: buyerEmail,
            current_period_end: periodEnd,
            canceled_at: null,
            refunded_at: null,
            past_due_since: null,
            updated_at: now,
          },
          { onConflict: "tenant_id" },
        )
        .select("id")
        .maybeSingle();
      if (error) {
        Sentry.captureException(error);
        return { ok: false, error: error.message };
      }
      // Atribuir afiliado (cupom ou Hotmart nativo) — não bloqueia fluxo
      await attributeAffiliateSale({
        supabase,
        payload,
        subscriptionId: upserted?.id ?? null,
        eventId,
      }).catch((err) => {
        console.error("[hotmart] Falha ao atribuir afiliado:", err);
      });
      // Registrar order bumps (se tiver) e entregar
      try {
        const bumpIds = await registerBumpsFromPayload({
          supabase,
          payload,
          subscriptionId: upserted?.id ?? null,
          tenantId,
          hotmartTransaction,
          eventId,
        });
        // Entregar cada bump via WhatsApp (não bloqueia se falhar)
        for (const bumpId of bumpIds) {
          await deliverBumpToCustomer({ purchaseBumpId: bumpId }).catch((err) => {
            console.error(`[hotmart] Falha ao entregar bump ${bumpId}:`, err);
          });
        }
      } catch (err) {
        console.error("[hotmart] Falha ao processar bumps:", err);
      }
      // Emitir NF-e (não bloqueia o fluxo se falhar)
      await emitirNFEFromPayload(payload, tenantId, supabase).catch((err) => {
        console.error("[hotmart] Falha ao emitir NFE:", err);
      });
      // Notificar cliente
      await notifyActivation(supabase, tenantId);
      return { ok: true };
    }

    case "PURCHASE_REFUNDED": {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "refunded",
          refunded_at: now,
          updated_at: now,
        })
        .eq("tenant_id", tenantId);
      if (error) return { ok: false, error: error.message };
      // Marca venda do afiliado como reembolsada (não bloqueia)
      if (hotmartTransaction) {
        await refundAffiliateSale({ supabase, hotmartTransaction }).catch(() => {});
      }
      await notifyRefund(supabase, tenantId);
      return { ok: true };
    }

    case "PURCHASE_CHARGEBACK": {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "chargeback",
          updated_at: now,
        })
        .eq("tenant_id", tenantId);
      if (error) return { ok: false, error: error.message };
      if (hotmartTransaction) {
        await refundAffiliateSale({ supabase, hotmartTransaction }).catch(() => {});
      }
      return { ok: true };
    }

    case "PURCHASE_PROTEST": {
      // Só loga, não revoga
      return { ok: true };
    }

    case "PURCHASE_DELAYED": {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          past_due_since: now,
          updated_at: now,
        })
        .eq("tenant_id", tenantId);
      if (error) return { ok: false, error: error.message };
      await notifyPastDue(supabase, tenantId);
      return { ok: true };
    }

    case "PURCHASE_CANCELED":
    case "SUBSCRIPTION_CANCELLATION": {
      // Mantém current_period_end para o usuário usar até o fim
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: now,
          updated_at: now,
        })
        .eq("tenant_id", tenantId);
      if (error) return { ok: false, error: error.message };
      await notifyCancellation(supabase, tenantId);
      return { ok: true };
    }

    default:
      return { ok: true };
  }
}

// ===== Notificações ao usuário =====

async function getUserPhone(supabase: SupabaseClient, tenantId: string): Promise<string | null> {
  const { data } = await supabase
    .from("whatsapp_links")
    .select("phone_number")
    .eq("tenant_id", tenantId)
    .eq("verified", true)
    .maybeSingle();
  return data?.phone_number ?? null;
}

async function notifyActivation(supabase: SupabaseClient, tenantId: string): Promise<void> {
  const phone = await getUserPhone(supabase, tenantId);
  if (!phone) return;

  const msg =
    "🎉 *Assinatura ativada!*\n\n" +
    "Bem-vindo(a) oficialmente ao Guarda Dinheiro! Seu acesso está liberado e já pode começar a lançar tudo por aqui.\n\n" +
    "💡 Dica: manda um áudio ou texto com qualquer gasto ou recebimento. Ex: \"paguei 50 reais de almoço\".";

  await sendWhatsAppMessage(phone, msg);
  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: msg + " [hotmart: PURCHASE_APPROVED]",
  });
}

async function notifyRefund(supabase: SupabaseClient, tenantId: string): Promise<void> {
  const phone = await getUserPhone(supabase, tenantId);
  if (!phone) return;

  const msg =
    "Olá! Seu reembolso foi processado pela Hotmart. 💚\n\n" +
    "Seu acesso ao Guarda Dinheiro foi pausado. Se mudou de ideia, basta assinar novamente quando quiser!";

  await sendWhatsAppMessage(phone, msg);
  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: msg + " [hotmart: PURCHASE_REFUNDED]",
  });
}

async function notifyPastDue(supabase: SupabaseClient, tenantId: string): Promise<void> {
  const phone = await getUserPhone(supabase, tenantId);
  if (!phone) return;

  const msg =
    "⚠️ *Sua última cobrança não foi aprovada!*\n\n" +
    "A Hotmart vai tentar de novo nos próximos dias. Pra garantir que não perca acesso, atualize seu cartão na área do assinante:\n\n" +
    "https://app-vlc.hotmart.com/tools/subscription";

  await sendWhatsAppMessage(phone, msg);
  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: msg + " [hotmart: PURCHASE_DELAYED]",
  });
}

async function notifyCancellation(supabase: SupabaseClient, tenantId: string): Promise<void> {
  const phone = await getUserPhone(supabase, tenantId);
  if (!phone) return;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const endDate = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
    : "fim do período pago";

  const msg =
    "Seu cancelamento foi confirmado. 💚\n\n" +
    `Você continua com acesso ao Guarda Dinheiro até *${endDate}*.\n\n` +
    "Se mudar de ideia antes dessa data, basta assinar novamente!";

  await sendWhatsAppMessage(phone, msg);
  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: msg + " [hotmart: SUBSCRIPTION_CANCELLATION]",
  });
}

async function emitirNFEFromPayload(
  payload: HotmartWebhookPayload,
  tenantId: string,
  supabase: SupabaseClient,
): Promise<void> {
  const buyer = payload.data?.buyer;
  const purchase = payload.data?.purchase;
  if (!buyer?.email || !buyer?.name) return;

  // Buscar documento (CPF/CNPJ) do tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("document")
    .eq("id", tenantId)
    .maybeSingle();

  const document = tenant?.document;
  if (!document) {
    console.warn(`[hotmart] Tenant ${tenantId} sem documento — não emitindo NFE`);
    return;
  }

  // Valor total (Hotmart envia em centavos ou em reais dependendo da config; vamos assumir centavos)
  const rawAmount = (payload.data as unknown as { purchase?: { price?: { value?: number } } })
    ?.purchase?.price?.value;
  const amount = typeof rawAmount === "number" ? rawAmount : 358.80;

  await emitirNFE({
    amount,
    description: "Assinatura Guarda Dinheiro - Plano Anual",
    customer: {
      name: buyer.name,
      email: buyer.email,
      document,
      phone: buyer.checkout_phone,
    },
    externalId: purchase?.transaction ?? `hotmart-${Date.now()}`,
  });
}

async function notifyEmailMismatch(phone: string, email: string | undefined): Promise<void> {
  // Pode ser acionado antes de ter tenant — loga apenas no console
  const msg =
    "Recebi sua compra! 🎉\n\n" +
    `Mas o email *${email ?? "usado no checkout"}* não está cadastrado no Guarda Dinheiro.\n\n` +
    "Pra liberar seu acesso, me responde aqui com o email que você quer usar pra fazer login no painel.";

  await sendWhatsAppMessage(phone, msg);
}
