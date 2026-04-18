import type { Category } from "@/types";

/**
 * Normaliza string para comparação fuzzy:
 * - lowercase
 * - remove acentos
 * - remove pontuação
 * - colapsa espaços
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Encontra a melhor categoria match para uma sugestão da IA.
 *
 * Estratégia em camadas:
 * 1. Match exato (case-insensitive)
 * 2. Match normalizado (sem acentos/pontuação)
 * 3. Match parcial (sugestão contém nome ou vice-versa)
 * 4. Fallback para "Outros" do mesmo tipo
 * 5. null se nada encontrar
 */
export function matchCategory(
  suggestion: string,
  type: "receita" | "despesa",
  categories: Category[],
): Category | null {
  const sameType = categories.filter((c) => c.type === type);
  if (sameType.length === 0) return null;

  const normSuggestion = normalize(suggestion);

  // 1. Match exato (case-insensitive)
  const exact = sameType.find(
    (c) => c.name.toLowerCase() === suggestion.toLowerCase(),
  );
  if (exact) return exact;

  // 2. Match normalizado (sem acentos)
  const normalized = sameType.find((c) => normalize(c.name) === normSuggestion);
  if (normalized) return normalized;

  // 3. Match parcial - sugestão contém nome de categoria
  const containsCategory = sameType.find((c) => {
    const normName = normalize(c.name);
    return normSuggestion.includes(normName) || normName.includes(normSuggestion);
  });
  if (containsCategory) return containsCategory;

  // 4. Fallback para "Outros" do mesmo tipo
  const outros = sameType.find((c) =>
    /^outros?\s*(ganhos|recebimentos)?$/i.test(c.name) ||
    /^despesas?\s*operacionais?$/i.test(c.name),
  );
  if (outros) return outros;

  // 5. Sem match → retornar null (melhor sem categoria do que categoria errada)
  return null;
}
