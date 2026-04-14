-- Adiciona flag pra rastrear se afiliado já trocou a senha temporária
-- Usado para mostrar banner de "trocar senha" no painel.

ALTER TABLE affiliates
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT true;

-- Afiliados existentes (já criados antes dessa flag) ficam com false
-- (assumindo que se já existem, ou já trocaram ou já estão usando a temporária)
UPDATE affiliates SET must_change_password = false WHERE created_at < now();
