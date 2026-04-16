import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3456";
const EMAIL = "teste@teste.com";
const PASSWORD = "TesteSprint5#2026";
const TENANT_ID = "2a88b588-3280-4027-b3df-3f26ff7b9919";
const SB_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjb2p4eG1zZG1ocXRtd3ZrandnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTE5MiwiZXhwIjoyMDkxMTk3MTkyfQ.-y9Raxk5rGeS5WRtaJcOI1-y8VhX3cXaRgOUVtPkrWg";

async function main() {
  // limpar scores antigos pra forçar cálculo fresco
  const sb = createClient(SB_URL, SB_KEY);
  await sb.from("financial_scores").delete().eq("tenant_id", TENANT_ID);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const page = await ctx.newPage();

  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  console.log("→ Login");
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  console.log("→ Dashboard carregado");

  await page.screenshot({ path: "sprint6-dashboard.png", fullPage: true });
  console.log("✓ sprint6-dashboard.png");

  // Expandir detalhamento
  const detailBtn = page.locator('button:has-text("Ver detalhamento")');
  if (await detailBtn.count() > 0) {
    await detailBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "sprint6-dashboard-expanded.png", fullPage: true });
    console.log("✓ sprint6-dashboard-expanded.png");
  }

  await browser.close();

  // Verifica que o score foi salvo
  const { data: scores } = await sb
    .from("financial_scores")
    .select("score, breakdown, calculated_at")
    .eq("tenant_id", TENANT_ID)
    .order("calculated_at", { ascending: false });

  console.log("Scores no DB:", JSON.stringify(scores, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
