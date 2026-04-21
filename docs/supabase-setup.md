# Supabase Setup — requisitos obrigatórios

Configurações que **precisam** estar ligadas no dashboard do Supabase (`supabase.com` → Project → Authentication) para o fluxo de cadastro funcionar com segurança.

## 1. Confirmação de email obrigatória

**Caminho:** Authentication → Providers → Email → **"Confirm email"** = **ON**

**Por quê:** Sem isso, `supabase.auth.signUp()` retorna `session` imediatamente e permite login antes do usuário confirmar o email. Isso abre espaço para fraude (qualquer pessoa cria conta com email falso).

O app tem defesa em profundidade no [src/app/(auth)/register/page.tsx](../src/app/(auth)/register/page.tsx) — faz `signOut()` após `signUp()` mesmo se o Supabase devolver sessão. Mas a configuração correta do Supabase é **requisito de segurança**.

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

## 4. URL do site

**Caminho:** Authentication → URL Configuration

- **Site URL:** `https://www.guardadinheiro.com.br`
- **Redirect URLs:** adicionar `https://www.guardadinheiro.com.br/login?confirmed=1` e `https://www.guardadinheiro.com.br/redefinir-senha`

## 5. Rate limits

**Caminho:** Authentication → Rate Limits

Manter defaults. O Supabase já tem rate limit em `resend` (1 por 60s) — o botão "Reenviar email" no frontend trata esse erro.

---

## Checklist de verificação pós-deploy

1. Criar conta de teste com email real
2. Confirmar que **não** aparece dashboard logo após cadastro (deve ver tela "Verifique seu email")
3. Tentar login sem confirmar — deve mostrar "Confirme seu email antes de entrar" com botão Reenviar
4. Confirmar email e fazer login — deve redirecionar pra `/dashboard`
5. Deletar a conta de teste no dashboard do Supabase
