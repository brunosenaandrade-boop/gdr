-- Super Admin + auditoria + rate limit por tenant + AI usage tracking

-- ============================================================
-- admin_users: lista de administradores do sistema
-- ============================================================
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin')) DEFAULT 'super_admin',
  totp_secret TEXT,                      -- base32 do segredo TOTP (encrypt em app)
  totp_enabled BOOLEAN DEFAULT false,
  recovery_codes TEXT[],                 -- array de 8 códigos de recuperação
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin reads own" ON admin_users FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- admin_audit_log: log de todas as ações administrativas
-- ============================================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                  -- ex: "user.suspend", "subscription.renew", "affiliate.create"
  target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  target_type TEXT,                      -- ex: "tenant", "subscription", "affiliate"
  target_id TEXT,                        -- UUID ou identificador do alvo
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_target_tenant ON admin_audit_log(target_tenant_id, created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON admin_audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- user_rate_limits: limites customizáveis por tenant
-- ============================================================
CREATE TABLE user_rate_limits (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  max_messages_per_day INT DEFAULT 500,
  max_audio_seconds_per_day INT DEFAULT 1800,
  ai_cost_limit_cents_per_day INT DEFAULT 500,    -- R$ 5/dia máx
  blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON user_rate_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Tenant reads own" ON user_rate_limits FOR SELECT USING (tenant_id = get_tenant_id());

-- ============================================================
-- ai_usage: log de cada chamada à OpenAI pra tracking de custo
-- ============================================================
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  model TEXT NOT NULL,                   -- 'gpt-4o-mini', 'whisper-1'
  function_name TEXT NOT NULL,           -- 'parse-lancamento', 'transcribe-audio', 'generate-response'
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  audio_seconds INT DEFAULT 0,
  estimated_cost_cents INT NOT NULL,     -- custo estimado em centavos de R$
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_function_date ON ai_usage(function_name, created_at DESC);
CREATE INDEX idx_ai_usage_date ON ai_usage(created_at DESC);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON ai_usage FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- IP tracking em whatsapp_conversation_log
-- ============================================================
ALTER TABLE whatsapp_conversation_log ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE whatsapp_conversation_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
