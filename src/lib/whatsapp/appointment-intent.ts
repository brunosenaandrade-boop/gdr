/**
 * Detecção rápida (regex) de intenção de compromisso/agenda.
 * Retorna true se o texto parece descrever um compromisso a ser agendado.
 *
 * Estratégia: keyword + indicador temporal. Keyword sozinha pode confundir
 * (ex: "paguei o dentista" é despesa, não compromisso). Precisa ter
 * indicação de horário/dia futuro pra ser considerado agendamento.
 */

const APPOINTMENT_KEYWORDS = [
  "m[eé]dico",
  "m[eé]dica",
  "dentista",
  "consulta",
  "reuni[aã]o",
  "compromisso",
  "anivers[aá]rio",
  "encontro",
  "entrevista",
  "audi[eê]ncia",
  "visita",
  "terapia",
  "fisioterapia",
  "apresenta[cç][aã]o",
  "palestra",
  "evento",
  "jantar",
  "almo[cç]o",
  "caf[eé]",
  "confer[eê]ncia",
  "workshop",
  "treino",
  "aula",
  "prova",
  "exame",
  "vacina",
];

const TIME_INDICATORS = [
  /\b\d{1,2}h(?:\d{2})?\b/i, // 14h, 14h30
  /\b\d{1,2}:\d{2}\b/, // 14:30
  /\b\d{1,2}\s*horas?\b/i, // 14 horas
  /\b[àa]s\s+\d{1,2}/i, // às 14, às 14h
  /\bmeio[\s-]*dia\b/i,
  /\bmeia[\s-]*noite\b/i,
  /\bdaqui\s+a?\s*\d+\s*(minutos?|min|horas?|h)\b/i, // daqui a 30 minutos, daqui 1 hora
  /\bem\s+\d+\s*(minutos?|min|horas?|h)\b/i, // em 30 minutos, em 2 horas
  /\bdaqui\s+a?\s*pouco\b/i, // daqui a pouco (vago mas com verbo de lembrete = compromisso)
  /[àa]\s*tarde/i, // à tarde (sem \b por causa do acento)
  /[àa]\s*noite/i, // à noite
  /de\s*manh[aã]/i, // de manhã
];

const DATE_INDICATORS = [
  /\bhoje\b/i,
  /\bamanh[aã]\b/i,
  /\bdepois\s+de\s+amanh[aã]\b/i,
  /\bsegunda(?:[\s-]feira)?\b/i,
  /\bter[cç]a(?:[\s-]feira)?\b/i,
  /\bquarta(?:[\s-]feira)?\b/i,
  /\bquinta(?:[\s-]feira)?\b/i,
  /\bsexta(?:[\s-]feira)?\b/i,
  /\bs[aá]bado\b/i,
  /\bdomingo\b/i,
  /\bpr[oó]xim[ao]\s+(?:segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo|semana|m[eê]s)\b/i,
  /\bdia\s+\d{1,2}\b/i,
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/, // 25/04 ou 25/04/2026
];

const COMMITMENT_VERBS = [
  /\bmarc(?:a|ar|ando|amos|ou|ado)\b/i,
  /\bagend(?:a|ar|ando|amos|ou|ado)\b/i,
  /\blembr(?:a|ar|e|ete|ete-me)\b/i,
  /\btenho\s+que\b/i,
  /\bprecis(?:o|amos)\b/i,
  /\bvou\b/i,
  /\biremos\b/i,
];

const KEYWORD_RE = new RegExp(`\\b(?:${APPOINTMENT_KEYWORDS.join("|")})\\b`, "i");

function hasTimeIndicator(text: string): boolean {
  return TIME_INDICATORS.some((p) => p.test(text));
}

function hasDateIndicator(text: string): boolean {
  return DATE_INDICATORS.some((p) => p.test(text));
}

function hasCommitmentVerb(text: string): boolean {
  return COMMITMENT_VERBS.some((p) => p.test(text));
}

/**
 * Detecta se o texto descreve um compromisso futuro que precisa ser agendado.
 *
 * Regras:
 * - Precisa ter ao menos 1 keyword de compromisso OU verbo de agendamento/lembrete
 * - Precisa ter ao menos 1 indicador temporal (hora ou data futura)
 *
 * Falsos negativos aceitáveis (melhor não agendar do que agendar errado).
 */
export function isAppointment(text: string): boolean {
  const hasKeyword = KEYWORD_RE.test(text);
  const hasVerb = hasCommitmentVerb(text);
  const hasTime = hasTimeIndicator(text);
  const hasDate = hasDateIndicator(text);

  // Pelo menos uma indicação temporal
  if (!hasTime && !hasDate) return false;

  // Keyword de compromisso explícita OR verbo de agendar/lembrar
  return hasKeyword || hasVerb;
}

/**
 * Detecta pergunta sobre agenda (consulta, não criação).
 */
export function isAgendaQuery(text: string): boolean {
  const lower = text.trim().toLowerCase();
  // Normaliza acentos pra simplificar os regex (amanhã -> amanha)
  const normalized = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return (
    /\b(?:quais|que)\s+(?:sao\s+)?(?:meus?|os)\s+(?:compromissos?|agend|eventos?)/.test(normalized) ||
    /\bo\s+que\s+(?:eu\s+)?tenho\s+(?:hoje|amanha|essa\s+semana|pra\s+hoje|pra\s+amanha|pra\s+fazer)/.test(normalized) ||
    /\btenho\s+(?:algum\s+)?(?:compromisso|reuniao|consulta)/.test(normalized) ||
    /\bminha\s+agenda\b/.test(normalized) ||
    /\bver\s+(?:minha\s+)?agenda\b/.test(normalized) ||
    /\bcompromissos?\s+(?:de\s+)?(?:hoje|amanha|essa\s+semana|do\s+mes)/.test(normalized)
  );
}
