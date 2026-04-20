import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export async function GET(request: NextRequest) {
  const unauth = verifyCronAuth(request);
  if (unauth) return unauth;

  try {
    const supabase = await createServiceClient();
    const { todayBRT } = await import("@/lib/date/brt");
    const today = todayBRT();

    // Buscar todos os tenants com WhatsApp vinculado
    const { data: links, error: linksError } = await supabase
      .from("whatsapp_links")
      .select("tenant_id, phone_number")
      .eq("verified", true);

    if (linksError) throw linksError;
    if (!links || links.length === 0) {
      return NextResponse.json({ status: "ok", sent: 0, reason: "no_linked_users" });
    }

    let sent = 0;

    for (const link of links) {
      try {
        // Buscar nome do tenant
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", link.tenant_id)
          .maybeSingle();

        const nome = tenant?.name?.split(" ")[0] ?? "usuário";

        // Contas a pagar hoje (pendentes com due_date = hoje)
        const { data: contasPagar } = await supabase
          .from("transactions")
          .select("description, amount")
          .eq("tenant_id", link.tenant_id)
          .eq("type", "despesa")
          .in("status", ["pendente", "atrasado"])
          .eq("due_date", today)
          .limit(10);

        // Contas a receber hoje
        const { data: contasReceber } = await supabase
          .from("transactions")
          .select("description, amount")
          .eq("tenant_id", link.tenant_id)
          .eq("type", "receita")
          .in("status", ["pendente", "atrasado"])
          .eq("due_date", today)
          .limit(10);

        // Contas atrasadas (não de hoje, mas vencidas)
        const { data: contasAtrasadas } = await supabase
          .from("transactions")
          .select("description, amount, due_date")
          .eq("tenant_id", link.tenant_id)
          .eq("status", "atrasado")
          .lt("due_date", today)
          .order("due_date", { ascending: true })
          .limit(5);

        // Compromissos de hoje
        const startOfToday = `${today}T00:00:00-03:00`;
        const endOfToday = `${today}T23:59:59-03:00`;
        const { data: compromissosHoje } = await supabase
          .from("appointments")
          .select("title, scheduled_at, notes")
          .eq("tenant_id", link.tenant_id)
          .eq("status", "pendente")
          .gte("scheduled_at", startOfToday)
          .lte("scheduled_at", endOfToday)
          .order("scheduled_at", { ascending: true })
          .limit(10);

        // Montar mensagem
        const pagar = contasPagar && contasPagar.length > 0
          ? contasPagar.map((t) => `  • ${t.description} — ${formatCurrency(t.amount)}`).join("\n")
          : "  Nenhuma conta para hoje ✅";

        const receber = contasReceber && contasReceber.length > 0
          ? contasReceber.map((t) => `  • ${t.description} — ${formatCurrency(t.amount)}`).join("\n")
          : "  Nenhum recebimento para hoje";

        let atrasadasBlock = "";
        if (contasAtrasadas && contasAtrasadas.length > 0) {
          const items = contasAtrasadas.map((t) => {
            const venc = t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "";
            return `  • ${t.description} — ${formatCurrency(t.amount)} (venceu ${venc})`;
          }).join("\n");
          atrasadasBlock = `\n\n⚠️ *Contas atrasadas:*\n${items}`;
        }

        let compromissosBlock = "";
        if (compromissosHoje && compromissosHoje.length > 0) {
          const { formatTimeBRT } = await import("@/lib/date/brt");
          const items = compromissosHoje.map((c) => {
            return `  • ${formatTimeBRT(c.scheduled_at)} — ${c.title}`;
          }).join("\n");
          compromissosBlock = `\n\n📅 *Compromissos de hoje:*\n${items}`;
        }

        const message =
          `☀️ Bom dia, ${nome}! Aqui está seu resumo do dia:\n\n` +
          `💸 *Contas a pagar hoje:*\n${pagar}\n\n` +
          `💰 *Contas a receber hoje:*\n${receber}` +
          atrasadasBlock +
          compromissosBlock +
          `\n\n⏰ *Lembre-se:* registre todos os seus gastos por aqui para manter o controle! 💚`;

        const result = await sendWhatsAppMessage(link.phone_number, message);
        if (result.ok) sent++;
      } catch (err) {
        console.error(`[cron/daily-reminder] Erro para tenant ${link.tenant_id}:`, err);
      }
    }

    return NextResponse.json({
      status: "ok",
      total_users: links.length,
      sent,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/daily-reminder] failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
