import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { parseLancamento } from "@/lib/openai/parse-lancamento";
import { transcribeAudio } from "@/lib/openai/transcribe-audio";
import { sendWhatsAppMessage, sendWhatsAppButtons, sendWhatsAppCTA, downloadWhatsAppMedia } from "./meta-api";
import { formatCurrency } from "@/lib/utils";
import { isConfirmation, isCancellation } from "./intent";
import { matchCategory } from "./category-match";
import { logConversation } from "./conversation-log";
import { isQuery, handleQuery } from "./query-handler";
import { generateResponse } from "@/lib/openai/generate-response";
import { sendSignupFlow, handleFlowResponse } from "./onboarding-flow";
import type { Category } from "@/types";

type WhatsAppMessage = {
  from: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    nfm_reply?: { response_json: string };
  };
  messageId?: string;
};

const DEDUP_WINDOW_MS = 30 * 1000;
const STALE_PENDING_MS = 2 * 60 * 1000;

export async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  const supabase = await createServiceClient();
  let currentTenantId: string | null = null;

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

  // Idempotência
  if (message.messageId) {
    const { data: existing } = await supabase
      .from("whatsapp_message_log")
      .select("message_id")
      .eq("message_id", message.messageId)
      .maybeSingle();

    if (existing) return;

    await supabase
      .from("whatsapp_message_log")
      .insert({ message_id: message.messageId, phone_number: message.from })
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
        await respond("Este número já está vinculado a outra conta do Guarda Dinheiro. Desvincule na outra conta primeiro.");
        return;
      }

      const { error: updateError } = await supabase
        .from("whatsapp_links")
        .update({ phone_number: message.from, verified: true, verification_code: null })
        .eq("id", pendingLink.id);

      if (updateError) {
        Sentry.captureException(updateError);
        console.error("Erro ao vincular número:", updateError.message);
        await respond("Erro ao vincular. Tente novamente.");
        return;
      }

      currentTenantId = pendingLink.tenant_id;

      // Mensagem 1: Apresentação do Guardinha + Como funciona
      const msg1Body =
        "A partir de agora, eu serei o seu Guardinha, seu assistente financeiro pessoal! 🛡️💚\n\n" +
        "Estou aqui para te ajudar a organizar sua vida financeira, registrar seus gastos e te ajudar a sair das dívidas de vez!\n\n" +
        "Preparei um guia rápido de como eu funciono para que possamos começar juntos da melhor forma. Clique no botão abaixo para entender! 👇";

      await sendWhatsAppCTA(message.from, msg1Body, {
        displayText: "📖 Entender como funciona",
        url: "https://www.guardadinheiro.com.br/como-funciona",
      });
      await logConversation(supabase, {
        tenantId: currentTenantId,
        phoneNumber: message.from,
        direction: "out",
        messageType: "text",
        content: msg1Body + " [CTA: 📖 Entender como funciona]",
      });

      // Aguardar 3 segundos entre as mensagens
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mensagem 2: Pronto para começar + Acessar plataforma
      const msg2Body =
        "Estamos prontos para começar! 🚀\n\n" +
        "Esse contato de WhatsApp será nosso canal principal. Você já pode começar a registrar tudo aqui comigo, é só mandar uma mensagem de voz ou texto!\n\n" +
        "Para acessar o painel com todos os seus dados:";

      await sendWhatsAppCTA(message.from, msg2Body, {
        displayText: "📊 Acessar a plataforma",
        url: "https://www.guardadinheiro.com.br/dashboard",
      });
      await logConversation(supabase, {
        tenantId: currentTenantId,
        phoneNumber: message.from,
        direction: "out",
        messageType: "text",
        content: msg2Body + " [CTA: 📊 Acessar a plataforma]",
      });
      return;
    }
  }

  // ===== Descobrir tenant =====
  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("tenant_id")
    .eq("phone_number", message.from)
    .eq("verified", true)
    .maybeSingle();

  if (!link) {
    // Verificar se é resposta do WhatsApp Flow (cadastro concluído)
    if (
      message.type === "interactive" &&
      message.interactive?.nfm_reply?.response_json
    ) {
      await handleFlowResponse(supabase, message.from, message.interactive.nfm_reply.response_json);
      return;
    }

    // Número sem cadastro → enviar formulário de cadastro via WhatsApp Flow
    await sendSignupFlow(supabase, message.from);
    return;
  }

  currentTenantId = link.tenant_id;
  const tenantId = link.tenant_id;

  // ===== Buscar pending ativo (para contexto multi-turn e detecção de intent) =====
  const { data: activePending } = await supabase
    .from("whatsapp_pending")
    .select("*, category:categories(name)")
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ===== FLUXO 1.5: Botões interativos (Editar/Excluir transação) =====
  if (message.type === "interactive" && message.interactive?.button_reply) {
    const buttonId = message.interactive.button_reply.id;

    if (buttonId === "ver_dashboard") {
      await sendWhatsAppCTA(
        message.from,
        "Acesse o painel com todos os seus dados, relatórios e categorias:",
        {
          displayText: "📊 Acessar a plataforma",
          url: "https://www.guardadinheiro.com.br/dashboard",
        },
      );
      await logConversation(supabase, {
        tenantId: currentTenantId,
        phoneNumber: message.from,
        direction: "out",
        messageType: "text",
        content: "[CTA: 📊 Acessar a plataforma]",
      });
      return;
    }

    if (buttonId.startsWith("editar_")) {
      const txId = buttonId.replace("editar_", "");
      // Guardar que estamos editando e pedir nova info
      await supabase.from("whatsapp_pending").insert({
        tenant_id: tenantId,
        raw_message: `__edit__${txId}`,
        parsed_type: null,
        parsed_description: null,
        parsed_amount: null,
        parsed_category_id: null,
      });
      await respond("Claro! Descreva na próxima mensagem o que você precisa que eu altere na transação.\n\nExemplo:\n• \"O valor era 200\"\n• \"Coloca na categoria Transporte\"\n• \"A descrição é almoço com cliente\"");
      return;
    }

    if (buttonId.startsWith("excluir_")) {
      const txId = buttonId.replace("excluir_", "");
      const { error: delErr } = await supabase
        .from("transactions")
        .delete()
        .eq("id", txId)
        .eq("tenant_id", tenantId);

      if (delErr) {
        console.error("Erro ao excluir transação:", delErr.message);
        await respond("Erro ao excluir. Tente novamente.");
      } else {
        await respond("Lançamento excluído com sucesso.");
      }
      return;
    }
  }

  // ===== FLUXO 1.6: Edição de transação em andamento =====
  if (activePending?.raw_message?.startsWith("__edit__") && message.type === "text" && message.text) {
    const txId = activePending.raw_message.replace("__edit__", "");
    const editText = message.text?.body ?? "";

    // Usar IA para interpretar a edição
    const typedCategories = await supabase.from("categories").select("*").eq("tenant_id", tenantId);
    const cats = (typedCategories.data ?? []) as Category[];
    const editResult = await parseLancamento(editText, cats);

    if (editResult.ok) {
      const matchedCat = matchCategory(editResult.data.category_suggestion, editResult.data.type, cats);
      const updates: {
        amount?: number;
        description?: string;
        category_id?: string;
        updated_at: string;
      } = { updated_at: new Date().toISOString() };

      if (editResult.data.amount > 0) updates.amount = editResult.data.amount;
      if (editResult.data.description && editResult.data.description.length > 1) updates.description = editResult.data.description;
      if (matchedCat) updates.category_id = matchedCat.id;

      if (updates.amount || updates.description || updates.category_id) {
        await supabase.from("transactions").update(updates).eq("id", txId).eq("tenant_id", tenantId);
        const updatedMsg = await generateResponse({
          action: "transaction_updated",
          data: {
            type: editResult.data.type,
            description: editResult.data.description,
            amount: editResult.data.amount,
            category: matchedCat?.name ?? editResult.data.category_suggestion,
          },
        });
        await respond(updatedMsg);
      } else {
        await respond("Não consegui identificar o que alterar. Tente ser mais específico.");
      }
    } else {
      await respond("Não entendi a alteração. Tente algo como:\n• \"O valor era 200\"\n• \"Coloca na categoria Transporte\"");
    }

    // Limpar o pending de edição
    await supabase.from("whatsapp_pending").delete().eq("id", activePending.id);
    return;
  }

  // ===== FLUXO 2: Confirmação/Cancelamento =====
  if (message.type === "text" && message.text) {
    const text = message.text?.body ?? "";

    // Regex-based intent (rápido, sem custo)
    if (isConfirmation(text)) {
      return handleConfirmation(tenantId, supabase, respond, activePending, message.from);
    }
    if (isCancellation(text)) {
      return handleCancellation(tenantId, supabase, respond, activePending);
    }

    // #4: Fallback semântico via IA — só se existe pending ativo e a frase é curta
    // Mensagens como "isso", "manda", "joga lá", "pode ser" que o regex não cobriu
    if (activePending && text.split(/\s+/).length <= 5) {
      const lower = text.trim().toLowerCase();
      // Verificar se parece ser um complemento com informação nova ou confirmação vaga
      const looksLikeValue = /\d/.test(lower);
      const looksLikeConfirmOrCancel = !/[0-9]/.test(lower) && lower.length < 30;

      if (looksLikeConfirmOrCancel && !looksLikeValue) {
        // Frase curta sem números com pending ativo — possivelmente confirmação/cancelamento
        // Palavras positivas genéricas
        const positiveVibes = /^(bora|vamo|vamos|vai|valeu|show|top|massa|boa|dale|dale|certinho|certeza|exato|fechou|isso a[ií]|manda|mete|joga|lan[çc]a|salva|grava|registra|bota|coloca)/i;
        const negativeVibes = /^(para|espera|calma|epa|opa|perai|p[eé]ra|errei|errado|engano|troca|muda|altera)/i;

        if (positiveVibes.test(lower)) {
          return handleConfirmation(tenantId, supabase, respond, activePending, message.from);
        }
        if (negativeVibes.test(lower)) {
          return handleCancellation(tenantId, supabase, respond, activePending);
        }
      }
    }
  }

  // ===== FLUXO 2.5: Consulta livre ("quanto gastei?", "qual meu saldo?") =====
  if (message.type === "text" && message.text) {
    const text = message.text?.body ?? "";
    if (isQuery(text)) {
      const answer = await handleQuery(tenantId, text, supabase);
      await respond(answer);
      return;
    }
  }

  // ===== FLUXO 3: Novo lançamento =====

  // Buscar tenant type (PF/PJ) para contexto da IA
  const { data: tenant } = await supabase
    .from("tenants")
    .select("type")
    .eq("id", tenantId)
    .maybeSingle();

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

  // #3: Montar contexto multi-turn (se há pending ativo)
  const pendingCat = activePending?.category as { name: string } | null | undefined;
  const pendingContext = activePending
    ? {
        type: activePending.parsed_type as "receita" | "despesa",
        description: activePending.parsed_description ?? "",
        amount: activePending.parsed_amount ?? 0,
        category: pendingCat?.name ?? null,
      }
    : null;

  // Parse com IA (com contexto PF/PJ + pending)
  const typedCategories = (categories ?? []) as Category[];
  const result = await parseLancamento(textContent, typedCategories, {
    tenantType: (tenant?.type as "pf" | "pj") ?? undefined,
    pendingContext,
  });

  if (!result.ok) {
    await respond(
      'Não entendi o lançamento. Tente algo como:\n"Paguei 150 reais de luz"\n"Recebi 500 do cliente João"',
    );
    return;
  }

  const { data: parsed } = result;

  // #2: Confidence low + amount 0 → pedir clarificação em vez de criar pending
  if (parsed.confidence === "low" && parsed.amount === 0) {
    await respond(
      "Não consegui identificar o valor do lançamento.\n\n" +
        "Pode repetir informando o valor? Exemplo:\n" +
        '• "Paguei 150 de luz"\n' +
        '• "Recebi 500 do João"',
    );
    return;
  }

  // #1: Fuzzy match de categoria (em vez de .find exato)
  const matched = matchCategory(
    parsed.category_suggestion,
    parsed.type,
    typedCategories,
  );

  // #3: Se a IA indicou que é update do pending, atualizar em vez de criar novo
  if (parsed.is_update_to_pending && activePending) {
    const { error: updateErr } = await supabase
      .from("whatsapp_pending")
      .update({
        parsed_type: parsed.type,
        parsed_description: parsed.description,
        parsed_amount: parsed.amount,
        parsed_category_id: matched?.id ?? null,
        raw_message: textContent,
      })
      .eq("id", activePending.id);

    if (updateErr) {
      console.error("Erro ao atualizar pending:", updateErr.message);
    }

    const updatedPendingMsg = await generateResponse({
      action: "transaction_updated",
      data: {
        type: parsed.type,
        description: parsed.description,
        amount: parsed.amount,
        category: matched?.name ?? parsed.category_suggestion,
      },
    });
    await respond(updatedPendingMsg);
    return;
  }

  // Limpar pendings antigos
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

  // Dedup
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
    const typeLabel = parsed.type === "receita" ? "RECEITA" : "DESPESA";
    const categoryLabel = matched?.name ?? parsed.category_suggestion;
    await respond(
      `Ainda aguardando sua confirmação do lançamento anterior:\n\n` +
        `${typeLabel}: ${parsed.description}\n` +
        `Valor: ${formatCurrency(parsed.amount)}\n` +
        `Categoria: ${categoryLabel}\n\n` +
        `Responda Sim para confirmar ou Não para cancelar.`,
    );
    return;
  }

  // Remover pendings ativos antigos (1 ativo por vez)
  await supabase
    .from("whatsapp_pending")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("confirmed", false)
    .then(({ error }) => {
      if (error) console.error("Erro ao limpar pendings ativos:", error.message);
    });

  const typeLabel = parsed.type === "receita" ? "RECEITA" : "DESPESA";
  const categoryLabel = matched?.name ?? parsed.category_suggestion;

  // === Recorrência: salvar em recurring_transactions se detectada ===
  let recurringLabel = "";
  if (parsed.is_recurring && parsed.amount > 0) {
    const dayOfMonth = parsed.day_of_month ?? new Date().getDate();
    const { error: recError } = await supabase.from("recurring_transactions").insert({
      tenant_id: tenantId,
      type: parsed.type,
      description: parsed.description,
      amount: parsed.amount,
      category_id: matched?.id ?? null,
      day_of_month: dayOfMonth,
      source: "whatsapp",
    });
    if (recError) {
      console.error("Erro ao criar recorrência:", recError.message);
    } else {
      recurringLabel = `\n🔄 Recorrência ativa: todo dia ${dayOfMonth} de cada mês`;
    }
  }

  // === Lançamento DIRETO para high confidence (sem Sim/Não) ===
  if (parsed.confidence === "high" && parsed.amount > 0) {
    const { data: newTx, error: insertError } = await supabase.from("transactions").insert({
      tenant_id: tenantId,
      type: parsed.type,
      description: parsed.description,
      amount: parsed.amount,
      category_id: matched?.id ?? null,
      status: "pago",
      paid_date: new Date().toISOString().split("T")[0],
      source: "whatsapp",
    }).select("id").maybeSingle();

    if (insertError) {
      Sentry.captureException(insertError);
      console.error("Erro ao inserir transação direta:", insertError.message);
      await respond("Erro ao salvar o lançamento. Tente novamente.");
      return;
    }

    const txId = newTx?.id ?? "";
    const summary = await generateResponse({
      action: "transaction_registered",
      data: {
        type: parsed.type,
        description: parsed.description,
        amount: parsed.amount,
        category: categoryLabel,
        recurring: recurringLabel || null,
      },
    });

    await sendWhatsAppButtons(message.from, summary, [
      { id: `editar_${txId}`, title: "✏️ Editar" },
      { id: `excluir_${txId}`, title: "🗑️ Excluir" },
      { id: "ver_dashboard", title: "📊 Ver Dashboard" },
    ]);
    await logConversation(supabase, {
      tenantId: currentTenantId,
      phoneNumber: message.from,
      direction: "out",
      messageType: "text",
      content: summary + " [botões: ✏️ Editar | 🗑️ Excluir | 📊 Ver Dashboard]",
    });
    return;
  }

  // === Lançamento com confirmação para medium/low confidence ===

  // Salvar novo pending
  const { error: pendingError } = await supabase.from("whatsapp_pending").insert({
    tenant_id: tenantId,
    raw_message: textContent,
    parsed_type: parsed.type,
    parsed_description: parsed.description,
    parsed_amount: parsed.amount,
    parsed_category_id: matched?.id ?? null,
  });

  if (pendingError) {
    Sentry.captureException(pendingError);
    console.error("Erro ao salvar pendência:", pendingError.message);
    await respond("Erro ao processar o lançamento. Tente novamente.");
    return;
  }

  const pendingMsg = await generateResponse({
    action: "transaction_pending",
    data: {
      type: parsed.type,
      description: parsed.description,
      amount: parsed.amount,
      category: categoryLabel,
      recurring: recurringLabel || null,
    },
    lowConfidence: parsed.confidence === "low",
  });
  await respond(pendingMsg);
}

