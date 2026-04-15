#!/usr/bin/env node
/**
 * Cadastra o order bump 'Arquitetura da Liberdade' na tabela bump_products.
 * Idempotente: se já existe com o hotmart_product_id, só atualiza.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ecojxxmsdmhqtmwvkjwg.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// IMPORTANTE: substituir pelo hotmart_product_id real do bump quando criar na Hotmart
// Placeholder por enquanto (será atualizado quando você criar o bump na Hotmart)
const HOTMART_PRODUCT_ID = "BUMP_ARQUITETURA_LIBERDADE";

const bumpData = {
  hotmart_product_id: HOTMART_PRODUCT_ID,
  name: "Arquitetura da Liberdade — Pacote Completo",
  description:
    "eBook de 57 páginas (10 capítulos) + Workbook interativo Meu Dia Perfeito + Planilha Simulador de Cenários. " +
    "Tudo que você precisa pra desenhar o estilo de vida que quer e atingir independência financeira.",
  amount_cents: 6700, // R$ 67,00
  files: [
    {
      storage_path: "arquitetura-liberdade/Arquitetura_da_Liberdade.pdf",
      filename: "Arquitetura_da_Liberdade.pdf",
      size_bytes: 53248718,
    },
    {
      storage_path: "arquitetura-liberdade/Workbook_Dia_Perfeito.pdf",
      filename: "Workbook_Dia_Perfeito.pdf",
      size_bytes: 147142,
    },
    {
      storage_path: "arquitetura-liberdade/Simulador_Cenarios.xlsx",
      filename: "Simulador_Cenarios.xlsx",
      size_bytes: 35726,
    },
    {
      storage_path: "arquitetura-liberdade/Mapa_do_Pacote.png",
      filename: "Mapa_do_Pacote.png",
      size_bytes: 2251681,
    },
    {
      storage_path: "arquitetura-liberdade/LEIA-ME.txt",
      filename: "LEIA-ME.txt",
      size_bytes: 2004,
    },
  ],
  active: true,
};

const { data, error } = await supabase
  .from("bump_products")
  .upsert(bumpData, { onConflict: "hotmart_product_id" })
  .select("id, name")
  .maybeSingle();

if (error) {
  console.error("❌ Erro:", error.message);
  process.exit(1);
}

console.log("✅ Bump product cadastrado:");
console.log(`   ID: ${data?.id}`);
console.log(`   Name: ${data?.name}`);
console.log(`   Hotmart product ID (placeholder): ${HOTMART_PRODUCT_ID}`);
console.log("");
console.log("⚠️  Quando você criar o bump na Hotmart, atualize o hotmart_product_id");
console.log("    via /admin/bumps ou execute:");
console.log(`    UPDATE bump_products SET hotmart_product_id = 'ID_REAL' WHERE id = '${data?.id}';`);
