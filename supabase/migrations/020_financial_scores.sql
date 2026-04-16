-- Sprint 6: Score Financeiro 0-1000
-- Histórico de scores calculados semanalmente (ou sob demanda) pra cada tenant.
-- breakdown armazena os componentes do cálculo pra mostrar no dashboard.

CREATE TABLE IF NOT EXISTS financial_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 1000),
  breakdown JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_tenant_date
  ON financial_scores(tenant_id, calculated_at DESC);

ALTER TABLE financial_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation financial_scores" ON financial_scores;
CREATE POLICY "Tenant isolation financial_scores"
  ON financial_scores
  FOR SELECT
  USING (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS "Service role financial_scores" ON financial_scores;
CREATE POLICY "Service role financial_scores"
  ON financial_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE financial_scores IS 'Score financeiro 0-1000 calculado semanalmente. breakdown tem os componentes do cálculo.';
