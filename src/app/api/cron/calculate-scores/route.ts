import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";
import { calculateTenantScore } from "@/lib/score/calculate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron semanal (domingo 09h BRT = 12h UTC). Para cada tenant com subscription
 * ativa e WhatsApp vinculado, calcula o score e envia notificação com a
 * variação vs. semana anterior.
 */
export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();

    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("tenant_id")
      .in("status", ["active", "canceled"])
      .gt("current_period_end", new Date().toISOString());

    const tenantIds = Array.from(new Set((activeSubs ?? []).map((s) => s.tenant_id)));

    if (tenantIds.length === 0) {
      return NextResponse.json({ status: "ok", calculated: 0, ranAt: new Date().toISOString() });
    }

    const { data: links } = await supabase
      .from("whatsapp_links")
      .select("tenant_id, phone_number")
      .in("tenant_id", tenantIds)
      .eq("verified", true);

    const phoneByTenant = new Map<string, string>();
    for (const link of links ?? []) phoneByTenant.set(link.tenant_id, link.phone_number);

    let calculated = 0;
    let notified = 0;
    let failed = 0;

    for (const tenantId of tenantIds) {
      try {
        const { data: previousRow } = await supabase
          .from("financial_scores")
          .select("score")
          .eq("tenant_id", tenantId)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const result = await calculateTenantScore(supabase, tenantId);

        await supabase
          .from("financial_scores")
          .insert({ tenant_id: tenantId, score: result.score, breakdown: result.breakdown });

        calculated++;

        const phone = phoneByTenant.get(tenantId);
        if (!phone) continue;

        const previous = previousRow?.score;
        const message = buildNotificationMessage(result.score, result.emoji, result.label, previous);
        if (!message) continue;

        const send = await sendWhatsAppMessage(phone, message);
        if (send.ok) notified++;
        else failed++;
      } catch (err) {
        failed++;
        Sentry.captureException(err);
        console.error(`[cron/calculate-scores] erro para tenant ${tenantId}:`, err);
      }
    }

    return NextResponse.json({
      status: "ok",
      calculated,
      notified,
      failed,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/calculate-scores] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

function buildNotificationMessage(
  score: number,
  emoji: string,
  label: string,
  previous?: number,
): string | null {
  if (previous === undefined) {
    return (
      `${emoji} *Seu Score Financeiro: ${score}*\n\n` +
      `Faixa: ${label}\n\n` +
      `Continue lançando receitas e despesas pra seu score refletir melhor sua realidade financeira.\n\n` +
      `Veja detalhes em: https://www.guardadinheiro.com.br/dashboard`
    );
  }

  const delta = score - previous;
  if (delta === 0) {
    return (
      `${emoji} *Score Financeiro: ${score}* (estável)\n\n` +
      `Faixa: ${label}\n\n` +
      `Mantenha a constância pra evoluir na próxima semana.`
    );
  }

  const arrow = delta > 0 ? "📈" : "📉";
  const sign = delta > 0 ? "+" : "";

  return (
    `${arrow} *Score Financeiro: ${score}* (${sign}${delta})\n\n` +
    `Faixa: ${label} ${emoji}\n` +
    `Semana passada: ${previous}\n\n` +
    (delta > 0
      ? `Continue nesse ritmo!`
      : `Confere o detalhamento em: https://www.guardadinheiro.com.br/dashboard`)
  );
}
