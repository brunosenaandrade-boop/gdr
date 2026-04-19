import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3456";
const SB_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjb2p4eG1zZG1ocXRtd3ZrandnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTE5MiwiZXhwIjoyMDkxMTk3MTkyfQ.-y9Raxk5rGeS5WRtaJcOI1-y8VhX3cXaRgOUVtPkrWg";

const TEST_EMAIL = "teste.painel@guardadinheiro.com.br";
const TEST_PASSWORD = "Teste1234Painel";
const TEST_NAME = "Teste Painel";

async function setupTestUser() {
  const sb = createClient(SB_URL, SB_KEY);

  // Limpar user antigo se existir
  const { data: authData } = await sb.auth.admin.listUsers();
  const existing = authData?.users?.find(u => u.email === TEST_EMAIL);
  if (existing) {
    // Limpar tenant
    const { data: tenant } = await sb.from("tenants").select("id").eq("user_id", existing.id).maybeSingle();
    if (tenant) {
      await sb.from("whatsapp_links").delete().eq("tenant_id", tenant.id);
      await sb.from("categories").delete().eq("tenant_id", tenant.id);
      await sb.from("transactions").delete().eq("tenant_id", tenant.id);
      await sb.from("recurring_transactions").delete().eq("tenant_id", tenant.id);
      await sb.from("subscriptions").delete().eq("tenant_id", tenant.id);
      await sb.from("tenants").delete().eq("id", tenant.id);
    }
    await sb.auth.admin.deleteUser(existing.id);
  }

  // Criar user novo
  const { data: newUser } = await sb.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (!newUser?.user) throw new Error("Falha ao criar user de teste");

  // Criar tenant
  const { data: tenant } = await sb.from("tenants").insert({
    user_id: newUser.user.id,
    name: TEST_NAME,
    type: "pf",
    document: "",
  }).select("id").maybeSingle();

  // Ativar subscription
  await sb.from("subscriptions").insert({
    tenant_id: tenant.id,
    status: "active",
    current_period_end: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  });

  console.log("✓ User de teste criado:", TEST_EMAIL);
  return { userId: newUser.user.id, tenantId: tenant.id };
}