type RespondFn = (text: string) => Promise<void>;

async function handleConfirmation(
  tenantId: string,
  supabase: SupabaseClient,
  respond: RespondFn,
  pending?: { id: string; parsed_type: string | null; parsed_description: string | null; parsed_amount: number | null; parsed_category_id: string | null } | null,
  phone?: string,
): Promise<void> {
  if (!pending) {
    await respond("Nenhum lançamento pendente para confirmar.");
    return;
  }

  const { data: newTx, error: insertError } = await supabase.from("transactions").insert({
    tenant_id: tenantId,
    type: pending.parsed_type,
    description: pending.parsed_description,
    amount: pending.parsed_amount,
    category_id: pending.parsed_category_id,
    status: "pago",
    paid_date: new Date().toISOString().split("T")[0],
    source: "whatsapp",
  }).select("id").maybeSingle();

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

  const txId = newTx?.id ?? "";
  const summary = await generateResponse({
    action: "transaction_confirmed",
    data: {
      type: (pending.parsed_type as "receita" | "despesa") ?? "despesa",
      description: pending.parsed_description ?? "",
      amount: pending.parsed_amount ?? 0,
      category: "",
    },
  });

  await sendWhatsAppButtons(phone ?? "", summary, [
    { id: `editar_${txId}`, title: "✏️ Editar" },
    { id: `excluir_${txId}`, title: "🗑️ Excluir" },
    { id: "ver_dashboard", title: "📊 Ver Dashboard" },
  ]);
}

async function handleCancellation(
  _tenantId: string,
  supabase: SupabaseClient,
  respond: RespondFn,
  pending?: { id: string } | null,
): Promise<void> {
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
