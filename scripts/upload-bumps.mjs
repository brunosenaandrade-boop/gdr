#!/usr/bin/env node
/**
 * Script pra subir os arquivos de order bump no Supabase Storage.
 * Cria o bucket 'bump-products' (privado) se não existir.
 *
 * Uso: node scripts/upload-bumps.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_DIR = "C:\\Users\\Outlier\\Downloads\\arquitetura-liberdade-v4\\output";
const BUCKET = "bump-products";

if (!SERVICE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não definida no env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const FILES = [
  { local: "Arquitetura_da_Liberdade_v4.pdf", remote: "arquitetura-liberdade/Arquitetura_da_Liberdade.pdf", type: "application/pdf" },
  { local: "Workbook_Dia_Perfeito.pdf", remote: "arquitetura-liberdade/Workbook_Dia_Perfeito.pdf", type: "application/pdf" },
  { local: "Simulador_Cenarios.xlsx", remote: "arquitetura-liberdade/Simulador_Cenarios.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { local: "Mapa_do_Pacote.png", remote: "arquitetura-liberdade/Mapa_do_Pacote.png", type: "image/png" },
  { local: "LEIA-ME.txt", remote: "arquitetura-liberdade/LEIA-ME.txt", type: "text/plain" },
];

async function ensureBucket() {
  console.log(`📦 Verificando bucket '${BUCKET}'...`);
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.name === BUCKET);

  if (exists) {
    console.log(`✅ Bucket '${BUCKET}' já existe`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  if (error) {
    console.error(`❌ Erro criando bucket: ${error.message}`);
    process.exit(1);
  }
  console.log(`✅ Bucket '${BUCKET}' criado (privado)`);
}

async function uploadFile(file) {
  const localPath = path.join(SOURCE_DIR, file.local);
  const buffer = await fs.readFile(localPath);
  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

  console.log(`⬆️  Enviando ${file.local} (${sizeMB} MB) → ${file.remote}`);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(file.remote, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error(`❌ Erro: ${error.message}`);
    return { ok: false, error: error.message, size: buffer.length };
  }

  console.log(`✅ ${file.local} enviado`);
  return { ok: true, size: buffer.length };
}

async function main() {
  console.log(`\n🚀 Upload de order bumps — Supabase Storage\n`);
  await ensureBucket();
  console.log();

  const results = [];
  for (const file of FILES) {
    const result = await uploadFile(file);
    results.push({ ...file, ...result });
  }

  console.log("\n📊 Resumo:");
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  const totalMB = results.reduce((s, r) => s + (r.size ?? 0), 0) / (1024 * 1024);

  console.log(`   ✅ ${ok.length} enviados`);
  console.log(`   ❌ ${fail.length} falhas`);
  console.log(`   💾 ${totalMB.toFixed(2)} MB total`);

  if (fail.length > 0) {
    console.log("\n❌ Arquivos que falharam:");
    fail.forEach((f) => console.log(`   - ${f.local}: ${f.error}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