async function main() {
  const { tenantId } = await setupTestUser();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const page = await ctx.newPage();
  const results = [];

  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  // ═══ TESTE 1: Página de login renderiza ═══
  console.log("\n🧪 1. Página de login");
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  const loginTitle = await page.locator("text=Entrar no Guarda Dinheiro").count();
  const emailInput = await page.locator('input[type="email"]').count();
  const passInput = await page.locator('input[type="password"]').count();
  const loginBtn = await page.locator('button[type="submit"]').count();
  if (loginTitle > 0 && emailInput > 0 && passInput > 0 && loginBtn > 0) {
    console.log("   ✅ Login renderiza: título, email, senha, botão");
    results.push({ name: "Login renderiza", pass: true });
  } else {
    console.log("   ❌ Login faltando elementos");
    results.push({ name: "Login renderiza", pass: false });
  }

  // ═══ TESTE 2: Login com credenciais inválidas ═══
  console.log("\n🧪 2. Login com credenciais inválidas");
  await page.fill('input[type="email"]', "naoexiste@teste.com");
  await page.fill('input[type="password"]', "senhaerrada");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const errorMsg = await page.locator("text=inválido").count() + await page.locator("text=Erro").count() + await page.locator("text=Invalid").count();
  const stayedOnLogin = page.url().includes("/login");
  if (stayedOnLogin) {
    console.log("   ✅ Permaneceu na página de login (não redirecionou)");
    results.push({ name: "Login inválido", pass: true });
  } else {
    console.log("   ❌ Redirecionou com credenciais inválidas: " + page.url());
    results.push({ name: "Login inválido", pass: false });
  }

  // ═══ TESTE 3: Login com credenciais válidas ═══
  console.log("\n🧪 3. Login com credenciais válidas");
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  const onDashboard = page.url().includes("/dashboard");
  if (onDashboard) {
    console.log("   ✅ Redirecionou pro dashboard: " + page.url());
    results.push({ name: "Login válido", pass: true });
  } else {
    console.log("   ❌ Não chegou no dashboard: " + page.url());
    results.push({ name: "Login válido", pass: false });
  }

  // ═══ TESTE 4: Dashboard renderiza ═══
  console.log("\n🧪 4. Dashboard renderiza");
  await page.waitForLoadState("networkidle");
  const saldoCard = await page.locator("text=SALDO").count();
  const receitasCard = await page.locator("text=RECEITAS").count();
  const scoreCard = await page.locator("text=SCORE FINANCEIRO").count();
  const emptyState = await page.locator("text=Bem-vindo").count();
  await page.screenshot({ path: "test-dashboard.png", fullPage: true });
  if (saldoCard > 0 && receitasCard > 0) {
    console.log("   ✅ StatCards renderizam (Saldo, Receitas)");
    console.log("   " + (scoreCard > 0 ? "✅" : "⚠️") + " Score card: " + (scoreCard > 0 ? "visível" : "não visível"));
    console.log("   " + (emptyState > 0 ? "✅" : "⚠️") + " Empty state: " + (emptyState > 0 ? "visível" : "não visível"));
    results.push({ name: "Dashboard renderiza", pass: true });
  } else {
    console.log("   ❌ Dashboard não renderizou cards");
    results.push({ name: "Dashboard renderiza", pass: false });
  }

  // ═══ TESTE 5: Navegar por todas as páginas ═══
  const pages = [
    { path: "/dashboard/lancamentos", name: "Lançamentos", check: "Lançamentos" },
    { path: "/dashboard/contas-pagar", name: "Contas a Pagar", check: "Contas a Pagar" },
    { path: "/dashboard/contas-receber", name: "Contas a Receber", check: "Contas a Receber" },
    { path: "/dashboard/fluxo-caixa", name: "Fluxo de Caixa", check: "Fluxo de Caixa" },
    { path: "/dashboard/categorias", name: "Categorias", check: "Categorias" },
    { path: "/dashboard/recorrencias", name: "Recorrências", check: "Recorrências" },
    { path: "/dashboard/agenda", name: "Agenda", check: "Agenda" },
    { path: "/dashboard/whatsapp", name: "WhatsApp", check: "WhatsApp" },
    { path: "/dashboard/configuracoes", name: "Configurações", check: "Configurações" },
  ];

  for (const pg of pages) {
    console.log(`\n🧪 ${pg.name}`);
    await page.goto(`${BASE}${pg.path}`);
    await page.waitForLoadState("networkidle");
    const found = await page.locator(`text=${pg.check}`).first().count();
    const hasError = await page.locator("text=Erro").count() + await page.locator("text=error").count();
    const hasPageError = await page.locator("text=Internal Server Error").count() + await page.locator("text=500").count();

    if (hasPageError > 0) {
      console.log(`   ❌ ERRO 500 na página ${pg.path}`);
      results.push({ name: pg.name, pass: false });
    } else if (found > 0) {
      console.log(`   ✅ ${pg.name} renderiza`);
      results.push({ name: pg.name, pass: true });
    } else {
      console.log(`   ⚠️ ${pg.name} — texto "${pg.check}" não encontrado`);
      await page.screenshot({ path: `test-${pg.name.toLowerCase().replace(/\s/g, '-')}.png` });
      results.push({ name: pg.name, pass: false });
    }
  }

  // ═══ TESTE 6: Sidebar presente ═══
  console.log("\n🧪 Sidebar");
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("networkidle");
  const sidebarItems = await page.locator("nav ul li a").count();
  if (sidebarItems >= 9) {
    console.log(`   ✅ Sidebar com ${sidebarItems} itens`);
    results.push({ name: "Sidebar", pass: true });
  } else {
    console.log(`   ❌ Sidebar com apenas ${sidebarItems} itens (esperado >= 9)`);
    results.push({ name: "Sidebar", pass: false });
  }

  // ═══ TESTE 7: Logout ═══
  console.log("\n🧪 Logout");
  const logoutBtn = page.locator("text=Sair");
  if (await logoutBtn.count() > 0) {
    await logoutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    console.log("   ✅ Logout → redirecionou pro login");
    results.push({ name: "Logout", pass: true });
  } else {
    console.log("   ❌ Botão Sair não encontrado");
    results.push({ name: "Logout", pass: false });
  }

  // ═══ TESTE 8: Rota protegida sem login ═══
  console.log("\n🧪 Rota protegida sem login");
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const redirectedToLogin = page2.url().includes("/login");
  if (redirectedToLogin) {
    console.log("   ✅ /dashboard redireciona pro /login sem sessão");
    results.push({ name: "Rota protegida", pass: true });
  } else {
    console.log("   ❌ /dashboard acessível sem login: " + page2.url());
    results.push({ name: "Rota protegida", pass: false });
  }
  await ctx2.close();

  await browser.close();

  // ═══ RELATÓRIO ═══
  console.log("\n═══════════════════════════════════════");
  console.log("  RELATÓRIO — TESTE PAINEL WEB");
  console.log("═══════════════════════════════════════\n");

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  for (const r of results) {
    console.log(`${r.pass ? "✅" : "❌"} ${r.name}`);
  }

  console.log(`\n━━━ ${passed}/${results.length} PASSARAM | ${failed} FALHARAM ━━━`);

  // Cleanup screenshots
  const fs = await import("fs");
  for (const f of fs.readdirSync(".").filter(f => f.startsWith("test-"))) {
    fs.unlinkSync(f);
  }

  // Cleanup test user
  const sb = createClient(SB_URL, SB_KEY);
  const { data: authData } = await sb.auth.admin.listUsers();
  const testUser = authData?.users?.find(u => u.email === TEST_EMAIL);
  if (testUser) {
    const { data: tenant } = await sb.from("tenants").select("id").eq("user_id", testUser.id).maybeSingle();
    if (tenant) {
      await sb.from("categories").delete().eq("tenant_id", tenant.id);
      await sb.from("subscriptions").delete().eq("tenant_id", tenant.id);
      await sb.from("tenants").delete().eq("id", tenant.id);
    }
    await sb.auth.admin.deleteUser(testUser.id);
  }
  console.log("\n✓ User de teste limpo");
}

main().catch(e => { console.error(e); process.exit(1); });
