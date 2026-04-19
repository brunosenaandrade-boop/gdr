import { BaseLayout, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base-layout";

interface PasswordChangedEmailProps {
  name?: string | null;
  email: string;
  changedAt: string;
}

export function PasswordChangedEmail({ name, email, changedAt }: PasswordChangedEmailProps) {
  return (
    <BaseLayout preview="Sua senha foi alterada com sucesso.">
      {/* Shield icon */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tr>
          <td align="center" style={{ paddingBottom: "20px" }}>
            <div style={{ fontSize: "48px", lineHeight: "1" }}>🔐</div>
          </td>
        </tr>
      </table>

      <EmailHeading>Senha alterada com sucesso</EmailHeading>

      <EmailText>
        A senha da conta {email} foi alterada em {changedAt}.
      </EmailText>

      <EmailButton href="https://www.guardadinheiro.com.br/login">Acessar Minha Conta</EmailButton>

      <EmailDivider />

      {/* Security warning */}
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={{
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          borderRadius: "12px",
          border: "1px solid rgba(239, 68, 68, 0.15)",
        }}
      >
        <tr>
          <td style={{ padding: "16px 20px" }}>
            <p style={{ color: "#F87171", fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>
              Voce NAO fez essa alteracao?
            </p>
            <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
              Entre em contato imediatamente pelo WhatsApp ou em contato@guardadinheiro.com.br para proteger sua conta.
            </p>
          </td>
        </tr>
      </table>
    </BaseLayout>
  );
}
