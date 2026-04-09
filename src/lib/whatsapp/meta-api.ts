const GRAPH_API = "https://graph.facebook.com/v21.0";

type SendMessageResult = { ok: true } | { ok: false; error: string };

export async function sendWhatsAppMessage(
  to: string,
  text: string,
): Promise<SendMessageResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: "WhatsApp API não configurada" };
  }

  const response = await fetch(
    `${GRAPH_API}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`Meta API error: ${response.status} - ${body}`);
    return { ok: false, error: "Falha ao enviar mensagem. Tente novamente." };
  }

  return { ok: true };
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) return null;

  // Step 1: Get media URL
  const metaRes = await fetch(`${GRAPH_API}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) return null;
  const { url } = await metaRes.json();

  // Step 2: Download media
  const mediaRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!mediaRes.ok) return null;
  const arrayBuffer = await mediaRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
