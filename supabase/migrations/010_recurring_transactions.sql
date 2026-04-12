-- Transações recorrentes (aluguel, salário, Netflix, etc.)
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  active BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recurring_tenant ON recurring_transactions (tenant_id);
CREATE INDEX idx_recurring_active ON recurring_transactions (active, day_of_month);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON recurring_transactions
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
