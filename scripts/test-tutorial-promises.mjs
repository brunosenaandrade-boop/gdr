/**
 * Teste completo de TUDO que o tutorial promete pro cliente.
 * Simula mensagens WhatsApp via webhook e verifica respostas.
 *
 * Cada teste envia uma mensagem como se fosse o cliente e lê
 * a resposta do conversation_log.
 */
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjb2p4eG1zZG1ocXRtd3ZrandnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTE5MiwiZXhwIjoyMDkxMTk3MTkyfQ.-y9Raxk5rGeS5WRtaJcOI1-y8VhX3cXaRgOUVtPkrWg";
const WEBHOOK_URL = "https://www.guardadinheiro.com.br/api/webhooks/whatsapp";
const PHONE = "554898649898";

// Precisa das env vars do Vercel
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
if (!APP_SECRET) {
  console.error("WHATSAPP_APP_SECRET não definido. Rode: npx vercel env pull .env.vercel.tmp && source .env.vercel.tmp");
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY);

function buildPayload(text) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "WABA_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: { display_phone_number: "554820270106", phone_number_id: "979072601966871" },
          messages: [{
            from: PHONE,
            id: `wamid.test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: text },
            type: "text",
          }],
        },
        field: "messages",
      }],
    }],
  };
}

async function sendMessage(text) {
  const body = JSON.stringify(buildPayload(text));
  const signature = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex");

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": signature,
    },
    body,
  });

  if (!res.ok) {
    console.error(`  WEBHOOK ERROR: ${res.status} ${await res.text()}`);
    return null;
  }
  return res.status;
}

async function getLastBotResponse(afterTimestamp) {
  // Esperar resposta do bot (até 15s)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    const { data } = await sb
      .from("whatsapp_conversation_log")
      .select("content, created_at")
      .eq("phone_number", PHONE)
      .eq("direction", "out")
      .gt("created_at", afterTimestamp)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data.content;
  }
  return null;
}

async function testCase(name, message, expectContains) {
  const before = new Date().toISOString();
  process.stdout.write(`\n🧪 ${name}\n   Enviando: "${message}"\n`);

  const status = await sendMessage(message);
  if (!status) {
    console.log(`   ❌ FALHA: webhook não respondeu`);
    return { name, pass: false, reason: "webhook error" };
  }

  const response = await getLastBotResponse(before);
  if (!response) {
    console.log(`   ❌ FALHA: sem resposta do bot (timeout 15s)`);
    return { name, pass: false, reason: "timeout" };
  }

  const truncated = response.length > 150 ? response.substring(0, 150) + "..." : response;
  console.log(`   Resposta: "${truncated}"`);

  if (Array.isArray(expectContains)) {
    const allMatch = expectContains.every(exp =>
      response.toLowerCase().includes(exp.toLowerCase())
    );
    if (allMatch) {
      console.log(`   ✅ PASSOU`);
      return { name, pass: true };
    } else {
      const missing = expectContains.filter(exp => !response.toLowerCase().includes(exp.toLowerCase()));
      console.log(`   ❌ FALHA: esperava conter: ${missing.join(", ")}`);
      return { name, pass: false, reason: `missing: ${missing.join(", ")}`, response };
    }
  }

  // Se não tem expectativa, só verifica que não é "Não entendi"
  if (response.includes("Não consegui identificar") || response.includes("Não entendi")) {
    console.log(`   ❌ FALHA: bot não entendeu`);
    return { name, pass: false, reason: "not understood", response };
  }

  console.log(`   ✅ PASSOU (resposta recebida)`);
  return { name, pass: true };
}

async function run() {
  console.log("═══════════════════════════════════════════");
  console.log("  TESTE COMPLETO DO TUTORIAL GUARDA DINHEIRO");
  console.log("  Testando CADA promessa feita ao cliente");
  console.log("═══════════════════════════════════════════");

  const results = [];

  // ━━━ TELA 1: BOAS PRÁTICAS ━━━
  // Promessa: "Enviar mensagens de texto ou áudio"
  // Promessa: "Tudo em uma única mensagem"

  // ━━━ TELA 2: REGISTRO DE TRANSAÇÕES ━━━
  results.push(await testCase(
    "Registro: despesa simples",
    "Gastei 35 reais no mercado",
    ["mercado", "35"]
  ));

  // Esperar 3s entre testes pra não sobrecarregar
  await new Promise(r => setTimeout(r, 3000));

  // Confirmar o pending se necessário
  results.push(await testCase(
    "Confirmação: sim",
    "Sim",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Registro: despesa com data",
    "Paguei 5 mil de aluguel dia 5",
    ["aluguel", "5"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Confirmação: sim",
    "Sim",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Registro: receita",
    "Recebi 1500 do cliente João",
    ["1.500", "João"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Confirmação: sim",
    "Sim",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  // ━━━ TELA 4: COMPROMISSOS ━━━
  results.push(await testCase(
    "Compromisso: médico amanhã",
    "Tenho médico amanhã às 16 horas",
    ["médico", "16"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Compromisso: daqui a 30 min",
    "Me lembre daqui a 30 minutos de ligar pro dentista",
    ["dentista"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  // ━━━ TELA 5: RECORRÊNCIAS ━━━
  results.push(await testCase(
    "Recorrência: aluguel todo dia 5",
    "Tenho pra pagar 2 mil de aluguel todo dia 5",
    ["aluguel", "2.000"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Confirmação: sim",
    "Sim",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  // ━━━ TELA 7: CONSULTAS ━━━
  results.push(await testCase(
    "Consulta: saldo",
    "Qual meu saldo?",
    ["saldo"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Consulta: quanto gastei",
    "Quanto gastei esse mês?",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Consulta: conta atrasada",
    "Tenho conta atrasada?",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Consulta: score financeiro",
    "Qual meu score?",
    ["score"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Consulta: agenda",
    "O que eu tenho pra fazer amanhã?",
    []
  ));
  await new Promise(r => setTimeout(r, 3000));

  // ━━━ EXTRAS: Saudação, casual, suporte ━━━
  results.push(await testCase(
    "Saudação: oi",
    "Oi",
    ["Guardinha"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Casual: obrigado",
    "Obrigado",
    ["nada"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Suporte: como funciona",
    "Como funciona",
    ["Guardinha"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Suporte: quero cancelar",
    "Quero cancelar",
    ["Mercado Pago"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Suporte: quero suporte",
    "Quero suporte",
    ["contato@guardadinheiro.com.br"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  // ━━━ EDGE CASES ━━━
  results.push(await testCase(
    "Edge: número sem contexto",
    "50",
    ["de quê"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  results.push(await testCase(
    "Edge: mensagem genérica",
    "Como ganhar 15 mil até o final do ano",
    ["Posso te ajudar"]
  ));
  await new Promise(r => setTimeout(r, 3000));

  // ━━━ RELATÓRIO ━━━
  console.log("\n═══════════════════════════════════════════");
  console.log("  RELATÓRIO FINAL");
  console.log("═══════════════════════════════════════════\n");

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  for (const r of results) {
    console.log(`${r.pass ? "✅" : "❌"} ${r.name}${r.reason ? ` — ${r.reason}` : ""}`);
  }

  console.log(`\n━━━ ${passed}/${results.length} PASSARAM | ${failed} FALHARAM ━━━`);

  if (failed > 0) {
    console.log("\n❌ TESTES FALHADOS (detalhes):");
    for (const r of results.filter(r => !r.pass)) {
      console.log(`\n  ${r.name}:`);
      console.log(`  Razão: ${r.reason}`);
      if (r.response) console.log(`  Resposta: ${r.response.substring(0, 200)}`);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
