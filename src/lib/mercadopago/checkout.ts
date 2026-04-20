/**
 * Mercado Pago Checkout — cria preferência de pagamento.
 * Suporta PIX, cartão e boleto. Redireciona pro ambiente MP.
 */
import { getPreference } from "./client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.guardadinheiro.com.br";

export type PlanType = "mensal" | "anual";

const PLANS = {
  mensal: { price: 49.9, title: "Guarda Dinheiro — Plano Mensal", days: 30 },
  anual: { price: 358.8, title: "Guarda Dinheiro — Plano Anual (12x R$ 29,90)", days: 365 },
} as const;

export function getPlanDetails(planType: PlanType) {
  return PLANS[planType];
}

export async function createCheckoutPreference(opts: {
  tenantId?: string;
  planType: PlanType;
  email?: string;
  name?: string;
  couponCode?: string;
}): Promise<{ ok: true; url: string; preferenceId: string } | { ok: false; error: string }> {
  try {
    const plan = PLANS[opts.planType];

    // external_reference identifica a compra no nosso sistema
    const externalRef = [
      opts.tenantId ?? "none",
      opts.planType,
      opts.couponCode ?? "none",
      String(Date.now()),
    ].join("__");

    const preference = getPreference();

    const result = await preference.create({
      body: {
        items: [
          {
            id: opts.planType,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "BRL",
          },
        ],
        external_reference: externalRef,
        back_urls: {
          success: `${SITE_URL}/compra-concluida`,
          failure: `${SITE_URL}/planos`,
          pending: `${SITE_URL}/compra-concluida`,
        },
        auto_return: "approved",
        notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
        payer: {
          ...(opts.email ? { email: opts.email } : {}),
          ...(opts.name ? { name: opts.name } : {}),
        },
        payment_methods: {
          installments: opts.planType === "anual" ? 12 : 1,
        },
      },
    });

    const url = result.init_point;
    if (!url) {
      return { ok: false, error: "Mercado Pago não retornou URL de checkout" };
    }

    return { ok: true, url, preferenceId: result.id! };
  } catch (err) {
    console.error("[mercadopago] Erro ao criar preferência:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

/**
 * Parseia o external_reference que nós criamos.
 * Formato: tenantId__planType__couponOrBump__timestamp
 * Separador: "__" (double underscore) para evitar conflito com IDs que contêm "_"
 *
 * Exemplos:
 * - "uuid__mensal__none__1713456000" → plano mensal, sem bump/cupom
 * - "none__anual__BUMP__1713456000" → plano anual com bump, sem login
 * - "uuid__anual__CUPOM10__1713456000" → plano anual com cupom
 */
export function parseExternalReference(ref: string): {
  tenantId: string | null;
  planType: PlanType;
  couponCode: string | null;
  hasBump: boolean;
} {
  const parts = ref.split("__");
  const tenantRaw = parts[0] ?? "none";
  const couponOrBump = parts[2] ?? "none";

  return {
    tenantId: tenantRaw === "none" || tenantRaw === "new" ? null : tenantRaw,
    planType: (parts[1] === "mensal" ? "mensal" : "anual") as PlanType,
    couponCode: couponOrBump === "none" || couponOrBump === "BUMP" ? null : couponOrBump,
    hasBump: couponOrBump === "BUMP",
  };
}
