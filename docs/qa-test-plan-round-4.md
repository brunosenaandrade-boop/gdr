# QA TEST PLAN — Round 4 (Guarda Dinheiro) — **"TUDO MESMO"**

**Alvo:** https://www.guardadinheiro.com.br
**Data-base:** 21/04/2026
**Deploy base:** commit `85b26ba` (df1d787 + R2 fixes + R3 fix Supabase Site URL + checkout_leads feature completa)
**Testado por:** _preencher_

> **Critério de sucesso:** veredito GO apenas se **zero 🔴 Critical** e **zero 🟠 High**. 🟡/🟢 podem passar pro próximo round se documentados.
>
> Este plano cobre: regressão 3 rounds anteriores + features novas (checkout_leads + cron recuperação + admin leads) + CRUD profundo + segurança + performance + acessibilidade + edge cases extremos.

---

## 0. Setup obrigatório

### Ambiente

**Navegador primário:** Chrome/Edge atualizado com DevTools aberto (Console + Network + Application tabs).

**Viewports pra testar (trocar via Toggle device):**
- Desktop: `1920×1080`, `1440×900`, `1280×800`
- Laptop menor: `1024×768`
- Tablet: `768×1024` (iPad), `820×1180` (iPad Air)
- Mobile: `390×844` (iPhone 14), `360×800` (Galaxy S8+), `414×896` (iPhone 11 Pro Max)

**Limpar entre cenários:** Ctrl+Shift+R ou DevTools → Application → Clear storage → Clear site data.

### Recursos

**Emails descartáveis (usar email único por teste):**
- https://temp-mail.org (recomendado — aceita vários domínios)
- https://mailinator.com
- Pattern: `qa4-<timestamp>@tatefarm.com` (evitar @mailinator — QA R3 reportou bloqueio)

**Cartão de teste Mercado Pago** (⚠️ **NÃO FINALIZAR pagamento real**):
- APRO: `5031 4332 1540 6351` · CVV `123` · val `11/30` · nome `APRO`
- OTHE (rejeita): mesmo cartão, nome `OTHE`

**CPF/CNPJ válidos pra onboarding:**
- Gerador: https://www.4devs.com.br/gerador_de_cpf
- CNPJ: https://www.4devs.com.br/gerador_de_cnpj
- Marcar a caixa "com máscara" pra facilitar colar

### Formato de report (por bug)

```
## BUG #N — <título curto>
- Severidade: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- Página: URL completa
- Viewport: 1440x900 / 390x844 / etc
- Steps: numerado
- Esperado: ...
- Observado: ... + screenshot se possível
- Console: erros ou "nenhum"
- Network: status codes relevantes
- Reproduzível: 100% / intermitente N/10
- Impacto: quem/como se ferra
```

---

## BLOCO 1 — REGRESSÃO TOTAL (Rounds 1, 2, 3)

**Todos estes DEVEM passar. Falha em qualquer item = regressão crítica.**

### 1.1 — Round 1 (11 casos)

| # | Caso | Ação rápida | Esperado |
|---|---|---|---|
| R1.1 | Registro não auto-loga | /register → criar conta | Tela "Verifique seu email", NÃO dashboard |
| R1.2 | 404 customizada | /rota-inexistente-${Date.now()} | Página 404 emerald (logado e deslogado) |
| R1.3 | Fluxo-caixa sem "Invalid Date" | /dashboard/fluxo-caixa | datas "23 abr" — zero "Invalid Date" |
| R1.4 | Login trata email-not-confirmed | login sem confirmar email | Banner amarelo + botão Reenviar |
| R1.5 | ESC fecha modal /planos | /planos → abrir modal → ESC | Modal fecha |
| R1.6 | Erros em PT-BR | /register email duplicado | "Este e-mail já está cadastrado" |
| R1.7 | XSS campo Nome | Nome `<script>alert(1)</script>` | Erro "Use apenas letras…" |
| R1.8 | Categorias com acento | Conta nova → /categorias | "Alimentação", "Saúde", "Educação", "Salário" |
| R1.9 | Voltar slide 1 desabilitado | /como-funciona slide 1 | opacity 30%, não clicável |
| R1.10 | Title sem duplicação | tab title /planos, /como-funciona, /compra-concluida | UM "\| Guarda Dinheiro" |
| R1.11 | Seção Assinatura | /configuracoes | 4 cards: Dados/Senha/Assinatura/Excluir |

