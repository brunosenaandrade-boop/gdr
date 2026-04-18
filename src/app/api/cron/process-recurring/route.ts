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
    const { getDayOfMonthBRT } = await import("@/lib/date/brt");
    const today = getDayOfMonthBRT(); // Dia do mês em BRT (1-31)

    // Buscar recorrências ativas para hoje
    const { data: recurrences, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("active", true)
      .eq("day_of_month", today);

    if (error) throw error;
    if (!recurrences || recurrences.length === 0) {
      return NextResponse.json({ status: "ok", created: 0 });
    }

    let created = 0;
    const todayDate = new Date().toISOString().split("T")[0];

    for (const rec of recurrences) {
      // Verificar se já foi criada hoje (dedup)
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("tenant_id", rec.tenant_id)
        .eq("description", rec.description)
        .eq("amount", rec.amount)
        .eq("due_date", todayDate)
        .maybeSingle();

      if (existing) continue; // Já existe, pular

      const { error: insertError } = await supabase.from("transactions").insert({
        tenant_id: rec.tenant_id,
        type: rec.type,
        description: rec.description,
        amount: rec.amount,
        category_id: rec.category_id,
        status: "pendente",
        due_date: todayDate,
        source: rec.source ?? "web",
      });

      if (insertError) {
        console.error(`[cron/recurring] Erro ao criar transação para ${rec.id}:`, insertError.message);
        continue;
      }
      created++;
    }

    return NextResponse.json({
      status: "ok",
      processed: recurrences.length,
      created,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/process-recurring] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
