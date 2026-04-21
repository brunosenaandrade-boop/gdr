# QA TEST PLAN — Round 3 (Guarda Dinheiro)

**Alvo:** https://www.guardadinheiro.com.br
**Data-base:** 21/04/2026
**Deploy base:** commit `df1d787` (após correção dos 10 bugs do Round 2 + Supabase "Confirm email" ON + migrations 028/029 aplicadas)
**Testado por:** _preencher_

> **Critério de sucesso:** zero bugs. Se algum dos blocos 1+2 falhar, é regressão crítica. Bloco 3 é cobertura nova (pode surgir bug inédito).

---

## 0. Setup

**Navegador:** Chrome/Edge com DevTools aberto (Console + Network + Application).
**Viewports:** `1440×900`, `768×1024`, `390×844`, `360×800`.
**Emails descartáveis:** `teste+<timestamp>@mailinator.com` ou temp-mail.org.
**Cartão teste MP (não finalizar):** `5031 4332 1540 6351` · CVV 123 · 11/30 · nome APRO.
**Limpar cache entre cenários:** `Ctrl+Shift+R`.

**Formato de report:** por bug, informar `severidade / página / steps / esperado / observado / console / reproduzível / impacto`.

---

## 1. REGRESSÃO ROUND 1 (11 bugs — devem PASSAR)

### R1.1 — Registro não libera login sem confirmar email
1. `/register` cadastrar com email descartável + senha `Teste@1234` + nome `João Silva`
2. **Esperado:** tela "Verifique seu email" com botão "Reenviar email de confirmação"
3. **NÃO esperado:** redirect pra /dashboard

### R1.2 — 404 customizada (não vira /login)
1. `/nunca-existiu-${Date.now()}` **deslogado**
2. **Esperado:** 404 com logo emerald, "Página não encontrada", botões "Voltar para o início" + "Ir para o painel"
3. Logado: mesma página

### R1.3 — Fluxo de Caixa sem "Invalid Date"
1. Logar + criar 1 receita + 1 despesa com data
2. `/dashboard/fluxo-caixa`
3. **Esperado:** datas "23 abr", "22 abr" — zero "Invalid Date"

### R1.5 — ESC fecha modal /planos
1. `/planos` → abrir modal Anual
2. Pressionar ESC
3. **Esperado:** modal fecha

### R1.6 — Mensagens de erro PT-BR amigáveis
1. `/register` com email já cadastrado
2. **Esperado:** "Este e-mail já está cadastrado. Faça login."

### R1.7 — XSS campo Nome bloqueado
1. `/register` nome `<script>alert(1)</script>` → esperado erro custom em vermelho
2. Nome `José D'Ávila-Silva` → aceito

### R1.8 — Categorias padrão com acento
1. Criar conta nova + completar onboarding
2. `/dashboard/categorias`
3. **Esperado:** "Alimentação", "Saúde", "Educação", "Salário" (com acento) + placeholder "Ex: Alimentação"

### R1.9 — Botão "← Voltar" slide 1 desabilitado
1. `/como-funciona` slide 1
2. **Esperado:** cinza 30% opacity, não clicável

### R1.10 — Title sem duplicação
1. Tab title em `/planos`, `/como-funciona`, `/compra-concluida`
2. **Esperado:** UM "| Guarda Dinheiro" só

### R1.11 — Seção Assinatura em /configuracoes
1. `/dashboard/configuracoes`
2. **Esperado:** 4 cards: Dados / Alterar Senha / **Assinatura** / Excluir Conta

---

## 2. REGRESSÃO ROUND 2 (10 bugs — DEVEM passar AGORA)

### R2.1 🔴 — Login bloqueado pra email não confirmado
1. Cadastrar conta → NÃO clicar no link do email
2. `/login` com credenciais
3. **Esperado:** banner amarelo "Confirme seu email antes de entrar" + botão "Reenviar email de confirmação"
4. **NÃO esperado:** acesso ao dashboard

### R2.2 🟠 — Botão pagamento desabilita IMEDIATAMENTE em email inválido
1. `/planos` → modal Anual
2. Digitar `abc` no campo email (sem tirar foco)
3. **Esperado:** botão cinza (`bg-slate-800`), cursor `not-allowed`, NÃO clicável, erro "E-mail inválido" em vermelho abaixo do campo
4. Apagar → digitar `ok@x.com` → botão verde + clicável

