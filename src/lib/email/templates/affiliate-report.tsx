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
    <BaseLayout preview={`Relatorio mensal: ${salesCount} vendas, ${totalCommission} em comissoes.`}>
      {/* Chart icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>📊</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Relatorio mensal de comissoes</EmailHeading>

      <EmailText>Oi {name}, aqui esta o resumo das suas vendas no periodo.</EmailText>

      <InfoCard
        rows={[
          { label: "Periodo", value: period },
          { label: "Vendas", value: String(salesCount) },
          { label: "Comissao total", value: totalCommission },
        ]}
      />

      <EmailButton href={dashboardUrl}>Ver no Painel</EmailButton>

      <EmailDivider />

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        {salesCount > 0
          ? "Continue divulgando seu cupom para aumentar suas comissoes!"
          : "Nenhuma venda registrada neste periodo. Compartilhe seu cupom para comecar a ganhar comissoes."}
      </EmailText>
    </BaseLayout>
  );
}
