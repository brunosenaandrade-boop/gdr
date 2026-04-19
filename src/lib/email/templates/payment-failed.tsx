import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard, EmailDivider } from "./base-layout";

interface PaymentFailedEmailProps {
  name?: string | null;
  planType: "mensal" | "anual";
  retryUrl: string;
}

export function PaymentFailedEmail({ name, planType, retryUrl }: PaymentFailedEmailProps) {
  const planLabel = planType === "mensal" ? "Mensal" : "Anual";

  return (
    <BaseLayout preview="Houve um problema no seu pagamento. Tente novamente.">
      {/* Warning icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>⚠️</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Problema no Pagamento</EmailHeading>

      <EmailText>
        {name ? `Oi ${name}, nao` : "Nao"} conseguimos processar o pagamento do seu plano. Isso pode acontecer por
        diversos motivos.
      </EmailText>

      <InfoCard
        rows={[
          { label: "Plano", value: planLabel },
          { label: "Status", value: "Nao aprovado" },
        ]}
      />

      <EmailDivider />

      <EmailText style={{ marginBottom: "8px" }}>Motivos mais comuns:</EmailText>
      <EmailText style={{ fontSize: "14px" }}>
        • Saldo insuficiente ou limite excedido
        {"\n"}• Dados do cartao incorretos
        {"\n"}• Cartao bloqueado pelo banco
        {"\n"}• PIX expirado (valido por 30 min)
      </EmailText>

      <EmailButton href={retryUrl}>Tentar Novamente</EmailButton>

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Se o problema persistir, entre em contato pelo WhatsApp ou em contato@guardadinheiro.com.br.
      </EmailText>
    </BaseLayout>
  );
}
