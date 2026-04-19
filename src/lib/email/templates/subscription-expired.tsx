import { BaseLayout, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base-layout";

interface SubscriptionExpiredEmailProps {
  name?: string | null;
  reactivationUrl: string;
}

export function SubscriptionExpiredEmail({ name, reactivationUrl }: SubscriptionExpiredEmailProps) {
  return (
    <BaseLayout preview="Sua assinatura expirou. Reative para continuar usando o Guarda Dinheiro.">
      {/* Lock icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>🔒</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Sua assinatura expirou</EmailHeading>

      <EmailText>
        {name ? `Oi ${name}, seu` : "Seu"} acesso ao Guarda Dinheiro foi desativado porque a assinatura venceu.
      </EmailText>

      <EmailText>
        Nao se preocupe — seus dados financeiros estao seguros e serao mantidos por 90 dias. Voce pode reativar a
        qualquer momento e tudo estara como voce deixou.
      </EmailText>

      <EmailButton href={reactivationUrl}>Reativar Agora</EmailButton>

      <EmailDivider />

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Apos 90 dias sem reativacao, seus dados serao permanentemente removidos em conformidade com a LGPD (Lei
        13.709/2018). Se precisar de ajuda, fale conosco em contato@guardadinheiro.com.br.
      </EmailText>
    </BaseLayout>
  );
}
