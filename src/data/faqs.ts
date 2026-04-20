export type FAQItem = {
  q: string;
  a: string;
  category?: "legal" | "produto" | "pagamento" | "suporte" | "seguranca";
};

const guaranteeFAQ: FAQItem = {
  q: "E se eu não gostar?",
  a: "Você tem os 7 dias de arrependimento garantidos pelo Código de Defesa do Consumidor (art. 49). Se dentro desse prazo você pedir reembolso por qualquer motivo, devolvemos 100% — basta mandar uma mensagem pra contato@guardadinheiro.com.br. Sem perguntas, sem formulário.",
  category: "legal",
};

const cancelFAQ: FAQItem = {
  q: "Posso cancelar a qualquer momento?",
  a: "Sim. O cancelamento é feito direto pela sua conta do Mercado Pago, na área de assinaturas, sem multa e sem ligação pra ninguém. Você mantém o acesso até o fim do período já pago.",
  category: "pagamento",
};

const pjFAQ: FAQItem = {
  q: "Funciona pra empresa (PJ, MEI, autônomo)?",
  a: "Sim. O mesmo plano serve pra Pessoa Física e Pessoa Jurídica. No primeiro acesso ao painel você escolhe PF ou PJ e a IA adapta as categorias automaticamente. Ideal pra autônomo, MEI e pequeno empresário que não quer separar vida pessoal e da empresa em dois apps.",
  category: "produto",
};

const securityFAQ: FAQItem = {
  q: "É seguro mandar meus dados financeiros pelo WhatsApp?",
  a: "Sim. Seus dados ficam num banco Supabase com criptografia em repouso e em trânsito. As mensagens trafegam pela API oficial da Meta (WhatsApp Business Cloud). Não vendemos, não compartilhamos e não usamos seus dados pra treinar IA de terceiros. Em linha com a LGPD, você pode pedir exportação ou exclusão a qualquer momento em contato@guardadinheiro.com.br.",
  category: "seguranca",
};

// ========== LANDING PAGE (/) ==========
export const landingFAQs: FAQItem[] = [
  {
    q: "Como funciona o Guarda Dinheiro?",
    a: "Você manda um áudio ou texto no WhatsApp dizendo o que gastou ou recebeu. A IA entende, categoriza e registra pra você em segundos. Também pode perguntar \"quanto gastei esse mês?\" ou \"tenho conta atrasada?\" e receber a resposta na hora, sem precisar abrir app nenhum.",
    category: "produto",
  },
  {
    q: "Preciso baixar algum app?",
    a: "Não. Zero downloads. Funciona direto no WhatsApp que você já usa. Tem também um painel web completo com gráficos e relatórios — acessa pelo navegador do celular ou computador.",
    category: "produto",
  },
  securityFAQ,
  {
    q: "A IA entende áudio?",
    a: "Entende. Você pode falar entre um compromisso e outro, no trânsito, na correria — o áudio é transcrito e interpretado automaticamente. Toda transação passa por uma confirmação curta antes de virar definitiva; se a IA entender errado, você corrige na hora.",
    category: "produto",
  },
  pjFAQ,
  {
    q: "Gera relatório pra Imposto de Renda?",
    a: "Sim. O painel permite exportar todas as suas transações do ano em CSV, separadas por categoria e período — pronto pra entregar ao contador ou preencher na declaração. Categorias de PJ incluem separação de receitas e despesas dedutíveis.",
    category: "produto",
  },
  {
    q: "Posso compartilhar com meu cônjuge?",
    a: "Sim. Você pode vincular mais de um número de WhatsApp à mesma conta — ideal pra casal ou sócios que querem controlar as finanças juntos, sem pagar dois planos. Configuração feita pelo painel.",
    category: "produto",
  },
  guaranteeFAQ,
];

// ========== PLANOS (/planos) ==========
export const planosFAQs: FAQItem[] = [
  guaranteeFAQ,
  {
    q: "Por que o anual sai mais barato?",
    a: "Porque a gente evita a taxa de processamento recorrente mensal do Mercado Pago e você se compromete por mais tempo, o que reduz custo de aquisição. Esse desconto a gente repassa pra você: R$ 29,90/mês no anual contra R$ 49,90/mês no mensal — economia de R$ 240 no ano.",
    category: "pagamento",
  },
  cancelFAQ,
  {
    q: "Posso mudar de mensal pra anual depois?",
    a: "Pode. Cancela o plano mensal atual na sua área do Mercado Pago e contrata o anual aqui no site. O acesso à conta e todo o seu histórico continuam intactos.",
    category: "pagamento",
  },
  {
    q: "O pagamento é seguro? Aceita PIX e cartão?",
    a: "Sim. Todo o checkout é processado pelo Mercado Pago (mesma infra do Mercado Livre), com criptografia PCI DSS. Aceitamos cartão de crédito (até 12x no anual) e PIX. A gente não vê e não guarda o número do seu cartão em momento algum.",
    category: "pagamento",
  },
  {
    q: "Como recebo o e-book de orçamento mensal (se adicionar no checkout)?",
    a: "Assim que o pagamento é confirmado, enviamos um link de download direto pro e-mail cadastrado. O link fica disponível também no painel, na aba \"Meus materiais\". É entrega digital instantânea, sem frete.",
    category: "produto",
  },
  {
    q: "Como falo com o suporte se precisar?",
    a: "Manda um e-mail pra contato@guardadinheiro.com.br e a gente responde em até 1 dia útil (normalmente no mesmo dia). Pra dúvidas de cobrança, também dá pra usar a central do Mercado Pago.",
    category: "suporte",
  },
];

// ========== COMO FUNCIONA (/como-funciona) ==========
export const comoFuncionaFAQs: FAQItem[] = [
  {
    q: "De qual número o bot vai falar comigo?",
    a: "Do nosso número oficial verificado na Meta: +55 48 2027-0106. Salva ele nos contatos como \"Guarda Dinheiro\" pra facilitar encontrar no dia a dia.",
    category: "produto",
  },
  {
    q: "Se eu trocar de celular, perco meu histórico?",
    a: "Não. Seus dados ficam no nosso servidor, não no seu aparelho. Basta instalar o WhatsApp no novo celular com o mesmo número e continuar conversando normalmente — todo o histórico financeiro está preservado.",
    category: "produto",
  },
  {
    q: "Posso criar categorias personalizadas?",
    a: "Pode. O painel tem uma aba de Categorias onde você edita, cria ou remove. A IA passa a usar suas categorias personalizadas nas próximas transações. Já começa com categorias padrão pra PF ou PJ, então não precisa configurar nada pra usar.",
    category: "produto",
  },
  {
    q: "Tem limite de mensagens ou transações?",
    a: "Não. Uso ilimitado pra conversar com o bot e registrar transações. A gente acredita que controle financeiro tem que ser sem fricção — se tivesse limite, você acabaria \"economizando mensagem\" em vez de registrar gasto.",
    category: "produto",
  },
  {
    q: "Posso exportar meus dados?",
    a: "Sim — a qualquer momento, pelo painel, em CSV. É um direito seu garantido pela LGPD (art. 18) e a gente facilita: 2 cliques e o arquivo tá no seu computador. Se quiser também excluir a conta e tudo dentro dela, pede por contato@guardadinheiro.com.br.",
    category: "seguranca",
  },
];

export function faqsToJsonLd(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
