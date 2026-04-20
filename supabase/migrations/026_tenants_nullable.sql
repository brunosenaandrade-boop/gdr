-- Permitir tenant incompleto durante WhatsApp signup.
-- Cliente cria conta via WhatsApp (apenas nome + email + senha),
-- completa PF/PJ + documento no painel via OnboardingModal.

ALTER TABLE tenants ALTER COLUMN type DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN document DROP NOT NULL;

-- O CHECK constraint "type IN ('pf', 'pj')" já aceita NULL por default.
