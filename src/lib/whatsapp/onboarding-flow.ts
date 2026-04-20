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

  // VAR 4: Validação de senha (mínimo 8 caracteres)
  if (senha.length < 8) {
    const { sendWhatsAppMessage } = await import("./meta-api");
    await sendWhatsAppMessage(
      phone,
      "Senha muito curta! Precisa ter pelo menos *8 caracteres*.\n\n" +
      "Clique no botão abaixo pra tentar novamente:",
    );
    await sendSignupFlow(supabase, phone);
    return;
  }

  // VAR 2: Verificar se email já existe (paginação limitada para evitar carregar todos)
  let emailExists = false;
  let page = 1;
  const perPage = 500;
  while (true) {
    const { data: authPage } = await supabase.auth.admin.listUsers({ page, perPage });
    const users = authPage?.users ?? [];
    if (users.some((u) => u.email?.toLowerCase() === email.toLowerCase())) {
      emailExists = true;
      break;
    }
    if (users.length < perPage) break; // última página
    page++;
    if (page > 20) break; // safety: max 10k users
  }

  if (emailExists) {
    const { sendWhatsAppMessage } = await import("./meta-api");
    await sendWhatsAppMessage(
      phone,
      "Esse e-mail já tem uma conta no Guarda Dinheiro! 📧\n\n" +
      "Se já tem conta, acesse o painel pra vincular seu WhatsApp:\n" +
      "guardadinheiro.com.br/dashboard/whatsapp\n\n" +
      "Se esqueceu a senha:\n" +
      "guardadinheiro.com.br/esqueci-senha",
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

  // Criar tenant (PF/PJ e documento serão preenchidos no painel via OnboardingModal)
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      user_id: newUser.user.id,
      name: nome,
      type: null,
      document: null,
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

  // VAR 1: Reconciliar compra Mercado Pago pendente (webhook pode ter chegado antes)
  const { reconcilePendingPurchase } = await import("@/lib/mercadopago/reconcile");
  const { reconciled } = await reconcilePendingPurchase(supabase, email, tenant.id);

  // Confirmar criação da conta
  const { sendWhatsAppMessage } = await import("./meta-api");

  if (reconciled) {
    // Compra encontrada e subscription ativada!
    await sendWhatsAppMessage(
      phone,
      `Conta criada e assinatura ativada com sucesso! 🎉🛡️\n\n` +
      `*Último passo:* acesse o painel para informar se você é PF ou PJ (CPF ou CNPJ). Leva 30 segundos:\n` +
      `guardadinheiro.com.br/dashboard\n\n` +
      `*Seus dados de acesso:*\n` +
      `📧 E-mail: ${email.toLowerCase()}\n` +
      `🔑 Senha: a que você escolheu no cadastro\n\n` +
      `Seu WhatsApp já está vinculado. Depois de completar o cadastro, pode começar a lançar! 💚\n\n` +
      `_Ao usar o Guardinha, você concorda com nossos Termos de Uso e Política de Privacidade: guardadinheiro.com.br/termos_`,
    );
  } else {
    // VAR 5: Sem compra encontrada — informar que acesso depende de assinatura
    await sendWhatsAppMessage(
      phone,
      `Conta criada com sucesso! 🎉\n\n` +
      `*Último passo:* acesse o painel para informar se você é PF ou PJ (CPF ou CNPJ):\n` +
      `guardadinheiro.com.br/dashboard\n\n` +
      `*Seus dados de acesso:*\n` +
      `📧 E-mail: ${email.toLowerCase()}\n` +
      `🔑 Senha: a que você escolheu no cadastro\n\n` +
      `Seu WhatsApp já está vinculado automaticamente.\n\n` +
      `Se você já fez a compra no Mercado Pago, seu acesso será ativado em alguns minutos.\n` +
      `Se ainda não assinou: guardadinheiro.com.br/planos\n\n` +
      `_Ao usar o Guardinha, você concorda com nossos Termos de Uso e Política de Privacidade: guardadinheiro.com.br/termos_`,
    );
  }
  await logConversation(supabase, {
    tenantId: tenant.id,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: "[onboarding] Conta criada com sucesso",
  });

  // Email de boas-vindas
  try {
    const { sendEmail } = await import("@/lib/email/resend");
    const { WelcomeEmail } = await import("@/lib/email/templates/welcome");
    await sendEmail({
      to: email.toLowerCase(),
      subject: "Bem-vindo ao Guarda Dinheiro!",
      react: WelcomeEmail({
        name: nome,
        email: email.toLowerCase(),
        dashboardUrl: "https://www.guardadinheiro.com.br/dashboard",
        hasSubscription: reconciled,
      }),
      idempotencyKey: `welcome-${tenant.id}`,
      tags: [{ name: "category", value: "welcome" }],
    });
  } catch (err) {
    console.error("[onboarding] Erro ao enviar email de boas-vindas:", err);
  }

  // Disparar tutorial via WhatsApp Flow (multi-tela)
  await sendOnboardingTutorial(supabase, phone, tenant.id, nome);
}

const TUTORIAL_FLOW_ID = process.env.WHATSAPP_TUTORIAL_FLOW_ID ?? "1319167250070584";

async function sendOnboardingTutorial(
  supabase: SupabaseClient,
  phone: string,
  tenantId: string,
  nome: string,
): Promise<void> {
  const { sendWhatsAppMessage } = await import("./meta-api");

  // 1. Boas-vindas (mensagem normal — personalizada com nome)
  await sendWhatsAppMessage(
    phone,
    `A partir de agora, eu sou o *Guardinha*, seu assistente financeiro pessoal! 🛡️💚\n\n` +
    `${nome}, estou aqui 24 horas pra te ajudar a organizar sua vida financeira.\n\n` +
    `Preparei um guia rápido pra você. Clique no botão abaixo! 👇`,
  );
  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "text",
    content: "[onboarding] Boas-vindas enviada",
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. Tutorial via Flow multi-tela (9 telas)
  const flowToken = process.env.WHATSAPP_FLOW_TOKEN ?? "unused";
  const result = await sendWhatsAppFlow(
    phone,
    "Veja como tirar o melhor do Guardinha — leva menos de 2 minutos:",
    {
      header: "Tutorial Guarda Dinheiro",
      ctaText: "Entender como funciona",
      screen: "BOAS_PRATICAS",
      flowId: TUTORIAL_FLOW_ID,
    },
  );

  if (!result.ok) {
    console.error("[onboarding] Falha ao enviar Flow tutorial:", result.error);
    // Fallback: enviar mensagens separadas se Flow falhar
    await sendFallbackMessages(supabase, phone, tenantId);
    return;
  }

  await logConversation(supabase, {
    tenantId,
    phoneNumber: phone,
    direction: "out",
    messageType: "system",
    content: "[onboarding] Tutorial Flow enviado",
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 3. CTA final pro painel
  await sendWhatsAppCTA(phone,
    `Quando terminar o tutorial, me manda seu primeiro lançamento! 🚀\n\n` +
    `Você também pode acessar o painel web:`,
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
    content: "[onboarding] Tutorial completo + CTA painel",
  });
}

/**
 * Fallback: se o Flow tutorial falhar, envia as mensagens chave como texto.
 */
async function sendFallbackMessages(
  supabase: SupabaseClient,
  phone: string,
  tenantId: string,
): Promise<void> {
  const { sendWhatsAppMessage } = await import("./meta-api");

  const messages = [
    `💰 *Como registrar*\n\nMe manda: _"Gastei 50 no mercado"_ ou _"Recebi 1500 do cliente"_\nPode ser texto ou áudio!\n\n⚠️ Sempre valor + descrição numa mensagem só.`,
    `📅 *Compromissos*: _"Tenho médico amanhã às 16h"_\n🔍 *Consultas*: _"Qual meu saldo?"_\n🔔 *Lembretes*: todo dia às 08h + 30min antes de compromissos`,
  ];

  for (const msg of messages) {
    await sendWhatsAppMessage(phone, msg);
    await logConversation(supabase, {
      tenantId,
      phoneNumber: phone,
      direction: "out",
      messageType: "text",
      content: msg,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
