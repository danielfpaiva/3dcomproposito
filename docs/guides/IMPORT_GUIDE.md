# 📥 Guia de Importação de Dados - Nova Supabase

## Pré-requisitos
- ✅ Schema já criado (schema.sql executado)
- ✅ Ficheiros CSV exportados do Lovable

## Ordem de Importação (IMPORTANTE!)

A ordem é crítica devido às **foreign keys** (relacionamentos entre tabelas):

### 1️⃣ **profiles** (tabela base - sem dependências)
- Ficheiro: `profiles.csv`
- 20 linhas
- Outras tabelas dependem desta (user_roles, wheelchair_projects)

### 2️⃣ **user_roles** (depende de profiles)
- Ficheiro: `user_roles.csv`
- 3 linhas
- Foreign key: `user_id → profiles.id`

### 3️⃣ **contributors** (independente)
- Ficheiro: `contributors.csv`
- 185 linhas
- **ATENÇÃO**: Tem colunas com arrays (materials, printer_models)

### 4️⃣ **wheelchair_projects** (depende de profiles)
- Ficheiro: `wheelchair_projects.csv`
- 2 linhas
- Foreign key: `coordinator_id → profiles.id`

### 5️⃣ **parts** (depende de wheelchair_projects e contributors)
- Ficheiro: `parts.csv`
- 48 linhas
- Foreign keys:
  - `project_id → wheelchair_projects.id`
  - `assigned_contributor_id → contributors.id`

### 6️⃣ **part_templates** (independente)
- Ficheiro: `part_templates.csv`
- 24 linhas

### 7️⃣ **beneficiary_requests** (independente)
- Ficheiro: `beneficiary_requests.csv`
- 3 linhas

### 8️⃣ **donations** (independente - VAZIO)
- Tabela vazia, não precisa importar

---

## Como Importar no Supabase

### Opção A: Interface Gráfica (Table Editor)

1. Vai a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj
2. No menu lateral, clica em **"Table Editor"**
3. Para cada tabela (na ordem acima):
   - Seleciona a tabela
   - Clica em **"Insert"** → **"Import data from CSV"**
   - Faz upload do ficheiro CSV correspondente
   - Mapeia as colunas corretamente
   - Clica em **"Import"**

**ATENÇÃO para colunas com arrays:**
- Nos ficheiros CSV, os arrays aparecem como: `["item1","item2"]`
- O Supabase deve reconhecer automaticamente o formato PostgreSQL

### Opção B: SQL Editor (Mais rápido e seguro)

Vou criar scripts SQL de importação que podes copiar e colar diretamente no SQL Editor.

---

## ⚠️ Problemas Comuns

### Erro: "violates foreign key constraint"
- **Causa**: Tentaste importar uma tabela antes da sua dependência
- **Solução**: Segue a ordem acima (profiles primeiro, depois user_roles, etc.)

### Erro: "duplicate key value violates unique constraint"
- **Causa**: UUID duplicado (improvável se exportaste corretamente)
- **Solução**: Verifica se não importaste a mesma tabela duas vezes

### Arrays não importam corretamente
- **Causa**: Formato de array incorreto no CSV
- **Solução**: Arrays devem estar como `{"item1","item2"}` ou `["item1","item2"]`
- No CSV do Lovable aparecem como: `"[""PETG"",""TPU""]"`
- Isto precisa ser convertido para: `{PETG,TPU}`

---

## ✅ Validação Pós-Importação

Após importar tudo, executa no SQL Editor:

```sql
-- Verificar contagem de linhas
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'contributors', COUNT(*) FROM contributors
UNION ALL
SELECT 'wheelchair_projects', COUNT(*) FROM wheelchair_projects
UNION ALL
SELECT 'parts', COUNT(*) FROM parts
UNION ALL
SELECT 'part_templates', COUNT(*) FROM part_templates
UNION ALL
SELECT 'beneficiary_requests', COUNT(*) FROM beneficiary_requests
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
ORDER BY table_name;
```

**Resultado esperado:**
```
profiles              → 20
user_roles            → 3
contributors          → 185
wheelchair_projects   → 2
parts                 → 48
part_templates        → 24
beneficiary_requests  → 3
donations             → 0
TOTAL                 → 285 linhas
```

---

## 🔄 Próximo Passo

Depois de importar e validar, precisas de:
1. Configurar **RLS policies** (segurança)
2. Testar localmente com `npm run dev`
3. Atualizar variáveis de ambiente no Vercel
4. Deploy final
