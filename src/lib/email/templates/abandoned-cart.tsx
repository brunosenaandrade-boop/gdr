import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard } from "./base-layout";

interface AbandonedCartEmailProps {
  planType: "mensal" | "anual";
  hasBump: boolean;
  resumeUrl: string;
}

export function AbandonedCartEmail({ planType, hasBump, resumeUrl }: AbandonedCartEmailProps) {
  const planLabel = planType === "mensal" ? "Mensal" : "Anual";
  const planPrice = planType === "mensal" ? "R$ 79,90/mês" : "R$ 29,90/mês (12x R$ 358,80)";
  const bumpRow = hasBump
    ? [{ label: "Bônus", value: "Pacote Arquitetura da Liberdade (+ R$ 67)" }]
    : [];

  return (
    <BaseLayout preview="Seu checkout ficou pela metade — continue de onde parou em 1 clique.">
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>🛒</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Seu plano ainda está te esperando</EmailHeading>

      <EmailText>
        Você começou a assinar o Guarda Dinheiro mas não finalizou o pagamento.
        Sem stress — seu carrinho continua salvo e você pode retomar em 1 clique.
      </EmailText>

      <InfoCard
        rows={[
          { label: "Plano escolhido", value: planLabel },
          { label: "Valor", value: planPrice },
          ...bumpRow,
        ]}
      />

      <EmailButton href={resumeUrl}>Finalizar minha assinatura</EmailButton>

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Lembrando: <strong style={{ color: "#E2E8F0" }}>garantia de 7 dias</strong> — se
        não valer, devolvemos 100% sem perguntas. E você pode cancelar quando quiser.
      </EmailText>

      <EmailText style={{ fontSize: "12px", color: "#475569", marginTop: "24px" }}>
        Se não foi você quem iniciou a compra ou já não tem mais interesse, ignore este
        email — ele não vai voltar.
      </EmailText>
    </BaseLayout>
  );
}
