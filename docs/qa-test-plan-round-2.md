# QA TEST PLAN — Round 2 (Guarda Dinheiro)

**Alvo:** https://www.guardadinheiro.com.br
**Data:** 21/04/2026
**Deploy base:** commit `29f1b21` (após correção dos 11 bugs do Round 1)
**Objetivo:** Regressão dos bugs corrigidos + cobertura completa do que faltou no Round 1.

> **Critério de sucesso:** zero bugs encontrados. Qualquer inconsistência (mesmo cosmética) precisa ser reportada.

---

## 0. Setup prévio

**Ferramentas:** Chrome/Edge moderno (DevTools aberto o tempo todo, aba Console + Network).

**Contas descartáveis pra cadastro:**
- https://temp-mail.org/ (ou `@mailinator.com`, `@sharklasers.com`)
- Use emails únicos por teste: `teste+${Date.now()}@mailinator.com`

**Cartão de teste Mercado Pago (ambiente produção — NÃO finalize pagamento):**
- APRO (aprovação): `5031 4332 1540 6351` · CVV 123 · validade 11/30 · nome `APRO`
- OTHE (rejeita): `5031 4332 1540 6351` · CVV 123 · nome `OTHE`
- **NUNCA completar compra real** — apenas validar que o fluxo chega no MP e exibe a tela deles. Aborte antes do submit final.

**Viewports a testar (trocar no DevTools → Toggle device):**
- Desktop: **1440×900** e **1920×1080**
- Tablet: **768×1024** (iPad)
- Mobile: **390×844** (iPhone 14) e **360×800** (Galaxy)

**Matar cache entre testes:** Ctrl+Shift+R (hard reload) ou DevTools → Application → Clear storage.

**Formato do report:** bullets com severidade + steps + console logs + screenshot (se aplicável).

Severidades:
- 🔴 **Critical** — bloqueia venda ou expõe dados
- 🟠 **High** — degrada UX de fluxo principal
- 🟡 **Medium** — impacta UX secundária
- 🟢 **Low** — cosmético / nice-to-have

---

## 1. REGRESSÃO DOS 11 BUGS DO ROUND 1

Estes casos DEVEM passar agora. Se algum falhar, é regressão crítica.

### R1.1 — Registro não libera login sem confirmar email
1. `/register` com email real descartável + senha `teste12345`
2. Clicar "Criar Conta"
3. **Esperado:** tela "Verifique seu email" com botão "Reenviar email de confirmação"
4. **NÃO esperado:** redirect pra /dashboard

### R1.2 — Rota inexistente → 404 customizada (não /login)
1. Navegar `/nunca-existiu-${Date.now()}` **deslogado**
2. **Esperado:** página 404 com logo emerald, "Página não encontrada", botões "Voltar para o início" + "Ir para o painel"
3. **NÃO esperado:** redirect pra /login
4. Repetir **logado** — mesmo 404 esperado

### R1.3 — Fluxo de Caixa sem "Invalid Date"
1. Login → criar 1 lançamento receita + 1 despesa (podem ter data)
2. `/dashboard/fluxo-caixa`
3. **Esperado:** coluna DATA com valores tipo "23 abr", "22 abr" (sem nenhum "Invalid Date" em lugar nenhum)

### R1.4 — Botão pagamento desabilitado com email inválido
1. `/planos` → clicar "Quero o plano anual"
2. Digitar `abc` no email (sem blur)
3. **Esperado:** botão "Ir para o pagamento" visualmente cinza (`bg-slate-800`), cursor `not-allowed`, não clica

### R1.5 — ESC fecha modal /planos
1. `/planos` → abrir modal (qualquer)
2. Pressionar **ESC**
3. **Esperado:** modal fecha suavemente

### R1.6 — Mensagens de erro em PT-BR
1. `/register` com email já cadastrado
2. **Esperado:** "Este e-mail já está cadastrado. Faça login." (não "User already registered" nem "Failed to fetch")
3. Desconectar internet → tentar cadastrar
4. **Esperado:** "Erro de conexão. Verifique sua internet e tente novamente."

