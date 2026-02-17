# 🔄 Workflow Obrigatório para Alterações na Base de Dados

> **⚠️ IMPORTANTE**: Este processo é **OBRIGATÓRIO** para qualquer alteração na estrutura da base de dados.

---

## 📋 Quando Usar Este Workflow

Use este workflow sempre que fizer:
- ✅ Adicionar nova tabela
- ✅ Adicionar/remover/alterar colunas
- ✅ Adicionar/alterar constraints (NOT NULL, UNIQUE, etc.)
- ✅ Adicionar/alterar foreign keys
- ✅ Criar/alterar indexes
- ✅ Criar/alterar views
- ✅ Alterar políticas RLS (Row Level Security)
- ✅ Alterar triggers ou functions
- ✅ Alterar enums

---

## 🚨 REGRA DE OURO

**NUNCA** faça alterações na base de dados sem:
1. Documentar o schema atualizado
2. Atualizar os types do TypeScript
3. Fazer commit das alterações

---

## 📝 Processo Completo (Passo a Passo)

### **PASSO 1: Planear a Alteração** 📐

Antes de fazer qualquer alteração, documenta:

1. **O que** vai mudar?
   - Exemplo: "Adicionar coluna `priority` à tabela `parts`"

2. **Porquê** é necessário?
   - Exemplo: "Para permitir priorização de peças urgentes"

3. **Impacto** no código existente?
   - Queries afetadas?
   - Componentes que precisam de atualização?
   - Breaking changes?

4. **Migration path**:
   - Como migrar dados existentes?
   - Valores padrão para novos campos?

**Criar ficheiro**: `backup/database/schema/migrations/YYYY-MM-DD_descricao.md`

Exemplo:
```markdown
# Migração: Adicionar Prioridade às Peças

**Data**: 2026-02-17
**Autor**: Helder

## Objetivo
Adicionar sistema de priorização de peças para permitir identificar
pedidos urgentes.

## Alterações
- Adicionar coluna `priority` (enum: low, medium, high, urgent)
- Valor padrão: 'medium'
- NOT NULL

## Impacto
- Frontend: Adicionar filtro por prioridade no admin
- Backend: Atualizar queries de listagem
- Breaking changes: Nenhum (valor padrão definido)

## SQL
\`\`\`sql
-- Criar enum
CREATE TYPE part_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Adicionar coluna
ALTER TABLE parts
ADD COLUMN priority part_priority NOT NULL DEFAULT 'medium';
\`\`\`

## Rollback
\`\`\`sql
ALTER TABLE parts DROP COLUMN priority;
DROP TYPE part_priority;
\`\`\`
```

---

### **PASSO 2: Fazer Alteração no Supabase** 🔧

1. Ir ao **Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/editor
   ```

2. Executar o SQL da migração

3. **Testar imediatamente**:
   - Verificar se queries existentes continuam a funcionar
   - Testar inserção/atualização com novos campos
   - Verificar políticas RLS

---

### **PASSO 3: Exportar Schema Atualizado** 📦

**Opção A: Script Automático (Recomendado)**
```bash
./backup/scripts/export_schema.sh "Adicionar prioridade às peças"
```

**Opção B: Manual**
```bash
# 1. Exportar schema
supabase db dump --schema public > backup/database/schema/schema.sql

# 2. Arquivar versão anterior
cp backup/database/schema/schema.sql \
   backup/database/schema/archive/schema_$(date +%Y-%m-%d_%H-%M-%S).sql
```

**Opção C: Copiar do Dashboard**
1. Ir ao Schema viewer no Supabase
2. Copiar todo o SQL
3. Guardar em `backup/database/schema/schema.sql`

---

### **PASSO 4: Atualizar Types do TypeScript** 🔷

**IMPORTANTE**: Sempre que o schema muda, atualizar os types!

#### 4.1. Regenerar types automaticamente

Se tiveres Supabase CLI configurado:
```bash
supabase gen types typescript --project-id bsbqmqfznkozqagdhvoj > src/integrations/supabase/types.ts
```

#### 4.2. Ou atualizar manualmente

Editar: `src/integrations/supabase/types.ts`

Exemplo:
```typescript
export interface Database {
  public: {
    Tables: {
      parts: {
        Row: {
          id: string
          name: string
          // ✅ ADICIONAR novo campo
          priority: 'low' | 'medium' | 'high' | 'urgent'
          // ... outros campos
        }
        Insert: {
          id?: string
          name: string
          priority?: 'low' | 'medium' | 'high' | 'urgent' // opcional no insert
          // ... outros campos
        }
        Update: {
          id?: string
          name?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent' // opcional no update
          // ... outros campos
        }
      }
      // ... outras tabelas
    }
  }
}
```

#### 4.3. Verificar TypeScript errors

```bash
npm run build
```

Resolver todos os erros de compilação!

---

### **PASSO 5: Atualizar Código da Aplicação** 💻

#### 5.1. Atualizar queries

Exemplo: Se adicionaste `priority`, atualizar queries:

```typescript
// ❌ ANTES
const { data } = await supabase
  .from('parts')
  .select('id, name, status')

// ✅ DEPOIS
const { data } = await supabase
  .from('parts')
  .select('id, name, status, priority')
