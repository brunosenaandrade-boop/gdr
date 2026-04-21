import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { sendEmail } from "@/lib/email/resend";
import { AbandonedCartEmail } from "@/lib/email/templates/abandoned-cart";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.guardadinheiro.com.br";

/**
 * Cron diário: marca checkout_leads pendentes há > 24h como 'abandoned'
 * e envia 1 email de recuperação de carrinho.
 *
 * - Só processa leads criados entre 24h e 7 dias atrás (evita ressuscitar velhos)
 * - Só envia 1 email por lead (marcar como abandoned ANTES do envio, idempotente)
 * - Se falhar envio, lead já está abandoned — não reprocessa.
 */
export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const now = Date.now();
    const since = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const until = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
      .from("checkout_leads")
      .select("id, email, plan_type, has_bump")
      .eq("status", "pending")
      .gte("created_at", since)
      .lte("created_at", until)
      .limit(200);

    if (error) {
      console.error("[cron/abandoned-leads] query failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ status: "ok", processed: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      // Marca como abandoned ANTES de tentar enviar — evita double-send
      // se o cron rodar duas vezes ou falhar no meio.
      const { error: updateErr } = await supabase
        .from("checkout_leads")
        .update({ status: "abandoned" })
        .eq("id", lead.id)
        .eq("status", "pending");

      if (updateErr) {
        console.error(`[cron/abandoned-leads] failed to mark ${lead.id}:`, updateErr.message);
        failed++;
        continue;
      }

      try {
        const planType = lead.plan_type as "mensal" | "anual";
        await sendEmail({
          to: lead.email,
          subject: "Seu plano Guarda Dinheiro ainda está te esperando",
          react: AbandonedCartEmail({
            planType,
            hasBump: !!lead.has_bump,
            resumeUrl: `${SITE_URL}/planos?plan=${planType}${lead.has_bump ? "&bump=1" : ""}`,
          }),
          idempotencyKey: `abandoned-cart-${lead.id}`,
          tags: [{ name: "category", value: "abandoned-cart" }],
        });
        sent++;
      } catch (err) {
        console.error(`[cron/abandoned-leads] email failed for ${lead.email}:`, err);
        failed++;
      }
    }

    return NextResponse.json({ status: "ok", processed: leads.length, sent, failed });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/abandoned-leads] unexpected error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
