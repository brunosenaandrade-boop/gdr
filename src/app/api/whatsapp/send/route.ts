import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

// Rate limiter: max 10 req/min por user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "Muitas mensagens. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { to, text } = body as { to?: string; text?: string };

  if (!to || !text) {
    return NextResponse.json({ error: "Missing to or text" }, { status: 400 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 403 });
  }

  const { data: whatsappLink } = await supabase
    .from("whatsapp_links")
    .select("phone_number")
    .eq("tenant_id", tenant.id)
    .eq("phone_number", to)
    .eq("verified", true)
    .maybeSingle();

  if (!whatsappLink) {
    return NextResponse.json({ error: "Phone number not linked to your account" }, { status: 403 });
  }

  const result = await sendWhatsAppMessage(to, text);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ status: "sent" });
}
