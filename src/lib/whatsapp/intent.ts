/**
 * Detecção de intenção de confirmação/cancelamento em mensagens de texto.
 *
 * Estratégia: extrair a última cláusula da frase (após último separador)
 * e verificar se ela é uma confirmação ou cancelamento pura. Isso cobre
 * casos como "Recebi 1440, pode lançar" onde a confirmação vem ao final.
 */

const CONFIRM_PATTERNS: RegExp[] = [
  /^sim$/i,
  /^s$/i,
  /^ok$/i,
  /^okay$/i,
  /^beleza$/i,
  /^blz$/i,
  /^perfeito$/i,
  /^isso$/i,
  /^isso\s+mesmo$/i,
  /^correto$/i,
  /^certo$/i,
  /^positivo$/i,
  /^afirmativo$/i,
  /^confirmar?$/i,
  /^confirmado$/i,
  /^pode\s+lan[çc]ar$/i,
  /^pode\s+lan[çc]ar?\s+sim$/i,
  /^pode\s+criar$/i,
  /^pode\s+ir$/i,
  /^pode\s+ser$/i,
  /^t[aá]\s+certo$/i,
  /^t[aá]\s+bom$/i,
  /^t[aá]\s+certinho$/i,
  /^vai$/i,
  /^vai\s+l[aá]$/i,
  /^manda$/i,
  /^manda\s+ver$/i,
];

const CANCEL_PATTERNS: RegExp[] = [
  /^n[aã]o$/i,
  /^n$/i,
  /^nao$/i,
  /^nops?$/i,
  /^negativo$/i,
  /^errado$/i,
  /^incorreto$/i,
  /^cancelar?$/i,
  /^cancelado$/i,
  /^cancela$/i,
  /^cancela\s+isso$/i,
  /^deixa\s+pra?\s*l[aá]$/i,
  /^esquece$/i,
  /^esqueça$/i,
  /^apaga$/i,
  /^apagar$/i,
  /^n[aã]o\s+[ée]\s+isso$/i,
  /^n[aã]o\s+confirma$/i,
];

/**
 * Extrai a última cláusula de uma frase (depois do último separador).
 * Exemplos:
 *  "Recebi 1440, pode lançar" → "pode lançar"
 *  "Sim" → "Sim"
 *  "Então é, pode ser, vai" → "vai"
 */
function extractLastClause(text: string): string {
  const normalized = text.trim();
  const parts = normalized.split(/[.,;!?\n]+/).filter((p) => p.trim().length > 0);
  return (parts[parts.length - 1] ?? normalized).trim();
}

export function isConfirmation(text: string): boolean {
  const lastClause = extractLastClause(text);
  return CONFIRM_PATTERNS.some((p) => p.test(lastClause));
}

export function isCancellation(text: string): boolean {
  const lastClause = extractLastClause(text);
  return CANCEL_PATTERNS.some((p) => p.test(lastClause));
}
