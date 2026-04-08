-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_pending ENABLE ROW LEVEL SECURITY;

-- Tenants: user can only see/modify their own tenant
CREATE POLICY "Users can view own tenant" ON tenants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tenant" ON tenants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tenant" ON tenants FOR UPDATE USING (user_id = auth.uid());

-- Helper function to get tenant_id from auth.uid()
CREATE OR REPLACE FUNCTION get_tenant_id() RETURNS UUID AS $$
  SELECT id FROM tenants WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Categories: tenant isolation
CREATE POLICY "Tenant isolation" ON categories FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- Transactions: tenant isolation
CREATE POLICY "Tenant isolation" ON transactions FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- WhatsApp links: tenant isolation
CREATE POLICY "Tenant isolation" ON whatsapp_links FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- WhatsApp pending: tenant isolation
CREATE POLICY "Tenant isolation" ON whatsapp_pending FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
