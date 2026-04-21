# Supabase Setup — requisitos obrigatórios

Configurações que **precisam** estar ligadas no dashboard do Supabase (`supabase.com` → Project → Authentication) para o fluxo de cadastro funcionar com segurança.

---

## 🚨 AÇÃO IMEDIATA — Round 2 QA flagou isso

> **QA Round 2 confirmou:** se "Confirm email" está OFF, qualquer pessoa cria conta com email falso e entra no sistema. **Vá ligar agora antes de abrir venda.**

### Passo-a-passo (1 minuto):

1. Abrir https://supabase.com/dashboard
2. Selecionar projeto `guarda-dinheiro` (ou nome equivalente)
3. Menu lateral → **Authentication** → **Providers**
4. Clicar em **Email**
5. Procurar a opção **"Confirm email"** e marcar ✅
6. Scroll até o fim → **Save**

### Verificação imediata (2 minutos):

1. Criar conta de teste em `https://www.guardadinheiro.com.br/register`
2. NÃO clicar no link do email
3. Ir em `/login` e tentar entrar
4. **Esperado:** banner amarelo "Confirme seu email antes de entrar" + botão "Reenviar email de confirmação"
5. Se entrou no dashboard sem ver banner → "Confirm email" ainda está OFF. Voltar ao passo 5 acima.

---

## 1. Confirmação de email obrigatória (detalhe técnico)

**Caminho:** Authentication → Providers → Email → **"Confirm email"** = **ON**

**Por quê:** Sem isso, `supabase.auth.signUp()` retorna `session` imediatamente e permite login antes do usuário confirmar o email. Isso abre espaço para fraude (qualquer pessoa cria conta com email falso).

O app tem defesa em profundidade no [src/app/(auth)/register/page.tsx](../src/app/(auth)/register/page.tsx) — faz `signOut()` após `signUp()` mesmo se o Supabase devolver sessão. MAS: se Supabase estiver com "Confirm email" OFF, o campo `auth.users.email_confirmed_at` é auto-preenchido no signup, o que faz o nosso middleware permitir o acesso depois que o usuário tenta login. Ou seja: **nosso código sozinho não consegue bloquear; a config do Supabase é requisito.**

## 2. SMTP custom (opcional mas recomendado)

**Caminho:** Authentication → Emails → **SMTP Settings**

Em produção, usar SMTP próprio (Resend, SES, etc.) para:
- Deliverability (emails do Supabase padrão caem em spam)
- Branding (remetente com domínio próprio)

Ver `RESEND_API_KEY` no env.

## 3. Email templates

**Caminho:** Authentication → Emails → Templates

Confirmar que:
- **Confirm signup** usa o template HTML em [supabase/email-templates/confirm-signup.html](../supabase/email-templates/confirm-signup.html)
- **Reset password** está em PT-BR

## 4. URL do site — 🚨 CRÍTICO (QA Round 3 flagou isso)

**Caminho:** Authentication → URL Configuration

- **Site URL:** `https://www.guardadinheiro.com.br`
- **Redirect URLs (wildcard):** `https://www.guardadinheiro.com.br/**,https://guardadinheiro.com.br/**`

### Por quê isso importa

O template de email em [supabase/email-templates/confirm-signup.html](../supabase/email-templates/confirm-signup.html) usa `{{ .ConfirmationURL }}`. Essa variável é montada pelo Supabase combinando **Site URL** + token de confirmação. Se o Site URL estiver apontando pra `http://localhost:3000` (default quando o projeto é criado em dev), TODOS os emails de cadastro em produção vão pra localhost → `ERR_CONNECTION_REFUSED` → onboarding quebrado.

O `emailRedirectTo` passado pelo código (`src/app/(auth)/register/page.tsx:66`) só é honrado se o domínio estiver na **URI Allow List**. Wildcard `/**` libera qualquer path sob o domínio.

### Aplicar via Management API (rastreável)

```bash
SUPABASE_TOKEN=sbp_xxx PROJECT_REF=ecojxxmsdmhqtmwvkjwg \
  curl -X PATCH \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
    -H "Authorization: Bearer ${SUPABASE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "site_url": "https://www.guardadinheiro.com.br",
      "uri_allow_list": "https://www.guardadinheiro.com.br/**,https://guardadinheiro.com.br/**"
    }'
```

### Re-verificar sempre que

- Criar projeto Supabase novo
- Trocar domínio
- Fizer migração/restore do projeto
- QA reportar email com link quebrado

## 5. Rate limits

**Caminho:** Authentication → Rate Limits

Manter defaults. O Supabase já tem rate limit em `resend` (1 por 60s) — o botão "Reenviar email" no frontend trata esse erro.

---

## 6. Migrations pendentes de aplicar (Round 2)

Executar no **SQL Editor** do Supabase (copia-cola) em ordem:

1. `supabase/migrations/028_reapply_default_categories.sql` — garante categorias com acento em novos tenants.
2. `supabase/migrations/029_drop_initial_subscription_trigger.sql` — remove o stub "expired" que confundia usuários.

Idempotentes: podem rodar múltiplas vezes sem quebrar.

---

## Checklist de verificação pós-deploy

1. Criar conta de teste com email real
2. Confirmar que **não** aparece dashboard logo após cadastro (deve ver tela "Verifique seu email")
3. Tentar login sem confirmar — deve mostrar "Confirme seu email antes de entrar" com botão Reenviar
4. Confirmar email e fazer login — deve redirecionar pra `/dashboard`
5. Deletar a conta de teste no dashboard do Supabase
