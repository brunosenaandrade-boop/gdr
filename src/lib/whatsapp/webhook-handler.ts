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
};

export async function handleIncomingMessage(message: WhatsAppMessage) {
  const supabase = await createServiceClient();

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
      "Numero nao vinculado. Acesse o painel do Guarda Dinheiro para vincular seu WhatsApp.",
    );
    return;
  }

  const tenantId = link.tenant_id;

  // Check if user is confirming a pending transaction
  if (message.type === "text" && message.text) {
    const text = message.text.body.trim().toLowerCase();

    if (text === "sim" || text === "s" || text === "confirma" || text === "confirmar") {
      return handleConfirmation(tenantId, message.from, supabase);
    }

    if (text === "nao" || text === "n" || text === "cancelar") {
      return handleCancellation(tenantId, message.from, supabase);
    }
  }

  // Get user's categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId);

  // Process text or audio
  let textContent: string;

  if (message.type === "audio" && message.audio) {
    const audioBuffer = await downloadWhatsAppMedia(message.audio.id);
    if (!audioBuffer) {
      await sendWhatsAppMessage(message.from, "Nao consegui baixar o audio. Tente novamente.");
      return;
    }

    const transcription = await transcribeAudio(audioBuffer);
    if (!transcription.ok) {
      await sendWhatsAppMessage(message.from, "Nao consegui transcrever o audio. Tente enviar como texto.");
      return;
    }

    textContent = transcription.text;
  } else if (message.type === "text" && message.text) {
    textContent = message.text.body;
  } else {
    await sendWhatsAppMessage(message.from, "Envie uma mensagem de texto ou audio com seu lancamento financeiro.");
    return;
  }

  // Parse with AI
  const result = await parseLancamento(textContent, categories ?? []);

  if (!result.ok) {
    await sendWhatsAppMessage(
      message.from,
      `Nao entendi o lancamento. Tente algo como:\n"Paguei 150 reais de luz"\n"Recebi 500 do cliente Joao"`,
    );
    return;
  }

  const { data: parsed } = result;

  // Find matching category
  const matchedCategory = (categories ?? []).find(
    (c: Category) => c.name.toLowerCase() === parsed.category_suggestion.toLowerCase(),
  );

  // Save as pending
  await supabase.from("whatsapp_pending").insert({
    tenant_id: tenantId,
    raw_message: textContent,
    parsed_type: parsed.type,
    parsed_description: parsed.description,
    parsed_amount: parsed.amount,
    parsed_category_id: matchedCategory?.id ?? null,
  });

  // Ask for confirmation
  const typeLabel = parsed.type === "receita" ? "RECEITA" : "DESPESA";
  const categoryLabel = matchedCategory?.name ?? parsed.category_suggestion;

  await sendWhatsAppMessage(
    message.from,
    `Entendi! Vou lancar:\n\n` +
      `${typeLabel}: ${parsed.description}\n` +
      `Valor: ${formatCurrency(parsed.amount)}\n` +
      `Categoria: ${categoryLabel}\n\n` +
      `Confirma? (Sim/Nao)`,
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
    await sendWhatsAppMessage(phone, "Nenhum lancamento pendente para confirmar.");
    return;
  }

  // Create the actual transaction
  await supabase.from("transactions").insert({
    tenant_id: tenantId,
    type: pending.parsed_type,
    description: pending.parsed_description,
    amount: pending.parsed_amount,
    category_id: pending.parsed_category_id,
    status: "pago",
    paid_date: new Date().toISOString().split("T")[0],
    source: "whatsapp",
  });

  // Mark as confirmed
  await supabase
    .from("whatsapp_pending")
    .update({ confirmed: true })
    .eq("id", pending.id);

  await sendWhatsAppMessage(phone, "Lancamento confirmado! Voce pode ver no painel do Guarda Dinheiro.");
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
    await sendWhatsAppMessage(phone, "Nenhum lancamento pendente para cancelar.");
    return;
  }

  await supabase.from("whatsapp_pending").delete().eq("id", pending.id);
  await sendWhatsAppMessage(phone, "Lancamento cancelado. Envie uma nova mensagem quando quiser.");
}
