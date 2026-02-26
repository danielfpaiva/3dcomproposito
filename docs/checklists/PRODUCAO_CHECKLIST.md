# ✅ Checklist de Validação ANTES de Produção

## 🎯 Objetivo
Garantir que TUDO funciona 100% antes de outras pessoas testarem o site em produção.

---

## 📋 1. Validação Local (localhost:8081)

### Teste 1: Página Inicial
- [ ] Site carrega sem erros no console
- [ ] Mapa de Portugal aparece corretamente
- [ ] Ilhas (Açores e Madeira) estão visíveis
- [ ] Estatísticas aparecem nos cards:
  - Total de Voluntários
  - Projetos Ativos
  - Peças Impressas
  - Cadeiras Completas
- [ ] Ao passar o rato sobre regiões, aparece o tooltip com dados
- [ ] Tooltip do Algarve aparece em cima (não cortado)

### Teste 2: Menu de Navegação
- [ ] "Início" funciona
- [ ] "Organizadores" funciona
- [ ] "Doar" funciona
- [ ] "Pedir Ajuda" funciona
- [ ] "Recursos" funciona
- [ ] "Entrar" funciona

### Teste 3: Página de Organizadores (/organizadores)
- [ ] Lista de voluntários carrega
- [ ] Mostra 191 voluntários
- [ ] Cards mostram informações:
  - Nome
  - Localização
  - Materiais (PETG, TPU, etc.)
  - Modelos de impressora
- [ ] Filtros por região funcionam
- [ ] Pesquisa funciona

### Teste 4: Formulário de Registo de Voluntário (/contribute)
- [ ] Formulário carrega
- [ ] Todos os campos aparecem:
  - Nome
  - Email
  - Telefone
  - Localização
  - Região (dropdown)
  - Disponibilidade
  - Materiais (checkboxes)
  - Modelos de impressora
  - Build plate size
  - Pode enviar? (checkbox)
  - Nível de experiência
  - Tempo de produção
- [ ] **NÃO submetas** o formulário (não queremos duplicados)
- [ ] Validações funcionam (campos obrigatórios)

### Teste 5: Formulário de Pedido de Ajuda (/pedir-ajuda)
- [ ] Formulário carrega
- [ ] Campos aparecem:
  - Nome do contacto
  - Email
  - Telefone
  - Região
  - Idade do beneficiário
  - Tipo (criança/adulto)
  - Descrição
  - Como nos encontrou
- [ ] **NÃO submetas** (não criar pedidos de teste)
- [ ] Validações funcionam

### Teste 6: Página de Recursos (/recursos)
- [ ] Links para modelos 3D funcionam
- [ ] Links externos abrem em nova tab
- [ ] Informações estão corretas

### Teste 7: Portal do Voluntário (/portal)
- [ ] Página pede token de acesso
- [ ] Campo de token aparece
- [ ] **Testa com um token real** da tabela contributors:
  - Abre o Supabase SQL Editor
  - Executa: `SELECT name, token FROM contributors LIMIT 1;`
  - Copia o UUID do token
  - Cola no campo do portal
  - [ ] Acesso ao portal funciona
  - [ ] Mostra dados do voluntário
  - [ ] Mostra peças atribuídas (se tiver)

### Teste 8: Painel de Admin (/admin)
- [ ] Requer autenticação
- [ ] Se tens acesso admin:
  - [ ] Dashboard mostra estatísticas
  - [ ] Tabela de voluntários carrega (191 linhas)
  - [ ] Filtros funcionam
  - [ ] Paginação funciona
  - [ ] Pesquisa funciona
  - [ ] Pode atribuir peças aos voluntários
  - [ ] Pedidos de beneficiários aparecem (3 pedidos)
  - [ ] Pode aprovar/rejeitar pedidos

---

## 🔍 2. Verificação de Dados no Supabase

No SQL Editor da nova Supabase (bsbqmqfznkozqagdhvoj):

```sql
-- Verifica arrays nos contributors (materiais e impressoras)
SELECT
  name,
  materials,
  printer_models,
  region
FROM contributors
WHERE materials IS NOT NULL
LIMIT 5;
```

**Esperado:**
- Arrays devem aparecer como: `{PETG,TPU}` ou `{"Bambu Lab A1","Bambu Lab A1 mini"}`
- NÃO deve aparecer: `["PETG","TPU"]` (formato JSON - incorreto)

```sql
-- Verifica peças atribuídas
SELECT
  p.part_name,
  p.status,
  c.name as contributor_name,
  w.name as project_name
FROM parts p
LEFT JOIN contributors c ON p.assigned_contributor_id = c.id
LEFT JOIN wheelchair_projects w ON p.project_id = w.id
LIMIT 10;
```

