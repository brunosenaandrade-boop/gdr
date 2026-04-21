import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago/checkout";
import { recordCheckoutLead } from "@/lib/leads/leads";

export const dynamic = "force-dynamic";

// Rate limiter: max 5 req/min por IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

/**
 * POST /api/subscriptions/checkout-pro
 * Cria preferência de pagamento ÚNICO via Mercado Pago Checkout Pro.
 * Aceita PIX, cartão à vista e parcelamento até 12x.
 *
 * Diferente de /api/subscriptions/preapproval (assinatura recorrente):
 * - NÃO renova automaticamente — cliente paga 1x e ganha 365 dias
 * - Cron subscription-expiring avisa 30 dias antes do vencimento
 * - Disponível só pro plano anual
 *
 * Body: { plan: "anual", email: string, hasBump?: boolean }
 * Response: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
    }

    const body = await request.json();
    const { plan, email, hasBump } = body;

    if (plan !== "anual") {
      return NextResponse.json(
        { error: "Checkout Pro só disponível pro plano anual" },
        { status: 400 },
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    let tenantId: string | undefined;
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        tenantId = tenant?.id;
      }
    } catch {
      // não logado, segue sem tenantId
    }

    const result = await createCheckoutPreference({
      tenantId,
      planType: "anual",
      email,
      hasBump: !!hasBump,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Captura lead ANTES do redirect pro MP. Webhook marca como completed
    // quando o pagamento for aprovado.
    await recordCheckoutLead({
      email,
      planType: "anual",
      paymentMethod: "one-time",
      hasBump: !!hasBump,
      tenantId: tenantId ?? null,
      externalReference: result.externalReference,
      mpPreferenceId: result.preferenceId,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[checkout-pro] error:", err);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}
