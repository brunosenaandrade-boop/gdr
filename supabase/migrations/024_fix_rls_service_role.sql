-- ============================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA
--
-- Problema: policies "Service role full access" com USING(true)
-- sem restrição TO service_role permitem que QUALQUER usuário
-- autenticado (via anon key + client SDK) leia/escreva nessas tabelas.
--
-- Fix: dropar policies antigas e recriar com TO service_role.
-- O service_role já bypassa RLS por padrão no Supabase, mas
-- ter policies explícitas com TO service_role é defesa em profundidade.
-- ============================================================

-- 1. whatsapp_message_log (migration 011)
DROP POLICY IF EXISTS "Service role full access" ON whatsapp_message_log;
CREATE POLICY "Service role full access" ON whatsapp_message_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. whatsapp_conversation_log (migration 011)
DROP POLICY IF EXISTS "Service role full access" ON whatsapp_conversation_log;
CREATE POLICY "Service role full access" ON whatsapp_conversation_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. subscriptions (migration 014)
DROP POLICY IF EXISTS "Service role full access" ON subscriptions;
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. subscription_events (migration 014)
DROP POLICY IF EXISTS "Service role full access" ON subscription_events;
CREATE POLICY "Service role full access" ON subscription_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. admin_users (migration 015)
DROP POLICY IF EXISTS "Service role full access" ON admin_users;
CREATE POLICY "Service role full access" ON admin_users
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 6. admin_audit_log (migration 015)
DROP POLICY IF EXISTS "Service role full access" ON admin_audit_log;
CREATE POLICY "Service role full access" ON admin_audit_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 7. user_rate_limits (migration 015)
DROP POLICY IF EXISTS "Service role full access" ON user_rate_limits;
CREATE POLICY "Service role full access" ON user_rate_limits
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 8. ai_usage (migration 015)
DROP POLICY IF EXISTS "Service role full access" ON ai_usage;
CREATE POLICY "Service role full access" ON ai_usage
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 9. affiliates (migration 016)
DROP POLICY IF EXISTS "Service role full access" ON affiliates;
CREATE POLICY "Service role full access" ON affiliates
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 10. coupons (migration 016)
DROP POLICY IF EXISTS "Service role full access" ON coupons;
CREATE POLICY "Service role full access" ON coupons
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 11. affiliate_sales (migration 016)
DROP POLICY IF EXISTS "Service role full access" ON affiliate_sales;
CREATE POLICY "Service role full access" ON affiliate_sales
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 12. bump_products (migration 018)
DROP POLICY IF EXISTS "Service role full access" ON bump_products;
CREATE POLICY "Service role full access" ON bump_products
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 13. purchase_bumps (migration 018)
DROP POLICY IF EXISTS "Service role full access" ON purchase_bumps;
CREATE POLICY "Service role full access" ON purchase_bumps
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
