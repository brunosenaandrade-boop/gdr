#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";

const SUPABASE_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const localPath = "C:\\Users\\Outlier\\Downloads\\arquitetura-liberdade-v4\\output\\Arquitetura_da_Liberdade_v4.pdf";
const remotePath = "arquitetura-liberdade/Arquitetura_da_Liberdade.pdf";

const buffer = await fs.readFile(localPath);
const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
console.log(`Enviando PDF (${sizeMB} MB)...`);

const { error } = await supabase.storage
  .from("bump-products")
  .upload(remotePath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

if (error) {
  console.error(`❌ Erro: ${error.message}`);
  process.exit(1);
}
console.log("✅ PDF enviado com sucesso");
