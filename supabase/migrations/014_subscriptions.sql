-- Sistema de assinaturas Hotmart
-- Cada tenant tem 1 subscription. Webhook Hotmart cria/atualiza via service role.

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'active',       -- assinatura ativa
    'canceled',     -- cancelada pelo usuário (mantém acesso até current_period_end)
    'expired',      -- passou do period_end, sem renovar
    'past_due',     -- cobrança falhou, grace period 3 dias
    'refunded',     -- reembolso emitido
    'chargeback'    -- chargeback no cartão
  )),
  hotmart_transaction TEXT,            -- última transaction ID
  hotmart_subscriber_code TEXT,        -- código do assinante Hotmart (pra gerenciar)
  hotmart_buyer_email TEXT,            -- email usado no Hotmart (pode diferir do cadastro)
  current_period_end TIMESTAMPTZ,      -- até quando o acesso vale
  canceled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  past_due_since TIMESTAMPTZ,          -- início do período past_due (pra calcular 3 dias de graça)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_status ON subscriptions(status, current_period_end);
CREATE INDEX idx_subscriptions_hotmart_email ON subscriptions(hotmart_buyer_email);

-- Histórico completo de eventos do webhook (auditoria + idempotência)
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,            -- PURCHASE_APPROVED, PURCHASE_REFUNDED, etc
  hotmart_event_id TEXT,               -- ID do evento Hotmart pra idempotência
  hotmart_transaction TEXT,
  buyer_email TEXT,
  payload JSONB NOT NULL,              -- payload completo do webhook
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  received_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_subscription_events_hotmart_id
  ON subscription_events(hotmart_event_id)
  WHERE hotmart_event_id IS NOT NULL;

CREATE INDEX idx_subscription_events_tenant ON subscription_events(tenant_id, received_at DESC);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Tenant vê só a própria assinatura
CREATE POLICY "Tenant reads own subscription" ON subscriptions
  FOR SELECT USING (tenant_id = get_tenant_id());

-- Service role full access (webhook Hotmart)
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON subscription_events
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger: ao criar tenant, cria subscription com status=expired (sem trial)
-- Usuário precisa pagar via Hotmart pra ativar
CREATE OR REPLACE FUNCTION create_initial_subscription() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (tenant_id, status)
  VALUES (NEW.id, 'expired')
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created_subscription
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_initial_subscription();
