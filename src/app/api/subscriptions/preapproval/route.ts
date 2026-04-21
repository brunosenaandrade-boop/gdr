import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createPreApprovalPlan, type PlanType } from "@/lib/mercadopago/checkout";

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
 * POST /api/subscriptions/preapproval
 * Cria uma assinatura recorrente no Mercado Pago.
 *
 * Body: { plan: "mensal" | "anual", email: string, hasBump?: boolean }
 * Response: { url: string } — URL para redirecionar o cliente ao MP
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
    }

    const body = await request.json();
    const { plan, email, hasBump } = body;

    if (!plan || (plan !== "mensal" && plan !== "anual")) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Buscar tenantId se usuário estiver logado
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
      // não logado, ok
    }

    const result = await createPreApprovalPlan({
      tenantId,
      planType: plan as PlanType,
      email,
      hasBump: !!hasBump,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ url: result.url });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[preapproval] error:", err);
    return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 });
  }
}
