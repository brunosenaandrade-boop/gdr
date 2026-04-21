-- Remove trigger que inseria subscription stub com status='expired' pra todo tenant novo.
-- QA Round 2 reportou confusão: conta recém-criada mostrava "Assinatura Expirada" em
-- /dashboard/configuracoes, parecendo que a compra havia expirado.
--
-- Abordagem nova: tenant sem compra NÃO tem linha em `subscriptions`. A UI
-- (src/app/dashboard/configuracoes/page.tsx) já trata ausência como "sem assinatura"
-- e mostra CTA pra /planos. A função hasActiveAccess em src/lib/subscriptions/access.ts
-- também trata ausência de linha como 'no_subscription' (bloqueio de acesso).

DROP TRIGGER IF EXISTS on_tenant_created_subscription ON tenants;
DROP FUNCTION IF EXISTS create_initial_subscription();

-- Limpar subscriptions stub (status='expired' sem gateway_transaction_id) remanescentes
-- de tenants que nunca compraram. Deixa intactas assinaturas reais já expiradas.
DELETE FROM subscriptions
WHERE status = 'expired'
  AND gateway_transaction_id IS NULL
  AND subscriber_code IS NULL
  AND buyer_email IS NULL;