### 1.2 — Round 2 (10 casos)

| # | Caso | Ação | Esperado |
|---|---|---|---|
| R2.1 | Login bloqueado sem email confirmado | Cadastrar → NÃO confirmar → login | Banner "Confirme seu email" |
| R2.2 | Email inválido desativa botão **imediato** | /planos modal → digitar `abc` | Botão cinza `bg-slate-800` na hora, não só no submit |
| R2.3 | Categorias prod com acento | Conta nova hoje → /categorias | Sem "Alimentacao" sem acento |
| R2.4 | Modal editar **pré-preenche** | /lancamentos → lápis | Form carregado com dados da linha; trocar de linha → form atualiza |
| R2.5 | Delete com modal custom | /lancamentos → lixeira | Modal custom (não `window.confirm`) com botão vermelho |
| R2.6 | AppHeader não trunca em mobile | 390px → /dashboard | "Dashboard" completo, não "hboard" |
| R2.7 | Assinatura vazia em conta nova | conta nova → /configuracoes | "Você ainda não tem uma assinatura ativa" + Ver planos |
| R2.8 | Nome vazio sem tooltip nativo | /register submit com nome vazio | Erro custom vermelho, não balão do browser |
| R2.9 | Email contato no footer | /` | `contato@guardadinheiro.com.br` mailto visível |
| R2.10 | Vencimento mostra data correta | /lancamentos criar com vencimento | DD/MM/AAAA (sem shift de 1 dia pra trás) |

### 1.3 — Round 3 (1 caso crítico)

| # | Caso | Ação | Esperado |
|---|---|---|---|
| R3.1 | Email de confirmação aponta pra domínio correto | Cadastrar com email real → abrir email | `href` do CTA começa com `https://www.guardadinheiro.com.br` (NUNCA `localhost`) |
| R3.1b | Clicar no link ativa conta | Passo acima → clicar | Redireciona pra `/login?confirmed=1` (ou similar), conta ativada |

---

## BLOCO 2 — FEATURES NOVAS (checkout_leads + cron + admin)

### 2.1 — Captura de lead ao iniciar checkout (recurring)

1. `/planos` → "Quero o plano anual" (modal abre)
2. Toggle em "Assinatura" (recurring)
3. Email `lead-recurring-${Date.now()}@tatefarm.com`
4. Bump: desmarcar
5. Clicar "Ir para o pagamento" → aguardar redirect pro MP
6. **Abandonar** (voltar com back do browser, não completar)
7. **Esperado no Supabase** (admin pode verificar via /admin/leads ou Supabase Table Editor):
   - Nova linha em `checkout_leads` com:
     - `email` igual ao digitado
     - `plan_type = "anual"`
     - `payment_method = "recurring"`
     - `has_bump = false`
     - `status = "pending"`
     - `external_reference` e `mp_preference_id` preenchidos
     - `created_at` ~ agora
     - `completed_at = null`

### 2.2 — Captura de lead ao iniciar checkout (one-time / Checkout Pro)

1. `/planos` → "Quero o plano anual" (modal)
2. Toggle em "Pagamento único"
3. Email `lead-onetime-${Date.now()}@tatefarm.com`
4. Bump: **marcar** (R$ 67)
5. "Ir para o pagamento" → MP
6. Abandonar
7. **Esperado:**
   - Linha nova em `checkout_leads`:
     - `plan_type = "anual"`
     - `payment_method = "one-time"`
     - `has_bump = true`

### 2.3 — Captura de lead no plano Mensal

1. `/planos` → "Quero o plano mensal"
2. Email + submit → MP → abandonar
3. **Esperado:** linha com `plan_type = "mensal"`, `payment_method = "recurring"`

### 2.4 — Captura **NÃO** acontece em erros

1. `/planos` modal → email `a@b` (inválido)
2. Submit — esperado: botão desabilitado, lead NÃO é criado
3. Testar também: email válido + MP offline/rate-limit (difícil simular — opcional)
4. **Esperado:** zero linhas em `checkout_leads` pra esses casos

### 2.5 — Lead marcado como `completed` ao pagar

1. Cadastrar conta real → confirmar email → login
2. `/planos` → modal → **usar cartão teste APRO**
3. Após submit do MP, aguardar webhook
4. **Esperado:**
   - Linha em `checkout_leads` com `status` trocando de `pending` → `completed`
   - `completed_at` preenchido
   - `subscriptions` ganha linha `active`
