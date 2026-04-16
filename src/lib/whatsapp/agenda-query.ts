import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Formata data/hora para exibição brasileira (ex: "16/04 às 16h00").
 */
function formatBRDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} às ${hh}h${mi}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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

  if (scope === "hoje") {
    startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    scopeLabel = "hoje";
  } else if (scope === "amanha") {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    startAt = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    endAt = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);
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

  const lines = data.map((apt) => {
    const when = formatBRDateTime(apt.scheduled_at);
    const isToday = isSameDay(new Date(apt.scheduled_at), now);
    const prefix = isToday ? "📍" : "📅";
    const notesLine = apt.notes ? `\n   _${apt.notes}_` : "";
    return `${prefix} *${apt.title}* — ${when}${notesLine}`;
  });

  const header = `Seus compromissos ${scopeLabel} (${data.length}):`;
  return `${header}\n\n${lines.join("\n\n")}`;
}
