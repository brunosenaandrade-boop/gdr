import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";
import { logConversation } from "@/lib/whatsapp/conversation-log";
import type { Json } from "@/types/supabase";

const BUCKET = "bump-products";
const SIGNED_URL_EXPIRES = 60 * 60 * 24; // 24 horas

export type BumpFile = {
  storage_path?: string;
  external_url?: string;
  filename: string;
  size_bytes?: number;
};

/**
 * Gera link assinado de 24h para um arquivo (Storage ou URL externa).
 * Retorna null se o arquivo não pode ser acessado.
 */
async function generateFileLink(
  supabase: SupabaseClient,
  file: BumpFile,
): Promise<string | null> {
  // URL externa: retorna direto
  if (file.external_url) return file.external_url;

  // Storage: gera signed URL
  if (file.storage_path) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, SIGNED_URL_EXPIRES, {
        download: file.filename,
      });

    if (error) {
      console.error(`[bump-delivery] Erro gerando signed URL pra ${file.storage_path}:`, error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  }

  return null;
}

/**
 * Gera os links de download de um purchase_bumps e envia via WhatsApp
 * para o tenant que comprou. Atualiza delivery_status.
 */
export async function deliverBumpToCustomer(params: {
  purchaseBumpId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { purchaseBumpId } = params;
  const supabase = await createServiceClient();

  // Buscar dados do bump
  const { data: bump, error: bumpErr } = await supabase
    .from("purchase_bumps")
    .select("*, bump_products(files, name), tenants(name)")
    .eq("id", purchaseBumpId)
    .maybeSingle();

  if (bumpErr || !bump) {
    return { ok: false, error: "Bump não encontrado" };
  }

  const product = Array.isArray(bump.bump_products) ? bump.bump_products[0] : bump.bump_products;
  const tenant = Array.isArray(bump.tenants) ? bump.tenants[0] : bump.tenants;

  if (!product) {
    await markDeliveryFailed(supabase, purchaseBumpId, "product_not_found");
    return { ok: false, error: "Produto não encontrado" };
  }

  // Phone do cliente
  if (!bump.tenant_id) {
    await markDeliveryFailed(supabase, purchaseBumpId, "tenant_not_found");
    return { ok: false, error: "Tenant não encontrado" };
  }

  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("phone_number")
    .eq("tenant_id", bump.tenant_id)
    .eq("verified", true)
    .maybeSingle();

  if (!link?.phone_number) {
    await markDeliveryFailed(supabase, purchaseBumpId, "no_whatsapp");
    return { ok: false, error: "Cliente sem WhatsApp vinculado" };
  }

  // Parsear files
  const files = (product.files as unknown as BumpFile[]) ?? [];
  if (files.length === 0) {
    await markDeliveryFailed(supabase, purchaseBumpId, "no_files");
    return { ok: false, error: "Produto sem arquivos configurados" };
  }

  // Gerar links
  const fileLinks: Array<{ filename: string; url: string }> = [];
  for (const file of files) {
    const url = await generateFileLink(supabase, file);
    if (url) fileLinks.push({ filename: file.filename, url });
  }

  if (fileLinks.length === 0) {
    await markDeliveryFailed(supabase, purchaseBumpId, "signed_url_failed");
    return { ok: false, error: "Não foi possível gerar links de download" };
  }

  // Montar mensagem WhatsApp
  const customerName = tenant?.name?.split(" ")[0] ?? "";
  const hello = customerName ? `Olá, ${customerName}! ` : "Olá! ";

  const linksText = fileLinks
    .map((f, i) => `${i + 1}. *${f.filename}*\n${f.url}`)
    .join("\n\n");

  const message =
    `${hello}🎉\n\n` +
    `Obrigado pela compra do *${product.name}*!\n\n` +
    `Aqui estão seus arquivos para download:\n\n` +
    `${linksText}\n\n` +
    `⏰ *Os links expiram em 24 horas.* Baixe e salve tudo hoje mesmo!\n\n` +
    `Se precisar de novos links, responda esta mensagem com *"reenviar bônus"* que eu envio novamente.`;

  const result = await sendWhatsAppMessage(link.phone_number, message);
  if (!result.ok) {
    await markDeliveryFailed(supabase, purchaseBumpId, `whatsapp_failed: ${result.error}`);
    return { ok: false, error: result.error };
  }

  // Log
  await logConversation(supabase, {
    tenantId: bump.tenant_id,
    phoneNumber: link.phone_number,
    direction: "out",
    messageType: "text",
    content: `[bump delivery] ${product.name} → ${fileLinks.length} arquivo(s)`,
  });

  // Marcar como entregue
  await supabase
    .from("purchase_bumps")
    .update({
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", purchaseBumpId);

  return { ok: true };
}

/**
 * Reenviar links (usuário pediu via WhatsApp).
 * Gera novos signed URLs e envia.
 */
export async function resendBumpLinks(params: {
  tenantId: string;
}): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const supabase = await createServiceClient();

  // Buscar bumps entregues do tenant nos últimos 60 dias
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: bumps } = await supabase
    .from("purchase_bumps")
    .select("id")
    .eq("tenant_id", params.tenantId)
    .eq("delivery_status", "delivered")
    .gte("created_at", sixtyDaysAgo);

  if (!bumps || bumps.length === 0) {
    return { ok: false, error: "no_bumps" };
  }

  let count = 0;
  for (const bump of bumps) {
    const result = await deliverBumpToCustomer({ purchaseBumpId: bump.id });
    if (result.ok) {
      count++;
      await supabase
        .from("purchase_bumps")
        .update({
          resend_count: undefined, // incrementado via raw
          last_resend_at: new Date().toISOString(),
        })
        .eq("id", bump.id);
    }
  }

  return { ok: true, count };
}

async function markDeliveryFailed(
  supabase: SupabaseClient,
  bumpId: string,
  error: string,
): Promise<void> {
  await supabase
    .from("purchase_bumps")
    .update({
      delivery_status: "failed",
      delivery_error: error,
    })
    .eq("id", bumpId);
}

/**
 * Detecta produtos bump em um payload Hotmart.
 * Retorna lista de { hotmart_product_id, name, amount_cents }.
 *
 * Hotmart envia os bumps em campos variados dependendo da configuração.
 * Essa função é defensiva — tenta múltiplos caminhos.
 */
export function extractBumpsFromPayload(payload: unknown): Array<{
  hotmart_product_id: string;
  name: string;
  amount_cents: number;
}> {
  const data = payload as {
    data?: {
      product?: { id?: number | string; name?: string };
      products?: Array<{
        id?: number | string;
        product_id?: number | string;
        name?: string;
        price?: { value?: number };
        amount?: number;
      }>;
      order_bumps?: Array<{
        id?: number | string;
        name?: string;
        price?: { value?: number };
      }>;
    };
  };

  const mainProductId = String(data.data?.product?.id ?? "");
  const bumps: Array<{ hotmart_product_id: string; name: string; amount_cents: number }> = [];

  // Caminho 1: array 'products' com mais de 1 item (primeiro é o principal, resto é bump)
  if (Array.isArray(data.data?.products)) {
    for (const p of data.data.products) {
      const pid = String(p.id ?? p.product_id ?? "");
      if (!pid || pid === mainProductId) continue;
      const priceValue = p.price?.value ?? p.amount ?? 0;
      bumps.push({
        hotmart_product_id: pid,
        name: p.name ?? `Bump ${pid}`,
        amount_cents: Math.round(priceValue * 100),
      });
    }
  }

  // Caminho 2: array 'order_bumps' explícito
  if (Array.isArray(data.data?.order_bumps)) {
    for (const b of data.data.order_bumps) {
      const pid = String(b.id ?? "");
      if (!pid) continue;
      const priceValue = b.price?.value ?? 0;
      bumps.push({
        hotmart_product_id: pid,
        name: b.name ?? `Bump ${pid}`,
        amount_cents: Math.round(priceValue * 100),
      });
    }
  }

  return bumps;
}

/**
 * Registra bumps detectados no payload Hotmart.
 * Idempotente via (hotmart_transaction, hotmart_product_id).
 */
export async function registerBumpsFromPayload(params: {
  supabase: SupabaseClient;
  payload: unknown;
  subscriptionId: string | null;
  tenantId: string;
  hotmartTransaction: string | null;
  eventId: string | null;
}): Promise<string[]> {
  const { supabase, payload, subscriptionId, tenantId, hotmartTransaction, eventId } = params;

  const bumpsInPayload = extractBumpsFromPayload(payload);
  if (bumpsInPayload.length === 0) return [];

  const createdBumpIds: string[] = [];

  for (const bump of bumpsInPayload) {
    // Buscar produto cadastrado com esse hotmart_product_id
    const { data: product } = await supabase
      .from("bump_products")
      .select("id, name, amount_cents, files")
      .eq("hotmart_product_id", bump.hotmart_product_id)
      .eq("active", true)
      .maybeSingle();

    // Se não tem produto cadastrado, ainda registra o bump (admin precisa cadastrar depois)
    const bumpName = product?.name ?? bump.name;
    const amountCents = product?.amount_cents ?? bump.amount_cents;

    const { data: inserted, error } = await supabase
      .from("purchase_bumps")
      .insert({
        subscription_id: subscriptionId,
        tenant_id: tenantId,
        bump_product_id: product?.id ?? null,
        hotmart_product_id: bump.hotmart_product_id,
        bump_name: bumpName,
        amount_cents: amountCents,
        hotmart_transaction: hotmartTransaction,
        hotmart_event_id: eventId,
        delivery_status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // Code 23505 = duplicate (idempotência OK)
      if (error.code !== "23505") {
        console.error(`[bump] Erro registrando bump ${bump.hotmart_product_id}:`, error.message);
      }
      continue;
    }

    if (inserted?.id && product) {
      createdBumpIds.push(inserted.id);
    }
  }

  return createdBumpIds;
}

export { BUCKET as BUMP_BUCKET };
