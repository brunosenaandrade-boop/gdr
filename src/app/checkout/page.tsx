import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import Link from "next/link";
import { CheckoutClient } from "./client";

export const metadata = {
  title: "Checkout — Guarda Dinheiro",
  description: "Finalize seu pagamento de forma segura.",
};

type SearchParams = Promise<{ plan?: string }>;

export default async function CheckoutPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const params = await searchParams;
  const plan = params.plan === "mensal" ? "mensal" : "anual";

  const amount = plan === "mensal" ? 49.90 : 358.80;
  const installments = plan === "mensal" ? 1 : 12;
  const label = plan === "mensal" ? "Mensal" : "Anual";
  const monthlyPrice = plan === "mensal" ? "R$ 49,90" : "R$ 29,90";

  const publicKey = process.env.MP_PUBLIC_KEY;
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">Checkout indisponível no momento.</p>
      </div>
    );
  }

  // Gerar external_reference
  let email: string | undefined;
  let tenantId: string | undefined;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
    if (user) {
      const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
      tenantId = tenant?.id;
    }
  } catch {
    // Usuário não logado
  }

  const externalReference = `${tenantId ?? "none"}_${plan}_none_${Date.now()}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Shield className="h-3.5 w-3.5 text-black fill-black" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Guarda Dinheiro</span>
          </Link>
          <Link href="/planos" className="text-xs text-slate-400 hover:text-slate-200">
            ← Voltar aos planos
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Resumo do pedido */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8">
          <h1 className="text-xl font-semibold mb-4">Resumo do pedido</h1>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Plano</span>
              <span className="text-white font-medium">{label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Valor mensal</span>
              <span className="text-emerald-400 font-medium">{monthlyPrice}/mês</span>
            </div>
            {plan === "anual" && (
              <div className="flex justify-between">
                <span className="text-slate-400">Parcelamento</span>
                <span className="text-white">12x de R$ 29,90</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white font-semibold">Total</span>
              <span className="text-white font-semibold">
                R$ {amount.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Brick */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-4">Pagamento</h2>
          <CheckoutClient
            publicKey={publicKey}
            amount={amount}
            installments={installments}
            planType={plan}
            externalReference={externalReference}
            email={email}
          />
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[10px] text-slate-500">
          <span>🔒 Pagamento seguro</span>
          <span>✓ Garantia 7 dias</span>
          <span>✓ Cancele quando quiser</span>
        </div>
      </div>
    </div>
  );
}
