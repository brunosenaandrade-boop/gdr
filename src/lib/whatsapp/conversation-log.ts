import type { SupabaseClient } from "@supabase/supabase-js";

export type ConversationLogEntry = {
  tenantId: string | null;
  phoneNumber: string;
  direction: "in" | "out";
  messageType: "text" | "audio" | "system";
  content: string;
  metadata?: Record<string, unknown>;
};

/**
 * Registra uma entrada no log de conversas WhatsApp.
 * Best-effort: falhas são logadas mas não interrompem o fluxo.
 */
export async function logConversation(
  supabase: SupabaseClient,
  entry: ConversationLogEntry,
): Promise<void> {
  const { error } = await supabase.from("whatsapp_conversation_log").insert({
    tenant_id: entry.tenantId,
    phone_number: entry.phoneNumber,
    direction: entry.direction,
    message_type: entry.messageType,
    content: entry.content,
    metadata: entry.metadata ?? null,
  });
  if (error) {
    console.error("[conversation-log] Falha ao registrar:", error.message);
  }
}
