import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron rodando a cada 10 minutos. Para cada compromisso pendente com
 * scheduled_at entre now+25min e now+35min (e sem reminder_sent_at),
 * envia WhatsApp e marca o lembrete como enviado.
 *
 * Janela de 10 minutos garante que um compromisso sempre cai dentro da
 * janela de pelo menos uma execução, mesmo com drift do cron.
 */
export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000).toISOString();

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, tenant_id, title, scheduled_at, notes")
      .eq("status", "pendente")
      .is("reminder_sent_at", null)
      .gte("scheduled_at", windowStart)
      .lte("scheduled_at", windowEnd)
      .limit(100);

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        status: "ok",
        sent: 0,
        ranAt: new Date().toISOString(),
      });
    }

    // Buscar phones em batch
    const tenantIds = Array.from(new Set(appointments.map((a) => a.tenant_id)));
    const { data: links } = await supabase
      .from("whatsapp_links")
      .select("tenant_id, phone_number")
      .in("tenant_id", tenantIds)
      .eq("verified", true);

    const phoneByTenant = new Map<string, string>();
    for (const link of links ?? []) {
      phoneByTenant.set(link.tenant_id, link.phone_number);
    }

    let sent = 0;
    let failed = 0;

    for (const apt of appointments) {
      const phone = phoneByTenant.get(apt.tenant_id);
      if (!phone) continue;

      try {
        const { formatTimeBRT } = await import("@/lib/date/brt");
        const notesLine = apt.notes ? `\n📝 ${apt.notes}` : "";

        const message =
          `⏰ *Lembrete em 30 minutos!*\n\n` +
          `*${apt.title}*\n` +
          `🕐 ${formatTimeBRT(apt.scheduled_at)}${notesLine}`;

        const result = await sendWhatsAppMessage(phone, message);
        if (result.ok) {
          await supabase
            .from("appointments")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", apt.id);
          sent++;
        } else {
          failed++;
          console.error(`[cron/appointment-reminders] Falha no envio para ${apt.id}:`, result.error);
        }
      } catch (err) {
        failed++;
        console.error(`[cron/appointment-reminders] Erro para ${apt.id}:`, err);
      }
    }

    return NextResponse.json({
      status: "ok",
      total: appointments.length,
      sent,
      failed,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/appointment-reminders] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
