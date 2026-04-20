-- Cron de lembrete de onboarding incompleto precisa marcar "já enviou"
-- para não incomodar o cliente todo dia.
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
