import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard, EmailDivider } from "./base-layout";

interface AffiliateReportEmailProps {
  name: string;
  period: string;
  salesCount: number;
  totalCommission: string;
  dashboardUrl: string;
}

export function AffiliateReportEmail({ name, period, salesCount, totalCommission, dashboardUrl }: AffiliateReportEmailProps) {
  return (
    <BaseLayout preview={`Relatório mensal: ${salesCount} vendas, ${totalCommission} em comissões.`}>
      {/* Chart icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>📊</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Relatório mensal de comissões</EmailHeading>

      <EmailText>Oi {name}, aqui está o resumo das suas vendas no período.</EmailText>

      <InfoCard
        rows={[
          { label: "Período", value: period },
          { label: "Vendas", value: String(salesCount) },
          { label: "Comissão total", value: totalCommission },
        ]}
      />

      <EmailButton href={dashboardUrl}>Ver no Painel</EmailButton>

      <EmailDivider />

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        {salesCount > 0
          ? "Continue divulgando seu cupom para aumentar suas comissões!"
          : "Nenhuma venda registrada neste período. Compartilhe seu cupom para começar a ganhar comissões."}
      </EmailText>
    </BaseLayout>
  );
}