5. **NÃO testar com pagamento real — aborte no passo "pagamento" do MP se for cartão próprio**

### 2.6 — Admin `/admin/leads` página

1. Login como super admin em `admin.guardadinheiro.com.br`
2. Clicar no item "Leads Checkout" na sidebar (entre "Assinaturas" e "Afiliados")
3. **Esperado:**
   - 4 StatCards: Total 30d, Conversões 30d, Abandonados 30d, Conversão %
   - Banner "Pendentes agora: N"
   - Filtros: Todos / Pendentes / Completos / Abandonados + Anual / Mensal
   - Tabela com: Email · Plano · Método · Bump · Status · Criado · Concluído
   - Link "Exportar CSV" no canto superior direito

### 2.7 — Admin: filtros funcionam

1. `/admin/leads?status=pending` → só pendentes
2. `/admin/leads?status=completed` → só completos
3. `/admin/leads?plan=anual` → só anuais
4. Combinar via URL: `/admin/leads?status=pending&plan=mensal`
5. **Esperado:** listagem filtra corretamente, URL contém os params

### 2.8 — Admin: Export CSV

1. `/admin/leads` → clicar "Exportar CSV"
2. **Esperado:** download imediato de `checkout-leads-YYYY-MM-DD.csv`
3. Abrir o CSV em Excel/Numbers/LibreOffice
4. **Validar:**
   - Encoding UTF-8 OK (acentos corretos)
   - 12 colunas: id, email, plan_type, payment_method, has_bump, tenant_id, status, created_at, completed_at, external_reference, mp_preference_id, ip_address
   - Respeita filtros atuais da página (se estava em `?status=pending`, exporta só pendentes)

### 2.9 — Admin: autorização do CSV

1. Deslogar do admin
2. Abrir direto `https://admin.guardadinheiro.com.br/api/admin/leads/export` (ou via curl)
3. **Esperado:** 401 Unauthorized, NÃO retorna CSV
4. Tentar acessar o endpoint logado como super admin → OK

### 2.10 — Cron `abandoned-leads` (manual trigger)

1. Criar lead de teste: `/planos` → preencher email + submit → abandonar
2. **Esperar > 24h** OU simular via SQL (admin):
   ```sql
   UPDATE checkout_leads
   SET created_at = now() - interval '25 hours'
   WHERE email = 'seu-teste@tatefarm.com';
   ```
