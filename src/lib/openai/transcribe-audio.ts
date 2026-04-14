import OpenAI from "openai";
import { logAIUsage } from "./usage-tracker";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type TranscribeOptions = {
  tenantId?: string | null;
};

export async function transcribeAudio(
  audioBuffer: Buffer,
  filenameOrOptions: string | TranscribeOptions = "audio.ogg",
  opts: TranscribeOptions = {},
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  // Backwards-compat: aceita filename string (uso atual) ou options
  const filename = typeof filenameOrOptions === "string" ? filenameOrOptions : "audio.ogg";
  const options = typeof filenameOrOptions === "string" ? opts : filenameOrOptions;

  try {
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });
    const file = new File([blob], filename, { type: "audio/ogg" });

    const openai = getClient();
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "pt",
      response_format: "text",
    });

    const text = typeof transcription === "string" ? transcription : String(transcription);
    if (!text.trim()) return { ok: false, error: "Transcricao vazia" };

    // Estima duração pelo tamanho do buffer (aproximação: OGG Opus ~ 16 KB/s)
    const estimatedSeconds = Math.max(1, Math.round(audioBuffer.length / 16_000));
    logAIUsage({
      tenantId: options.tenantId ?? null,
      model: "whisper-1",
      functionName: "transcribe-audio",
      audioSeconds: estimatedSeconds,
    }).catch(() => {});

    return { ok: true, text: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, error: `Falha na transcricao: ${message}` };
  }
}
