import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/server";
import { parseLancamento } from "@/lib/openai/parse-lancamento";
import { transcribeAudio } from "@/lib/openai/transcribe-audio";
import { sendWhatsAppMessage, downloadWhatsAppMedia } from "./meta-api";
import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/types";

type WhatsAppMessage = {
  from: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  messageId?: string;
};

export async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  const supabase = await createServiceClient();

  // Idempotência: ignorar mensagens já processadas (Meta pode reenviar webhooks)
  if (message.messageId) {
    const { data: existing } = await supabase
      .from("whatsapp_message_log")
      .select("message_id")
      .eq("message_id", message.messageId)
      .maybeSingle();

    if (existing) return; // Já processada, ignorar silenciosamente

    // Best-effort: registrar antes de processar para garantir idempotência
    // mesmo se o processamento falhar no meio
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

  // Find tenant by phone number
  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("tenant_id")
    .eq("phone_number", message.from)
    .eq("verified", true)
    .single();

  if (!link) {
    await sendWhatsAppMessage(
      message.from,
      "Número não vinculado. Acesse o painel do Guarda Dinheiro para vincular seu WhatsApp.",
    );
    return;
  }

  const tenantId = link.tenant_id;

  // Check if user is confirming a pending transaction
  if (message.type === "text" && message.text) {
    const text = (message.text?.body ?? "").trim().toLowerCase();

    if (text === "sim" || text === "s" || text === "confirma" || text === "confirmar") {
      return handleConfirmation(tenantId, message.from, supabase);
    }

    if (text === "nao" || text === "n" || text === "cancelar") {
      return handleCancellation(tenantId, message.from, supabase);
    }
  }

  // Get user's categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId);

  if (catError) {
    Sentry.captureException(catError);
    console.error("Erro ao buscar categorias:", catError.message);
    await sendWhatsAppMessage(message.from, "Erro interno. Tente novamente em alguns minutos.");
    return;
  }

  // Process text or audio
  let textContent: string;

  if (message.type === "audio" && message.audio) {
    const audioBuffer = await downloadWhatsAppMedia(message.audio.id);
    if (!audioBuffer) {
      await sendWhatsAppMessage(message.from, "Não consegui baixar o áudio. Tente novamente.");
      return;
    }

    const transcription = await transcribeAudio(audioBuffer);
    if (!transcription.ok) {
      await sendWhatsAppMessage(message.from, "Não consegui transcrever o áudio. Tente enviar como texto.");
      return;
    }

    textContent = transcription.text;
  } else if (message.type === "text" && message.text) {
    textContent = message.text?.body ?? "";
  } else {
    await sendWhatsAppMessage(message.from, "Envie uma mensagem de texto ou áudio com seu lançamento financeiro.");
    return;
  }

  // Parse with AI
  const result = await parseLancamento(textContent, categories ?? []);

  if (!result.ok) {
    await sendWhatsAppMessage(
      message.from,
      `Não entendi o lançamento. Tente algo como:\n"Paguei 150 reais de luz"\n"Recebi 500 do cliente João"`,
    );
    return;
  }

  const { data: parsed } = result;

  // Find matching category
  const matchedCategory = (categories ?? []).find(
    (c: Category) => c.name.toLowerCase() === parsed.category_suggestion.toLowerCase(),
  );

  // Save as pending
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
    await sendWhatsAppMessage(message.from, "Erro ao processar o lançamento. Tente novamente.");
    return;
  }

  // Ask for confirmation
  const typeLabel = parsed.type === "receita" ? "RECEITA" : "DESPESA";
  const categoryLabel = matchedCategory?.name ?? parsed.category_suggestion;

  await sendWhatsAppMessage(
    message.from,
    `Entendi! Vou lancar:\n\n` +
      `${typeLabel}: ${parsed.description}\n` +
      `Valor: ${formatCurrency(parsed.amount)}\n` +
      `Categoria: ${categoryLabel}\n\n` +
      `Confirma? (Sim/Não)`,
  );
}

async function handleConfirmation(tenantId: string, phone: string, supabase: any) {
  const { data: pending } = await supabase
    .from("whatsapp_pending")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!pending) {
    await sendWhatsAppMessage(phone, "Nenhum lançamento pendente para confirmar.");
    return;
  }

  // Create the actual transaction
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
    await sendWhatsAppMessage(phone, "Erro ao salvar o lançamento. Tente novamente.");
    return;
  }

  // Mark as confirmed
  const { error: updateError } = await supabase
    .from("whatsapp_pending")
    .update({ confirmed: true })
    .eq("id", pending.id);

  if (updateError) console.error("Erro ao atualizar pending:", updateError.message);

  await sendWhatsAppMessage(phone, "Lançamento confirmado! Você pode ver no painel do Guarda Dinheiro.");
}

async function handleCancellation(tenantId: string, phone: string, supabase: any) {
  const { data: pending } = await supabase
    .from("whatsapp_pending")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!pending) {
    await sendWhatsAppMessage(phone, "Nenhum lançamento pendente para cancelar.");
    return;
  }

  const { error: deleteError } = await supabase.from("whatsapp_pending").delete().eq("id", pending.id);
  if (deleteError) console.error("Erro ao deletar pending:", deleteError.message);

  await sendWhatsAppMessage(phone, "Lançamento cancelado. Envie uma nova mensagem quando quiser.");
}