3. Disparar cron manualmente:
   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" \
     https://www.guardadinheiro.com.br/api/cron/abandoned-leads
   ```
4. **Esperado:**
   - Response `200 {"status": "ok", "processed": N, "sent": N, "failed": 0}`
   - Lead muda pra `status = "abandoned"`
   - Email de recuperação chega em até 1 min no inbox (pasta principal ou spam)

### 2.11 — Email de recuperação (AbandonedCartEmail)

1. Abrir email de recuperação (passo anterior)
2. **Esperado visualmente:**
   - Assunto: "Seu plano Guarda Dinheiro ainda está te esperando"
   - Emoji 🛒 no topo
   - Título: "Seu plano ainda está te esperando"
   - Card com Plano + Valor + (Bônus se aplicável)
   - Botão CTA "Finalizar minha assinatura"
   - Nota sobre garantia de 7 dias
   - Rodapé com escudo emerald, LGPD, contato@guardadinheiro.com.br
3. Clicar no CTA → deve abrir `/planos?plan=anual` (ou `&bump=1` se tinha bump)
4. **Dark mode:** fundo preto, texto claro, legível

### 2.12 — Cron idempotência

1. Repetir o curl do passo 2.10 (mesma chamada)
2. **Esperado:** `{"status": "ok", "processed": 0}` (já processou os pendentes na primeira chamada)
3. Lead já virou `abandoned` — cron não envia email duplicado

### 2.13 — Cron sem auth

```bash
curl https://www.guardadinheiro.com.br/api/cron/abandoned-leads  # sem header
```

**Esperado:** 401 Unauthorized

---

## BLOCO 3 — CRUD PROFUNDO

### 3.1 — Lançamentos: criar receita

- [ ] Modal abre via botão "+ Novo" do AppHeader
- [ ] Toggle Receita (emerald destacado)
- [ ] Descrição: `Salário de abril 2026`
- [ ] Valor: `3000,50` (vírgula aceita); também testar `3000.50` (ponto)
- [ ] Categoria: select mostra só categorias de receita
- [ ] Vencimento: `2026-05-05` via datepicker
- [ ] Data Pagamento: deixar vazio
- [ ] Status: `Pendente`
- [ ] Notas: `Teste QA R4`
- [ ] Submit → modal fecha → lista mostra linha nova
- [ ] Valor renderizado: `R$ 3.000,50` com `+` emerald
- [ ] Vencimento renderizado: `05/05/2026`
- [ ] Origem: ícone 🌐 (web), não WhatsApp

### 3.2 — Lançamentos: criar despesa + validações

- [ ] Valor `0` → erro "Valor deve ser positivo"
- [ ] Valor `-5` → erro
- [ ] Valor `100000000000` → erro "Valor máximo: R$ 99.999.999,99"
- [ ] Descrição vazia → erro "Descrição obrigatória"
- [ ] Despesa válida → linha aparece com `-` vermelho

### 3.3 — Lançamentos: editar (R2.4 já cobre básico — testar edge)

- [ ] Editar uma despesa → trocar pra receita → categoria reseta → salvar
- [ ] Editar → mudar valor → salvar → lista reflete novo valor
- [ ] Abrir edit de linha A → fechar sem salvar → abrir edit de linha B → form tem dados de B (não de A)

### 3.4 — Lançamentos: filtros combinados

- [ ] Filtro tipo = Receita → só receitas
- [ ] Filtro status = Atrasado → só atrasados
- [ ] Filtros tipo + status juntos → AND lógico
- [ ] Busca por descrição parcial (case insensitive?)
- [ ] Clicar "Limpar" → todos filtros resetam, lista recarrega

### 3.5 — Lançamentos: paginação

- [ ] Criar 26+ lançamentos (podem ser iguais pra agilizar)
- [ ] Botão "próxima página" aparece
- [ ] Clicar → URL muda pra `?page=2` → lista recarrega
- [ ] "Anterior" volta pra p1
- [ ] Estar em p2 + aplicar filtro → deve voltar pra p1 (ou manter + filtrar — documentar o comportamento)

### 3.6 — Lançamentos: delete (R2.5 cobre básico)

- [ ] Abrir modal → clicar Cancelar → modal fecha, linha permanece
- [ ] Abrir modal → clicar Excluir → loading → linha some
- [ ] Descrição aparece entre aspas no modal ("Salário de abril 2026")

### 3.7 — Categorias: CRUD

- [ ] Botão "+ Nova Categoria" abre modal com placeholder "Ex: Alimentação"
- [ ] Nome `Viagem` + tipo Despesa + ícone/cor → salvar
- [ ] Aparece na lista de despesas
- [ ] Editar: clicar no lápis → form pré-preenche
- [ ] Mudar nome → salvar → reflete
- [ ] Deletar categoria CUSTOM → some
- [ ] Tentar deletar categoria DEFAULT ("Alimentação") → deve bloquear ou pedir confirmação extra

### 3.8 — Contas a Pagar

- [ ] `/dashboard/contas-pagar`
- [ ] Lista só despesas com status pendente/atrasado
- [ ] Vencimentos futuros: neutro
- [ ] Vencimentos passados: destaque (vermelho/amber)
- [ ] Ação de marcar como paga (se houver botão): status muda → sai da lista

### 3.9 — Contas a Receber

- [ ] `/dashboard/contas-receber`
- [ ] Lista só receitas pendentes
- [ ] Mesmo fluxo de marcar como recebida

### 3.10 — Fluxo de caixa

- [ ] Gráfico carrega
- [ ] 3 cards (Entradas/Saídas/Saldo) batem com os lançamentos criados
- [ ] Seletor 7/15/30/60/90 dias → gráfico e tabela atualizam
- [ ] Tabela sem "Invalid Date"

### 3.11 — Recorrências

- [ ] `/dashboard/recorrencias`
- [ ] Empty state OK
- [ ] **NÃO deve** ter botão "+ Nova Recorrência" (só via WhatsApp)

### 3.12 — Compromissos / Agenda

- [ ] `/dashboard/compromissos` ou `/agenda`
- [ ] Se houver botão novo: criar com título + data + lembrete → aparece
- [ ] Editar → salva
- [ ] Deletar → some

### 3.13 — Dashboard Overview

- [ ] Empty state (zero lançamentos) → banner "Bem-vindo"
- [ ] Com 6+ lançamentos → StatCards batem
- [ ] Score aparece após 5+ lançamentos (antes era null/empty)
- [ ] Cash flow chart renderiza
- [ ] Categorias top renderizam

### 3.14 — Configurações: Dados da Conta

- [ ] Editar Nome válido → salva → "Salvo com sucesso!"
- [ ] Nome com `<script>` → server bloqueia com erro em pt-BR
- [ ] Nome com 100 chars → bloqueado (regra max 60)
- [ ] CPF/CNPJ inválido → bloqueado
- [ ] Telefone: aceita `(11) 99999-9999`

### 3.15 — Configurações: Alterar senha

- [ ] Atual errada → "Senha atual incorreta"
- [ ] Nova < 8 → "Mínimo 8 caracteres"
- [ ] Confirmação ≠ nova → erro
- [ ] Sucesso → campos limpam + mensagem + login continua ativo

### 3.16 — Configurações: Excluir Conta ⚠️

(usar SÓ conta descartável)

- [ ] Clicar "Quero excluir minha conta" → input aparece
- [ ] Texto ≠ `EXCLUIR` → botão desabilitado
- [ ] Digitar `EXCLUIR` → botão habilita
- [ ] Clicar Confirmar → `window.confirm` nativo (JS) → OK → delete → redirect `/login`
- [ ] Tentar logar com mesma conta → "Email ou senha incorretos" (conta não existe)

### 3.17 — Materiais (sem compra)

- [ ] `/dashboard/materiais` em conta sem compras
- [ ] Empty state com ícone + texto + **CTA "Ver planos e bônus disponíveis"**
- [ ] CTA linka pra `/planos`

### 3.18 — WhatsApp link

- [ ] `/dashboard/whatsapp`
- [ ] Exibe status (vinculado ou não)
- [ ] Se não vinculado: botão ou código pra vincular no WhatsApp
- [ ] Se vinculado: mostra número mascarado + botão desvincular

---

## BLOCO 4 — SEGURANÇA

### 4.1 — XSS persistente

- [ ] Criar lançamento com descrição `<img src=x onerror=alert(1)>` → React escapa na renderização (não executa)
- [ ] Criar categoria com nome `<script>alert(1)</script>` → server bloqueia OU React escapa na lista
- [ ] Notas com HTML → escapado
- [ ] Nome PJ `<iframe src=evil>` → bloqueado (nameSchema regex)

### 4.2 — SQL injection

- [ ] Busca em /lancamentos: `?q=' OR 1=1--` → não retorna tudo, não quebra
- [ ] Login com email `admin' OR '1'='1` → erro normal, não autentica

