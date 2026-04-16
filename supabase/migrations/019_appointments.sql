-- Sprint 5: Compromissos (agenda pessoal integrada ao WhatsApp)
-- Tabela appointments: compromissos do usuário com lembrete automático 30min antes

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  reminder_sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'realizado', 'cancelado')),
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('web', 'whatsapp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date
  ON appointments(tenant_id, scheduled_at);

-- Index específico pro cron de lembretes (só pendentes sem lembrete enviado)
CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON appointments(scheduled_at, reminder_sent_at)
  WHERE status = 'pendente' AND reminder_sent_at IS NULL;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation appointments" ON appointments;
CREATE POLICY "Tenant isolation appointments"
  ON appointments
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS "Service role appointments" ON appointments;
CREATE POLICY "Service role appointments"
  ON appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger pra manter updated_at em dia
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

COMMENT ON TABLE appointments IS 'Compromissos pessoais com lembrete 30min antes via WhatsApp';
