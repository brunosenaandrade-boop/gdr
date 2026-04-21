-- checkout_leads: captura email antes do usuário redirecionar pro Mercado Pago.
-- Antes desta migration, emails preenchidos no modal /planos eram perdidos se o
-- usuário abandonasse o checkout no MP. Agora são persistidos com status='pending'
-- e o webhook marca como 'completed' quando o pagamento é aprovado.
--
-- Uso esperado:
-- - /api/subscriptions/preapproval   → INSERT com payment_method='recurring'
-- - /api/subscriptions/checkout-pro  → INSERT com payment_method='one-time'
-- - /api/webhooks/mercadopago        → UPDATE completed_at + status='completed'
-- - Cron opcional futuro             → status='abandoned' após 24h sem completar

CREATE TABLE IF NOT EXISTS checkout_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  plan_type           TEXT NOT NULL CHECK (plan_type IN ('mensal', 'anual')),
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('recurring', 'one-time')),
  has_bump            BOOLEAN NOT NULL DEFAULT false,
  tenant_id           UUID REFERENCES tenants(id) ON DELETE SET NULL,
  external_reference  TEXT NOT NULL,
  mp_preference_id    TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'completed', 'abandoned')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  ip_address          TEXT,
  user_agent          TEXT
);

CREATE INDEX IF NOT EXISTS idx_checkout_leads_email
  ON checkout_leads (email);

CREATE INDEX IF NOT EXISTS idx_checkout_leads_external_ref
  ON checkout_leads (external_reference);

CREATE INDEX IF NOT EXISTS idx_checkout_leads_status_created
  ON checkout_leads (status, created_at DESC);

-- RLS: apenas service role acessa (dados sensíveis, usados por admin/cron).
-- Usuário final não precisa ler seus próprios leads (essa info aparece em /configuracoes
-- via subscriptions quando a compra é concluída).
ALTER TABLE checkout_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON checkout_leads;
CREATE POLICY "Service role full access" ON checkout_leads
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE checkout_leads IS 'Leads capturados no modal de /planos antes do redirect pro Mercado Pago. Permite recuperação de carrinhos abandonados via email.';
