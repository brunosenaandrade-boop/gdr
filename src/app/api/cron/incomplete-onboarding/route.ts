import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diário (10h UTC = 07h BRT):
 * Lembra clientes que cadastraram via WhatsApp mas não completaram
 * PF/PJ + documento no painel. Envia apenas 1 lembrete por tenant.
 */
export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Buscar tenants incompletos há > 24h (type OU document null)
    const { data: incomplete } = await supabase
      .from("tenants")
      .select("id, name")
      .or("type.is.null,document.is.null")
      .lte("created_at", yesterday)
      .limit(100);

    if (!incomplete || incomplete.length === 0) {
      return NextResponse.json({ status: "ok", reminded: 0 });
    }

    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/meta-api");
    let reminded = 0;

    for (const tenant of incomplete) {
      // Buscar phone vinculado
      const { data: link } = await supabase
        .from("whatsapp_links")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("phone_number, reminder_sent_at" as any)
        .eq("tenant_id", tenant.id)
        .eq("verified", true)
        .maybeSingle() as { data: { phone_number?: string; reminder_sent_at?: string | null } | null };

      if (!link?.phone_number) continue;
      if (link.reminder_sent_at) continue;

      await sendWhatsAppMessage(
        link.phone_number,
        `Oi ${tenant.name}! 👋\n\n` +
        `Percebi que seu cadastro ainda está incompleto. Falta você informar se é *Pessoa Física* ou *Pessoa Jurídica* (CPF ou CNPJ).\n\n` +
        `É rápido — só 30 segundos no painel:\n` +
        `guardadinheiro.com.br/dashboard\n\n` +
        `Depois disso, a IA adapta as categorias e você pode começar a lançar seus gastos. 💚`,
      );

      // Marcar lembrete enviado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("whatsapp_links") as any)
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("tenant_id", tenant.id);

      reminded++;
    }

    return NextResponse.json({ status: "ok", reminded });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/incomplete-onboarding] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