### R1.7 — XSS no campo Nome bloqueado
1. `/register` com nome `<script>alert('x')</script>` + email válido
2. **Esperado:** erro "Nome inválido. Use apenas letras, espaços, apóstrofo ou hífen (2-60 caracteres)."
3. Repetir com `Admin{drop tab}` → bloqueado
4. Nome válido: `José D'Ávila-Silva` → aceito

### R1.8 — Categorias com acento
1. Criar conta nova, completar onboarding
2. `/dashboard/categorias`
3. **Esperado:** "Alimentação", "Saúde", "Educação", "Salário" (com acento)
4. Clicar "+ Nova Categoria"
5. **Esperado:** placeholder "Ex: Alimentação" (com acento)

### R1.9 — Botão "← Voltar" em /como-funciona (já estava ok)
1. `/como-funciona` slide 1
2. **Esperado:** botão "← Voltar" visualmente cinza (opacity 30%), não clicável

### R1.10 — Title sem duplicação
1. Verificar tab title em `/planos`
2. **Esperado:** "Planos | Guarda Dinheiro" (UM "| Guarda Dinheiro", não dois)
3. Repetir em `/como-funciona`, `/compra-concluida`

### R1.11 — Seção Assinatura em /configuracoes
1. `/dashboard/configuracoes`
2. **Esperado:** 4 cards — Dados da Conta, Alterar Senha, **Assinatura**, Excluir Conta
3. Sem assinatura ativa → card mostra "Você ainda não tem uma assinatura ativa" + link "Ver planos"

---

## 2. LANDING (`/`)

### 2.1 — Hero
- [ ] Logo emerald (escudo + nome) no canto esquerdo — clica e vai pra `/`
- [ ] CTA primário "Começar agora" → `/planos`
- [ ] CTA secundário "Ver como funciona" → `/como-funciona`
- [ ] Textos sem typo, sem palavras cortadas
- [ ] Gradientes emerald renderizam em Chrome/Firefox/Safari

### 2.2 — Seção "Como funciona"
- [ ] 3 steps exibidos (mandar áudio → IA organiza → ver no painel)
- [ ] Icones não quebram

### 2.3 — Seção depoimentos
- [ ] Cards com foto+nome+texto
- [ ] Texto legível em dark mode

### 2.4 — FAQ
- [ ] Clicar cada pergunta → expande resposta com animação suave
- [ ] Clicar de novo → colapsa
- [ ] Nenhum FAQ aberto por default

### 2.5 — CTA final + Footer
- [ ] Botão "Começar agora" → /planos
- [ ] Links footer: Termos, Privacidade, email `contato@guardadinheiro.com.br`
- [ ] Copyright "© 2026 Guarda Dinheiro"

### 2.6 — Mobile (390px)
- [ ] Hamburguer abre drawer com navegação
- [ ] ESC/clicar fora fecha drawer
- [ ] Nada transborda horizontal
- [ ] Botões com mín 44px de altura (tap target)

---

## 3. /planos

### 3.1 — Layout
- [ ] 2 cards: Anual (destaque emerald, badge "Mais escolhido", badge "-62%") + Mensal
- [ ] Preços corretos: Anual R$ 29,90/mês · R$ 358,80/ano · Mensal R$ 79,90/mês
- [ ] Badge "Garantia de 7 dias" acima do H1
- [ ] Seção bônus (R$ 67) com 3 itens descritos

### 3.2 — Modal Anual
- [ ] Clicar "Quero o plano anual" → modal abre
- [ ] Toggle Assinatura/Pagamento único — ambos clicáveis, highlight emerald no selecionado
- [ ] Checkbox "Adicionar Pacote Arquitetura da Liberdade" → total passa de R$ 358,80 pra R$ 425,80
- [ ] Desmarcar bump → total volta pra R$ 358,80
- [ ] Campo email valida em tempo real (R1.4)
- [ ] Email duplicado já cadastrado: após submit, MP rejeita ou aceita conforme fluxo
- [ ] Botão X fecha · backdrop click fecha · ESC fecha (R1.5)
- [ ] Quando loading, modal não fecha por ESC/backdrop (aguarda resposta)

