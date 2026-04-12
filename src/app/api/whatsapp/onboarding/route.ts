import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppCTA } from "@/lib/whatsapp/meta-api";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 403 });
  }

  const { data: whatsappLink } = await supabase
    .from("whatsapp_links")
    .select("phone_number")
    .eq("tenant_id", tenant.id)
    .eq("verified", true)
    .maybeSingle();

  if (!whatsappLink?.phone_number) {
    return NextResponse.json({ error: "No verified WhatsApp number" }, { status: 404 });
  }

  const phone = whatsappLink.phone_number;

  // Mensagem 1: Apresentação do Guardinha + Como funciona
  const msg1Body =
    "A partir de agora, eu serei o seu Guardinha, seu assistente financeiro pessoal! 🛡️💚\n\n" +
    "Estou aqui para te ajudar a organizar sua vida financeira, registrar seus gastos e te ajudar a sair das dívidas de vez!\n\n" +
    "Preparei um guia rápido de como eu funciono para que possamos começar juntos da melhor forma. Clique no botão abaixo para entender! 👇";

  await sendWhatsAppCTA(phone, msg1Body, {
    displayText: "📖 Entender como funciona",
    url: "https://www.guardadinheiro.com.br/como-funciona",
  });

  // Aguardar 3 segundos entre as mensagens
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Mensagem 2a: Pronto para começar + Acessar plataforma
  const msg2Body =
    "Estamos prontos para começar! 🚀\n\n" +
    "Esse contato de WhatsApp será nosso canal principal. Você já pode começar a registrar tudo aqui comigo, é só mandar uma mensagem de voz ou texto!\n\n" +
    "Para acessar o painel com todos os seus dados:";

  await sendWhatsAppCTA(phone, msg2Body, {
    displayText: "📊 Acessar a plataforma",
    url: "https://www.guardadinheiro.com.br/dashboard",
  });

  // Mensagem 2b: Instagram (enviada logo após)
  await sendWhatsAppCTA(
    phone,
    "Siga o Guarda Dinheiro no Instagram para dicas de finanças e novidades! 💚",
    {
      displayText: "📸 Instagram do Guarda Dinheiro",
      url: "https://www.instagram.com/guardadinheiro",
    },
  );

  return NextResponse.json({ status: "onboarding_sent" });
}