### 4.3 — Authorization (RLS)

- [ ] Logado em conta A, tentar acessar `/api/...` com `tenant_id` de conta B → 403 ou silent fail
- [ ] Deslogado acessar `/dashboard/lancamentos` → redirect `/login`
- [ ] Tentar `/admin/leads` como usuário comum (não super admin) → redirect/bloqueado
- [ ] Tentar `/admin/leads/export` sem auth → 401

### 4.4 — CSRF / cookie

- [ ] DevTools → Application → Cookies
- [ ] Verificar que cookies `supabase-auth-token` têm `HttpOnly=true` e `SameSite=Lax/Strict`
- [ ] localStorage **não** deve ter access token
- [ ] Interceptar requisição `/api/*` no Network → verificar que manda cookie (não Authorization header hardcoded no client)

### 4.5 — Rate limit

- [ ] 10x POST em `/register` em 1 min → Supabase deve limitar (erro 429 ou similar)
- [ ] 6x POST em `/api/subscriptions/preapproval` → erro 429 "Muitas tentativas. Aguarde 1 minuto"
- [ ] 11x POST no webhook MP com IPs iguais → 429 (testável só via curl)

### 4.6 — Headers

- [ ] View-source de `/` → sem comentários com secrets
- [ ] Network: nenhum `authorization: Bearer sk-*` visível (apenas cookies)
- [ ] `http://guardadinheiro.com.br` (sem HTTPS) → 301 pra `https://`
- [ ] `http://www.guardadinheiro.com.br` → 301 pra `https://`