### 3.3 — Modal Mensal
- [ ] Não tem toggle Assinatura/Pagamento único (só PreApproval)
- [ ] Total fixo R$ 79,90
- [ ] Bump R$ 67 funciona igual ao Anual
- [ ] Submit com email válido → redirect pra Mercado Pago (URL contém `mercadopago.com.br`)

### 3.4 — Submit do modal
- [ ] Email vazio → botão desativado
- [ ] Email `abc@` → erro "E-mail inválido" em vermelho
- [ ] Email `valido@teste.com` → botão ativa → submit → "Redirecionando..." com loader → MP carrega
- [ ] **NÃO FINALIZAR PAGAMENTO** — voltar pelo browser

### 3.5 — FAQ /planos
- [ ] 6-8 FAQs específicas de planos
- [ ] Expand/collapse funciona
- [ ] JSON-LD de FAQ no HTML (view-source)

---

## 4. /como-funciona

- [ ] 9 slides navegáveis (← →)
- [ ] Slide 1: botão "← Voltar" desativado visualmente (R1.9)
- [ ] Slide 9: botão "Próximo →" desativado ou vira "Começar agora"
- [ ] Indicador "slide N de 9" visível
- [ ] FAQ inline no rodapé
- [ ] Botão WhatsApp final funciona (abre wa.me/+554820270106)
- [ ] Swipe funciona em mobile

---

## 5. /register — regressão + novos casos

### 5.1 — Fluxo feliz
- [ ] Nome `João da Silva` + email único + senha `teste12345` → submit → tela "Verifique seu email" (R1.1)
- [ ] Botão "Reenviar email de confirmação" funciona (Supabase rate limit = 1x/60s)
- [ ] Link "Voltar ao login" → /login

### 5.2 — Validações
- [ ] Nome vazio → "Nome é obrigatório"
- [ ] Nome `<script>...` → bloqueado (R1.7)
- [ ] Nome `A` (1 char) → bloqueado pela regex
- [ ] Nome com 61 chars → bloqueado
- [ ] Email `abc` → erro do Supabase traduzido
- [ ] Senha `1234567` (7 chars) → "Senha deve ter pelo menos 8 caracteres"
- [ ] Senhas diferentes → "Senhas não conferem"
- [ ] Email já cadastrado → "Este e-mail já está cadastrado. Faça login." (R1.6)

### 5.3 — Segurança
- [ ] SQL injection no email: `a'; DROP TABLE users;--@teste.com` → não quebra
- [ ] XSS no nome: já testado em 5.2
- [ ] Submit duplo rápido → apenas uma conta criada
- [ ] Network throttle "Slow 3G" → loading permanece, não trava

---

## 6. /login

### 6.1 — Fluxos normais
- [ ] Email + senha errados → "Email ou senha incorretos"
- [ ] Email válido + senha correta + email NÃO confirmado → banner amarelo "Confirme seu email antes de entrar" + botão "Reenviar email de confirmação"
- [ ] Clicar reenviar — mensagem de sucesso ou erro apropriado
- [ ] Email confirmado + senha correta → redirect para `/dashboard`

### 6.2 — Link "Esqueci minha senha"
- [ ] Clicar → `/esqueci-senha`

### 6.3 — Link "Ver planos" (cadastro)
- [ ] Clicar → `/planos`

---

## 7. /verificar-email

1. Cadastre conta nova, NÃO confirme email
2. Tente acessar `/dashboard` diretamente
3. **Esperado:** redireciona pra `/verificar-email`
4. Tela mostra: logo, ícone mail, email do usuário, botão "Reenviar email", botão "Usar outro email" (signOut + volta login), link "Voltar ao site"
5. Botão "Usar outro email" → desloga → /login
6. Depois de confirmar email, acessar /verificar-email manualmente → redireciona pra /dashboard

---

## 8. /esqueci-senha + /redefinir-senha

### 8.1 — Esqueci senha
- [ ] Email válido → "E-mail enviado" com link "Voltar ao login"
- [ ] Email inexistente → não revela (Supabase retorna sucesso mesmo assim — anti-enumeração)

