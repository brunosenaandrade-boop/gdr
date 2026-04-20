import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard } from "./base-layout";

interface AffiliateCommissionEmailProps {
  name: string;
  amount: string;
  method: string;
  dashboardUrl: string;
}

export function AffiliateCommissionEmail({ name, amount, method, dashboardUrl }: AffiliateCommissionEmailProps) {
  return (
    <BaseLayout preview={`Comissão de ${amount} paga! Confira os detalhes.`}>
      {/* Money icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>💰</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Comissão paga!</EmailHeading>

      <EmailText>Oi {name}, sua comissão foi paga com sucesso. Confira os detalhes abaixo.</EmailText>

      <InfoCard
        rows={[
          { label: "Valor", value: amount },
          { label: "Método", value: method },
          { label: "Status", value: "Pago" },
        ]}
      />

      <EmailButton href={dashboardUrl}>Ver Detalhes</EmailButton>

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Obrigado por fazer parte do programa de afiliados do Guarda Dinheiro!
      </EmailText>
    </BaseLayout>
  );
}
