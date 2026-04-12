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
    "Olá! 👋 Crie sua conta grátis agora e ganhe *7 dias gratuitos* para organizar suas finanças e começar a sair das dívidas de vez! 🚀\n\nO cadastro é rápido e acontece aqui mesmo no WhatsApp!",
    {
      header: "Cadastro Guarda Dinheiro",
      footer: "Sem cartão de crédito.",
      ctaText: "🎯 Criar minha conta grátis",
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

  // Disparar sequência de onboarding
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const msg1Body =
    "A partir de agora, eu serei o seu Guardinha, seu assistente financeiro pessoal! 🛡️💚\n\n" +
    "Estou aqui para te ajudar a organizar sua vida financeira, registrar seus gastos e te ajudar a sair das dívidas de vez!\n\n" +
    "Preparei um guia rápido de como eu funciono para que possamos começar juntos da melhor forma. Clique no botão abaixo para entender! 👇";

  await sendWhatsAppCTA(phone, msg1Body, {
    displayText: "📖 Entender como funciona",
    url: "https://www.guardadinheiro.com.br/como-funciona",
  });
  await logConversation(supabase, {
    tenantId: tenant.id,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: msg1Body + " [CTA: 📖 Entender como funciona]",
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const msg2Body =
    "Estamos prontos para começar! 🚀\n\n" +
    "Esse contato de WhatsApp será nosso canal principal. Você já pode começar a registrar tudo aqui comigo, é só mandar uma mensagem de voz ou texto!\n\n" +
    "Para acessar o painel com todos os seus dados:";

  await sendWhatsAppCTA(phone, msg2Body, {
    displayText: "📊 Acessar a plataforma",
    url: "https://www.guardadinheiro.com.br/dashboard",
  });
  await logConversation(supabase, {
    tenantId: tenant.id,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: msg2Body + " [CTA: 📊 Acessar a plataforma]",
  });
}
