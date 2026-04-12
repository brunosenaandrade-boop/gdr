import OpenAI from "openai";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ===== Tipos de ação que a persona pode responder =====

type TransactionData = {
  type: "receita" | "despesa";
  description: string;
  amount: number; // centavos
  category: string;
  recurring?: string | null; // ex: "todo dia 10 de cada mês"
};

type ResponseAction =
  | { action: "transaction_registered"; data: TransactionData }
  | { action: "transaction_pending"; data: TransactionData; lowConfidence?: boolean }
  | { action: "transaction_confirmed"; data: TransactionData }
  | { action: "transaction_updated"; data: TransactionData }
  | { action: "query_response"; query: string; data: string }
  | { action: "welcome"; userName?: string };

const DASHBOARD_URL = "https://www.guardadinheiro.com.br/dashboard";

// ===== Persona system prompt =====

const PERSONA_PROMPT = `Você é o assistente financeiro do Guarda Dinheiro, falando via WhatsApp.

PERSONALIDADE:
- Amigável e direto, como um amigo que entende de finanças
- Use linguagem informal brasileira natural (mas nunca vulgar)
- Use emojis com moderação (1-2 por mensagem, nunca mais que 3)
- Varie suas aberturas — nunca repita a mesma frase duas vezes seguidas
- Pode fazer comentários leves e contextuais sobre o lançamento quando natural (ex: se é café, faça um comentário sobre café; se é conta de luz, comente algo sobre)

REGRAS RÍGIDAS:
- NUNCA invente dados que não foram fornecidos
- NUNCA dê conselhos financeiros não solicitados
- NUNCA use gírias forçadas ou exagere na informalidade
- Mantenha os dados numéricos EXATAMENTE como fornecidos
- Responda APENAS o texto da mensagem, sem JSON
- Gere SOMENTE a parte conversacional (o "comentário"). O bloco de dados estruturado será adicionado automaticamente pelo sistema — NÃO inclua lista de dados, resumo, nem repita os valores na sua resposta.

FORMATO DA SUA RESPOSTA:
Escreva APENAS 1-2 frases de comentário contextual/personalizado sobre a ação. Máximo 150 caracteres. Nada mais.

EXEMPLOS DE RESPOSTAS BOAS:
- "Café registrado! Nada como uma dose de energia pra começar o dia ☕"
- "Conta de luz anotada! Pelo menos agora tá tudo no controle 💡"
- "Salário na conta, bora! 💪"
- "Atualizei aqui, dá uma conferida nos dados 👇"
- "Confirmado! Tá tudo certo no seu controle ✅"

EXEMPLOS DE RESPOSTAS RUINS (NÃO FAÇA):
- "Lançamento registrado! ✅ DESPESA: Café R$ 2,00 Categoria: Alimentação" (repetiu os dados)
- "Muito bem! Registrei seu café. O valor é R$ 2,00 na categoria Alimentação." (repetiu os dados)`;

// ===== Bloco de dados estruturado (sempre o mesmo formato visual) =====

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function buildDataBlock(d: TransactionData): string {
  const tipoLabel = d.type === "receita" ? "Receita" : "Despesa";
  return (
    `📋 *Resumo do registro*\n\n` +
    `Descrição: ${d.description}\n` +
    `Valor: ${formatCurrency(d.amount)}\n` +
    `Categoria: ${d.category}\n` +
    `Data: ${todayFormatted()}\n` +
    `Tipo: ${tipoLabel}\n` +
    `Status: pago` +
    (d.recurring ? `\n🔄 ${d.recurring}` : "")
  );
}

function buildPendingDataBlock(d: TransactionData): string {
  const tipoLabel = d.type === "receita" ? "Receita" : "Despesa";
  return (
    `📋 *Dados do lançamento*\n\n` +
    `Descrição: ${d.description}\n` +
    `Valor: ${formatCurrency(d.amount)}\n` +
    `Categoria: ${d.category}\n` +
    `Tipo: ${tipoLabel}` +
    (d.recurring ? `\n🔄 ${d.recurring}` : "")
  );
}

function buildFooter(): string {
  return `\n\n📊 Para mais detalhes e relatórios, acesse o painel:\n${DASHBOARD_URL}`;
}

// ===== Templates de fallback (quando a API falha) =====

function fallbackComment(input: ResponseAction): string {
  switch (input.action) {
    case "transaction_registered":
      return "Lançamento registrado com sucesso! ✅";
    case "transaction_pending":
      return input.lowConfidence
        ? "Hmm, não tenho certeza se entendi tudo. Confira os dados abaixo 👇"
        : "Entendi! Dá uma olhada se tá tudo certo 👇";
    case "transaction_confirmed":
      return "Lançamento confirmado! ✅";
    case "transaction_updated":
      return "Atualizei o lançamento! Confira 👇";
    case "query_response":
      return "";
    case "welcome":
      return "";
  }
}

