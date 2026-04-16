import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3456";
const EMAIL = "teste@teste.com";
const PASSWORD = "TesteSprint5#2026";
const TENANT_ID = "2a88b588-3280-4027-b3df-3f26ff7b9919";
const SB_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjb2p4eG1zZG1ocXRtd3ZrandnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTE5MiwiZXhwIjoyMDkxMTk3MTkyfQ.-y9Raxk5rGeS5WRtaJcOI1-y8VhX3cXaRgOUVtPkrWg";

async function seedAppointments() {
  const sb = createClient(SB_URL, SB_KEY);
  // limpar anteriores
  await sb.from("appointments").delete().eq("tenant_id", TENANT_ID);
  const now = Date.now();
  const rows = [
    { tenant_id: TENANT_ID, title: "Médico", scheduled_at: new Date(now + 3 * 3600e3).toISOString(), status: "pendente", source: "whatsapp", notes: "Dr. Pereira — trazer exames" },
    { tenant_id: TENANT_ID, title: "Reunião com cliente", scheduled_at: new Date(now + 26 * 3600e3).toISOString(), status: "pendente", source: "web", notes: null },
    { tenant_id: TENANT_ID, title: "Aniversário da Ana", scheduled_at: new Date(now + 5 * 24 * 3600e3).toISOString(), status: "pendente", source: "whatsapp", notes: "Presente: livro" },
    { tenant_id: TENANT_ID, title: "Check-up dentista", scheduled_at: new Date(now + 20 * 24 * 3600e3).toISOString(), status: "pendente", source: "web", notes: null },
    { tenant_id: TENANT_ID, title: "Reunião passada teste", scheduled_at: new Date(now - 2 * 24 * 3600e3).toISOString(), status: "realizado", source: "whatsapp", notes: null },
  ];
  const { error } = await sb.from("appointments").insert(rows);
  if (error) throw error;
  console.log("✓ 5 appointments seeded");
}

async function main() {
  await seedAppointments();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const page = await ctx.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[browser ERROR]", msg.text());
  });
  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  console.log("→ Navigating to /login");
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  console.log("✓ Logged in, URL:", page.url());

  console.log("→ Navigating to /dashboard/agenda");
  await page.goto(`${BASE}/dashboard/agenda`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "sprint5-agenda-list.png", fullPage: true });
  console.log("✓ Screenshot: sprint5-agenda-list.png");

  console.log("→ Opening create modal");
  await page.click('button:has-text("Novo compromisso")');
  await page.waitForSelector('text="Novo compromisso"', { timeout: 5000 });
  await page.fill('input[placeholder*="Médico"]', "Consulta dermato");
  // deixar datetime como está (default +1h)
  await page.fill('textarea', "Trazer encaminhamento");
  await page.screenshot({ path: "sprint5-agenda-modal.png" });
  console.log("✓ Screenshot: sprint5-agenda-modal.png");

  await page.click('button:has-text("Criar")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "sprint5-agenda-after-create.png", fullPage: true });
  console.log("✓ Screenshot: sprint5-agenda-after-create.png");

  // marcar como realizado o primeiro "Médico"
  console.log("→ Marking first appointment as realizado");
  const firstCheck = page.locator('button[title="Marcar como realizado"]').first();
  if (await firstCheck.count() > 0) {
    await firstCheck.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "sprint5-agenda-marked-done.png", fullPage: true });
    console.log("✓ Screenshot: sprint5-agenda-marked-done.png");
  }

  await browser.close();
  console.log("✓ Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
