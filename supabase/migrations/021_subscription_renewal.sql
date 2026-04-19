-- Migração: campos pra suporte a múltiplos gateways + renovação manual
-- InfinitePay não tem recorrência nativa, então gerenciamos do nosso lado.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS
  renewal_link_sent_at TIMESTAMPTZ;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS
  gateway TEXT DEFAULT 'hotmart' CHECK (gateway IN ('hotmart', 'infinitepay'));

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS
  gateway_transaction_id TEXT;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS
  plan_type TEXT DEFAULT 'anual' CHECK (plan_type IN ('mensal', 'anual'));

-- Índice pra cron de renovação (busca subscriptions prestes a vencer)
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal
  ON subscriptions(current_period_end, status)
  WHERE status IN ('active', 'past_due') AND renewal_link_sent_at IS NULL;

COMMENT ON COLUMN subscriptions.gateway IS 'Gateway de pagamento: hotmart ou infinitepay';
COMMENT ON COLUMN subscriptions.plan_type IS 'Tipo de plano: mensal (30d) ou anual (365d)';
COMMENT ON COLUMN subscriptions.renewal_link_sent_at IS 'Quando o link de renovação foi enviado (pra não reenviar)';
