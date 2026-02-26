# Database Migrations - Initiative Template System

## Ordem de Execução em PRODUÇÃO

Execute estes scripts **pela ordem** no SQL Editor do Supabase (produção):

### 1️⃣ Criar Novas Tabelas

```bash
# Ficheiro: 001_create_initiative_template_system.sql
```

Este script cria:
- `initiatives` - Templates de iniciativas
- `initiative_parts` - Peças por iniciativa
- `project_instances` - Projetos criados a partir de templates
- `project_instance_parts` - Peças por projeto (snapshot)
- RLS policies para todas as tabelas
- Adiciona estado `em_andamento` ao enum `beneficiary_request_status`

**Verificação:**
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('initiatives', 'initiative_parts', 'project_instances', 'project_instance_parts')
ORDER BY tablename;
```

---

### 2️⃣ Testar o Sistema Novo

1. Aceder ao **Admin → Iniciativas**
2. Criar uma iniciativa (ex: "TMT")
3. Adicionar peças à iniciativa
4. Aceder ao **Admin → Projetos**
5. Criar um projeto a partir da iniciativa
6. Atribuir peças a voluntários
7. Verificar que o email é enviado
8. Testar o portal do voluntário

---

### 3️⃣ Eliminar Tabelas Antigas (APENAS após confirmar que tudo funciona!)

```bash
# Ficheiro: ../cleanup_legacy_tables.sql
```

Este script remove:
- `wheelchair_projects`
- `parts`
- `part_templates`

**⚠️ AVISO:** Este passo é **irreversível**! Só executar após:
- Confirmar que o novo sistema funciona 100%
- Fazer backup completo da base de dados
- Testar em ambiente de desenvolvimento primeiro

**Verificação:**
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Notas Importantes

### RLS Policies

As novas tabelas têm RLS ativado e políticas configuradas:

**Organizers (admins):**
- Podem ver, criar, editar, e apagar em todas as tabelas

**Contributors (voluntários via token):**
- Podem ver apenas as suas peças atribuídas (`project_instance_parts`)
- Podem atualizar o estado das suas peças atribuídas

### Enums Criados

- `project_status`: `planning`, `in_progress`, `completed`, `cancelled`
- `part_status`: `unassigned`, `assigned`, `printing`, `printed`, `shipped`, `complete`
- `beneficiary_request_status`: adicionado valor `em_andamento`

### Foreign Keys

- `initiative_parts.initiative_id` → `initiatives.id` (CASCADE)
- `project_instances.initiative_id` → `initiatives.id` (RESTRICT)
- `project_instances.request_id` → `beneficiary_requests.id` (SET NULL)
- `project_instance_parts.project_instance_id` → `project_instances.id` (CASCADE)
- `project_instance_parts.initiative_part_id` → `initiative_parts.id` (SET NULL)
- `project_instance_parts.assigned_contributor_id` → `contributors.id` (SET NULL)

---

## Rollback (Em caso de problemas)

Se algo correr mal **antes** de eliminar as tabelas antigas:

```sql
-- 1. Remover novas tabelas
DROP TABLE IF EXISTS project_instance_parts CASCADE;
DROP TABLE IF EXISTS project_instances CASCADE;
DROP TABLE IF EXISTS initiative_parts CASCADE;
DROP TABLE IF EXISTS initiatives CASCADE;

-- 2. Remover enums (se necessário)
DROP TYPE IF EXISTS project_status;
-- Nota: part_status já existia, não remover

-- 3. Sistema antigo continua a funcionar
```

---

## Schema Documentation

Após executar as migrations, atualizar:
- `backup/database/schema/schema.sql` - Exportar schema completo
- `src/integrations/supabase/types.ts` - Regenerar types (se necessário)

---

**Data de criação:** 2026-02-19
**Autor:** Generated with Claude Code
