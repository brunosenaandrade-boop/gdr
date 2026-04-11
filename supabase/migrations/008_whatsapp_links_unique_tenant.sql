-- Garante que cada tenant pode ter apenas um número WhatsApp vinculado
-- Necessário para upsert com ON CONFLICT (tenant_id)
ALTER TABLE whatsapp_links ADD CONSTRAINT whatsapp_links_tenant_id_key UNIQUE (tenant_id);