### R2.3 🟡 — Categorias novas com acento
1. Criar conta nova e completar onboarding
2. `/dashboard/categorias`
3. **Esperado:** "Alimentação" (com ç), "Saúde", "Educação", "Salário", "Serviços", "Comissões", "Serviços Terceiros"
4. **Listagem NÃO pode ter** "Alimentacao", "Saude", "Educacao", "Salario"

### R2.4 🟠 — Modal Editar Lançamento PRÉ-PREENCHE
1. Criar lançamento "Salário de abril" R$ 3.000 categoria Freelance vencimento 25/04/2026
2. Clicar no lápis dessa linha
3. **Esperado:** modal abre com TODOS os campos pré-preenchidos: Descrição = "Salário de abril", Valor = 3000.00, Categoria = "Freelance", Vencimento = "2026-04-25", Status = o que foi salvo
4. Fechar sem salvar
5. Clicar lápis em OUTRO lançamento com dados diferentes
6. **Esperado:** modal reabre com os dados do SEGUNDO lançamento (não do primeiro)

### R2.5 🟡 — Delete via modal custom de confirmação
1. `/dashboard/lancamentos` clicar no ícone de lixeira
2. **Esperado:** modal custom com título "Excluir lançamento", texto "Tem certeza que deseja excluir 'X'?", botões Cancelar (secundário) + Excluir (vermelho)
3. Clicar Cancelar → modal fecha, lançamento permanece
4. Reabrir → clicar Excluir → loading → some da lista
5. **NÃO esperado:** `window.confirm` nativo do browser

### R2.6 🟢 — AppHeader não trunca em mobile
1. Viewport 390×844
2. `/dashboard/` → header mostra "Dashboard" inteiro (não "hboard")
3. `/dashboard/fluxo-caixa` → header mostra "Fluxo de Caixa" + "Visualize entradas..." completo
4. Descrição pode ter ellipsis ("...") se não couber, mas NUNCA cortar o início

### R2.7 🟡 — Card Assinatura em conta nova mostra empty state
1. Criar conta nova + onboarding
2. `/dashboard/configuracoes`
3. Scroll até card "Assinatura"
4. **Esperado:** "Você ainda não tem uma assinatura ativa" + link "Ver planos" → /planos
5. **NÃO esperado:** "Status: Expirada" ou "Plano: Anual"

### R2.8 🟢 — Nome vazio no /register mostra erro custom, não tooltip nativo
1. `/register` deixar Nome vazio + preencher resto
2. Clicar "Criar Conta"
3. **Esperado:** texto vermelho "Nome é obrigatório" abaixo do form
4. **NÃO esperado:** balão do browser tipo "Preencha este campo."

### R2.9 🟢 — Email contato no footer da landing
1. `/`
2. Scroll até o fim
3. **Esperado:** visível `contato@guardadinheiro.com.br` (link mailto) junto com Privacidade/Termos

### R2.10 🟡 — Coluna Vencimento mostra a data salva
1. Criar lançamento via `/dashboard/lancamentos` preenchendo "Vencimento" no datepicker (usar calendário do browser, clicar numa data ~ 5 dias à frente)
2. Salvar → olhar coluna "Vencimento" na listagem
3. **Esperado:** data formatada DD/MM/AAAA correspondente ao que foi escolhido (sem shift de 1 dia pra trás)
4. Repetir em `/dashboard/contas-pagar` e `/dashboard/contas-receber`

---

## 3. COBERTURA INCREMENTAL (áreas não testadas antes / edge cases)

### 3.1 — Confirmação de email via link → login
1. Cadastrar conta com email REAL seu (não descartável)
2. Abrir email de confirmação → clicar no link
3. **Esperado:** redireciona pra `/login?confirmed=1` ou tela de sucesso
4. Fazer login com as mesmas credenciais → entra no /dashboard (com onboarding modal)

### 3.2 — Reenviar email múltiplas vezes (rate limit)
1. Conta não confirmada em `/verificar-email`
2. Clicar "Reenviar email de confirmação" 3x em sequência
3. **Esperado:** Supabase rate-limit (1/60s) → mensagem de erro amigável no 2º ou 3º clique