### 4.7 — Enumeração

- [ ] `/esqueci-senha` com email inexistente → não revela ("E-mail enviado" mesmo assim — anti-enumeração)
- [ ] `/login` com email inexistente vs senha errada → mesma mensagem ("Email ou senha incorretos")

### 4.8 — Secrets no cliente

- [ ] DevTools Sources → buscar por `sbp_` (Supabase management tokens) → zero resultados
- [ ] Buscar por `SERVICE_ROLE` → zero
- [ ] `HOTTOK`, `HOTMART_` → só se aparecer em chunk NEXT_PUBLIC → zero

---

## BLOCO 5 — MOBILE DEEP (390×844 iPhone 14)

**Pra cada página, checar:**
1. Nenhum scroll horizontal (se tiver, é BUG)
2. Tap targets ≥ 44×44px
3. Texto legível (mín 14px body)
4. Imagens não cortadas
5. Modais: 90vw, scroll interno
6. Forms: input focus NÃO faz zoom (viewport meta tag correta)

### 5.1 — `/`

- [ ] Hamburguer abre drawer suave
- [ ] Drawer tem todos links + Entrar + Começar agora
- [ ] ESC fecha drawer (desktop); tap no X fecha
- [ ] Hero text não quebra feio
- [ ] CTAs empilhados, não cortados
- [ ] Footer: email contato visível e clicável

### 5.2 — `/planos`

- [ ] Cards empilhados (Anual em cima, Mensal embaixo)
- [ ] Preços grandes, legíveis
- [ ] Modal ocupa 90vw, com scroll interno se conteúdo passar de 90vh
- [ ] Toggle Assinatura/Pagamento único: botões lado a lado
- [ ] Campo email com teclado em modo `email` (sem autocapitalize primeira letra)

### 5.3 — `/register` e `/login`

- [ ] Card centralizado, bordas OK
- [ ] Todos inputs visíveis sem scroll inicial
- [ ] Focus no input → teclado abre sem "jumping" de layout
- [ ] Botão submit grande, legível
- [ ] Links "Esqueci senha" e "Ver planos" clicáveis sem zoom

### 5.4 — `/dashboard/*`

- [ ] Sidebar vira drawer via hamburguer (top-left)
- [ ] AppHeader: título completo (não "hboard")
- [ ] StatCards empilham
- [ ] Tabelas: scroll horizontal (não quebrar)
- [ ] Modais (Novo Lançamento, Delete): 90vw, fechar fácil

### 5.5 — Onboarding Modal mobile

- [ ] Step "PF ou PJ?": cards lado a lado ou empilhados (ok qualquer um)
- [ ] Step "Info": inputs empilhados, rolagem interna se passa de viewport
- [ ] X NÃO aparece (modal obrigatório — R2 fix)
- [ ] Botão "Começar a usar" acessível

---

## BLOCO 6 — PERFORMANCE (Lighthouse Mobile)

Rodar Lighthouse em DevTools → Performance → Mobile → throttling "Simulated slow 4G" → gerar report.

### 6.1 — Landing `/`

- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] TBT < 300ms
- [ ] INP < 200ms (interagir com FAQ e depoimentos)
- [ ] Nenhuma imagem sem `loading="lazy"` abaixo do fold
- [ ] Nenhum console.error

### 6.2 — `/planos`

- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Abrir modal → INP < 200ms
- [ ] Digitar no input → INP < 100ms

### 6.3 — `/dashboard` (após login)

- [ ] LCP < 3.5s (tem mais queries)
- [ ] CLS < 0.1
- [ ] Score chart/recharts carrega sem layout shift
- [ ] Nenhum console.error

### 6.4 — Bundle size

- [ ] DevTools Network: JS inicial < 500KB comprimido
- [ ] Nenhum chunk > 1MB
- [ ] Fontes carregam com `font-display: swap`

---

## BLOCO 7 — ACESSIBILIDADE

### 7.1 — Teclado only

- [ ] Navegar TODA a aplicação apenas com Tab + Shift+Tab + Enter + Space + ESC
- [ ] Todos elementos clicáveis alcançáveis
- [ ] Focus ring visível (ring emerald ou borda equivalente)
- [ ] ESC fecha modais em todos os lugares

### 7.2 — Screen reader (NVDA ou VoiceOver)

