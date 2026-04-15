-- Order Bumps: produtos digitais vendidos junto com o plano principal no checkout Hotmart.
-- Catálogo (bump_products) + instâncias de compra (purchase_bumps).

-- ============================================================
-- bump_products: catálogo de bumps disponíveis
-- Admin cadastra aqui o mapeamento: hotmart_product_id → arquivo(s) de download
-- ============================================================
CREATE TABLE bump_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ID do produto no Hotmart (deve bater com o que vem no webhook)
  hotmart_product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  amount_cents INT NOT NULL CHECK (amount_cents >= 0),
  -- Lista de arquivos do pacote: [{ "storage_path": "bump-products/xxx.pdf", "filename": "eBook.pdf", "size_bytes": 53248718 }]
  files JSONB NOT NULL DEFAULT '[]'::JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bump_products_hotmart ON bump_products(hotmart_product_id);
CREATE INDEX idx_bump_products_active ON bump_products(active) WHERE active = true;

ALTER TABLE bump_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON bump_products FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- purchase_bumps: instâncias de compras de bumps
-- Uma linha por produto extra que o cliente comprou no checkout
-- ============================================================
CREATE TABLE purchase_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  bump_product_id UUID REFERENCES bump_products(id) ON DELETE SET NULL,
  -- Snapshots no momento da compra (caso bump_product mude depois)
  hotmart_product_id TEXT NOT NULL,
  bump_name TEXT NOT NULL,
  amount_cents INT NOT NULL,
  hotmart_transaction TEXT,
  hotmart_event_id UUID REFERENCES subscription_events(id) ON DELETE SET NULL,
  -- Status de entrega ao cliente (via WhatsApp/email)
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','delivered','failed')),
  delivery_error TEXT,
  delivered_at TIMESTAMPTZ,
  -- Quantas vezes o cliente pediu novo link (pra debug/auditoria)
  resend_count INT NOT NULL DEFAULT 0,
  last_resend_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_purchase_bumps_tenant ON purchase_bumps(tenant_id, created_at DESC);
CREATE INDEX idx_purchase_bumps_delivery ON purchase_bumps(delivery_status, created_at);
CREATE INDEX idx_purchase_bumps_transaction
  ON purchase_bumps(hotmart_transaction, hotmart_product_id);

-- Idempotência: uma mesma transação Hotmart + produto não pode criar 2 bumps
CREATE UNIQUE INDEX idx_purchase_bumps_unique
  ON purchase_bumps(hotmart_transaction, hotmart_product_id)
  WHERE hotmart_transaction IS NOT NULL;

ALTER TABLE purchase_bumps ENABLE ROW LEVEL SECURITY;
-- Tenant vê só as próprias compras
CREATE POLICY "Tenant sees own bumps" ON purchase_bumps
  FOR SELECT USING (tenant_id = get_tenant_id());
CREATE POLICY "Service role full access" ON purchase_bumps FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER bump_products_updated_at
  BEFORE UPDATE ON bump_products
  FOR EACH ROW EXECUTE FUNCTION affiliate_update_timestamp();
