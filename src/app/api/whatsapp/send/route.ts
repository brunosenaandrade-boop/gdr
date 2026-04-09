import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { to, text } = body;

  if (!to || !text) {
    return NextResponse.json({ error: "Missing to or text" }, { status: 400 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .single();

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
