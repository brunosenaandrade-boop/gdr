-- Log de mensagens processadas para idempotência
CREATE TABLE whatsapp_message_log (
  message_id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Index para limpeza periódica
CREATE INDEX idx_message_log_processed_at ON whatsapp_message_log (processed_at);

-- RLS: apenas service role pode acessar
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;
