# 🚀 Próximos Passos - Migração Supabase

## Estado Atual ✅
- ✅ Schema criado na nova Supabase (bsbqmqfznkozqagdhvoj)
- ✅ Ficheiros CSV exportados do Lovable (falta só parts.csv)
- ✅ .env atualizado com novas credenciais
- ✅ Scripts de conversão e importação prontos

## O Que Falta Fazer 📋

### 1️⃣ Exportar parts.csv do Lovable (URGENTE!)

No **SQL Editor do Lovable**:
```sql
SELECT * FROM parts ORDER BY created_at;
```
- Exporta como CSV
- Guarda em: `backup/parts.csv`

---

### 2️⃣ Converter CSVs para formato Supabase

Abre o terminal na pasta do projeto e executa:

```bash
cd backup
python convert_csv_for_supabase.py
```

Isto vai criar ficheiros com sufixo `_supabase.csv`:
- contributors_supabase.csv
- profiles_supabase.csv
- user_roles_supabase.csv
- wheelchair_projects_supabase.csv
- parts_supabase.csv
- part_templates_supabase.csv
- beneficiary_requests_supabase.csv

**Por que converter?**
- Lovable usa `;` como delimitador → Supabase prefere `,`
- Arrays em JSON `["PETG","TPU"]` → PostgreSQL `{PETG,TPU}`

---

### 3️⃣ Importar dados no Supabase

Vai a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj

**ORDEM DE IMPORTAÇÃO (CRÍTICA!):**

1. **profiles_supabase.csv** → Tabela `profiles`
2. **user_roles_supabase.csv** → Tabela `user_roles`
3. **contributors_supabase.csv** → Tabela `contributors`
4. **wheelchair_projects_supabase.csv** → Tabela `wheelchair_projects`
5. **parts_supabase.csv** → Tabela `parts`
6. **part_templates_supabase.csv** → Tabela `part_templates`
7. **beneficiary_requests_supabase.csv** → Tabela `beneficiary_requests`

**Como importar cada ficheiro:**
- Table Editor → Seleciona a tabela
- Clica em **"Insert row"** → **"Import data from CSV"**
- Faz upload do ficheiro `*_supabase.csv`
- **IMPORTANTE**: Marca **"First row is header"** ✅
- Clica em **"Import"**

---

### 4️⃣ Validar importação

No **SQL Editor** da nova Supabase, executa:

```sql
-- Conta todas as linhas
SELECT 'profiles' as tabela, COUNT(*) as linhas FROM profiles
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL SELECT 'contributors', COUNT(*) FROM contributors
UNION ALL SELECT 'wheelchair_projects', COUNT(*) FROM wheelchair_projects
UNION ALL SELECT 'parts', COUNT(*) FROM parts
UNION ALL SELECT 'part_templates', COUNT(*) FROM part_templates
UNION ALL SELECT 'beneficiary_requests', COUNT(*) FROM beneficiary_requests
ORDER BY tabela;
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
TOTAL: 285 linhas
```

---

### 5️⃣ Configurar RLS (Row Level Security)

**IMPORTANTE**: Por defeito, o Supabase bloqueia TUDO com RLS!

No **SQL Editor**, executa:

```sql
-- Desativa RLS temporariamente para testar
-- (ATENÇÃO: Isto deixa tudo público!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contributors DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheelchair_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE part_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
```

**NOTA**: Vamos configurar RLS corretamente depois de validar que tudo funciona!

---

### 6️⃣ Testar localmente

```bash
npm run dev
```

Abre http://localhost:5173 e testa:
- ✅ Página inicial carrega
- ✅ Mapa mostra estatísticas por região
- ✅ Painel de Admin funciona (se tiveres acesso)
- ✅ Formulários de registo funcionam

---

### 7️⃣ Atualizar Vercel

Vai a: https://vercel.com/[teu-username]/3dcomproposito/settings/environment-variables

**Atualiza estas variáveis:**
```
VITE_SUPABASE_PROJECT_ID = bsbqmqfznkozqagdhvoj
VITE_SUPABASE_URL = https://bsbqmqfznkozqagdhvoj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYnFtcWZ6bmtvenFhZ2Rodm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTMwMTcsImV4cCI6MjA4NjgyOTAxN30.6cyFvE8lk7251ZMZqCveCZsiZ8ZzSbxSWM7whk1vlFo
```

Depois, **Redeploy**:
- Vai a **"Deployments"**
- Clica nos **3 pontos** do último deployment
- Seleciona **"Redeploy"**

---

### 8️⃣ Validar produção

Abre https://3dcomproposito.vercel.app e testa tudo novamente!

---

## ⚠️ Se Algo Correr Mal

### Site em branco ou erro de "supabaseUrl is required"
→ Verifica as variáveis de ambiente no Vercel

### Erro "RLS policy violation" ou "new row violates row-level security"
→ Desativa RLS temporariamente (passo 5)

### Erro "violates foreign key constraint"
→ Importaste as tabelas fora de ordem. Apaga e importa de novo na ordem correta

### Arrays não aparecem nos contributors
→ Verifica se o script Python converteu corretamente (deve ter `{PETG,TPU}` em vez de `["PETG","TPU"]`)

---

## 📞 Ajuda

Se ficares preso em algum passo, avisa! Estou aqui para ajudar. 🚀