function fallbackResponse(input: ResponseAction): string {
  switch (input.action) {
    case "transaction_registered": {
      const comment = fallbackComment(input);
      return comment + "\n\n" + buildDataBlock(input.data) + buildFooter();
    }
    case "transaction_pending": {
      const comment = fallbackComment(input);
      return comment + "\n\n" + buildPendingDataBlock(input.data) + "\n\nConfirma? (Sim/Não)";
    }
    case "transaction_confirmed": {
      const comment = fallbackComment(input);
      return comment + "\n\n" + buildDataBlock(input.data) + buildFooter();
    }
    case "transaction_updated": {
      const comment = fallbackComment(input);
      return comment + "\n\n" + buildPendingDataBlock(input.data) + "\n\nConfirma? (Sim/Não)";
    }
    case "query_response":
      return input.data;
    case "welcome":
      return (
        "Número vinculado com sucesso! 🎉\n\n" +
        "Agora você pode lançar receitas e despesas por aqui.\n\n" +
        'Exemplo:\n• "Paguei 150 de luz"\n• "Recebi 500 do cliente João"\n\n' +
        "Ou envie um áudio dizendo o lançamento."
      );
  }
}

// ===== Gerador de resposta com persona =====

function buildUserPrompt(input: ResponseAction): string {
  switch (input.action) {
    case "transaction_registered":
      return (
        `O usuário registrou: ${input.data.description} (${input.data.type}) de ${formatCurrency(input.data.amount)}, categoria ${input.data.category}.` +
        `\n\nGere APENAS o comentário curto e contextual. Os dados estruturados serão adicionados automaticamente.`
      );

    case "transaction_pending":
      return (
        `O usuário quer lançar: ${input.data.description} (${input.data.type}) de ${formatCurrency(input.data.amount)}, categoria ${input.data.category}. Preciso da confirmação dele.` +
        (input.lowConfidence ? ` A confiança na interpretação é BAIXA — peça pra ele conferir.` : "") +
        `\n\nGere APENAS o comentário curto. Os dados e o "Confirma? (Sim/Não)" serão adicionados automaticamente.`
      );

    case "transaction_confirmed":
      return (
        `O usuário confirmou o lançamento: ${input.data.description} (${input.data.type}) de ${formatCurrency(input.data.amount)}.` +
        `\n\nGere APENAS o comentário curto de confirmação positiva.`
      );

    case "transaction_updated":
      return (
        `O usuário pediu para alterar um lançamento. Dados atualizados: ${input.data.description} (${input.data.type}) de ${formatCurrency(input.data.amount)}, categoria ${input.data.category}.` +
        `\n\nGere APENAS o comentário curto. Os dados e "Confirma?" serão adicionados automaticamente.`
      );

    case "query_response":
      return (
        `O usuário perguntou: "${input.query}"\n\n` +
        `Dados reais do banco:\n${input.data}\n\n` +
        `Reformule essa resposta com personalidade, mantendo TODOS os números exatos. Pode adicionar um breve comentário/insight se for óbvio dos dados. Neste caso, inclua os dados na resposta pois não há bloco automático.`
      );

    case "welcome":
      return (
        `O usuário acabou de vincular seu número com sucesso. Dê boas-vindas, explique brevemente o que ele pode fazer (lançar receitas/despesas por texto ou áudio) e dê 2 exemplos de uso.` +
        (input.userName ? `\nNome do usuário: ${input.userName}` : "")
      );
  }
}

/**
 * Monta a resposta final: comentário da IA + bloco de dados estruturado + footer.
 * Para queries e welcome, a IA gera a resposta completa.
 */
function assembleResponse(comment: string, input: ResponseAction): string {
  switch (input.action) {
    case "transaction_registered":
      return comment + "\n\n" + buildDataBlock(input.data) + buildFooter();

    case "transaction_pending":
      return comment + "\n\n" + buildPendingDataBlock(input.data) + "\n\nConfirma? (Sim/Não)";

    case "transaction_confirmed":
      return comment + "\n\n" + buildDataBlock(input.data) + buildFooter();

    case "transaction_updated":
      return comment + "\n\n" + buildPendingDataBlock(input.data) + "\n\nConfirma? (Sim/Não)";

    case "query_response":
    case "welcome":
      return comment; // IA gera a resposta completa
  }
}

export async function generateResponse(input: ResponseAction): Promise<string> {
  const fallback = fallbackResponse(input);

  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        { role: "system", content: PERSONA_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content || content.length < 5) return fallback;

    // Para queries e welcome, a IA gera tudo
    if (input.action === "query_response" || input.action === "welcome") {
      return content.length > 1000 ? fallback : content;
    }

    // Para transações, montar: comentário IA + bloco estruturado
    // Limitar comentário a 200 chars para manter conciso
    const comment = content.length > 200 ? content.slice(0, 200) : content;
    return assembleResponse(comment, input);
  } catch (err) {
    console.error("generateResponse failed, using fallback:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export type { ResponseAction, TransactionData };
