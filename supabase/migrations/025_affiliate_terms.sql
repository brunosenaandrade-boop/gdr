-- Afiliados devem aceitar termos de adesão no primeiro acesso.
-- Quando terms_accepted_at IS NULL → afiliado é redirecionado para /afiliado/termos.
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;
