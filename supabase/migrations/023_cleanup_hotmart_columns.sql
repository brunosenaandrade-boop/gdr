-- Cleanup: remover colunas hotmart_* órfãs que sobraram da migração

ALTER TABLE affiliate_sales DROP COLUMN IF EXISTS hotmart_event_id;
ALTER TABLE purchase_bumps DROP COLUMN IF EXISTS hotmart_event_id;
ALTER TABLE purchase_bumps DROP COLUMN IF EXISTS hotmart_transaction;
ALTER TABLE subscription_events DROP COLUMN IF EXISTS hotmart_transaction;

-- Drop foreign keys órfãs (se existirem)
ALTER TABLE affiliate_sales DROP CONSTRAINT IF EXISTS affiliate_sales_hotmart_event_id_fkey;
ALTER TABLE purchase_bumps DROP CONSTRAINT IF EXISTS purchase_bumps_hotmart_event_id_fkey;
