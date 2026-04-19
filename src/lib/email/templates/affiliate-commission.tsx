import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard } from "./base-layout";

interface AffiliateCommissionEmailProps {
  name: string;
  amount: string;
  method: string;
  dashboardUrl: string;
}

export function AffiliateCommissionEmail({ name, amount, method, dashboardUrl }: AffiliateCommissionEmailProps) {
  return (
    <BaseLayout preview={`Comissao de ${amount} paga! Confira os detalhes.`}>
      {/* Money icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>💰</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Comissao paga!</EmailHeading>

      <EmailText>Oi {name}, sua comissao foi paga com sucesso. Confira os detalhes abaixo.</EmailText>

      <InfoCard
        rows={[
          { label: "Valor", value: amount },
          { label: "Metodo", value: method },
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