```

#### 5.2. Atualizar componentes UI

Se necessário, criar/atualizar componentes:
- Formulários (adicionar campo `priority`)
- Listas (mostrar `priority`)
- Filtros (filtrar por `priority`)

#### 5.3. Testar localmente

```bash
npm run dev
```

Verificar:
- [ ] Dados carregam corretamente
- [ ] Formulários funcionam
- [ ] Filtros funcionam
- [ ] Sem erros na consola

---

### **PASSO 6: Atualizar Documentação** 📚

#### 6.1. Atualizar CLAUDE.md

Editar: `CLAUDE.md`

Na secção **Database Schema**, adicionar/atualizar tabela:

```markdown
### `parts` (Peças para Impressão)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| name | text | Nome da peça |
| priority | part_priority | Prioridade: low/medium/high/urgent ⬅️ NOVO
| status | text | Status: available/assigned/printing/printed/shipped/delivered |
| ... | ... | ... |
```

#### 6.2. Criar CHANGELOG (opcional mas recomendado)

Criar: `backup/database/schema/CHANGELOG.md`

```markdown
# Database Schema Changelog

## [2026-02-17] - Prioridade de Peças

### Adicionado
- Enum `part_priority` (low, medium, high, urgent)
- Coluna `parts.priority` (NOT NULL, default: medium)

### Impacto
- Frontend: Novo filtro de prioridade no admin
- TypeScript: Types atualizados

---

## [2026-02-16] - Schema Inicial

### Criado
- Todas as tabelas iniciais
- Políticas RLS
- Views
```

---

### **PASSO 7: Commit e Push** 🚀

```bash
# Adicionar ficheiros
git add backup/database/schema/
git add src/integrations/supabase/types.ts
git add CLAUDE.md
git add src/  # componentes alterados

# Commit com mensagem descritiva
git commit -m "feat(db): adicionar prioridade às peças

Alterações na base de dados:
- Criar enum part_priority (low, medium, high, urgent)
- Adicionar coluna parts.priority (NOT NULL, default: medium)

Alterações no código:
- Atualizar types do TypeScript
- Adicionar filtro de prioridade no admin
- Atualizar queries para incluir priority

Migration: backup/database/schema/migrations/2026-02-17_add_priority.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push
```

---

### **PASSO 8: Testar em Produção (Staging primeiro!)** 🧪

1. **Deploy para staging** (se existir)
2. **Testar todas as funcionalidades**
3. **Verificar logs** (sem erros)
4. **Deploy para produção**

---

## ✅ Checklist Completo

Usar esta checklist para **CADA** alteração na base de dados:

```markdown
### Alteração: [Descrição]
**Data**: YYYY-MM-DD

- [ ] 1. Planeamento documentado (backup/database/schema/migrations/)
- [ ] 2. SQL testado no Supabase Dashboard
- [ ] 3. Schema exportado (backup/database/schema/schema.sql)
- [ ] 4. Schema anterior arquivado (backup/database/schema/archive/)
- [ ] 5. Types do TypeScript atualizados (src/integrations/supabase/types.ts)
- [ ] 6. TypeScript compila sem erros (npm run build)
- [ ] 7. Queries atualizadas no código
- [ ] 8. Componentes UI atualizados (se necessário)
- [ ] 9. Testado localmente (npm run dev)
- [ ] 10. CLAUDE.md atualizado
- [ ] 11. CHANGELOG.md atualizado (opcional)
- [ ] 12. Commit com mensagem descritiva
- [ ] 13. Push para repositório
- [ ] 14. Testado em staging (se existir)
- [ ] 15. Deployed para produção
- [ ] 16. Verificado em produção

**Status**: ⏳ Em progresso / ✅ Completo
```

---

## 🔧 Scripts Úteis

### Exportar Schema
```bash
./backup/scripts/export_schema.sh "descrição da alteração"
```

### Regenerar Types
```bash
supabase gen types typescript --project-id bsbqmqfznkozqagdhvoj > src/integrations/supabase/types.ts
```

### Verificar Diferenças
```bash
git diff backup/database/schema/schema.sql
```

---

## 🚨 Troubleshooting

### Problema: Types desatualizados

**Sintoma**: Erros TypeScript após alteração na BD

**Solução**:
```bash
# Regenerar types
supabase gen types typescript --project-id bsbqmqfznkozqagdhvoj > src/integrations/supabase/types.ts

# Ou atualizar manualmente src/integrations/supabase/types.ts
```

---

### Problema: Queries quebradas

**Sintoma**: Erros 500 ou dados não carregam

**Solução**:
1. Verificar console do browser (erros de query)
2. Atualizar queries para incluir novos campos
3. Verificar políticas RLS (podem estar a bloquear novos campos)

---

### Problema: Migration falhou

**Sintoma**: Erro ao executar SQL no Supabase

**Solução**:
1. Verificar syntax do SQL
2. Verificar se tabelas/colunas já existem
3. Ter plan de rollback pronto
4. Executar rollback se necessário

---

## 📞 Contacto

Para dúvidas sobre alterações na BD:
- **Consultar**: `CLAUDE.md` (secção Database Schema)
- **Ver exemplos**: `backup/database/schema/migrations/`
- **Pedir ajuda**: Admins (Helder, Ana, Gabriel)

---

**Última atualização**: 2026-02-17
