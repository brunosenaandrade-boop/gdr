CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'whatsapp')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_type ON transactions(tenant_id, type);
CREATE INDEX idx_transactions_status ON transactions(tenant_id, status);
CREATE INDEX idx_transactions_due_date ON transactions(tenant_id, due_date);
