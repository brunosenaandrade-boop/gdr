-- Log completo de conversas bidirecionais (user <-> bot) via WhatsApp
-- Facilita debug de interações e auditoria
CREATE TABLE whatsapp_conversation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'audio', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversation_log_tenant ON whatsapp_conversation_log (tenant_id, created_at DESC);
CREATE INDEX idx_conversation_log_phone ON whatsapp_conversation_log (phone_number, created_at DESC);
CREATE INDEX idx_conversation_log_created_at ON whatsapp_conversation_log (created_at);

ALTER TABLE whatsapp_conversation_log ENABLE ROW LEVEL SECURITY;
