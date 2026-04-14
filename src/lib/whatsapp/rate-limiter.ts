import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "blocked" | "messages_exceeded" | "audio_exceeded" | "ai_cost_exceeded"; details?: string };

/**
 * Verifica limites por tenant baseados na tabela user_rate_limits.
 * - blocked=true → bloqueia tudo
 * - max_messages_per_day excedido → bloqueia
 * - max_audio_seconds_per_day excedido → bloqueia áudios
 * - ai_cost_limit_cents_per_day excedido → bloqueia mensagens que exigem IA
 */
export async function checkTenantRateLimit(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<RateLimitResult> {
  const { data: limits } = await supabase
    .from("user_rate_limits")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (limits?.blocked) {
    return { allowed: false, reason: "blocked", details: limits.blocked_reason ?? undefined };
  }

  // Se não tem configuração específica, usa defaults
  const maxMessages = limits?.max_messages_per_day ?? 500;
  const maxAudio = limits?.max_audio_seconds_per_day ?? 1800;
  const maxCost = limits?.ai_cost_limit_cents_per_day ?? 500;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Contar mensagens recebidas hoje
  const { count: msgCount = 0 } = await supabase
    .from("whatsapp_conversation_log")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("direction", "in")
    .gte("created_at", startOfDay.toISOString());

  if ((msgCount ?? 0) >= maxMessages) {
    return { allowed: false, reason: "messages_exceeded" };
  }

  // Somar custo e segundos de áudio de IA hoje
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("estimated_cost_cents, audio_seconds")
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfDay.toISOString());

  const totalCost = (usage ?? []).reduce((s, u) => s + u.estimated_cost_cents, 0);
  const totalAudio = (usage ?? []).reduce((s, u) => s + (u.audio_seconds ?? 0), 0);

  if (totalCost >= maxCost) {
    return { allowed: false, reason: "ai_cost_exceeded" };
  }

  if (totalAudio >= maxAudio) {
    return { allowed: false, reason: "audio_exceeded" };
  }

  return { allowed: true };
}

export type RateLimitReason = "blocked" | "messages_exceeded" | "audio_exceeded" | "ai_cost_exceeded";

/**
 * Mensagem amigável de bloqueio para enviar ao usuário no WhatsApp.
 */
export function getRateLimitMessage(reason: RateLimitReason, details?: string): string {
  switch (reason) {
    case "blocked":
      return `⚠️ Sua conta está temporariamente suspensa.${details ? `\n\nMotivo: ${details}` : ""}\n\nEntre em contato pelo suporte@guardadinheiro.com.br`;
    case "messages_exceeded":
      return "Você atingiu o limite diário de mensagens. O limite será renovado amanhã às 00h. 📬";
    case "audio_exceeded":
      return "Você atingiu o limite diário de áudios. Envie como texto ou aguarde amanhã. 🎙️";
    case "ai_cost_exceeded":
      return "Você atingiu o limite diário de uso da IA. O limite será renovado amanhã. 🤖";
    default:
      return "Sua conta está temporariamente indisponível.";
  }
}
