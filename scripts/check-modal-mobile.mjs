import { chromium } from "playwright";

const BASE = "http://localhost:3456";

async function run() {
  console.log("=== Teste do Modal Novo + Mobile ===\n");

  const browser = await chromium.launch({ headless: true });

  // === DESKTOP ===
  console.log("[DESKTOP 1280x800]");
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "pt-BR",
  });
  const dPage = await desktop.newPage();

  await dPage.goto(`${BASE}/planos`, { waitUntil: "networkidle" });
  await dPage.waitForTimeout(1000);

  // 1. Abrir modal do anual
  console.log("1. Clicando 'Quero o plano anual'...");
  await dPage.getByRole("button", { name: "Quero o plano anual" }).click();
  await dPage.waitForTimeout(500);
  await dPage.screenshot({ path: "tmp_modal_anual_desktop.png" });

  const anualModalTitle = await dPage.locator("h3:has-text('Plano Anual')").isVisible();
  console.log(`   Modal Anual visível: ${anualModalTitle ? "✅" : "❌"}`);

  const modalCount = await dPage.locator("[class*='fixed inset-0'][class*='z-50']").count();
  console.log(`   Modais abertos: ${modalCount} ${modalCount === 1 ? "✅" : "❌"}`);

  // 2. Fechar e abrir o mensal
  console.log("\n2. Fechando e clicando 'Quero o plano mensal'...");
  await dPage.locator("button").filter({ has: dPage.locator("svg.lucide-x") }).first().click();
  await dPage.waitForTimeout(500);
  await dPage.getByRole("button", { name: "Quero o plano mensal" }).click();
  await dPage.waitForTimeout(500);

  const mensalModalTitle = await dPage.locator("h3:has-text('Plano Mensal')").isVisible();
  console.log(`   Modal Mensal visível: ${mensalModalTitle ? "✅" : "❌"}`);

  const modalCount2 = await dPage.locator("[class*='fixed inset-0'][class*='z-50']").count();
  console.log(`   Modais abertos: ${modalCount2} ${modalCount2 === 1 ? "✅" : "❌"}`);

  // 3. Testar o upsell
  console.log("\n3. Marcando checkbox do bump...");
  await dPage.locator('input[type="checkbox"]').first().check();
  await dPage.waitForTimeout(300);
  await dPage.screenshot({ path: "tmp_modal_bump_desktop.png" });

  const totalVisible = await dPage.locator("text=R$ 116,90").isVisible();
  console.log(`   Total com bump (R$ 116,90): ${totalVisible ? "✅" : "❌"}`);

  await desktop.close();

  // === MOBILE ===
  console.log("\n[MOBILE 390x844]");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "pt-BR",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobile.newPage();

  await mPage.goto(`${BASE}/planos`, { waitUntil: "networkidle" });
  await mPage.waitForTimeout(1500);
  await mPage.screenshot({ path: "tmp_planos_mobile.png", fullPage: true });

  // Testar clique no botão (plano anual)
  console.log("1. Clicando 'Quero o plano anual' no mobile...");
  const anualBtn = mPage.getByRole("button", { name: "Quero o plano anual" });
  await anualBtn.scrollIntoViewIfNeeded();
  await anualBtn.click();
  await mPage.waitForTimeout(800);
  await mPage.screenshot({ path: "tmp_modal_mobile.png" });

  const mobileModal = await mPage.locator("h3:has-text('Plano Anual')").isVisible();
  console.log(`   Modal visível no mobile: ${mobileModal ? "✅" : "❌"}`);

  // Verificar se caiu dentro do viewport
  const modal = mPage.locator("[class*='max-w-md']").first();
  const box = await modal.boundingBox();
  if (box) {
    const fits = box.x >= 0 && box.y >= 0 && (box.x + box.width) <= 390;
    console.log(`   Modal dentro do viewport: ${fits ? "✅" : "❌"} (x=${box.x.toFixed(0)}, w=${box.width.toFixed(0)})`);
  }

  // Testar preenchimento
  console.log("\n2. Preenchendo email...");
  const emailInput = mPage.locator('input[type="email"]');
  await emailInput.fill("teste@exemplo.com");

  const submitBtn = mPage.getByRole("button", { name: /Ir para o pagamento/i });
  const submitVisible = await submitBtn.isVisible();
  console.log(`   Botão submit visível: ${submitVisible ? "✅" : "❌"}`);

  await mPage.screenshot({ path: "tmp_modal_mobile_filled.png" });

  await browser.close();
  console.log("\n=== Screenshots: tmp_modal_*.png e tmp_planos_mobile.png ===");
}

run().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