**Esperado:**
- 48 peças
- Algumas com status 'assigned', 'in_progress', 'completed'
- Nomes de voluntários aparecem (se atribuído)

---

## 🚀 3. Atualizar Vercel (DEPOIS de validar localmente)

**IMPORTANTE:** Só faz isto DEPOIS de confirmar que TUDO funciona localmente!

### Passo 1: Atualizar Variáveis de Ambiente

1. Vai a: https://vercel.com/[teu-username]/3dcomproposito/settings/environment-variables

2. **Edita** (não apagues/cria) cada variável:

   **VITE_SUPABASE_PROJECT_ID:**
   - Valor antigo: `gbfahkeamspmzptetkqc`
   - **Novo valor:** `bsbqmqfznkozqagdhvoj`

   **VITE_SUPABASE_URL:**
   - Valor antigo: `https://gbfahkeamspmzptetkqc.supabase.co`
   - **Novo valor:** `https://bsbqmqfznkozqagdhvoj.supabase.co`

   **VITE_SUPABASE_PUBLISHABLE_KEY:**
   - Valor antigo: `eyJ...` (começava com gbfahkeamspmzptetkqc)
   - **Novo valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYnFtcWZ6bmtvenFhZ2Rodm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTMwMTcsImV4cCI6MjA4NjgyOTAxN30.6cyFvE8lk7251ZMZqCveCZsiZ8ZzSbxSWM7whk1vlFo`

3. **Aplica a todos os ambientes:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Passo 2: Redeploy

1. Vai a: **Deployments**
2. Clica nos **3 pontos (...)** do deployment mais recente
3. Seleciona **"Redeploy"**
4. **IMPORTANTE:** Desmarca **"Use existing Build Cache"** (queremos rebuild completo com novas variáveis)
5. Clica em **"Redeploy"**

**Tempo estimado:** 2-3 minutos

---

## ✅ 4. Validação em Produção (3dcomproposito.vercel.app)

**ESPERA** o deployment terminar (fica verde ✅)

### Teste Rápido Inicial:
1. Abre: https://3dcomproposito.vercel.app
2. **Verifica o console do browser (F12):**
   - [ ] SEM erros de "supabaseUrl is required"
   - [ ] SEM erros de autenticação Supabase
   - [ ] SEM erros 401/403

3. **Mapa carrega:**
   - [ ] Portugal continental + ilhas aparecem
   - [ ] Estatísticas carregam (números reais, não zeros)
   - [ ] Tooltips funcionam

### Teste Completo (repete TODOS os testes da secção 1):
- [ ] Página inicial
- [ ] Menu de navegação
- [ ] Organizadores (191 voluntários)
- [ ] Formulário de registo (NÃO submeter)
- [ ] Formulário de pedido (NÃO submeter)
- [ ] Recursos
- [ ] Portal com token
- [ ] Admin (se aplicável)

---

## 🆘 Problemas Comuns

### Site em branco / "supabaseUrl is required"
**Causa:** Variáveis de ambiente não aplicadas
**Solução:**
- Verifica que editaste as 3 variáveis
- Faz redeploy SEM cache
- Espera 2-3 minutos pelo deployment

### Estatísticas mostram zeros
**Causa:** RLS (Row Level Security) ainda ativo
**Solução:**
- Vai ao SQL Editor da nova Supabase
- Executa: `ALTER TABLE contributors DISABLE ROW LEVEL SECURITY;`
- (Repete para todas as tabelas)

### Arrays dos contributors aparecem como "null" ou estranho
**Causa:** Importação CSV incorreta
**Solução:**
- Verifica no SQL Editor: `SELECT materials FROM contributors LIMIT 5;`
- Deve mostrar: `{PETG,TPU}` e não `["PETG","TPU"]`
- Se estiver errado, reimporta os CSV convertidos

### Erro 401 ou 403
**Causa:** Publishable key incorreta
**Solução:**
- Vai ao Supabase → Settings → API
- Copia novamente a "anon public" key
- Atualiza no Vercel
- Redeploy

---

## 🎉 5. Quando Tudo Estiver OK

- [ ] Marca este checklist como ✅ COMPLETO
- [ ] Avisa a equipa que podem testar
- [ ] Envia o link: https://3dcomproposito.vercel.app
- [ ] Monitoriza erros no Vercel Dashboard → Logs

---

## 📞 Próximos Passos (DEPOIS da validação)

1. **Configurar RLS policies corretamente** (agora está desativado = público)
2. **Configurar Resend** para emails automáticos
3. **Domínio custom** (se aplicável)
4. **Backups automáticos** da Supabase

---

**Criado em:** 2026-02-16
**Migração:** Lovable Cloud → Vercel + Supabase
**Database ID:** bsbqmqfznkozqagdhvoj