### 3.3 — Dashboard score: conta nova × conta com >5 lançamentos
1. Conta nova sem lançamentos → `/dashboard`
2. **Esperado:** Score card mostra "Comece a lançar pra calcular seu score" (não "200 - Muito baixo")
3. Criar 6 lançamentos variados (receitas + despesas pagas)
4. Refresh `/dashboard`
5. **Esperado:** Score numérico aparece (provavelmente 300-700 faixa dependendo dos dados)

### 3.4 — CRUD completo de Lançamentos
- [ ] **Criar** receita via modal → aparece na lista
- [ ] **Criar** despesa com status "atrasado" → aparece com badge vermelha
- [ ] **Filtrar** por tipo "Receita" → só receitas na lista
- [ ] **Filtrar** por status "Atrasado" → só atrasados
- [ ] **Buscar** por descrição parcial (ex: "conta") → retorna matches
- [ ] **Combinar** filtros tipo+status → AND (não OR)
- [ ] **Paginação** (criar 26+ lançamentos) → botões anterior/próxima aparecem
- [ ] **Editar** → modal pré-preenche (R2.4) → salvar → reflete lista
- [ ] **Deletar** → modal custom (R2.5)

### 3.5 — Contas a Pagar / Receber
1. `/dashboard/contas-pagar` → só despesas pendentes/atrasadas
2. `/dashboard/contas-receber` → só receitas pendentes
3. Marcar como paga (se houver botão) → some da lista
4. Vencimentos passados → destaque vermelho

### 3.6 — Categorias CRUD
- [ ] Criar categoria custom "Viagem" receita → aparece na listagem
- [ ] Editar categoria custom → renome → reflete
- [ ] Deletar categoria DEFAULT (tentar) → deve bloquear ou exigir confirmação
- [ ] Deletar categoria CUSTOM → remove

### 3.7 — Recorrências
1. `/dashboard/recorrencias` sem recorrências → empty state
2. **NÃO deve ter** botão "+ Nova Recorrência" (intencional — só via WhatsApp)

### 3.8 — Compromissos/Agenda
1. `/dashboard/compromissos` ou `/dashboard/agenda`
2. Criar compromisso (se houver UI)
3. Listar futuros/passados

### 3.9 — /dashboard/whatsapp
1. Página carrega sem erro
2. Mostra status do link ou QR code/botão de vinculação

### 3.10 — Configurações completas
**Dados da Conta:**
- [ ] Editar Nome com `<script>` → server rejeita com erro em pt-BR
- [ ] Editar Nome válido → salva → "Salvo com sucesso!"

**Alterar Senha:**
- [ ] Senha atual errada → "Senha atual incorreta" (ou similar)
- [ ] Nova com <8 chars → erro
- [ ] Sucesso → "Senha alterada com sucesso!" + campos limpos

**Assinatura:** (R2.7 já cobre)

**Excluir Conta:** (testar em conta descartável!)
- [ ] Botão "Quero excluir..." → input aparece
- [ ] Digite "EXCLUIR" → botão habilita
- [ ] Confirmar → redirect /login + conta some

### 3.11 — /dashboard/materiais
1. Conta sem compras → empty state com CTA "Ver planos e bônus disponíveis" → /planos
2. Conta com bump comprado → lista de arquivos (testar só se tiver conta real pós-compra)

### 3.12 — /planos: fluxo completo até MP
1. Modal Anual → bump desmarcado → total R$ 358,80 → Assinatura → email válido
2. Submit → "Redirecionando..." com loader
3. **Esperado:** abre Mercado Pago (URL `mercadopago.com.br`) com valor R$ 358,80
4. **ABORTAR** (não finalizar) → voltar com back do browser
5. Repetir com bump marcado → total R$ 425,80
6. Repetir modal Mensal → R$ 79,90

### 3.13 — /como-funciona mobile swipe
1. Viewport 390px
2. Swipe pra esquerda → avança slide
3. Swipe pra direita → volta
4. Slide 1 → não volta (R1.9)
5. Slide 9 → botão vira "Começar agora" ou similar

