import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateTimeBRT, todayBRT } from "@/lib/date/brt";

type Scope = "hoje" | "amanha" | "semana" | "proximos";

function detectScope(text: string): Scope {
  const lower = text.toLowerCase();
  if (/\bhoje\b/.test(lower)) return "hoje";
  if (/\bamanh[aã]\b/.test(lower)) return "amanha";
  if (/\bessa\s+semana|semana\b/.test(lower)) return "semana";
  return "proximos";
}

/**
 * Responde consultas sobre a agenda do usuário.
 * Ex: "o que tenho hoje?", "quais compromissos amanhã?", "minha agenda"
 */
export async function handleAgendaQuery(
  tenantId: string,
  text: string,
  supabase: SupabaseClient,
): Promise<string> {
  const scope = detectScope(text);
  const now = new Date();

  let startAt = now;
  let endAt: Date;
  let scopeLabel: string;

  const todayStr = todayBRT(now);

  if (scope === "hoje") {
    startAt = new Date(`${todayStr}T00:00:00-03:00`);
    endAt = new Date(`${todayStr}T23:59:59-03:00`);
    scopeLabel = "hoje";
  } else if (scope === "amanha") {
    const tomorrow = new Date(new Date(`${todayStr}T12:00:00-03:00`).getTime() + 24 * 3600 * 1000);
    const tomorrowStr = todayBRT(tomorrow);
    startAt = new Date(`${tomorrowStr}T00:00:00-03:00`);
    endAt = new Date(`${tomorrowStr}T23:59:59-03:00`);
    scopeLabel = "amanhã";
  } else if (scope === "semana") {
    startAt = now;
    endAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    scopeLabel = "nos próximos 7 dias";
  } else {
    startAt = now;
    endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    scopeLabel = "nos próximos 30 dias";
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("id, title, scheduled_at, notes")
    .eq("tenant_id", tenantId)
    .eq("status", "pendente")
    .gte("scheduled_at", startAt.toISOString())
    .lte("scheduled_at", endAt.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) {
    console.error("[agenda-query] Erro ao buscar:", error.message);
    return "Erro ao consultar sua agenda. Tente novamente.";
  }

  if (!data || data.length === 0) {
    return `Você não tem compromissos ${scopeLabel}. 🍃`;
  }

  const todayDate = todayBRT(now);
  const lines = data.map((apt) => {
    const when = formatDateTimeBRT(apt.scheduled_at);
    const aptDate = todayBRT(new Date(apt.scheduled_at));
    const isToday = aptDate === todayDate;
    const prefix = isToday ? "📍" : "📅";
    const notesLine = apt.notes ? `\n   _${apt.notes}_` : "";
    return `${prefix} *${apt.title}* — ${when}${notesLine}`;
  });

  const header = `Seus compromissos ${scopeLabel} (${data.length}):`;
  return `${header}\n\n${lines.join("\n\n")}`;
}
