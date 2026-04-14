-- Sistema de afiliados e cupons
-- Afiliados logam via Supabase Auth separado (user_id), promovem com cupom,
-- comissão calculada automaticamente via webhook Hotmart.

-- ============================================================
-- affiliates: cadastro de afiliados
-- ============================================================
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf_cnpj TEXT,
  phone TEXT,
  pix_key TEXT,
  -- Código do afiliado na Hotmart (quando usa afiliação nativa)
  hotmart_affiliate_code TEXT,
  -- Email usado na Hotmart (pode diferir do cadastro)
  hotmart_email TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00
    CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_email ON affiliates(email);
CREATE INDEX idx_affiliates_hotmart_code
  ON affiliates(hotmart_affiliate_code)
  WHERE hotmart_affiliate_code IS NOT NULL;
CREATE INDEX idx_affiliates_hotmart_email
  ON affiliates(hotmart_email)
  WHERE hotmart_email IS NOT NULL;

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Afiliado vê só os próprios dados
CREATE POLICY "Affiliate self read" ON affiliates
  FOR SELECT USING (user_id = auth.uid());

-- Service role: acesso total (admin + webhook Hotmart)
CREATE POLICY "Service role full access" ON affiliates
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- coupons: códigos de desconto (vinculados opcionalmente a afiliados)
-- ============================================================
CREATE TABLE coupons (
  -- código é o PRIMARY KEY (ex: "TITTO10", "BLACKFRIDAY20")
  code TEXT PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  -- Desconto em % (0 = cupom só de tracking, sem desconto)
  discount_pct INT NOT NULL DEFAULT 0
    CHECK (discount_pct >= 0 AND discount_pct <= 50),
  -- NULL = ilimitado
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  valid_until DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coupons_affiliate ON coupons(affiliate_id)
  WHERE affiliate_id IS NOT NULL;
CREATE INDEX idx_coupons_active ON coupons(active, valid_until)
  WHERE active = true;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Afiliado vê só os cupons vinculados a ele
CREATE POLICY "Affiliate sees own coupons" ON coupons
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access" ON coupons
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- affiliate_sales: vendas atribuídas a afiliados
-- ============================================================
CREATE TABLE affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  coupon_code TEXT REFERENCES coupons(code) ON DELETE SET NULL,
  -- Valor bruto da venda (centavos)
  sale_amount_cents INT NOT NULL CHECK (sale_amount_cents >= 0),
  -- Comissão a pagar ao afiliado (centavos)
  commission_amount_cents INT NOT NULL CHECK (commission_amount_cents >= 0),
  -- Taxa aplicada no momento da venda (para auditoria histórica)
  commission_rate_applied DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','refunded','canceled')),
  -- Como a venda foi atribuída ao afiliado
  attribution_source TEXT NOT NULL
    CHECK (attribution_source IN ('coupon','hotmart_affiliate','manual')),
  -- Referência Hotmart
  hotmart_transaction TEXT,
  hotmart_event_id UUID REFERENCES subscription_events(id) ON DELETE SET NULL,
  -- Pagamento
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_method TEXT,
  paid_notes TEXT,
  -- Reembolso (quando venda vira refunded)
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_affiliate_sales_affiliate_status
  ON affiliate_sales(affiliate_id, status, created_at DESC);
CREATE INDEX idx_affiliate_sales_subscription
  ON affiliate_sales(subscription_id)
  WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_affiliate_sales_transaction
  ON affiliate_sales(hotmart_transaction)
  WHERE hotmart_transaction IS NOT NULL;
CREATE INDEX idx_affiliate_sales_pending_date
  ON affiliate_sales(status, created_at DESC)
  WHERE status = 'pending';

-- Evita duplicação: uma transação Hotmart só pode virar 1 affiliate_sale
CREATE UNIQUE INDEX idx_affiliate_sales_unique_transaction
  ON affiliate_sales(hotmart_transaction)
  WHERE hotmart_transaction IS NOT NULL;

ALTER TABLE affiliate_sales ENABLE ROW LEVEL SECURITY;

-- Afiliado vê só as próprias vendas
CREATE POLICY "Affiliate sees own sales" ON affiliate_sales
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access" ON affiliate_sales
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Trigger: updated_at automático em affiliates e coupons
-- ============================================================
CREATE OR REPLACE FUNCTION affiliate_update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION affiliate_update_timestamp();

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION affiliate_update_timestamp();

CREATE TRIGGER affiliate_sales_updated_at
  BEFORE UPDATE ON affiliate_sales
  FOR EACH ROW EXECUTE FUNCTION affiliate_update_timestamp();