- [ ] Cabeçalhos em ordem hierárquica (h1 → h2 → h3)
- [ ] Labels de inputs lidos (não só placeholder)
- [ ] Botões só-ícone têm `aria-label` (X, hamburguer, lápis, lixeira, download)
- [ ] Links com texto descritivo (não "clique aqui")

### 7.3 — Contraste

- [ ] Texto `text-slate-400` (#94a3b8) em fundo #000 → 7.1:1 (passa AAA)
- [ ] Botão emerald `#10B981` em preto → verificar legibilidade
- [ ] Placeholder em inputs: contraste mín 4.5:1

### 7.4 — Formulários

- [ ] Erros associados a inputs via `aria-describedby`
- [ ] Inputs obrigatórios marcados (asterisco visual + `aria-required`)
- [ ] Autocomplete: `email`, `current-password`, `new-password`, `name`

---

## BLOCO 8 — EMAILS TRANSACIONAIS

Cada email: receber de verdade + abrir no Gmail/Outlook + validar.

### 8.1 — Confirm signup (cadastro)

- [ ] Chega em < 1 min
- [ ] Assunto em PT-BR
- [ ] Escudo emerald no header (CSS shield, não emoji 🛡️)
- [ ] Botão "Confirmar meu email" com gradient emerald
- [ ] Link do botão começa com `https://www.guardadinheiro.com.br` (R3.1)
- [ ] Rodapé: LGPD + contato@guardadinheiro.com.br
- [ ] Dark mode (fundo #000)
- [ ] Não cai em spam (Gmail ao menos)

### 8.2 — Reset password

- [ ] `/esqueci-senha` → email chega
- [ ] Botão "Redefinir senha" funciona
- [ ] Redireciona pra `/redefinir-senha` no domínio correto
- [ ] Link expira após uso OU após X horas

### 8.3 — Payment confirmed

(difícil disparar sem pagamento real — testar se houver conta com subscription ativa)

- [ ] Layout igual aos outros
- [ ] Valor + plano + data corretos
- [ ] "Acesso até DD/MM/AAAA"

### 8.4 — Payment failed

- [ ] Se tiver como simular com cartão OTHE
- [ ] Mensagem amigável
- [ ] Botão "Tentar novamente" → `/planos`

### 8.5 — Abandoned cart (NOVO)

- [ ] Disparar via cron manual (ver 2.10)
- [ ] Emoji 🛒 no topo
- [ ] Título "Seu plano ainda está te esperando"
- [ ] Card com plano + valor
- [ ] CTA "Finalizar minha assinatura" → `/planos?plan=anual`
- [ ] Nota sobre garantia 7 dias
- [ ] Mesmo visual dos outros

### 8.6 — Subscription expiring

- [ ] Disparável via cron
- [ ] Emoji ⏰
- [ ] Data de expiração correta
- [ ] Botão "Renovar Agora"

### 8.7 — Welcome (após 1ª compra)

- [ ] Visual consistente
- [ ] Link pro WhatsApp ou dashboard

### 8.8 — Account deleted

- [ ] Excluir conta descartável → email de confirmação
- [ ] Menciona retenção 90 dias (LGPD)

### 8.9 — Affiliate emails (se o QA for super admin com conta afiliado)

- [ ] Credenciais afiliado
- [ ] Relatório mensal
- [ ] Notificação de comissão

---

## BLOCO 9 — EDGE CASES EXTREMOS

### 9.1 — Abas múltiplas

- [ ] 2 abas com `/login` → logar em A → F5 em B → B reconhece auth (ou redireciona /dashboard)
- [ ] 2 abas logadas → logout em A → ação em B → redirect /login
- [ ] 2 abas em `/register` → cadastrar em A → em B, tentar com mesmo email → "já cadastrado"

### 9.2 — Back/forward do browser

- [ ] /register → preencher → submit → "verifique email"
- [ ] Clicar **back** no browser → form deve ter limpado OU mostrar estado anterior coerente
- [ ] `/planos` → abrir modal → fechar → **back** → não volta pra modal aberto

### 9.3 — Refresh durante loading

- [ ] /register → submit → F5 imediatamente (antes do response)
- [ ] Não criar conta duplicada

### 9.4 — Network throttle

- [ ] DevTools → Slow 3G
- [ ] /register → submit → aguardar ~10s
- [ ] Loading mantém (não trava); quando completar, mostra tela correta
- [ ] /planos modal → submit → MP carrega mesmo lento

### 9.5 — Desabilitar JavaScript

- [ ] `chrome://settings/content/javascript` → desabilitar
- [ ] Acessar `/` → página estática funciona? ou mostra mensagem?
- [ ] `/register` → forms não devem funcionar (OK esperado)
- [ ] Reabilitar JS depois

### 9.6 — Zoom 200%

- [ ] `/` em 200% → layout não quebra feio
- [ ] `/planos` em 200% → cards legíveis
- [ ] Dashboard em 200% → navegação possível

### 9.7 — Copiar URL protegida

- [ ] Logado: copiar URL `/dashboard/lancamentos`
- [ ] Colar em aba **anônima** → redirect `/login`
- [ ] Logar → volta pra `/dashboard/lancamentos`? (deep link)

### 9.8 — Voltar após excluir conta

- [ ] Excluir conta descartável → redirect `/login`
- [ ] Clicar back do browser → não deve acessar dashboard antigo

### 9.9 — Teclas ESC/Enter em formulários

- [ ] Onboarding modal: ESC não fecha (R2 — hideClose)
- [ ] Modal de Novo Lançamento: ESC fecha
- [ ] Modal confirmar exclusão: ESC fecha (pendente — verificar)
- [ ] Enter em `/login` com campos preenchidos → submit (não só cliques)

### 9.10 — Valores extremos

- [ ] Lançamento valor `0,01` → aceita
- [ ] Lançamento valor `99999999,99` → aceita
- [ ] Lançamento valor `99999999,991` → rejeita (arredonda ou bloqueia)
- [ ] Descrição com 500 chars → bloqueia ou trunca
- [ ] Notas com 5000 chars → bloqueia ou trunca

---

## BLOCO 10 — SEO + PWA (low priority, mas vale olhar)

- [ ] `/` view-source: meta description, og:image, og:title preenchidos
- [ ] `/planos` e `/como-funciona`: mesma coisa
- [ ] Favicon carrega (aquele escudo emerald)
- [ ] `/robots.txt` existe e é coerente
- [ ] `/sitemap.xml` existe
- [ ] Structured data (JSON-LD) em `/planos` tem FAQ schema

---

## BLOCO 11 — RELATÓRIO FINAL

### 11.1 — Formato por bug

```
## BUG #N — <título>
- Severidade: 🔴/🟠/🟡/🟢
- Página: URL
- Viewport: desktop 1440x900 / mobile 390x844
- Steps: 1. 2. 3.
- Esperado: ...
- Observado: ... (screenshot)
- Console: <erros>
- Network: <status codes>
- Reproduzível: 100% / Nx10 intermitente
- Impacto: 1 linha
```

### 11.2 — Tabela de regressão

| Round | Casos | ✅ PASS | ❌ FAIL | Observação |
|---|---|---|---|---|
| Round 1 | 11 | ? | ? | |
| Round 2 | 10 | ? | ? | |
| Round 3 | 1 crítico | ? | ? | |
| **TOTAL regressão** | **22** | | | |

### 11.3 — Features novas (R4)

| Bloco | Casos | ✅ | ❌ |
|---|---|---|---|
| 2. Leads + cron + admin | 13 | | |
| 3. CRUD profundo | 18 | | |
| 4. Segurança | 8 | | |
| 5. Mobile | 5 | | |
| 6. Performance | 4 | | |
| 7. Acessibilidade | 4 | | |
| 8. Emails | 9 | | |
| 9. Edge cases | 10 | | |
| 10. SEO | 1 | | |

### 11.4 — Resumo executivo

- Total bugs: 🔴 _N_ · 🟠 _N_ · 🟡 _N_ · 🟢 _N_
- Métricas Lighthouse (LCP/CLS/INP) pra `/`, `/planos`, `/dashboard`
- 3 principais riscos (se houver) em 1 linha cada
- **Veredito final:** GO / NO-GO / GO condicional ("se corrigir X antes de anunciar")

### 11.5 — Recomendações UX (não bugs)

Continuar tracking as 4 pendentes do R3:
1. CNPJ no footer (compliance)
2. "Economia R$ 600" explícito
3. Tela verificação com timer
4. /como-funciona com índice

Novas recomendações que surgirem também aqui.

---

**Fim do plano. Copia esse arquivo inteiro no prompt do QA.**
