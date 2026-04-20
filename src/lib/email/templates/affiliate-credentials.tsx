import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard, EmailDivider } from "./base-layout";

interface AffiliateCredentialsEmailProps {
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function AffiliateCredentialsEmail({ name, email, tempPassword, loginUrl }: AffiliateCredentialsEmailProps) {
  return (
    <BaseLayout preview={`${name}, sua conta de afiliado foi criada! Acesse o painel.`}>
      <EmailHeading>Bem-vindo ao Programa de Afiliados!</EmailHeading>

      <EmailText>
        Oi {name}, sua conta de afiliado do Guarda Dinheiro foi criada com sucesso. Use as credenciais abaixo para
        acessar o painel de afiliados.
      </EmailText>

      <InfoCard
        rows={[
          { label: "Painel", value: loginUrl },
          { label: "E-mail", value: email },
          { label: "Senha temporária", value: tempPassword },
        ]}
      />

      {/* Warning to change password */}
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.08)",
          borderRadius: "12px",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          marginBottom: "20px",
        }}
      >
        <tr>
          <td style={{ padding: "14px 20px" }}>
            <p style={{ color: "#FBBF24", fontSize: "13px", fontWeight: 600, margin: 0 }}>
              Altere sua senha no primeiro acesso por segurança.
            </p>
          </td>
        </tr>
      </table>

      <EmailButton href={loginUrl}>Acessar Painel de Afiliado</EmailButton>

      <EmailDivider />

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Comissão de 40% sobre cada venda realizada com seu cupom. Acompanhe suas vendas e comissões pelo painel.
      </EmailText>
    </BaseLayout>
  );
}
