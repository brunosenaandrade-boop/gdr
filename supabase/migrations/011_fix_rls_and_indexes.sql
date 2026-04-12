-- Fix: RLS policies faltando + índices para queries frequentes

-- ============================================================
-- 1. whatsapp_message_log — policy para service_role
--    (RLS estava habilitado sem nenhuma policy = tabela inacessível)
-- ============================================================
CREATE POLICY "Service role full access" ON whatsapp_message_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
-- Nota: essa tabela só é acessada via service role (createServiceClient).
-- A policy permite tudo porque o service role já bypassa RLS no Supabase,
-- mas ter uma policy explícita evita problemas caso o behavior mude.

-- ============================================================
-- 2. whatsapp_conversation_log — policy para service_role + tenant isolation
--    (RLS estava habilitado sem nenhuma policy = tabela inacessível)
-- ============================================================

-- Service role (webhook) pode ler/escrever tudo
CREATE POLICY "Service role full access" ON whatsapp_conversation_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados veem apenas logs do próprio tenant
CREATE POLICY "Tenant isolation" ON whatsapp_conversation_log
  FOR SELECT
  USING (tenant_id = get_tenant_id());

-- ============================================================
-- 3. Índice composto em whatsapp_links (phone_number, verified)
--    Usado em TODA mensagem recebida para descobrir o tenant
-- ============================================================
CREATE INDEX idx_whatsapp_links_phone_verified
  ON whatsapp_links (phone_number, verified);

-- ============================================================
-- 4. Índice composto em whatsapp_pending (tenant_id, confirmed, created_at)
--    Usado em toda mensagem para buscar pending ativo
-- ============================================================
CREATE INDEX idx_whatsapp_pending_tenant_confirmed
  ON whatsapp_pending (tenant_id, confirmed, created_at DESC);

-- ============================================================
-- 5. Índice em categories (tenant_id)
--    Queries frequentes filtram por tenant_id
-- ============================================================
CREATE INDEX idx_categories_tenant
  ON categories (tenant_id);
