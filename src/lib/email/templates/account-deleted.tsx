import { BaseLayout, EmailHeading, EmailText, InfoCard, EmailDivider } from "./base-layout";

interface AccountDeletedEmailProps {
  name?: string | null;
  email: string;
}

export function AccountDeletedEmail({ name, email }: AccountDeletedEmailProps) {
  return (
    <BaseLayout preview="Sua conta no Guarda Dinheiro foi excluida com sucesso.">
      <EmailHeading>Conta excluida com sucesso</EmailHeading>

      <EmailText>
        {name ? `Oi ${name}, sua` : "Sua"} conta ({email}) e todos os dados associados foram permanentemente removidos
        do Guarda Dinheiro.
      </EmailText>

      <InfoCard
        rows={[
          { label: "Removido", value: "Dados financeiros (transacoes, categorias)" },
          { label: "", value: "Historico de conversas no WhatsApp" },
          { label: "", value: "Compromissos e lembretes" },
          { label: "", value: "Dados pessoais e credenciais" },
        ]}
      />

      <EmailDivider />

      <EmailText style={{ fontSize: "13px" }}>
        Em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/2018), todos os seus dados pessoais foram
        permanentemente removidos dos nossos servidores. Esta acao nao pode ser desfeita.
      </EmailText>

      <EmailText style={{ fontSize: "13px", color: "#64748B" }}>
        Sentiremos sua falta! Se quiser voltar, crie uma nova conta em guardadinheiro.com.br.
      </EmailText>
    </BaseLayout>
  );
}
