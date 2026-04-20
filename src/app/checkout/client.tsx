"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { CheckCircle, AlertTriangle, Loader2, Gift } from "lucide-react";

interface CheckoutClientProps {
  publicKey: string;
  planAmount: number;
  installments: number;
  planType: "mensal" | "anual";
  planLabel: string;
  monthlyPrice: string;
  externalReference: string;
  email?: string;
  bumpAmount: number;
  bumpName: string;
  bumpDesc: string;
  showBump: boolean;
}

export function CheckoutClient({
  publicKey,
  planAmount,
  installments,
  planType,
  planLabel,
  monthlyPrice,
  externalReference,
  email,
  bumpAmount,
  bumpName,
  bumpDesc,
  showBump,
}: CheckoutClientProps) {
  const [addBump, setAddBump] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "approved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const totalAmount = addBump ? planAmount + bumpAmount : planAmount;

  // Inicializar Mercado Pago SDK
  initMercadoPago(publicKey, { locale: "pt-BR" });

  // Ref com bump flag no external_reference (separador __)
  const finalRef = addBump
    ? externalReference.replace("__none__", "__BUMP__")
    : externalReference;

  async function onSubmit(formData: Record<string, unknown>) {
    setStatus("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          external_reference: finalRef,
          has_bump: addBump,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao processar pagamento.");
        setStatus("error");
        return;
      }

      if (data.status === "approved") {
        setStatus("approved");
        setTimeout(() => router.push("/compra-concluida"), 2000);
      } else if (data.status === "in_process" || data.status === "pending") {
        setStatus("approved");
        setTimeout(() => router.push("/compra-concluida?status=pending"), 2000);
      } else {
        setErrorMsg(getStatusMessage(data.status_detail || data.status));
        setStatus("error");
      }
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setStatus("error");
    }
  }

  function onError(error: unknown) {
    console.error("[checkout] Brick error:", error);
  }

  if (status === "approved") {
    return (
      <div className="text-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Pagamento confirmado!</h3>
        <p className="text-sm text-slate-400">Redirecionando para ativação...</p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Processando pagamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do pedido */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h1 className="text-lg font-semibold mb-4">Resumo do pedido</h1>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Plano {planLabel}</span>
            <span className="text-white font-medium">{monthlyPrice}/mês</span>
          </div>
          {planType === "anual" && (
            <div className="flex justify-between">
              <span className="text-slate-400">12x sem juros</span>
              <span className="text-white">R$ {planAmount.toFixed(2).replace(".", ",")}</span>
            </div>
          )}

          {/* Upsell checkbox — só mostra se ainda não comprou */}
          {showBump && (
          <div className="border-t border-white/10 pt-3 mt-3">
            <label className="flex items-start gap-3 cursor-pointer group rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3 transition-colors hover:bg-amber-500/[0.06]">
              <input
                type="checkbox"
                checked={addBump}
                onChange={(e) => setAddBump(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm font-medium text-white">Adicionar {bumpName}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{bumpDesc}</p>
                <p className="text-xs text-amber-400 font-semibold mt-1">+ R$ {bumpAmount.toFixed(2).replace(".", ",")}</p>
              </div>
            </label>
          </div>
          )}

          {/* Total */}
          <div className="border-t border-white/10 pt-3 flex justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-emerald-400 font-semibold text-base">
              R$ {totalAmount.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Brick — re-monta quando amount muda via key */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-base font-semibold mb-4">Pagamento</h2>

        {status === "error" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Pagamento não aprovado</p>
                <p className="text-xs text-red-300/70 mt-1">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        <Payment
          key={`payment-${totalAmount}`}
          initialization={{
            amount: totalAmount,
            payer: { email: email || "" },
          }}
          customization={{
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              maxInstallments: installments,
            },
            visual: {
              style: {
                theme: "dark" as const,
                customVariables: {
                  formBackgroundColor: "#0f0f0f",
                  baseColor: "#10B981",
                },
              },
            },
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSubmit={onSubmit as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError={onError as any}
        />
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500">
        <span>🔒 Pagamento seguro</span>
        <span>✓ Garantia 7 dias</span>
        <span>✓ Cancele quando quiser</span>
      </div>
    </div>
  );
}

function getStatusMessage(statusDetail: string): string {
  const messages: Record<string, string> = {
    cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
    cc_rejected_bad_filled_date: "Data de validade incorreta.",
    cc_rejected_bad_filled_other: "Dados do cartão incorretos.",
    cc_rejected_bad_filled_security_code: "Código de segurança incorreto.",
    cc_rejected_blacklist: "Cartão não aceito. Use outro cartão.",
    cc_rejected_call_for_authorize: "Cartão requer autorização. Ligue para o banco.",
    cc_rejected_card_disabled: "Cartão desabilitado. Ligue para o banco.",
    cc_rejected_card_error: "Erro no cartão. Tente novamente.",
    cc_rejected_duplicated_payment: "Pagamento duplicado. Verifique sua fatura.",
    cc_rejected_high_risk: "Pagamento recusado por segurança. Use outro meio.",
    cc_rejected_insufficient_amount: "Saldo insuficiente.",
    cc_rejected_invalid_installments: "Parcelas não disponíveis para este cartão.",
    cc_rejected_max_attempts: "Limite de tentativas atingido. Use outro cartão.",
    cc_rejected_other_reason: "Pagamento recusado. Tente outro cartão ou PIX.",
    rejected: "Pagamento recusado. Tente outro meio de pagamento.",
  };
  return messages[statusDetail] || "Pagamento não aprovado. Tente novamente ou use outro meio de pagamento.";
}
