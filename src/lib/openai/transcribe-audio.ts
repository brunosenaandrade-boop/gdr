import OpenAI from "openai";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = "audio.ogg",
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
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

    return { ok: true, text: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, error: `Falha na transcricao: ${message}` };
  }
}
