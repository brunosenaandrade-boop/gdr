"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface CheckoutClientProps {
  publicKey: string;
  amount: number;
  installments: number;
  planType: "mensal" | "anual";
  externalReference: string;
  email?: string;
}

export function CheckoutClient({
  publicKey,
  amount,
  installments,
  planType,
  externalReference,
  email,
}: CheckoutClientProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "approved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // Inicializar Mercado Pago SDK
  initMercadoPago(publicKey, { locale: "pt-BR" });

  async function onSubmit(formData: Record<string, unknown>) {
    setStatus("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          external_reference: externalReference,
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
        setTimeout(() => router.push("/compra-concluida"), 2000);
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
      <div className="text-center py-12">
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
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Processando pagamento...</p>
      </div>
    );
  }

  return (
    <div>
      {status === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
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
        initialization={{
          amount,
          payer: {
            email: email || "",
          },
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
