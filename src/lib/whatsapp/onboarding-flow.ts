import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppFlow, sendWhatsAppCTA } from "./meta-api";
import { logConversation } from "./conversation-log";

/**
 * Envia o WhatsApp Flow de cadastro (formulário nativo dentro do WhatsApp).
 * O usuário preenche nome, email e senha sem sair do WhatsApp.
 */
export async function sendSignupFlow(
  supabase: SupabaseClient,
  phone: string,
): Promise<void> {
  const result = await sendWhatsAppFlow(
    phone,
    "Oi, tudo bem com você! 👋 Vi que você ainda não ativou o seu cadastro. Clique no botão abaixo e ative ele! 🚀\n\nVocê está a um clique de ter um assistente financeiro 24 horas pra organizar a sua vida.\n\nFaça seu cadastro rapidamente pra ativar a sua conta no Guarda Dinheiro! ⏱️ O cadastro demora apenas 30 segundos.",
    {
      header: "Cadastro Guarda Dinheiro",
      footer: "Cadastro rápido em 30 segundos.",
      ctaText: "FAÇA SEU CADASTRO AQUI",
      screen: "CADASTRO",
    },
  );

  if (!result.ok) {
    console.error("Falha ao enviar Flow de cadastro:", result.error);
  }

  await logConversation(supabase, {
    tenantId: null,
    phoneNumber: phone,
    direction: "out",
    messageType: "system",
    content: "[Flow] Formulário de cadastro enviado",
  });
}

/**
 * Processa a resposta do WhatsApp Flow (nfm_reply).
 * Cria a conta no Supabase, tenant, vincula WhatsApp e dispara onboarding.
 */
export async function handleFlowResponse(
  supabase: SupabaseClient,
  phone: string,
  responseJson: string,
): Promise<void> {
  let payload: { nome?: string; email?: string; senha?: string };
  try {
    payload = JSON.parse(responseJson);
  } catch {
    console.error("[onboarding] Erro ao parsear response_json do Flow:", responseJson);
    return;
  }

  const { nome, email, senha } = payload;

  if (!nome || !email || !senha) {
    console.error("[onboarding] Dados incompletos do Flow:", payload);
    return;
  }

  // Verificar se email já existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const emailExists = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (emailExists) {
    const { sendWhatsAppMessage } = await import("./meta-api");
    await sendWhatsAppMessage(
      phone,
      "Esse e-mail já tem uma conta no Guarda Dinheiro! 📧\n\n" +
      "Se já tem conta, acesse o painel para vincular seu WhatsApp.\n" +
      "Se esqueceu a senha: https://www.guardadinheiro.com.br/esqueci-senha",
    );
    return;
  }

  // Criar conta no Supabase
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: nome },
  });

  if (createError || !newUser?.user) {
    console.error("[onboarding] Erro ao criar usuário:", createError?.message);
    const { sendWhatsAppMessage } = await import("./meta-api");
    await sendWhatsAppMessage(
      phone,
      "Ops, tive um problema ao criar sua conta. 😔 Tente novamente em alguns minutos.",
    );
    return;
  }

  // Criar tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      user_id: newUser.user.id,
      name: nome,
      type: "pf",
      document: "",
    })
    .select("id")
    .maybeSingle();

  if (tenantError || !tenant) {
    console.error("[onboarding] Erro ao criar tenant:", tenantError?.message);
    const { sendWhatsAppMessage } = await import("./meta-api");
    await sendWhatsAppMessage(phone, "Erro ao configurar sua conta. Tente novamente.");
    return;
  }

  // Vincular WhatsApp automaticamente
  await supabase.from("whatsapp_links").insert({
    tenant_id: tenant.id,
    phone_number: phone,
    verified: true,
  });

  // Confirmar criação da conta
  const { sendWhatsAppMessage } = await import("./meta-api");
  await sendWhatsAppMessage(
    phone,
    `Conta criada com sucesso! 🎉🛡️\n\n` +
    `*Seus dados de acesso ao painel:*\n` +
    `📧 E-mail: ${email.toLowerCase()}\n` +
    `🔑 Senha: a que você escolheu no cadastro\n\n` +
    `Seu WhatsApp já está vinculado automaticamente. Você já pode começar a lançar agora mesmo! 💚`,
  );
  await logConversation(supabase, {
    tenantId: tenant.id,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: "[onboarding] Conta criada com sucesso",
  });

  // Disparar sequência de onboarding (tutorial passo a passo no WhatsApp)
  await sendOnboardingSequence(supabase, phone, tenant.id, nome);
}

const DELAY_MS = 2500;