### 3.14 — Subdomínios
- [ ] `admin.guardadinheiro.com.br/login` carrega (não redireciona pra domínio principal)
- [ ] `afiliado.guardadinheiro.com.br/login` carrega
- [ ] `guardadinheiro.com.br/admin` → redireciona pra `/`

### 3.15 — Páginas legais
- [ ] `/termos` — conteúdo completo com 13+ seções
- [ ] `/privacidade` — LGPD, DPO, email contato
- [ ] `/afiliado/termos` (no subdomínio afiliado) — contrato completo

### 3.16 — Responsividade 390px (iPhone)
Testar cada página crítica:
- [ ] `/` — hamburguer abre drawer, nada transborda
- [ ] `/planos` — cards empilhados, modal full-screen com scroll interno
- [ ] `/register` — form sem scroll horizontal
- [ ] `/dashboard` — sidebar vira drawer, cards empilham
- [ ] `/dashboard/lancamentos` — tabela com scroll horizontal, linhas legíveis
- [ ] Modais do dashboard (onboarding, lançamento, delete) — 90vw, scroll interno

### 3.17 — Segurança
- [ ] XSS em DESCRIÇÃO de lançamento: criar com `<script>alert(1)</script>` — React escapa, não executa
- [ ] XSS em NOTAS: idem
- [ ] SQL injection no filtro de busca `/lancamentos?q=' OR 1=1--` → não retorna tudo, não quebra
- [ ] Logado como conta A, tentar `/api/...` manipulando tenant_id → 403 ou silent fail
- [ ] Deslogado, acessar `/dashboard/lancamentos` → redirect `/login`
- [ ] Headers HTTPS (view-source) — sem tokens hardcoded
- [ ] `localStorage` não tem `supabase.auth.token` ou similar (deve estar em cookie HttpOnly)

### 3.18 — Performance (Lighthouse Mobile)
- [ ] `/` — LCP < 2.5s, CLS < 0.1
- [ ] `/planos` — similar
- [ ] `/dashboard` — LCP < 3s (tem dados)
- [ ] Nenhum console.error nas 3

### 3.19 — Acessibilidade
- [ ] Tab navigation: chegar em TODOS os elementos clicáveis sem mouse
- [ ] Focus ring visível em todos
- [ ] Screen reader lê labels de inputs (NVDA/VoiceOver)
- [ ] Botões só-ícone têm `aria-label` (X, hamburguer, lápis, lixeira)

### 3.20 — Emails transacionais (receber e abrir)
- [ ] **Confirm signup** — escudo emerald, link funciona, remetente com domínio próprio
- [ ] **Reset password** — botão funciona
- [ ] **Welcome** (se disparável) — mesmo visual
- [ ] Todos em PT-BR, rodapé LGPD, contato@guardadinheiro.com.br

### 3.21 — Edge cases
- [ ] 2 abas simultâneas: logar em 1 → refresh na outra → sincroniza
- [ ] Logout em 1 aba → próxima ação na outra → redirect /login
- [ ] URL direta `/dashboard/lancamentos` em aba anônima → redirect `/login`
- [ ] Network throttle "Slow 3G" no signUp → loading permanece, não trava infinito
- [ ] Zoom 150% → layout não quebra

### 3.22 — Logout + re-login
1. Logado, clicar botão Sair (sidebar? menu?)
2. **Esperado:** redirect pra `/login`
3. Tentar voltar pra `/dashboard` via URL → redirect /login

---

## 4. Relatório final

### 4.1 — Formato por bug
```
## BUG #N — <título>
- Severidade: 🔴/🟠/🟡/🟢
- Página: URL
- Steps: 1. ... 2. ... 3. ...
- Esperado: ...
- Observado: ...
- Console: <logs ou "nenhum">
- Reproduzível: 100% / intermitente
- Impacto: 1 linha
```

### 4.2 — Resumo
- Regressão R1 (11 casos): <X passou / Y falhou>
- Regressão R2 (10 casos): <X passou / Y falhou>
- Cobertura nova: <novos bugs encontrados>
- Severidades totais: 🔴 / 🟠 / 🟡 / 🟢
- Performance: LCP/CLS/INP nas 3 páginas críticas
- **Veredito:** GO (zero critical+high) ou NO-GO (há critical/high)
