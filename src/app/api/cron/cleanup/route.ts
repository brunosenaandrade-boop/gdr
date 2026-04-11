import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  const supabase = await createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const results: Record<string, number> = {};

  try {
    // 1. whatsapp_pending expirados (não confirmados e passaram do expires_at)
    const pending = await supabase
      .from("whatsapp_pending")
      .delete()
      .lt("expires_at", nowIso)
      .select("id");
    if (pending.error) throw pending.error;
    results.whatsapp_pending_deleted = pending.data?.length ?? 0;

    // 2. whatsapp_message_log > 30 dias (log de idempotência não precisa mais)
    const log = await supabase
      .from("whatsapp_message_log")
      .delete()
      .lt("processed_at", thirtyDaysAgo)
      .select("message_id");
    if (log.error) throw log.error;
    results.whatsapp_message_log_deleted = log.data?.length ?? 0;

    // 3. whatsapp_links órfãos (códigos pendentes não verificados há mais de 10 min)
    const links = await supabase
      .from("whatsapp_links")
      .delete()
      .eq("verified", false)
      .lt("created_at", tenMinutesAgo)
      .select("id");
    if (links.error) throw links.error;
    results.whatsapp_links_orphan_deleted = links.data?.length ?? 0;

    // 4. whatsapp_conversation_log > 30 dias
    const convLog = await supabase
      .from("whatsapp_conversation_log")
      .delete()
      .lt("created_at", thirtyDaysAgo)
      .select("id");
    if (convLog.error) throw convLog.error;
    results.whatsapp_conversation_log_deleted = convLog.data?.length ?? 0;

    return NextResponse.json({ status: "ok", ranAt: nowIso, ...results });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/cleanup] failed:", err, results);
    return NextResponse.json(
      { error: "Cleanup failed", partial: results },
      { status: 500 },
    );
  }
}
