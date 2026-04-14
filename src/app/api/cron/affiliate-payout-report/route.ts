import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Cron mensal (dia 5 às 09h BRT = 12h UTC):
 * Agrega vendas pendentes do mês anterior por afiliado e gera relatório.
 *
 * Comportamento atual: gera dados estruturados que podem ser:
 * - Visualizados no admin (em /admin/affiliates)
 * - Exportados em CSV manualmente
 *
 * Pagamento é feito MANUALMENTE via PIX pelo admin, depois marca cada
 * venda como "paid" no painel.
 */
export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const now = new Date();

    // Janela: mês anterior completo
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const startCurrMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Buscar todas vendas pendentes do mês anterior
    const { data: sales, error } = await supabase
      .from("affiliate_sales")
      .select(`
        id, affiliate_id, sale_amount_cents, commission_amount_cents,
        coupon_code, attribution_source, hotmart_transaction, created_at,
        affiliates(name, email, pix_key)
      `)
      .eq("status", "pending")
      .gte("created_at", startPrevMonth)
      .lt("created_at", startCurrMonth);

    if (error) throw error;

    if (!sales || sales.length === 0) {
      return NextResponse.json({
        status: "ok",
        message: "Sem vendas pendentes no mês anterior",
        ranAt: now.toISOString(),
      });
    }

    // Agregar por afiliado
    type SummaryRow = {
      affiliate_id: string;
      affiliate_name: string;
      affiliate_email: string;
      pix_key: string | null;
      sales_count: number;
      total_commission_cents: number;
      sale_ids: string[];
    };

    const byAffiliate = new Map<string, SummaryRow>();

    for (const s of sales) {
      const affiliate = Array.isArray(s.affiliates) ? s.affiliates[0] : s.affiliates;
      if (!affiliate) continue;

      const curr: SummaryRow = byAffiliate.get(s.affiliate_id) ?? {
        affiliate_id: s.affiliate_id,
        affiliate_name: affiliate.name,
        affiliate_email: affiliate.email,
        pix_key: affiliate.pix_key,
        sales_count: 0,
        total_commission_cents: 0,
        sale_ids: [] as string[],
      };

      curr.sales_count++;
      curr.total_commission_cents += s.commission_amount_cents;
      curr.sale_ids.push(s.id);

      byAffiliate.set(s.affiliate_id, curr);
    }

    const summary = Array.from(byAffiliate.values());
    const grandTotal = summary.reduce((sum, s) => sum + s.total_commission_cents, 0);

    // Log estruturado pra admin ver no Sentry/Vercel
    console.log("[cron/affiliate-payout-report]", JSON.stringify({
      period: { start: startPrevMonth, end: startCurrMonth },
      affiliates_count: summary.length,
      sales_count: sales.length,
      grand_total_brl: formatCurrency(grandTotal),
      details: summary.map((s) => ({
        affiliate: s.affiliate_name,
        email: s.affiliate_email,
        pix: s.pix_key,
        sales: s.sales_count,
        amount: formatCurrency(s.total_commission_cents),
      })),
    }, null, 2));

    return NextResponse.json({
      status: "ok",
      ranAt: now.toISOString(),
      period: {
        start: startPrevMonth,
        end: startCurrMonth,
      },
      summary: {
        affiliates_count: summary.length,
        sales_count: sales.length,
        grand_total_cents: grandTotal,
        grand_total_formatted: formatCurrency(grandTotal),
      },
      details: summary.map((s) => ({
        affiliate_id: s.affiliate_id,
        affiliate_name: s.affiliate_name,
        affiliate_email: s.affiliate_email,
        pix_key: s.pix_key,
        sales_count: s.sales_count,
        total_commission_cents: s.total_commission_cents,
        total_commission_formatted: formatCurrency(s.total_commission_cents),
        sale_ids: s.sale_ids,
      })),
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/affiliate-payout-report] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
