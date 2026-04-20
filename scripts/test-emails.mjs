/**
 * Script para testar todos os templates de email.
 * Envia cada template para o email especificado via Resend.
 *
 * Uso: npx tsx scripts/test-emails.mjs
 */
import { Resend } from "resend";
import { createElement } from "react";

const API_KEY = "re_Jg6N2KL1_BydNqQK2FjDEX6uqyjnUbTqL";
const TO_EMAIL = "brunoeducafinancas@gmail.com";
const FROM = "Guarda Dinheiro <noreply@guardadinheiro.com.br>";

const resend = new Resend(API_KEY);

async function sendTest(name, subject, component) {
  process.stdout.write(`  Enviando: ${name}... `);
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [TO_EMAIL],
      subject: `[TESTE] ${subject}`,
      react: component,
    });
    if (error) {
      console.log(`ERRO: ${error.message}`);
      return false;
    }
    console.log(`OK (${data?.id})`);
    return true;
  } catch (err) {
    console.log(`FALHA: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log("===========================================");
  console.log("  TESTE DE TODOS OS TEMPLATES DE EMAIL");
  console.log(`  Destinatário: ${TO_EMAIL}`);
  console.log("===========================================\n");

  // Import all templates
  const { WelcomeEmail } = await import("../src/lib/email/templates/welcome.tsx");
  const { PaymentConfirmedEmail } = await import("../src/lib/email/templates/payment-confirmed.tsx");
  const { PaymentFailedEmail } = await import("../src/lib/email/templates/payment-failed.tsx");
  const { SubscriptionExpiringEmail } = await import("../src/lib/email/templates/subscription-expiring.tsx");
  const { SubscriptionExpiredEmail } = await import("../src/lib/email/templates/subscription-expired.tsx");
  const { AccountDeletedEmail } = await import("../src/lib/email/templates/account-deleted.tsx");
  const { PasswordChangedEmail } = await import("../src/lib/email/templates/password-changed.tsx");
  const { AffiliateCredentialsEmail } = await import("../src/lib/email/templates/affiliate-credentials.tsx");
  const { AffiliateCommissionEmail } = await import("../src/lib/email/templates/affiliate-commission.tsx");
  const { AffiliateReportEmail } = await import("../src/lib/email/templates/affiliate-report.tsx");

  const tests = [
    {
      name: "1. Boas-vindas",
      subject: "Bem-vindo ao Guarda Dinheiro!",
      component: createElement(WelcomeEmail, {
        name: "Bruno",
        email: "bruno@exemplo.com",
        dashboardUrl: "https://www.guardadinheiro.com.br/dashboard",
        hasSubscription: true,
      }),
    },
    {
      name: "2. Pagamento Confirmado",
      subject: "Pagamento confirmado - Guarda Dinheiro",
      component: createElement(PaymentConfirmedEmail, {
        name: "Bruno",
        planType: "anual",
        amount: 358.80,
        periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        transactionId: "MP-123456789",
      }),
    },
    {
      name: "3. Pagamento Falhou",
      subject: "Problema no pagamento - Guarda Dinheiro",
      component: createElement(PaymentFailedEmail, {
        name: "Bruno",
        planType: "mensal",
        retryUrl: "https://www.guardadinheiro.com.br/planos",
      }),
    },
    {
      name: "4. Assinatura Expirando",
      subject: "Sua assinatura expira em 5 dias",
      component: createElement(SubscriptionExpiringEmail, {
        name: "Bruno",
        planType: "anual",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 5,
        renewalUrl: "https://www.guardadinheiro.com.br/planos",
      }),
    },
    {
      name: "5. Assinatura Expirada",
      subject: "Sua assinatura expirou",
      component: createElement(SubscriptionExpiredEmail, {
        name: "Bruno",
        reactivationUrl: "https://www.guardadinheiro.com.br/planos",
      }),
    },
    {
      name: "6. Conta Excluída (LGPD)",
      subject: "Conta excluida - Guarda Dinheiro",
      component: createElement(AccountDeletedEmail, {
        name: "Bruno",
        email: "bruno@exemplo.com",
      }),
    },
    {
      name: "7. Senha Alterada",
      subject: "Senha alterada - Guarda Dinheiro",
      component: createElement(PasswordChangedEmail, {
        name: "Bruno",
        email: "bruno@exemplo.com",
        changedAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      }),
    },
    {
      name: "8. Credenciais Afiliado",
      subject: "Suas credenciais de afiliado",
      component: createElement(AffiliateCredentialsEmail, {
        name: "João Silva",
        email: "joao@afiliado.com",
        tempPassword: "Gd#8kL2mPx",
        loginUrl: "https://afiliado.guardadinheiro.com.br/login",
      }),
    },
    {
      name: "9. Comissão Paga",
      subject: "Comissao paga!",
      component: createElement(AffiliateCommissionEmail, {
        name: "João Silva",
        amount: "R$ 143,52",
        method: "PIX",
        dashboardUrl: "https://afiliado.guardadinheiro.com.br",
      }),
    },
    {
      name: "10. Relatório Mensal Afiliado",
      subject: "Relatorio de comissoes - Março 2026",
      component: createElement(AffiliateReportEmail, {
        name: "João Silva",
        period: "01/03/2026 - 31/03/2026",
        salesCount: 7,
        totalCommission: "R$ 1.004,64",
        dashboardUrl: "https://afiliado.guardadinheiro.com.br",
      }),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const ok = await sendTest(test.name, test.subject, test.component);
    if (ok) passed++;
    else failed++;
    // Rate limit: 2 req/s no Resend
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n===========================================`);
  console.log(`  ${passed}/10 enviados | ${failed} falharam`);
  console.log(`  Verifique a caixa de ${TO_EMAIL}`);
  console.log(`===========================================`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
