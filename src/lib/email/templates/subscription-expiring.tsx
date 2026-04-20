import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard } from "./base-layout";

interface SubscriptionExpiringEmailProps {
  name?: string | null;
  planType: "mensal" | "anual";
  expiresAt: string;
  daysRemaining: number;
  renewalUrl: string;
}

export function SubscriptionExpiringEmail({
  name,
  planType,
  expiresAt,
  daysRemaining,
  renewalUrl,
}: SubscriptionExpiringEmailProps) {
  const planLabel = planType === "mensal" ? "Mensal" : "Anual";
  const formattedDate = new Date(expiresAt).toLocaleDateString("pt-BR");

  return (
    <BaseLayout preview={`Sua assinatura expira em ${daysRemaining} dias. Renove para não perder acesso.`}>
      {/* Clock icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>⏰</div>
          </td>
        </tr>
      </table>

      <EmailHeading>
        Sua assinatura expira em {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}
      </EmailHeading>

      <EmailText>
        {name ? `Oi ${name}, sua` : "Sua"} assinatura do Guarda Dinheiro está prestes a vencer. Renove agora para
        continuar usando o Guardinha sem interrupção.
      </EmailText>

      <InfoCard
        rows={[
          { label: "Plano atual", value: planLabel },
          { label: "Expira em", value: formattedDate },
        ]}
      />

      <EmailButton href={renewalUrl}>Renovar Agora</EmailButton>

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Após o vencimento, você perderá acesso ao painel e ao Guardinha no WhatsApp. Seus dados ficam seguros por 90
        dias.
      </EmailText>
    </BaseLayout>
  );
}
