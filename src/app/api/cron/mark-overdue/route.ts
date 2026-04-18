import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const { todayBRT } = await import("@/lib/date/brt");
    const today = todayBRT();

    const { data, error } = await supabase
      .from("transactions")
      .update({
        status: "atrasado",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pendente")
      .lt("due_date", today)
      .select("id");

    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      updated: data?.length ?? 0,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/mark-overdue] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
