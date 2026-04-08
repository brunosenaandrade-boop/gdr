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

  const result = await sendWhatsAppMessage(to, text);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ status: "sent" });
}
