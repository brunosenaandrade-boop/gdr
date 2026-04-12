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
    try {
      const body = await response.text();
      console.error(`Meta API error: ${response.status} - ${body}`);
    } catch {
      console.error(`Meta API error: ${response.status} - (could not read body)`);
    }
    return { ok: false, error: "Falha ao enviar mensagem. Tente novamente." };
  }

  return { ok: true };
}

type InteractiveButton = { id: string; title: string };

/**
 * Envia mensagem com botões interativos via WhatsApp Business API.
 * Máximo 3 botões por mensagem.
 */
export async function sendWhatsAppButtons(
  to: string,
  body: string,
  buttons: InteractiveButton[],
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
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: body },
          action: {
            buttons: buttons.slice(0, 3).map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title },
            })),
          },
        },
      }),
    },
  );

  if (!response.ok) {
    try {
      const respBody = await response.text();
      console.error(`Meta API interactive error: ${response.status} - ${respBody}`);
    } catch {
      console.error(`Meta API interactive error: ${response.status}`);
    }
    return { ok: false, error: "Falha ao enviar botões." };
  }

  return { ok: true };
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!accessToken) return null;

    // Step 1: Get media URL
    const metaRes = await fetch(`${GRAPH_API}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!metaRes.ok) return null;

    let mediaUrl: string;
    try {
      const json = await metaRes.json();
      mediaUrl = json.url;
    } catch {
      console.error("Erro ao parsear resposta da Meta API (media URL)");
      return null;
    }

    if (!mediaUrl) return null;

    // Step 2: Download media
    const mediaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mediaRes.ok) return null;
    const arrayBuffer = await mediaRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Erro ao baixar mídia do WhatsApp:", err);
    return null;
  }
}
