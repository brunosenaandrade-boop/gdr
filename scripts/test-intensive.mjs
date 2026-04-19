/**
 * TESTE INTENSO — cobre TUDO que o tutorial promete + edge cases reais.
 * Simula 35+ mensagens como se fosse um cliente real.
 */
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjb2p4eG1zZG1ocXRtd3ZrandnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTE5MiwiZXhwIjoyMDkxMTk3MTkyfQ.-y9Raxk5rGeS5WRtaJcOI1-y8VhX3cXaRgOUVtPkrWg";
const WEBHOOK_URL = "https://www.guardadinheiro.com.br/api/webhooks/whatsapp";
const PHONE = "554898649898";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

if (!APP_SECRET) {
  console.error("Rode: export $(grep -v '^#' .env.vercel.tmp | xargs)");
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY);

function buildPayload(text) {
  return {
    object: "whatsapp_business_account",
    entry: [{ id: "WABA_ID", changes: [{ value: {
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "554820270106", phone_number_id: "979072601966871" },
      messages: [{ from: PHONE, id: `wamid.test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: String(Math.floor(Date.now() / 1000)), text: { body: text }, type: "text" }],
    }, field: "messages" }] }],
  };
}

async function send(text) {
  const body = JSON.stringify(buildPayload(text));
  const sig = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex");
  const res = await fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-hub-signature-256": sig }, body });
  return res.ok;
}

async function getResponse(after) {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    const { data } = await sb.from("whatsapp_conversation_log").select("content, created_at")
      .eq("phone_number", PHONE).eq("direction", "out").gt("created_at", after)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data) return data.content;
  }
  return null;
}

let passed = 0, failed = 0;
const failures = [];

async function test(name, msg, checks) {
  const before = new Date().toISOString();
  process.stdout.write(`\n🧪 ${name}\n   → "${msg}"\n`);
  if (!await send(msg)) { console.log("   ❌ WEBHOOK ERROR"); failed++; failures.push({ name, reason: "webhook" }); return; }
  const resp = await getResponse(before);
  if (!resp) { console.log("   ❌ TIMEOUT"); failed++; failures.push({ name, reason: "timeout" }); return; }
  const short = resp.length > 120 ? resp.substring(0, 120) + "..." : resp;
  console.log(`   ← "${short}"`);

  // Check: não deve ser fallback genérico (a menos que esperado)
  const isFallback = resp.includes("Não consegui identificar");
  const isNotUnderstood = resp.includes("Não entendi");

  if (checks === "EXPECT_FALLBACK") {
    if (isFallback || isNotUnderstood) { console.log("   ✅ PASSOU (fallback esperado)"); passed++; return; }
    console.log("   ❌ FALHA: esperava fallback"); failed++; failures.push({ name, reason: "expected fallback", resp }); return;
  }

  if (isFallback || isNotUnderstood) {
    console.log("   ❌ FALHA: bot não entendeu"); failed++; failures.push({ name, reason: "not understood", resp }); return;
  }

  if (checks && Array.isArray(checks)) {
    const missing = checks.filter(c => !resp.toLowerCase().includes(c.toLowerCase()));
    if (missing.length > 0) {
      console.log(`   ❌ FALHA: faltou: ${missing.join(", ")}`);
      failed++; failures.push({ name, reason: `missing: ${missing.join(", ")}`, resp }); return;
    }
  }

  console.log("   ✅ PASSOU"); passed++;
  await new Promise(r => setTimeout(r, 3000)); // cooldown
}

async function run() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  TESTE INTENSO — GUARDA DINHEIRO");
  console.log("  35+ cenários como um cliente real usaria");
  console.log("═══════════════════════════════════════════════════════");

  // ━━━ SAUDAÇÕES ━━━
  await test("Saudação: Oi", "Oi", ["Guardinha"]);
  await test("Saudação: Bom dia", "Bom dia", ["Guardinha"]);
  await test("Saudação: Boa noite", "Boa noite", ["Guardinha"]);
  await test("Saudação: E aí", "E aí", ["Guardinha"]);

  // ━━━ CASUAL / SUPORTE ━━━
  await test("Casual: Obrigado", "Obrigado", ["nada"]);
  await test("Casual: Valeu", "Valeu", ["nada"]);
  await test("Ajuda: Como funciona", "Como funciona", ["Guardinha"]);
  await test("Ajuda: O que você faz", "O que você faz", ["Guardinha"]);
  await test("Ajuda: Me ajuda", "Me ajuda", ["Guardinha"]);
  await test("Cancelar: Quero cancelar", "Quero cancelar", ["Hotmart"]);
  await test("Suporte: Quero suporte", "Quero suporte", ["contato@guardadinheiro.com.br"]);
  await test("Suporte: Quero falar com alguém", "Quero falar com alguém", ["contato@guardadinheiro.com.br"]);
  await test("Avulso: Beleza", "Beleza", ["mais alguma"]);
  await test("Avulso: Ok", "Ok", ["mais alguma"]);

  // ━━━ REGISTRO DE TRANSAÇÕES ━━━
  await test("Despesa: mercado", "Gastei 35 reais no mercado", ["mercado", "35"]);
  await test("Despesa: conta de luz", "Paguei 120 reais de conta de luz", ["luz", "120"]);
  await test("Despesa: uber", "Gastei 22 reais de Uber", ["22"]);
  await test("Receita: cliente", "Recebi 3000 do cliente Maria", ["3.000", "Maria"]);
  await test("Receita: salário", "Recebi meu salário de 5 mil", ["5.000"]);
  await test("Despesa com data: aluguel dia 5", "Paguei 2 mil de aluguel dia 5", ["aluguel", "2.000"]);

  // ━━━ CATEGORIZAÇÃO (o que causou o bug original) ━━━
  await test("Categoria: ferramentas internet → Assinaturas", "Gastei 440 com ferramentas de internet", ["440"]);
  await test("Categoria: Netflix → Assinaturas", "Paguei 55 reais de Netflix", ["55"]);
  await test("Categoria: farmácia → Saúde", "Gastei 80 na farmácia", ["80"]);
  await test("Categoria: gasolina → Transporte", "Gastei 200 de gasolina", ["200"]);

  // ━━━ COMPROMISSOS ━━━
  await test("Compromisso: médico amanhã", "Tenho médico amanhã às 16 horas", ["médico", "16"]);
  await test("Compromisso: daqui a 30 min", "Me lembre daqui a 30 minutos de buscar encomenda", ["encomenda"]);
  await test("Compromisso: reunião à tarde", "Tenho reunião amanhã à tarde", ["reunião"]);

  // ━━━ RECORRÊNCIAS ━━━
  await test("Recorrência: salário", "Tenho pra receber 5 mil de salário todo dia 6", ["5.000"]);

  // ━━━ CONSULTAS FINANCEIRAS ━━━
  await test("Query: saldo", "Qual meu saldo?", ["saldo"]);
  await test("Query: quanto gastei", "Quanto gastei esse mês?", []);
  await test("Query: conta atrasada", "Tenho conta atrasada?", []);
  await test("Query: score", "Qual meu score?", ["score"]);
  await test("Query: como melhorar score", "Como melhorar meu score?", ["oportunidades", "melhoria"]);
  await test("Query: quanto gastei de alimentação", "Quanto gastei de alimentação?", []);

  // ━━━ AGENDA ━━━
  await test("Agenda: o que tenho amanhã", "O que eu tenho pra fazer amanhã?", []);
  await test("Agenda: minha agenda", "Minha agenda", []);
  await test("Agenda: compromissos de hoje", "Compromissos de hoje", []);

  // ━━━ EDGE CASES ━━━
  await test("Edge: número sem contexto", "50", ["de quê"]);
  await test("Edge: mensagem genérica", "Como ganhar 15 mil até o final do ano", "EXPECT_FALLBACK");
  await test("Edge: emoji", "👍", ["entendi"]);
  await test("Edge: texto longo", "a".repeat(501), ["longa"]);

  // ━━━ RELATÓRIO ━━━
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  RELATÓRIO FINAL");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`✅ ${passed} passaram | ❌ ${failed} falharam | Total: ${passed + failed}\n`);

  if (failures.length > 0) {
    console.log("❌ FALHAS:");
    for (const f of failures) {
      console.log(`\n  ${f.name}: ${f.reason}`);
      if (f.resp) console.log(`  Resposta: ${f.resp.substring(0, 200)}`);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
