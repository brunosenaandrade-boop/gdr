import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { parseLancamento } from "@/lib/openai/parse-lancamento";
import { transcribeAudio } from "@/lib/openai/transcribe-audio";
import { sendWhatsAppMessage, downloadWhatsAppMedia } from "./meta-api";
import { formatCurrency } from "@/lib/utils";
import { isConfirmation, isCancellation } from "./intent";
import { logConversation } from "./conversation-log";
import type { Category } from "@/types";

type WhatsAppMessage = {
  from: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  messageId?: string;
};

// Janela para considerar um pending como "recente" para dedup (30s)
const DEDUP_WINDOW_MS = 30 * 1000;
// Pendings mais antigos que isso são descartados quando chega novo lançamento (2 min)
const STALE_PENDING_MS = 2 * 60 * 1000;

export async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  const supabase = await createServiceClient();
  let currentTenantId: string | null = null;

  // Helper: envia mensagem + registra no log de conversas
  async function respond(text: string): Promise<void> {
    await sendWhatsAppMessage(message.from, text);
    await logConversation(supabase, {
      tenantId: currentTenantId,
      phoneNumber: message.from,
      direction: "out",
      messageType: "text",
      content: text,
    });
  }

  // Log da mensagem recebida (best-effort, antes de qualquer processamento)
  const incomingContent =
    message.type === "text"
      ? (message.text?.body ?? "")
      : message.type === "audio"
        ? `[áudio id=${message.audio?.id ?? "unknown"}]`
        : `[tipo=${message.type}]`;

  await logConversation(supabase, {
    tenantId: null,
    phoneNumber: message.from,
    direction: "in",
    messageType: (message.type === "text" || message.type === "audio") ? message.type : "system",
    content: incomingContent,
    metadata: { messageId: message.messageId },
  });

  // Idempotência: ignorar mensagens já processadas (Meta pode reenviar webhooks)
  if (message.messageId) {
    const { data: existing } = await supabase
      .from("whatsapp_message_log")
      .select("message_id")
      .eq("message_id", message.messageId)
      .maybeSingle();

    if (existing) return;

    await supabase
      .from("whatsapp_message_log")
      .insert({
        message_id: message.messageId,
        phone_number: message.from,
      })
      .then(({ error }) => {
        if (error) console.error("Erro ao registrar message_log:", error.message);
      });
  }

  // ===== FLUXO 1: Vinculação via código GD-XXXXXX =====
  if (message.type === "text" && message.text) {
    const rawText = (message.text?.body ?? "").trim();
    const linkCodeMatch = rawText.toUpperCase().match(/GD-[A-Z0-9]{6}/);

    if (linkCodeMatch) {
      const code = linkCodeMatch[0];
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { data: pendingLink, error: pendingLinkError } = await supabase
        .from("whatsapp_links")
        .select("id, tenant_id, created_at")
        .eq("verification_code", code)
        .eq("verified", false)
        .gte("created_at", tenMinutesAgo)
        .maybeSingle();

      if (pendingLinkError) {
        console.error("Erro ao buscar código de vinculação:", pendingLinkError.message);
        await respond("Erro ao vincular. Tente novamente em alguns minutos.");
        return;
      }

      if (!pendingLink) {
        await respond("Código inválido ou expirado. Gere um novo código no painel.");
        return;
      }

      const { data: existingPhone } = await supabase
        .from("whatsapp_links")
        .select("id")
        .eq("phone_number", message.from)
        .eq("verified", true)
        .maybeSingle();

      if (existingPhone) {
        await respond(
          "Este número já está vinculado a outra conta do Guarda Dinheiro. Desvincule na outra conta primeiro.",
        );
        return;
      }

      const { error: updateError } = await supabase
        .from("whatsapp_links")
        .update({
          phone_number: message.from,
          verified: true,
          verification_code: null,
        })
        .eq("id", pendingLink.id);

      if (updateError) {
        Sentry.captureException(updateError);
        console.error("Erro ao vincular número:", updateError.message);
        await respond("Erro ao vincular. Tente novamente.");
        return;
      }

      currentTenantId = pendingLink.tenant_id;
      await respond(
        'Número vinculado com sucesso! 🎉\n\nAgora você pode lançar receitas e despesas por aqui.\n\nExemplo:\n• "Paguei 150 de luz"\n• "Recebi 500 do cliente João"\n\nOu envie um áudio dizendo o lançamento.',
      );
      return;
    }
  }

  // ===== Descobrir tenant do número =====
  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("tenant_id")
    .eq("phone_number", message.from)
    .eq("verified", true)
    .maybeSingle();

  if (!link) {
    await respond(
      "Número não vinculado. Acesse o painel do Guarda Dinheiro, gere um código e envie-o aqui para vincular.",
    );
    return;
  }

  currentTenantId = link.tenant_id;
  const tenantId = link.tenant_id;

  // ===== FLUXO 2: Confirmação/Cancelamento (detecta na última cláusula) =====
  if (message.type === "text" && message.text) {
    const text = message.text?.body ?? "";

    if (isConfirmation(text)) {
      return handleConfirmation(tenantId, supabase, respond);
    }

    if (isCancellation(text)) {
      return handleCancellation(tenantId, supabase, respond);
    }
  }

  // ===== FLUXO 3: Novo lançamento =====

  // Buscar categorias do tenant
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId);

  if (catError) {
    Sentry.captureException(catError);
    console.error("Erro ao buscar categorias:", catError.message);
    await respond("Erro interno. Tente novamente em alguns minutos.");
    return;
  }

  // Processar texto ou áudio
  let textContent: string;

  if (message.type === "audio" && message.audio) {
    const audioBuffer = await downloadWhatsAppMedia(message.audio.id);
    if (!audioBuffer) {
      await respond("Não consegui baixar o áudio. Tente novamente.");
      return;
    }

    const transcription = await transcribeAudio(audioBuffer);
    if (!transcription.ok) {
      await respond("Não consegui transcrever o áudio. Tente enviar como texto.");
      return;
    }

    textContent = transcription.text;

    // Registrar transcrição do áudio no log
    await logConversation(supabase, {
      tenantId: currentTenantId,
      phoneNumber: message.from,
      direction: "in",
      messageType: "system",
      content: `[transcrição] ${textContent}`,
      metadata: { audioId: message.audio.id },
    });
  } else if (message.type === "text" && message.text) {
    textContent = message.text?.body ?? "";
  } else {
    await respond("Envie uma mensagem de texto ou áudio com seu lançamento financeiro.");
    return;
  }

  // Parse com IA
  const typedCategories = (categories ?? []) as Category[];
  const result = await parseLancamento(textContent, typedCategories);

  if (!result.ok) {
    await respond(
      'Não entendi o lançamento. Tente algo como:\n"Paguei 150 reais de luz"\n"Recebi 500 do cliente João"',
    );
    return;
  }

  const { data: parsed } = result;

  // Encontrar categoria matching
  const matchedCategory = typedCategories.find(
    (c: Category) => c.name.toLowerCase() === parsed.category_suggestion.toLowerCase(),
  );

  // Limpar pendings antigos (> STALE_PENDING_MS) antes de criar novo
  const staleCutoff = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  await supabase
    .from("whatsapp_pending")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .lt("created_at", staleCutoff)
    .then(({ error }) => {
      if (error) console.error("Erro ao limpar pendings antigos:", error.message);
    });

  // Dedup: se já existe um pending recente (< DEDUP_WINDOW_MS) igual, não duplica
  const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
  const { data: recentSimilar } = await supabase
    .from("whatsapp_pending")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .eq("parsed_type", parsed.type)
    .eq("parsed_amount", parsed.amount)
    .gte("created_at", dedupCutoff)
    .maybeSingle();

  if (recentSimilar) {
    // Já existe pending igual recente — só reenvia a pergunta de confirmação
    const typeLabel = parsed.type === "receita" ? "RECEITA" : "DESPESA";
    const categoryLabel = matchedCategory?.name ?? parsed.category_suggestion;
    await respond(
      `Ainda aguardando sua confirmação do lançamento anterior:\n\n` +
        `${typeLabel}: ${parsed.description}\n` +
        `Valor: ${formatCurrency(parsed.amount)}\n` +
        `Categoria: ${categoryLabel}\n\n` +
        `Responda Sim para confirmar ou Não para cancelar.`,
    );
    return;
  }

  // Remover qualquer outro pending ativo do mesmo tenant (só permite 1 ativo por vez)
  await supabase
    .from("whatsapp_pending")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .then(({ error }) => {
      if (error) console.error("Erro ao limpar pendings ativos:", error.message);
    });

  // Salvar novo pending
  const { error: pendingError } = await supabase.from("whatsapp_pending").insert({
    tenant_id: tenantId,
    raw_message: textContent,
    parsed_type: parsed.type,
    parsed_description: parsed.description,
    parsed_amount: parsed.amount,
    parsed_category_id: matchedCategory?.id ?? null,
  });

  if (pendingError) {
    Sentry.captureException(pendingError);
    console.error("Erro ao salvar pendência:", pendingError.message);
    await respond("Erro ao processar o lançamento. Tente novamente.");
    return;
  }

  // Perguntar confirmação (com aviso extra quando confidence é baixa)
  const typeLabel = parsed.type === "receita" ? "RECEITA" : "DESPESA";
  const categoryLabel = matchedCategory?.name ?? parsed.category_suggestion;
  const lowConfidenceWarning =
    parsed.confidence === "low"
      ? `\n\n⚠️ Não tenho certeza se entendi tudo. Confira os dados acima antes de confirmar.`
      : "";

  await respond(
    `Entendi! Vou lançar:\n\n` +
      `${typeLabel}: ${parsed.description}\n` +
      `Valor: ${formatCurrency(parsed.amount)}\n` +
      `Categoria: ${categoryLabel}` +
      lowConfidenceWarning +
      `\n\nConfirma? (Sim/Não)`,
  );
}

