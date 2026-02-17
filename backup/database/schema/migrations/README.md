# 📝 Database Migrations

Esta pasta contém documentação de todas as alterações estruturais na base de dados.

## Objetivo

Manter histórico completo de:
- O que mudou (ADD/ALTER/DROP)
- Porquê mudou (motivação)
- Como migrar (SQL statements)
- Impacto no código (breaking changes)
- Como reverter (rollback SQL)

## Formato do Ficheiro

Cada migração deve ser um ficheiro markdown:

```
YYYY-MM-DD_descricao-curta.md
```

**Exemplos:**
- `2026-02-17_add_priority_to_parts.md`
- `2026-02-18_create_notifications_table.md`
- `2026-02-20_alter_contributors_add_rating.md`

## Template de Migração

```markdown
# Migração: [Título Descritivo]

**Data**: YYYY-MM-DD
**Autor**: [Nome]
**Status**: ✅ Aplicado / ⏳ Pendente / ❌ Revertido

---

## 🎯 Objetivo

[Explicar em 2-3 frases o que esta migração faz e porquê]

Exemplo: "Adicionar sistema de priorização de peças para permitir
identificar pedidos urgentes e melhorar a alocação de voluntários."

---

## 📋 Alterações

### Tabelas Afetadas
- `parts` - Adicionar coluna `priority`

### Novos Tipos
- Enum `part_priority` (low, medium, high, urgent)

### Constraints
- NOT NULL constraint em `parts.priority`
- Default value: 'medium'

---

## 💻 SQL Migration

### ⬆️ UP (Aplicar)

\`\`\`sql
-- Criar enum para prioridades
CREATE TYPE part_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Adicionar coluna priority à tabela parts
ALTER TABLE parts
ADD COLUMN priority part_priority NOT NULL DEFAULT 'medium';

-- Criar index para queries por prioridade
CREATE INDEX idx_parts_priority ON parts(priority);

-- Comentário para documentação
COMMENT ON COLUMN parts.priority IS 'Prioridade da peça: low/medium/high/urgent';
\`\`\`

### ⬇️ DOWN (Reverter)

\`\`\`sql
-- Remover coluna priority
ALTER TABLE parts DROP COLUMN priority;

-- Remover enum
DROP TYPE part_priority;

-- Nota: Index é removido automaticamente com a coluna
\`\`\`

---

## 🔄 Impacto no Código

### TypeScript Types
- ✅ Atualizar `src/integrations/supabase/types.ts`
- Adicionar `priority?: 'low' | 'medium' | 'high' | 'urgent'` a `Parts` interface

### Queries
- ✅ Atualizar queries de partes para incluir `priority`
- Localizações:
  - `src/components/admin/PartsTable.tsx` - Adicionar coluna priority
  - `src/hooks/useFilteredParts.ts` - Adicionar filtro por priority

### UI Components
- ✅ Criar componente `PriorityBadge` para visualizar prioridade
- ✅ Adicionar filtro de prioridade no admin dashboard
- ✅ Adicionar campo priority no formulário de criação de peças

### Breaking Changes
- ❌ Nenhum (valor padrão definido, campo opcional no frontend)

---

## ✅ Checklist de Aplicação

- [ ] SQL testado em ambiente de desenvolvimento
- [ ] Schema exportado (`./backup/scripts/export_schema.sh`)
- [ ] Types do TypeScript atualizados
- [ ] TypeScript compila sem erros (`npm run build`)
- [ ] Queries atualizadas no código
- [ ] Componentes UI atualizados
- [ ] Testado localmente
- [ ] CLAUDE.md atualizado
- [ ] Commit e push realizados
- [ ] Aplicado em produção
- [ ] Verificado em produção

---

## 📊 Dados Afetados

### Contagem de Registos
- Tabela `parts`: ~48 registos (todos receberão `priority = 'medium'`)

### Data Migration (se necessário)
\`\`\`sql
-- Exemplo: Atualizar peças específicas com prioridade alta
UPDATE parts
SET priority = 'high'
WHERE beneficiary_request_id IN (
  SELECT id FROM beneficiary_requests
  WHERE created_at < NOW() - INTERVAL '30 days'
);
\`\`\`

---

## 🧪 Testes

### Queries de Teste
\`\`\`sql
-- Verificar valores padrão aplicados
SELECT priority, COUNT(*)
FROM parts
GROUP BY priority;

-- Testar insert com nova coluna
INSERT INTO parts (name, project_id, priority)
VALUES ('Test Part', 'some-uuid', 'urgent');

-- Testar update
UPDATE parts
SET priority = 'high'
WHERE name = 'Test Part';
\`\`\`

### Testes de Interface
- [ ] Filtro por prioridade funciona
- [ ] Badge de prioridade aparece corretamente
- [ ] Formulário permite selecionar prioridade
- [ ] Ordenação por prioridade funciona

---

## 📝 Notas Adicionais

[Qualquer informação adicional relevante]

Exemplo:
- Esta feature foi solicitada por Ana (admin) para melhorar gestão de pedidos urgentes
- A prioridade 'urgent' deve ser usada apenas para casos médicos críticos
- Considerar adicionar notificações automáticas para prioridade 'urgent' no futuro

---

**Aplicado por**: [Nome]
**Data de aplicação**: YYYY-MM-DD
**Commit**: [hash do commit]
\`\`\`

---

## 📚 Histórico

Nenhuma migração aplicada ainda.

Quando aplicares migrações, lista aqui:

- `2026-02-17_add_priority_to_parts.md` - ✅ Aplicado (commit: abc1234)
- ...
