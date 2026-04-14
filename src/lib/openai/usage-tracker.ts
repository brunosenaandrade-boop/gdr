import { createServiceClient } from "@/lib/supabase/server";

// Custos por 1M tokens em USD, convertidos para centavos de BRL (1 USD ≈ 5 BRL)
const COST_PER_MILLION_BRL_CENTS = {
  "gpt-4o-mini": { input: 7.5, output: 30 },    // $0.15/1M in, $0.60/1M out
  "gpt-4o": { input: 125, output: 500 },        // $2.50/1M in, $10/1M out
} as const;

// Whisper: $0.006/minuto = ~R$ 0.03/min = 3 centavos/min → 0.05 centavos/segundo
const WHISPER_CENTS_PER_SECOND = 0.05;

export type LogAIUsageParams = {
  tenantId: string | null;
  model: string;
  functionName: "parse-lancamento" | "transcribe-audio" | "generate-response" | "detect-intent" | "parse-appointment";
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
};

/**
 * Calcula custo estimado em centavos de BRL.
 */
export function estimateCostCents(params: LogAIUsageParams): number {
  const { model, inputTokens = 0, outputTokens = 0, audioSeconds = 0 } = params;

  if (model.startsWith("whisper")) {
    return Math.ceil(audioSeconds * WHISPER_CENTS_PER_SECOND);
  }

  const rates = COST_PER_MILLION_BRL_CENTS[model as keyof typeof COST_PER_MILLION_BRL_CENTS];
  if (!rates) return 0;

  const inputCost = (inputTokens * rates.input) / 1_000_000;
  const outputCost = (outputTokens * rates.output) / 1_000_000;
  return Math.ceil(inputCost + outputCost);
}

/**
 * Loga uma chamada de IA no banco para tracking de custo por tenant.
 * Nunca falha — erros são apenas logados no console.
 */
export async function logAIUsage(params: LogAIUsageParams): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const cost = estimateCostCents(params);

    await supabase.from("ai_usage").insert({
      tenant_id: params.tenantId,
      model: params.model,
      function_name: params.functionName,
      input_tokens: params.inputTokens ?? 0,
      output_tokens: params.outputTokens ?? 0,
      audio_seconds: params.audioSeconds ?? 0,
      estimated_cost_cents: cost,
    });
  } catch (err) {
    console.error("[ai-usage] Falha ao logar uso:", err);
  }
}