type RespondFn = (text: string) => Promise<void>;

async function handleConfirmation(
  tenantId: string,
  supabase: SupabaseClient,
  respond: RespondFn,
): Promise<void> {
  const { data: pending } = await supabase
    .from("whatsapp_pending")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pending) {
    await respond("Nenhum lançamento pendente para confirmar.");
    return;
  }

  const { error: insertError } = await supabase.from("transactions").insert({
    tenant_id: tenantId,
    type: pending.parsed_type,
    description: pending.parsed_description,
    amount: pending.parsed_amount,
    category_id: pending.parsed_category_id,
    status: "pago",
    paid_date: new Date().toISOString().split("T")[0],
    source: "whatsapp",
  });

  if (insertError) {
    Sentry.captureException(insertError);
    console.error("Erro ao inserir transação:", insertError.message);
    await respond("Erro ao salvar o lançamento. Tente novamente.");
    return;
  }

  const { error: updateError } = await supabase
    .from("whatsapp_pending")
    .update({ confirmed: true })
    .eq("id", pending.id);

  if (updateError) console.error("Erro ao atualizar pending:", updateError.message);

  await respond("Lançamento confirmado! Você pode ver no painel do Guarda Dinheiro.");
}

async function handleCancellation(
  tenantId: string,
  supabase: SupabaseClient,
  respond: RespondFn,
): Promise<void> {
  const { data: pending } = await supabase
    .from("whatsapp_pending")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pending) {
    await respond("Nenhum lançamento pendente para cancelar.");
    return;
  }

  const { error: deleteError } = await supabase
    .from("whatsapp_pending")
    .delete()
    .eq("id", pending.id);
  if (deleteError) console.error("Erro ao deletar pending:", deleteError.message);

  await respond("Lançamento cancelado. Envie uma nova mensagem quando quiser.");
}
