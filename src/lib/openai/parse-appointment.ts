import OpenAI from "openai";
import { z } from "zod";
import { logAIUsage } from "./usage-tracker";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const appointmentSchema = z.object({
  title: z.string().min(2).max(120),
  scheduled_at: z.string(), // ISO 8601 em BRT
  notes: z.string().nullable().optional(),
});

export type ParsedAppointment = z.infer<typeof appointmentSchema>;

export type ParseAppointmentContext = {
  tenantId?: string | null;
  now?: Date;
};

/**
 * Formata uma Date como ISO com offset BRT (-03:00).
 * BRT é fixo sem horário de verão desde 2019.
 */
function toBrtISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${mi}:00-03:00`;
}

export async function parseAppointment(
  text: string,
  context: ParseAppointmentContext = {},
): Promise<{ ok: true; data: ParsedAppointment } | { ok: false; error: string }> {
  const now = context.now ?? new Date();

  const todayBRT = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  const nowISO = toBrtISO(now);

  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Você é um assistente de agenda brasileiro. Extraia informações de compromissos a partir do texto do usuário (pode vir de áudio transcrito).

Contexto temporal:
- Hoje é ${todayBRT}
- Agora (BRT): ${nowISO}
- Fuso horário: America/Sao_Paulo (UTC-3)

Retorne APENAS JSON válido com:
- title: string curto descrevendo o compromisso (ex: "Médico", "Reunião com João", "Aniversário da Ana"). Máximo 80 caracteres. Capitalize a primeira letra.
- scheduled_at: data/hora em ISO 8601 com offset -03:00 (ex: "2026-04-16T16:00:00-03:00")
- notes: observações adicionais se relevantes (null se não houver)

REGRAS CRÍTICAS para scheduled_at:
1. SEMPRE use offset -03:00 no final
2. Se o usuário disser "amanhã às 16h", calcule a data de amanhã + hora 16:00
3. Se disser "quarta-feira às 10h", calcule a próxima quarta-feira
4. Se não mencionar horário mas mencionar dia, use 09:00 como padrão
5. Se não mencionar data, assuma hoje (se horário ainda não passou) ou amanhã
6. "meio-dia" = 12:00, "meia-noite" = 00:00
7. "14h" ou "14 horas" = 14:00
8. "14h30" ou "14:30" = 14:30
9. Se o usuário disser só "às 3h" e for de manhã, use 03:00 AM. Se contexto indicar tarde ("de tarde", "à tarde"), use 15:00
10. NUNCA invente datas no passado — se ficar ambíguo, use próxima ocorrência futura
11. "daqui a 30 minutos" = agora + 30 minutos. "daqui a 1 hora" = agora + 1 hora. "daqui a pouco" = agora + 30 minutos (padrão)
12. "em 2 horas" = agora + 2 horas. "em 15 minutos" = agora + 15 minutos
13. "à tarde" sem hora = 14:00. "à noite" sem hora = 19:00. "de manhã" sem hora = 09:00

REGRAS para title:
- Extraia o assunto do compromisso, não o dia/hora
- "Tenho médico amanhã às 16h" → title: "Médico"
- "Reunião com João quarta-feira" → title: "Reunião com João"
- "Aniversário da Ana no sábado" → title: "Aniversário da Ana"
- Capitalize adequadamente nomes próprios

REGRAS para notes:
- Somente se houver informação adicional relevante (local, motivo específico)
- "Médico no Hospital São Lucas amanhã" → notes: "Hospital São Lucas"
- Se for só o assunto, use null

EXEMPLOS:
Input: "Tenho médico amanhã às 16 horas"
Output: {"title":"Médico","scheduled_at":"${toBrtISO(new Date(now.getTime() + 24 * 60 * 60 * 1000)).replace(/T\d{2}:\d{2}:00/, "T16:00:00")}","notes":null}

Input: "Marca reunião com o Carlos sexta às 10h"
Output: {"title":"Reunião com Carlos","scheduled_at":"<próxima sexta às 10:00>","notes":null}

Input: "Lembra que tenho aniversário da minha mãe dia 20"
Output: {"title":"Aniversário da minha mãe","scheduled_at":"<dia 20 do mês atual ou próximo às 09:00>","notes":null}

Se não conseguir extrair data válida, retorne {"title":"","scheduled_at":"","notes":null} — o sistema vai pedir clarificação.`,
      },
      { role: "user", content: text },
    ],
  });

  logAIUsage({
    tenantId: context.tenantId ?? null,
    model: "gpt-4o-mini",
    functionName: "parse-appointment",
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  }).catch(() => {});

  const content = response.choices[0]?.message?.content;
  if (!content) return { ok: false, error: "Resposta vazia da IA" };

  try {
    const json = JSON.parse(content);
    const parsed = appointmentSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: "Formato inválido da IA" };
    }

    // Validar que scheduled_at é uma data futura válida
    const scheduledDate = new Date(parsed.data.scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return { ok: false, error: "Data inválida" };
    }

    // Não aceitar datas no passado (mais que 5 minutos atrás, pra margem de processamento)
    if (scheduledDate.getTime() < now.getTime() - 5 * 60 * 1000) {
      return { ok: false, error: "Data no passado" };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "JSON inválido da IA" };
  }
}