async function sendOnboardingSequence(
  supabase: SupabaseClient,
  phone: string,
  tenantId: string,
  nome: string,
): Promise<void> {
  const { sendWhatsAppMessage } = await import("./meta-api");

  async function send(text: string): Promise<void> {
    await sendWhatsAppMessage(phone, text);
    await logConversation(supabase, {
      tenantId,
      phoneNumber: phone,
      direction: "out",
      messageType: "text",
      content: text,
    });
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  // 1. Boas-vindas
  await send(
    `A partir de agora, eu sou o *Guardinha*, seu assistente financeiro pessoal! 🛡️💚\n\n` +
    `${nome}, estou aqui 24 horas pra te ajudar a organizar sua vida financeira.\n\n` +
    `Preparei um guia rápido pra você. Vamos lá! 👇`,
  );

  // 2. Registro de transações
  await send(
    `💰 *Registro de transações*\n\n` +
    `Você pode me enviar mensagens de texto ou áudio, como ficar mais prático pra você!\n\n` +
    `Veja alguns exemplos de uso:\n\n` +
    `✅ _"Gastei 35 reais no mercado"_\n` +
    `✅ _"Paguei 120 reais na conta de luz"_\n` +
    `✅ _"Recebi 1500 do cliente João"_\n` +
    `✅ _"Paguei 5 mil de aluguel hoje dia 5"_\n\n` +
    `❌ _"Gastei"_, _"35 reais no mercado"_ (em duas mensagens separadas)\n` +
    `❌ _"Paguei 10 reais"_ (sem informar do que é)\n\n` +
    `⚠️ Sempre envie tudo em uma *única mensagem* com valor e descrição.`,
  );

  // 3. Categorias
  await send(
    `🚀 *Categorias personalizadas*\n\n` +
    `Já cadastramos categorias essenciais pra suas finanças (Alimentação, Moradia, Transporte, Saúde, etc.).\n\n` +
    `Quer um controle mais detalhado? Crie categorias no painel web! Por exemplo, uma categoria "Café" pra saber quanto gasta de café no mês.\n\n` +
    `Acesse: guardadinheiro.com.br/dashboard/categorias`,
  );

  // 4. Compromissos e lembretes
  await send(
    `📅 *Compromissos e lembretes*\n\n` +
    `Registre compromissos e eu te lembro 30 minutos antes! Exemplos:\n\n` +
    `✅ _"Tenho médico amanhã às 16 horas"_\n` +
    `✅ _"Tenho que ir no dentista terça às 11 horas"_\n` +
    `✅ _"Me lembre de buscar meu filho na escola hoje às 16:30"_\n` +
    `✅ _"Tenho reunião amanhã às 14:30 com o cliente X"_\n\n` +
    `❌ _"Tenho reunião amanhã"_ (sem horário)\n` +
    `❌ _"Tenho reunião com a empresa X"_ (sem data e horário)\n\n` +
    `⚠️ Sempre informe *data e horário* pro lembrete funcionar.`,
  );

  // 5. Receitas e gastos recorrentes
  await send(
    `🔄 *Receitas e gastos recorrentes*\n\n` +
    `Registre transações que se repetem todo mês:\n\n` +
    `✅ _"Tenho pra pagar 2 mil de aluguel todo dia 5"_\n` +
    `✅ _"Tenho pra receber 5 mil de salário todo dia 6"_\n` +
    `✅ _"Tenho pra pagar 25 reais de estacionamento toda quarta"_\n\n` +
    `Eu registro automaticamente pra você no dia certo de cada mês!`,
  );

  // 6. Edição e exclusão
  await send(
    `✏️ *Edição e exclusão de registros*\n\n` +
    `Depois de registrar um lançamento, aparecem botões pra:\n` +
    `• ✏️ *Editar* — mudar valor, descrição ou categoria\n` +
    `• 🗑️ *Excluir* — remover o lançamento\n\n` +
    `Exemplos do que dizer ao editar:\n` +
    `• _"O valor era 200"_\n` +
    `• _"Coloca na categoria Transporte"_\n` +
    `• _"A descrição é almoço com cliente"_`,
  );

  // 7. Consultas
  await send(
    `🔍 *Pergunte o que quiser*\n\n` +
    `Você pode me perguntar sobre suas finanças a qualquer momento:\n\n` +
    `• _"Quanto gastei esse mês?"_\n` +
    `• _"Qual meu saldo?"_\n` +
    `• _"Quanto gastei de alimentação?"_\n` +
    `• _"Tenho conta atrasada?"_\n` +
    `• _"Qual meu score?"_\n` +
    `• _"O que eu tenho pra fazer amanhã?"_\n` +
    `• _"Onde estou gastando mais?"_\n\n` +
    `Pode perguntar do seu jeito que eu entendo! 😊`,
  );

  // 8. Lembretes diários
  await send(
    `🔔 *Lembretes diários*\n\n` +
    `Todos os dias às 08:00 da manhã eu te envio um resumo com:\n` +
    `• Contas a pagar e vencidas\n` +
    `• Compromissos do dia\n` +
    `• Contas a receber\n\n` +
    `Além disso, envio um *lembrete 30 minutos antes* de cada compromisso marcado.`,
  );

  // 9. Painel web + Finalização
  await sendWhatsAppCTA(phone,
    `✅ *Estamos prontos!*\n\n` +
    `${nome}, agora você sabe tudo que eu faço! Esse WhatsApp é nosso canal principal.\n\n` +
    `Você também tem acesso ao *painel web* com gráficos, relatórios, fluxo de caixa e seu score financeiro.\n\n` +
    `Pode começar agora mesmo — me manda seu primeiro lançamento! 🚀`,
    {
      displayText: "📊 Acessar o painel web",
      url: "https://www.guardadinheiro.com.br/dashboard",
    },
  );
  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: "[onboarding] Tutorial completo enviado + CTA painel",
  });
}
