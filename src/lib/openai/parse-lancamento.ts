import OpenAI from "openai";
import { aiParsedTransactionSchema } from "@/lib/validators/schemas";
import type { AIParsedTransaction, Category } from "@/types";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function parseLancamento(
  text: string,
  categories: Category[],
): Promise<{ ok: true; data: AIParsedTransaction } | { ok: false; error: string }> {
  const categoryList = categories
    .map((c) => `${c.name} (${c.type})`)
    .join(", ");

  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Voce e um assistente financeiro brasileiro. Extraia informacoes de lancamentos financeiros do texto do usuario.

Retorne APENAS um JSON valido com estes campos:
- type: "receita" ou "despesa"
- description: descricao curta e clara do lancamento
- amount: valor em CENTAVOS (inteiro). Ex: R$ 150,00 = 15000
- category_suggestion: nome da categoria mais provavel da lista abaixo

Categorias disponiveis: ${categoryList}

Se o texto mencionar pagamento, compra, gasto, conta = despesa.
Se mencionar recebimento, venda, salario, ganho = receita.
Se o valor nao for claro, retorne amount: 0.
Nunca invente valores que nao estao no texto.`,
      },
      { role: "user", content: text },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { ok: false, error: "Resposta vazia da IA" };

  try {
    const json = JSON.parse(content);
    const parsed = aiParsedTransactionSchema.safeParse(json);
    if (!parsed.success) return { ok: false, error: "Formato invalido da IA" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "JSON invalido da IA" };
  }
}
