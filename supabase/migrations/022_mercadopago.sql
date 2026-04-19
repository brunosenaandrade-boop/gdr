-- Migração: renomear campos Hotmart → genérico + Mercado Pago como gateway padrão
-- Remove TODO vestígio de Hotmart/InfinitePay nos nomes de campos.

-- 1. Subscriptions: dropar campos hotmart_* (já tem equivalentes genéricos da 021)
ALTER TABLE subscriptions DROP COLUMN IF EXISTS hotmart_transaction;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS hotmart_subscriber_code;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS hotmart_buyer_email;

-- Adicionar subscriber_code e buyer_email se não existirem
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'subscriber_code') THEN
    ALTER TABLE subscriptions ADD COLUMN subscriber_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'buyer_email') THEN
    ALTER TABLE subscriptions ADD COLUMN buyer_email TEXT;
  END IF;
END $$;

-- Atualizar constraint de gateway
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_gateway_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_gateway_check
  CHECK (gateway IN ('mercadopago'));
ALTER TABLE subscriptions ALTER COLUMN gateway SET DEFAULT 'mercadopago';

-- Limpar dados antigos (não tem clientes reais)
UPDATE subscriptions SET gateway = 'mercadopago' WHERE gateway != 'mercadopago';

-- 2. Subscription events: renomear hotmart_event_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_events' AND column_name = 'hotmart_event_id') THEN
    ALTER TABLE subscription_events RENAME COLUMN hotmart_event_id TO gateway_event_id;
  END IF;
END $$;

-- Adicionar buyer_email se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_events' AND column_name = 'buyer_email') THEN
    ALTER TABLE subscription_events ADD COLUMN buyer_email TEXT;
  END IF;
END $$;

-- Adicionar gateway_event_id se não existir (caso hotmart_event_id não existia)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_events' AND column_name = 'gateway_event_id') THEN
    ALTER TABLE subscription_events ADD COLUMN gateway_event_id TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_events_gateway_id
      ON subscription_events(gateway_event_id) WHERE gateway_event_id IS NOT NULL;
  END IF;
END $$;

-- 3. Affiliate sales: renomear hotmart_transaction
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_sales' AND column_name = 'hotmart_transaction') THEN
    ALTER TABLE affiliate_sales RENAME COLUMN hotmart_transaction TO gateway_transaction_id;
  END IF;
END $$;

-- 4. Purchase bumps: renomear hotmart_product_id → product_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_bumps' AND column_name = 'hotmart_product_id') THEN
    ALTER TABLE purchase_bumps RENAME COLUMN hotmart_product_id TO product_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bump_products' AND column_name = 'hotmart_product_id') THEN
    ALTER TABLE bump_products RENAME COLUMN hotmart_product_id TO product_id;
  END IF;
END $$;

-- 5. Affiliates: renomear hotmart_* → genérico
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliates' AND column_name = 'hotmart_affiliate_code') THEN
    ALTER TABLE affiliates RENAME COLUMN hotmart_affiliate_code TO affiliate_code;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliates' AND column_name = 'hotmart_email') THEN
    ALTER TABLE affiliates RENAME COLUMN hotmart_email TO affiliate_email;
  END IF;
END $$;

COMMENT ON TABLE subscriptions IS 'Assinaturas gerenciadas via Mercado Pago (PIX, cartão, boleto)';
