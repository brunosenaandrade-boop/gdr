import { BaseLayout, EmailHeading, EmailText, EmailButton, InfoCard, BulletItem, EmailDivider } from "./base-layout";

interface WelcomeEmailProps {
  name: string;
  email: string;
  dashboardUrl: string;
  hasSubscription: boolean;
}

export function WelcomeEmail({ name, email, dashboardUrl, hasSubscription }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`Bem-vindo ao Guarda Dinheiro, ${name}! Sua conta foi criada com sucesso.`}>
      <EmailHeading>Bem-vindo ao Guarda Dinheiro!</EmailHeading>

      <EmailText>
        Oi {name}, sua conta foi criada com sucesso. Agora voce tem o Guardinha — seu assistente financeiro pessoal
        no WhatsApp.
      </EmailText>

      <InfoCard
        rows={[
          { label: "E-mail", value: email },
          { label: "Senha", value: "A que voce escolheu no cadastro" },
          { label: "Painel", value: dashboardUrl },
        ]}
      />

      <EmailDivider />

      <EmailText style={{ marginBottom: "12px" }}>O que voce pode fazer:</EmailText>
      <table cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: "8px" }}>
        <BulletItem>Registrar gastos e receitas por texto ou audio no WhatsApp</BulletItem>
        <BulletItem>Acompanhar seu fluxo de caixa e contas a pagar no painel</BulletItem>
        <BulletItem>Receber lembretes de compromissos e contas vencendo</BulletItem>
        <BulletItem>Consultar saldo, gastos do mes e score financeiro</BulletItem>
      </table>

      <EmailButton href={dashboardUrl}>Acessar o Painel</EmailButton>

      {!hasSubscription && (
        <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
          Se voce ainda nao assinou um plano, acesse guardadinheiro.com.br/planos para ativar seu acesso completo.
        </EmailText>
      )}

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Dica: adicione o Guardinha nos contatos do seu WhatsApp para nao perder nenhuma mensagem.
      </EmailText>
    </BaseLayout>
  );
}