### 8.2 — Redefinir senha
- [ ] Abrir link do email → formulário com nova senha
- [ ] Senha < 8 chars → erro
- [ ] Senhas diferentes → "Senhas não conferem"
- [ ] Submit com sucesso → "Senha redefinida" → redirect pra /dashboard em 3s

---

## 9. Onboarding Modal (primeiro login)

### 9.1 — Fluxo PF
1. Login com conta nova confirmada
2. Modal abre automaticamente — **NÃO tem botão X, ESC não fecha, clicar fora não fecha**
3. Clicar "Pessoa Física" → step 2
4. Nome vazio → "Nome obrigatório"
5. Nome `<script>` → bloqueado
6. Nome `Maria` + CPF inválido `111.111.111-11` → "CPF inválido"
7. CPF válido (gerar em geradorcpf.com) → Começar a usar → dashboard

### 9.2 — Fluxo PJ
1. Outra conta nova → modal → "Pessoa Jurídica"
2. Razão Social com `<script>` → bloqueado
3. CNPJ inválido → "CNPJ inválido"
4. CNPJ válido (geradorcnpj.com) → Começar a usar → dashboard

---

## 10. /dashboard (overview)

- [ ] AppHeader "Dashboard — Visão geral do mês atual"
- [ ] Empty state "Bem-vindo ao Guarda Dinheiro!" se sem transações
- [ ] 4 StatCards: Saldo, Receitas, Despesas, Contas Vencidas
- [ ] Score Financeiro: conta com <5 transações → "Comece a lançar pra calcular seu score" (NÃO mostra "200 - Muito baixo") **← UX fix**
- [ ] Cash Flow Chart carrega
- [ ] Recent Transactions — última 10
- [ ] Category Breakdown — pie/donut

---

## 11. /dashboard/lancamentos — CRUD COMPLETO

### 11.1 — Criar
- [ ] Botão "+ Novo Lançamento" abre modal
- [ ] Toggle Receita/Despesa
- [ ] Descrição obrigatória
- [ ] Valor: aceita `100,50` (pt-BR) e `100.50`
- [ ] Categoria: select populado com categorias padrão com acento (R1.8)
- [ ] Status: pendente/pago/atrasado/cancelado
- [ ] Data vencimento + data pagamento (datepicker)
- [ ] Notas (opcional)
- [ ] Submit → aparece na lista

### 11.2 — Listagem
- [ ] Tabela com colunas: Data, Descrição, Categoria, Valor, Status
- [ ] Filtros: Todos/Receita/Despesa, Status, Período
- [ ] Busca por descrição
- [ ] Paginação (se >N itens)
- [ ] Ordenação por coluna (clicável?)

### 11.3 — Editar
- [ ] Clicar linha ou botão edit → modal pré-preenchido
- [ ] Mudar valor → salvar → reflete na lista

### 11.4 — Deletar
- [ ] Botão delete → confirma
- [ ] Delete → some da lista

---

## 12. /dashboard/contas-pagar + /dashboard/contas-receber

- [ ] Listagem apenas despesas pendentes/atrasadas (contas-pagar)
- [ ] Listagem apenas receitas pendentes (contas-receber)
- [ ] Marcar como paga → muda status
- [ ] Vencidas em vermelho, próximas em amarelo

---

## 13. /dashboard/fluxo-caixa (R1.3)

- [ ] Seletor de período: 7/15/30/60/90 dias
- [ ] 3 cards: Entradas, Saídas, Saldo Período (cor condicional)
- [ ] Gráfico de linha
- [ ] Tabela com data formatada (sem "Invalid Date")

---

## 14. /dashboard/categorias

- [ ] 12 categorias PF (ou PJ) visíveis com acento (R1.8)
- [ ] Separadas em Receitas / Despesas
- [ ] Cada uma com ícone + cor
- [ ] + Nova Categoria: placeholder "Ex: Alimentação" (R1.8)
- [ ] Criar → salva → aparece
- [ ] Editar → salva
- [ ] Deletar (se não for default) → remove
- [ ] Categoria default NÃO pode ser deletada (ou pode mas vem flag?)

