import OpenAI from "openai";
import { aiParsedTransactionSchema } from "@/lib/validators/schemas";
import type { AIParsedTransaction, Category } from "@/types";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Regex para detectar descrições genéricas que precisam de enriquecimento.
 * Casos como "Recebimento", "Pagamento", "Despesa", "Receita" sem contexto.
 */
const GENERIC_DESCRIPTION_RE =
  /^(recebimento|pagamento|compra|venda|gasto|despesa|receita|transfer[eê]ncia|transf|dep[oó]sito|saque|retirada|entrada|sa[ií]da)s?$/i;

/**
 * Formata uma data como DD/MM para usar em descrições genéricas.
 */
function formatShortDate(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

/**
 * Capitaliza a primeira letra de uma string.
 */
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Enriquece uma descrição genérica com contraparte ou data.
 *
 * Exemplos:
 *  polish("Recebimento", "João Silva") → "Recebimento de João Silva"
 *  polish("Pagamento", null) → "Pagamento - 11/04"
 *  polish("Conta de luz", null) → "Conta de luz"  (não é genérica, mantém)
 *  polish("compra", null) → "Compra - 11/04"
 */
export function polishDescription(
  description: string,
  counterparty: string | null | undefined,
  type: "receita" | "despesa",
  now: Date = new Date(),
): string {
  const trimmed = (description ?? "").trim();

  // Se a descrição já é boa (mais de 2 palavras ou não é genérica), mantém
  const isGeneric = GENERIC_DESCRIPTION_RE.test(trimmed);
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  if (!isGeneric && wordCount >= 2) {
    return capitalize(trimmed);
  }

  // Descrição genérica — tenta enriquecer
  if (counterparty && counterparty.trim()) {
    const preposition = type === "receita" ? "de" : "para";
    const base = isGeneric ? capitalize(trimmed) : (type === "receita" ? "Recebimento" : "Pagamento");
    return `${base} ${preposition} ${counterparty.trim()}`;
  }

  // Sem contraparte, usa data
  const base = isGeneric ? capitalize(trimmed) : capitalize(trimmed || (type === "receita" ? "Recebimento" : "Pagamento"));
  return `${base} - ${formatShortDate(now)}`;
}

export type ParseContext = {
  tenantType?: "pf" | "pj";
  pendingContext?: {
    type: "receita" | "despesa";
    description: string;
    amount: number; // centavos
    category: string | null;
  } | null;
};

export async function parseLancamento(
  text: string,
  categories: Category[],
  context: ParseContext = {},
): Promise<{ ok: true; data: AIParsedTransaction & { is_update_to_pending?: boolean } } | { ok: false; error: string }> {
  const categoryList = categories
    .map((c) => `${c.name} (${c.type})`)
    .join(", ");

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const tenantContext =
    context.tenantType === "pj"
      ? "Esta é uma conta de PESSOA JURÍDICA (empresa). Receitas tipicamente são vendas/serviços/notas fiscais. Despesas tipicamente são folha, aluguel, fornecedores, impostos."
      : context.tenantType === "pf"
        ? "Esta é uma conta de PESSOA FÍSICA (orçamento pessoal). Receitas tipicamente são salário/freelance/transferências. Despesas tipicamente são contas, alimentação, transporte, lazer."
        : "";

  const pendingContextText = context.pendingContext
    ? `\n\nLANÇAMENTO PENDENTE DO USUÁRIO (aguardando confirmação):\n` +
      `- Tipo: ${context.pendingContext.type}\n` +
      `- Descrição: ${context.pendingContext.description}\n` +
      `- Valor: R$ ${(context.pendingContext.amount / 100).toFixed(2)}\n` +
      `- Categoria: ${context.pendingContext.category ?? "(nenhuma)"}\n\n` +
      `Se a nova mensagem for um COMPLEMENTO desse lançamento (ex: usuário adicionando contraparte, ajustando valor, mudando categoria), retorne os dados ATUALIZADOS e adicione "is_update_to_pending": true.\n` +
      `Se for um LANÇAMENTO NOVO totalmente diferente, ignore o pendente e retorne normalmente (sem o campo is_update_to_pending).`
    : "";

  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Você é um assistente financeiro brasileiro. Extraia informações de lançamentos financeiros a partir do texto do usuário (que pode ser transcrição de áudio, com hesitações, repetições e palavras de preenchimento).

Hoje é ${today}.
${tenantContext ? `\n${tenantContext}\n` : ""}${pendingContextText}

Retorne APENAS um JSON válido com estes campos:
- type: "receita" ou "despesa"
- description: descrição CONCISA e INFORMATIVA do lançamento (ver regras abaixo)
- amount: valor em CENTAVOS (inteiro). Ex: R$ 150,00 = 15000, R$ 1.440 = 144000
- category_suggestion: nome da categoria mais provável da lista disponível
- counterparty: nome da pessoa/empresa envolvida (null se não mencionada)
- confidence: "high" | "medium" | "low"
- is_recurring: true se o usuário indicar que é recorrente ("todo mês", "fixo", "mensal", "semanal", "sempre"). false ou omitido caso contrário.
- day_of_month: dia do mês para recorrência (1-31). Obrigatório se is_recurring=true. Extrair do texto (ex: "dia 10", "todo dia 5"). Se não mencionado, usar o dia atual.

REGRAS PARA DESCRIPTION:
1. Se o usuário menciona "o quê" explicitamente (ex: "conta de luz", "salário", "jantar"), use isso como descrição.
2. Se menciona apenas pessoa/empresa (ex: "recebi do João", "paguei pra Maria"), use "Recebimento de João" / "Pagamento para Maria".
3. Se menciona só o valor sem contexto (ex: "recebi 1440", "gastei 50"), use descrição genérica como "Recebimento" ou "Pagamento" (o sistema vai enriquecer com data automaticamente).
4. NUNCA invente detalhes que não estão no texto. Prefira descrições curtas e verdadeiras a longas e inventadas.
5. Comece sempre com letra maiúscula.
6. Máximo 50 caracteres.

REGRAS PARA COUNTERPARTY:
- Extraia SOMENTE se explicitamente mencionado (ex: "do João Silva", "pra padaria", "Netflix").
- null se não houver menção clara.
- Capitalize nomes próprios.

REGRAS PARA CONFIDENCE:
- "high": texto claro, valor e tipo óbvios, contexto presente.
- "medium": valor claro mas contexto vago, ou tipo deduzível.
- "low": texto ambíguo, valor confuso, pode ser receita ou despesa.

REGRAS PARA CATEGORY_SUGGESTION:
- Escolha EXATAMENTE um nome da lista fornecida.
- Se nenhuma categoria se encaixa perfeitamente, escolha a mais próxima.

Categorias disponíveis: ${categoryList}

EXEMPLOS:
Input: "Paguei 150 reais de luz"
Output: {"type":"despesa","description":"Conta de luz","amount":15000,"category_suggestion":"Moradia","counterparty":null,"confidence":"high"}

Input: "Recebi 500 do cliente João"
Output: {"type":"receita","description":"Recebimento de João","amount":50000,"category_suggestion":"Vendas","counterparty":"João","confidence":"high"}

Input: "Então, é, recebi 1440 agora, olha que bênção"
Output: {"type":"receita","description":"Recebimento","amount":144000,"category_suggestion":"Outros","counterparty":null,"confidence":"medium"}

Input: "Gastei uns trocados no mercado"
Output: {"type":"despesa","description":"Compras no mercado","amount":0,"category_suggestion":"Alimentação","counterparty":null,"confidence":"low"}

Se o valor não for claro, retorne amount: 0 e confidence: "low".
Nunca invente valores que não estão no texto.`,
      },
      { role: "user", content: text },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { ok: false, error: "Resposta vazia da IA" };

  if (content.length > 2000) {
    console.error("AI response too large:", content.length, "chars");
    return { ok: false, error: "Resposta da IA excedeu o tamanho permitido" };
  }

  try {
    const json = JSON.parse(content);
    const parsed = aiParsedTransactionSchema.safeParse(json);
    if (!parsed.success) return { ok: false, error: "Formato inválido da IA" };

    // Pós-processamento: enriquecer descrição genérica
    const polishedDescription = polishDescription(
      parsed.data.description,
      parsed.data.counterparty ?? null,
      parsed.data.type,
    );

    return {
      ok: true,
      data: {
        ...parsed.data,
        description: polishedDescription,
        is_update_to_pending: (json as { is_update_to_pending?: boolean }).is_update_to_pending === true,
      },
    };
  } catch {
    return { ok: false, error: "JSON inválido da IA" };
  }
}
