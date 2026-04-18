/**
 * Helpers de data/hora para fuso horário America/Sao_Paulo (BRT, UTC-3).
 * Brasil não tem mais horário de verão desde 2019, então -03:00 é fixo.
 *
 * IMPORTANTE: Nunca usar .getHours() / .getDate() direto em Date objects
 * no servidor (Vercel roda em UTC). Sempre usar estas funções.
 */

const TZ = "America/Sao_Paulo";

/**
 * Retorna a data "hoje" em BRT no formato YYYY-MM-DD.
 */
export function todayBRT(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/**
 * Retorna horas e minutos de uma data ISO em BRT.
 */
export function getHoursBRT(iso: string | Date): { hours: number; minutes: number } {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hours = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const minutes = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  return { hours, minutes };
}

/**
 * Formata ISO pra "HHhMM" em BRT. Ex: "16h30", "09h00".
 */
export function formatTimeBRT(iso: string | Date): string {
  const { hours, minutes } = getHoursBRT(iso);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}h${mm}`;
}

/**
 * Retorna o dia do mês em BRT (1-31).
 */
export function getDayOfMonthBRT(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    day: "numeric",
  }).formatToParts(now);

  return parseInt(parts.find((p) => p.type === "day")!.value, 10);
}

/**
 * Retorna início e fim de "hoje" em BRT como ISO strings (com offset -03:00).
 * Útil pra filtrar por data no Supabase.
 */
export function todayRangeBRT(now: Date = new Date()): { start: string; end: string } {
  const today = todayBRT(now);
  return {
    start: `${today}T00:00:00-03:00`,
    end: `${today}T23:59:59-03:00`,
  };
}

/**
 * Formata ISO pra "DD/MM às HHhMM" em BRT.
 */
export function formatDateTimeBRT(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const dateParts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(date);

  const time = formatTimeBRT(date);
  return `${dateParts} às ${time}`;
}
