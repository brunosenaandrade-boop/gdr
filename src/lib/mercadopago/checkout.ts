/**
 * Mercado Pago Checkout — cria preferência de pagamento e assinaturas.
 */
import { getPreference, getPreApproval } from "./client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.guardadinheiro.com.br";

function extractMpError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.error === "string") return e.error;
    if (typeof e.cause === "string") return e.cause;
    if (e.status) return `Erro do Mercado Pago (status ${e.status})`;
  }
  return "Erro ao se comunicar com o Mercado Pago. Verifique sua conexão e tente novamente.";
}

export type PlanType = "mensal" | "anual";

const PLANS = {
  mensal: { price: 79.9, title: "Guarda Dinheiro — Plano Mensal", days: 30 },
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
  hasBump?: boolean;
}): Promise<
  | { ok: true; url: string; preferenceId: string; externalReference: string }
  | { ok: false; error: string }
> {
  try {
    const plan = PLANS[opts.planType];
    const couponOrBump = opts.hasBump ? "BUMP" : (opts.couponCode ?? "none");

    // external_reference identifica a compra no nosso sistema.
    // Usa marker "BUMP" (igual ao PreApproval) pra webhook reconhecer order bump.
    const externalRef = [
      opts.tenantId ?? "none",
      opts.planType,
      couponOrBump,
      String(Date.now()),
    ].join("__");

    type PreferenceItem = {
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
      currency_id: string;
    };

    const items: PreferenceItem[] = [
      {
        id: opts.planType,
        title: plan.title,
        quantity: 1,
        unit_price: plan.price,
        currency_id: "BRL",
      },
    ];

    if (opts.hasBump) {
      items.push({
        id: "bump-arquitetura-liberdade",
        title: "Pacote Arquitetura da Liberdade",
        quantity: 1,
        unit_price: 67,
        currency_id: "BRL",
      });
    }

    const preference = getPreference();

    const result = await preference.create({
      body: {
        items,
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

    return { ok: true, url, preferenceId: result.id!, externalReference: externalRef };
  } catch (err) {
    console.error("[mercadopago] Erro ao criar preferência:", err);
    return { ok: false, error: extractMpError(err) };
  }
}

/**
 * Cria uma Assinatura (PreApproval) no Mercado Pago.
 * Diferente de createCheckoutPreference (pagamento único), este é recorrente.
 *
 * - Mensal: R$ 79,90/mês recorrente mensal
 * - Anual: R$ 358,80/ano recorrente anual (uma cobrança por ano)
 *
 * O bump (R$ 67) NÃO é incluído aqui — é cobrado separadamente via payment.create()
 * pelo webhook quando a assinatura for autorizada. external_reference indica hasBump.
 */
export async function createPreApprovalPlan(opts: {
  tenantId?: string;
  planType: PlanType;
  email: string;
  hasBump?: boolean;
  couponCode?: string;
}): Promise<
  | { ok: true; url: string; preapprovalId: string; externalReference: string }
  | { ok: false; error: string }
> {
  try {
    const plan = PLANS[opts.planType];
    const couponOrBump = opts.hasBump ? "BUMP" : (opts.couponCode ?? "none");

    const externalRef = [
      opts.tenantId ?? "none",
      opts.planType,
      couponOrBump,
      String(Date.now()),
    ].join("__");

    const preapproval = getPreApproval();

    // MP PreApproval só aceita frequency_type = "days" ou "months".
    // Anual = 12 meses. Mensal = 1 mês.
    const frequency = opts.planType === "anual" ? 12 : 1;

    // notification_url de PreApproval é configurado no painel do MP
    // (Suas integrações → Webhooks), não no payload como em Preference.
    const result = await preapproval.create({
      body: {
        reason: plan.title,
        external_reference: externalRef,
        payer_email: opts.email,
        back_url: `${SITE_URL}/compra-concluida`,
        auto_recurring: {
          frequency,
          frequency_type: "months",
          transaction_amount: plan.price,
          currency_id: "BRL",
        },
        status: "pending",
      },
    });

    const url = result.init_point;
    if (!url) {
      return { ok: false, error: "Mercado Pago não retornou URL de assinatura" };
    }

    return { ok: true, url, preapprovalId: result.id!, externalReference: externalRef };
  } catch (err) {
    console.error("[mercadopago] Erro ao criar assinatura:", err);
    return { ok: false, error: extractMpError(err) };
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
