import { chromium } from "playwright";

const BASE = "http://localhost:3456";

async function run() {
  console.log("=== Verificação do Checkout via Playwright ===\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });

  const page = await context.newPage();

  // 1. Página de planos
  console.log("1. Abrindo /planos...");
  await page.goto(`${BASE}/planos`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "tmp_pw_planos.png" });

  const anualBtn = page.locator('a[href="/checkout?plan=anual"]').first();
  const mensalBtn = page.locator('a[href="/checkout?plan=mensal"]').first();

  const anualVisible = await anualBtn.isVisible();
  const mensalVisible = await mensalBtn.isVisible();
  console.log(`   Botão anual: ${anualVisible ? "✅" : "❌"}`);
  console.log(`   Botão mensal: ${mensalVisible ? "✅" : "❌"}`);

  // 2. Checkout mensal
  console.log("\n2. Abrindo /checkout?plan=mensal...");
  await page.goto(`${BASE}/checkout?plan=mensal`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000); // Esperar SDK carregar
  await page.screenshot({ path: "tmp_pw_checkout_mensal.png" });

  const resumo = page.locator("text=Resumo do pedido");
  const resumoVisible = await resumo.isVisible();
  console.log(`   Resumo do pedido: ${resumoVisible ? "✅" : "❌"}`);

  const pagamento = page.getByRole("heading", { name: "Pagamento" });
  const pagamentoVisible = await pagamento.isVisible();
  console.log(`   Seção Pagamento: ${pagamentoVisible ? "✅" : "❌"}`);

  const upsell = page.locator("text=Adicionar Pacote");
  const upsellVisible = await upsell.isVisible();
  console.log(`   Upsell checkbox: ${upsellVisible ? "✅" : "❌"}`);

  const total = page.locator("text=R$ 49,90").first();
  const totalVisible = await total.isVisible();
  console.log(`   Total R$ 49,90: ${totalVisible ? "✅" : "❌"}`);

  // Verificar se o Payment Brick carregou (iframe do MP)
  const mpIframe = page.locator("iframe").first();
  const mpIframeCount = await page.locator("iframe").count();
  console.log(`   Payment Brick (iframes): ${mpIframeCount > 0 ? `✅ (${mpIframeCount} iframe(s))` : "❌ NÃO RENDERIZOU"}`);

  // 3. Checkout anual
  console.log("\n3. Abrindo /checkout?plan=anual...");
  await page.goto(`${BASE}/checkout?plan=anual`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "tmp_pw_checkout_anual.png" });

  const totalAnual = page.locator("text=R$ 358,80").first();
  const totalAnualVisible = await totalAnual.isVisible();
  console.log(`   Total R$ 358,80: ${totalAnualVisible ? "✅" : "❌"}`);

  const mpIframeAnual = await page.locator("iframe").count();
  console.log(`   Payment Brick (iframes): ${mpIframeAnual > 0 ? `✅ (${mpIframeAnual} iframe(s))` : "❌ NÃO RENDERIZOU"}`);

  // 4. Marcar upsell e verificar total
  console.log("\n4. Testando upsell...");
  const checkbox = page.locator('input[type="checkbox"]');
  if (await checkbox.isVisible()) {
    await checkbox.check();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "tmp_pw_checkout_upsell.png" });

    const totalComBump = page.locator("text=R$ 425,80");
    const totalComBumpVisible = await totalComBump.isVisible();
    console.log(`   Total com bump R$ 425,80: ${totalComBumpVisible ? "✅" : "❌"}`);
  } else {
    console.log("   Checkbox não encontrado ❌");
  }

  // 5. Mobile view
  console.log("\n5. Verificando mobile (390px)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/checkout?plan=mensal`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "tmp_pw_checkout_mobile.png" });

  const mobileResumo = await page.locator("text=Resumo do pedido").isVisible();
  console.log(`   Mobile resumo: ${mobileResumo ? "✅" : "❌"}`);

  await browser.close();

  console.log("\n=== Screenshots salvas em tmp_pw_*.png ===");
  console.log("Use Read tool para visualizar.");
}

run().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
