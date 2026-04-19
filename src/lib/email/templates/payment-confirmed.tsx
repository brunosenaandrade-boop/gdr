import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard } from "./base-layout";

interface PaymentConfirmedEmailProps {
  name?: string | null;
  planType: "mensal" | "anual";
  amount: number;
  periodEnd: string;
  transactionId: string;
}

export function PaymentConfirmedEmail({ name, planType, amount, periodEnd, transactionId }: PaymentConfirmedEmailProps) {
  const planLabel = planType === "mensal" ? "Mensal" : "Anual";
  const formattedAmount = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formattedDate = new Date(periodEnd).toLocaleDateString("pt-BR");

  return (
    <BaseLayout preview={`Pagamento de ${formattedAmount} confirmado! Plano ${planLabel} ativado.`}>
      {/* Green checkmark */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#059669",
                lineHeight: "56px",
                textAlign: "center" as const,
                fontSize: "28px",
                color: "#ffffff",
                display: "inline-block",
              }}
            >
              ✓
            </div>
          </td>
        </tr>
      </table>

      <EmailHeading>Pagamento Confirmado!</EmailHeading>

      <EmailText>
        {name ? `Oi ${name}, seu` : "Seu"} pagamento foi processado com sucesso. Seu plano esta ativo e voce ja pode
        usar todas as funcionalidades do Guarda Dinheiro.
      </EmailText>

      <InfoCard
        rows={[
          { label: "Plano", value: planLabel },
          { label: "Valor", value: formattedAmount },
          { label: "Acesso ate", value: formattedDate },
          { label: "ID transacao", value: transactionId },
        ]}
      />

      <EmailButton href="https://www.guardadinheiro.com.br/dashboard">Acessar o Painel</EmailButton>

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Este email serve como comprovante de pagamento. Guarde-o para referencia futura.
      </EmailText>
    </BaseLayout>
  );
}
