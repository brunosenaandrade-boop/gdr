import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

/**
 * Cron diário (09h UTC = 06h BRT):
 * 1. Assinaturas expirando em 7 dias → email de lembrete
 * 2. Assinaturas já expiradas (active mas vencida) → email de expiração
 */
export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowISO = now.toISOString();

    let expiringCount = 0;
    let expiredCount = 0;

    // 1. Assinaturas expirando em 7 dias (que ainda não receberam lembrete)
    const { data: expiring } = await supabase
      .from("subscriptions")
      .select("tenant_id, plan_type, current_period_end")
      .eq("status", "active")
      .is("renewal_link_sent_at", null)
      .lte("current_period_end", sevenDaysFromNow)
      .gt("current_period_end", nowISO);

    if (expiring && expiring.length > 0) {
      const { sendEmail } = await import("@/lib/email/resend");
      const { SubscriptionExpiringEmail } = await import("@/lib/email/templates/subscription-expiring");

      for (const sub of expiring) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name, user_id")
          .eq("id", sub.tenant_id)
          .maybeSingle();

        if (!tenant?.user_id || !sub.current_period_end) continue;

        const { data: authData } = await supabase.auth.admin.getUserById(tenant.user_id);
        const email = authData?.user?.email;
        if (!email) continue;

        const periodEnd = sub.current_period_end;
        const daysRemaining = Math.ceil(
          (new Date(periodEnd).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );

        await sendEmail({
          to: email,
          subject: `Sua assinatura expira em ${daysRemaining} dias - Guarda Dinheiro`,
          react: SubscriptionExpiringEmail({
            name: tenant.name,
            planType: (sub.plan_type ?? "mensal") as "mensal" | "anual",
            expiresAt: periodEnd,
            daysRemaining,
            renewalUrl: "https://www.guardadinheiro.com.br/planos",
          }),
          idempotencyKey: `sub-expiring-${sub.tenant_id}`,
          tags: [{ name: "category", value: "subscription-expiring" }],
        });

        // Marcar que o lembrete foi enviado
        await supabase
          .from("subscriptions")
          .update({ renewal_link_sent_at: nowISO })
          .eq("tenant_id", sub.tenant_id);

        expiringCount++;
      }
    }

    // 2. Assinaturas expiradas (active mas current_period_end < now)
    const { data: expired } = await supabase
      .from("subscriptions")
      .select("tenant_id, plan_type, current_period_end")
      .eq("status", "active")
      .lt("current_period_end", nowISO);

    if (expired && expired.length > 0) {
      const { sendEmail } = await import("@/lib/email/resend");
      const { SubscriptionExpiredEmail } = await import("@/lib/email/templates/subscription-expired");

      for (const sub of expired) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name, user_id")
          .eq("id", sub.tenant_id)
          .maybeSingle();

        if (!tenant?.user_id) continue;

        const { data: authData } = await supabase.auth.admin.getUserById(tenant.user_id);
        const email = authData?.user?.email;
        if (!email) continue;

        await sendEmail({
          to: email,
          subject: "Sua assinatura expirou - Guarda Dinheiro",
          react: SubscriptionExpiredEmail({
            name: tenant.name,
            reactivationUrl: "https://www.guardadinheiro.com.br/planos",
          }),
          idempotencyKey: `sub-expired-${sub.tenant_id}`,
          tags: [{ name: "category", value: "subscription-expired" }],
        });

        expiredCount++;
      }
    }

    return NextResponse.json({
      status: "ok",
      ranAt: nowISO,
      expiring_notified: expiringCount,
      expired_notified: expiredCount,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/subscription-expiring] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