---

## 15. /dashboard/recorrencias

- [ ] Lista de recorrências (ou empty state)
- [ ] Toggle active/inactive
- [ ] **Sem** botão "+ Nova Recorrência" — intencional, só via WhatsApp

---

## 16. /dashboard/agenda ou /compromissos

- [ ] Calendário ou lista
- [ ] Adicionar compromisso
- [ ] Notificação/lembrete

---

## 17. /dashboard/whatsapp

- [ ] Status do link
- [ ] Número ativo
- [ ] QR code ou botão pra abrir wa.me

---

## 18. /dashboard/configuracoes (R1.11)

### 18.1 — Dados da Conta
- [ ] Nome, CPF/CNPJ, telefone editáveis
- [ ] Nome com `<script>` → bloqueado server-side (após fix #7)
- [ ] Salvar → "Salvo com sucesso!"

### 18.2 — Alterar Senha
- [ ] Senha atual errada → erro
- [ ] Senha nova < 8 chars → erro
- [ ] Senhas diferentes → erro
- [ ] Success → "Senha alterada com sucesso!"

### 18.3 — Assinatura (NOVO)
- [ ] Conta sem assinatura: "Você ainda não tem uma assinatura ativa" + link "Ver planos"
- [ ] Conta com assinatura mock (simular via admin se possível): mostra Status/Plano/Próxima cobrança + "Gerenciar no Mercado Pago" (só se status active + gateway=mercadopago)

### 18.4 — Excluir Conta
- [ ] Clicar "Quero excluir minha conta" → input aparece
- [ ] Texto ≠ "EXCLUIR" → botão disabled
- [ ] "EXCLUIR" → clica → confirm JS nativo → delete → redirect /login
- [ ] Testar em conta descartável!

---

## 19. /dashboard/materiais (UX #3)

- [ ] Sem compras → empty state com CTA "Ver planos e bônus disponíveis" linkando /planos
- [ ] Com compra (bump): mostra lista com arquivos downloadáveis

---

## 20. /compra-concluida

- [ ] Layout com check emerald grande
- [ ] Botão "Ativar no WhatsApp" abre wa.me
- [ ] Title: "Compra concluída | Guarda Dinheiro" (UM sufixo, R1.10)

---

## 21. Subdomínios

### 21.1 — admin.guardadinheiro.com.br
- [ ] /admin/login carrega
- [ ] Sem credenciais → não loga
- [ ] Acesso direto ao domínio principal `/admin` → redirect `/`

### 21.2 — afiliado.guardadinheiro.com.br
- [ ] /afiliado/login carrega
- [ ] /afiliado/termos carrega (em guardadinheiro.com.br/afiliado/termos — bloqueado)

---

## 22. Páginas legais

- [ ] /termos — conteúdo completo, footer, logo
- [ ] /privacidade — conteúdo LGPD, DPO, email contato
- [ ] /afiliado/termos — 13 seções de contrato

---

## 23. 404 / Error pages

- [ ] `/teste-404-${Date.now()}` → página 404 customizada (R1.2) logado e deslogado
- [ ] Forçar erro em /dashboard (mock API down?) — NÃO expõe stacktrace ao usuário
- [ ] `/api/inexistente` → 404 JSON ou similar (não HTML)

---

## 24. Responsividade 390×844 (iPhone 14)

Para TODAS as páginas acima, testar em 390px:
- [ ] Nada transborda horizontalmente (scroll horizontal é RED FLAG)
- [ ] Botões ≥ 44px altura
- [ ] Textos legíveis (mín 14px body, 12px meta)
- [ ] Modais ocupam 90vw, scroll interno se maior que 90vh
- [ ] Forms sem zoom no focus (meta viewport correto)
- [ ] Navegação mobile (hamburguer) em /, /planos, /como-funciona

Focos críticos mobile:
- [ ] `/planos` — cards empilhados, modal full-height
- [ ] `/register` — todos os inputs visíveis sem scroll inicial
- [ ] Dashboard — sidebar vira drawer?
- [ ] Modal onboarding — 2 steps sem scroll

---

## 25. Performance (Lighthouse)

Rodar Lighthouse → Mobile → Performance em:
- [ ] `/` — LCP < 2.5s, CLS < 0.1, FID/INP < 200ms
- [ ] `/planos` — mesma barra
- [ ] `/dashboard` (após login) — LCP < 3s (tem mais dados)

Flags críticas:
- [ ] Nenhum console.error
- [ ] Nenhum preload não utilizado (warning do Chrome)
- [ ] Imagens otimizadas (next/image)

---

## 26. Acessibilidade

- [ ] Navegar TODA a aplicação apenas com **Tab + Enter + ESC** — nada fica inalcançável
- [ ] Focus visível (ring emerald) em todos os elementos clicáveis
- [ ] Labels em inputs (não só placeholder)
- [ ] aria-label em ícones clicáveis (botão X, hamburguer)
- [ ] Contraste texto em dark — `slate-400` em `#000` passa WCAG AA?
- [ ] Screen reader (NVDA ou VoiceOver em macOS): /register pronuncia labels corretamente

---

## 27. Segurança

### 27.1 — Headers
- [ ] View-source: sem comentários com credentials
- [ ] DevTools → Network → olhar `/api/*` requests: tem `authorization` bearer ou cookie HttpOnly (não localStorage)
- [ ] HTTPS obrigatório — testar `http://guardadinheiro.com.br` → redirect 301

### 27.2 — XSS persistente
- [ ] Nome `<img src=x onerror=alert(1)>` (bloqueado pela regex client) — confirmar que server também bloqueia (via POST direto à action)
- [ ] Descrição de lançamento com `<script>` — renderizado como texto (React escapa), não executa

### 27.3 — Authorization
- [ ] Logado como Tenant A, tentar URL `/api/...tenant_B_id...` → 403 ou silent fail
- [ ] Deslogado, acessar `/dashboard/lancamentos` → redirect /login

### 27.4 — Rate limit
- [ ] /register 10x em 1min com emails diferentes → Supabase deve limitar
- [ ] /api/subscriptions/preapproval POST spam → rate limit

---

## 28. Edge cases / sanity

- [ ] Abrir /login em 2 abas, logar em 1, refresh na outra → sincroniza (ou redireciona /dashboard)
- [ ] Logar em 1 aba, logout em outra → aba antiga: próxima ação → redirect /login
- [ ] Copiar URL do /dashboard → colar em aba anônima → redirect /login
- [ ] Dark mode em Windows/Mac/Linux — visual idêntico
- [ ] Zoom 150% no browser → layout não quebra
- [ ] Desabilitar JavaScript (chrome://settings/content/javascript) → mensagem "Habilite JS" ou página estática funcional

---

## 29. Email transacionais (validação de conteúdo)

Para cada tipo, disparar (cadastrar/pagar/etc.) e abrir no Gmail:
- [ ] **Confirm signup** — escudo emerald no header, link funciona, expira em 24h
- [ ] **Reset password** — botão "Redefinir senha" funciona
- [ ] **Welcome** (após 1ª compra) — layout consistente com confirm signup
- [ ] **Payment confirmed** — valor e plano corretos
- [ ] **Subscription expiring** (se disparável) — aviso 3 dias antes

**Todos os emails devem ter:**
- Escudo emerald (CSS table, não emoji) no header
- Rodapé "Em conformidade com a LGPD"
- Email de contato `contato@guardadinheiro.com.br`
- Dark mode nativo (fundo #000)

---

## 30. Relatório final

Formato esperado de cada bug encontrado:
```
## BUG #N — <título curto>
- Severidade: 🔴/🟠/🟡/🟢
- Página: URL
- Steps: 1. ... 2. ... 3. ...
- Esperado: ...
- Observado: ... (screenshot se possível)
- Console: <erros ou "nenhum">
- Reproduzível: 100% / intermitente
- Impacto: 1 linha sobre quem se ferra
```

**Ao final, incluir:**
- Total de bugs por severidade
- Checklist de fluxos 100% OK
- Flags de performance (LCP, CLS, INP)
- Recomendações UX (improvements, não bugs)
