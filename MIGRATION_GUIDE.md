# 🚀 Guia de Migração: Lovable → Vercel + Supabase

> **Projeto**: Impact Print Connect
> **Data**: 2026-02-14
> **Duração estimada**: 2-4 horas
> **Risco**: Baixo (Lovable continua ativo durante migração)

---

## 📋 Checklist Geral

- [ ] Fase 1: Backup completo (30-45 min)
- [ ] Fase 2: Criar nova infraestrutura (20-30 min)
- [ ] Fase 3: Migração de dados (30-60 min)
- [ ] Fase 4: Atualizar código (15-20 min)
- [ ] Fase 5: Deploy Vercel (10-15 min)
- [ ] Fase 6: Testes e validação (20-30 min)

---

## 📦 FASE 1: Backup e Preparação

### 1.1 Criar Pasta de Backup

```bash
mkdir backup
mkdir backup/csv
```

### 1.2 Exportar Schema SQL

**No Lovable Dashboard → SQL Editor:**

Execute este comando para ver a estrutura:

```sql
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**Guardar resultado em**: `backup/schema_info.txt`

### 1.3 Exportar Dados (CRÍTICO!)

Para cada tabela, executar no SQL Editor:

#### **Contributors** (185 rows - MAIS IMPORTANTE)
```sql
SELECT * FROM contributors;
```
- Copiar resultado
- Guardar em `backup/csv/contributors.csv`

#### **Parts** (48 rows)
```sql
SELECT * FROM parts;
```
- Guardar em `backup/csv/parts.csv`

#### **Part Templates** (24 rows)
```sql
SELECT * FROM part_templates;
```
- Guardar em `backup/csv/part_templates.csv`

#### **Profiles** (20 rows)
```sql
SELECT * FROM profiles;
```
- Guardar em `backup/csv/profiles.csv`

#### **Beneficiary Requests** (3 rows)
```sql
SELECT * FROM beneficiary_requests;
```
- Guardar em `backup/csv/beneficiary_requests.csv`

#### **User Roles** (3 rows)
```sql
SELECT * FROM user_roles;
```
- Guardar em `backup/csv/user_roles.csv`

#### **Wheelchair Projects** (2 rows)
```sql
SELECT * FROM wheelchair_projects;
```
- Guardar em `backup/csv/wheelchair_projects.csv`

### 1.4 Exportar RLS Policies

**No Dashboard → RLS Policies:**
- Clicar em cada tabela
- Copiar SQL de cada policy
- Guardar em `backup/rls_policies.sql`

### 1.5 Verificar Storage

**No Dashboard → Storage:**
- Verificar se há buckets configurados
- Listar ficheiros (se existirem)
- Documentar em `backup/storage_info.txt`

---

## 🆕 FASE 2: Criar Nova Infraestrutura

### 2.1 Criar Conta Supabase

1. Ir a [supabase.com](https://supabase.com)
2. **Sign Up** (GitHub recomendado)
3. Verificar email

### 2.2 Criar Novo Projeto

1. **New Project**
2. Configurações:
   - **Name**: `impact-print-connect`
   - **Database Password**: [CRIAR SENHA FORTE!]
   - **Region**: `Europe West (Ireland)` ou `Europe (Frankfurt)`
   - **Pricing**: `Free`
3. Aguardar criação (~2 min)

### 2.3 Guardar Credenciais

**Settings → API:**

Copiar para ficheiro seguro `new_supabase_credentials.txt`:

```
Project URL: https://[PROJECT_ID].supabase.co
Project ID: [PROJECT_ID]
anon key: eyJ...
service_role key: eyJ... (SECRETO - NÃO PARTILHAR)
```

### 2.4 Criar Conta Vercel

1. Ir a [vercel.com](https://vercel.com)
2. **Sign Up** com GitHub
3. Autorizar acesso

---

## 📥 FASE 3: Migração de Dados

### 3.1 Recriar Schema no Novo Supabase

**No novo Supabase → SQL Editor → New Query:**

Executar os seguintes comandos (ajusta conforme necessário):

```sql
-- Tabela: beneficiary_requests
CREATE TABLE beneficiary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  beneficiary_type TEXT NOT NULL,
  beneficiary_age TEXT NOT NULL,
  region TEXT DEFAULT 'lisboa',
  description TEXT NOT NULL,
  how_found_us TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending'
);

-- Tabela: contributors
CREATE TABLE contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  availability TEXT NOT NULL,
  experience_level TEXT DEFAULT 'iniciante',
  printer_models TEXT[],
  materials TEXT[] DEFAULT '{}',
  build_volume_ok BOOLEAN DEFAULT false,
  build_plate_size TEXT,
  turnaround_time TEXT,
  can_ship BOOLEAN DEFAULT false,
  shipping_carrier TEXT,
  willing_to_collaborate BOOLEAN DEFAULT false,
  token TEXT NOT NULL
);

-- Tabela: parts
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES part_templates(id),
  material TEXT,
  color TEXT,
  print_time INTEGER,
  contributor_id UUID REFERENCES contributors(id),
  project_id UUID REFERENCES wheelchair_projects(id),
  status TEXT DEFAULT 'pending',
  notes TEXT
);

-- Tabela: part_templates
CREATE TABLE part_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  stl_file_url TEXT,
  recommended_material TEXT,
  estimated_print_time INTEGER,
  difficulty_level TEXT DEFAULT 'medium'
);

-- Tabela: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'volunteer'
);

-- Tabela: user_roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: wheelchair_projects
CREATE TABLE wheelchair_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  beneficiary_id UUID REFERENCES beneficiary_requests(id),
  status TEXT DEFAULT 'planning',
  target_completion_date DATE,
  notes TEXT
);

-- Índices para performance
CREATE INDEX idx_contributors_email ON contributors(email);
CREATE INDEX idx_contributors_region ON contributors(region);
CREATE INDEX idx_parts_template ON parts(template_id);
CREATE INDEX idx_parts_contributor ON parts(contributor_id);
CREATE INDEX idx_beneficiary_status ON beneficiary_requests(status);
```

### 3.2 Importar Dados

**Opção A - Via Interface (Recomendado):**

Para cada tabela:
1. Database → Tables → [nome_tabela]
2. Click "Insert" → "Import from CSV"
3. Upload `backup/csv/[nome_tabela].csv`
4. Mapear colunas automaticamente
5. Click "Import"

**Opção B - Via SQL:**

Usar INSERTs manuais (posso ajudar quando chegares a esta fase)

### 3.3 Verificar Dados Importados

```sql
-- Verificar contagem de registos
SELECT 'contributors' as table_name, COUNT(*) as count FROM contributors
UNION ALL
SELECT 'parts', COUNT(*) FROM parts
UNION ALL
SELECT 'part_templates', COUNT(*) FROM part_templates
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'beneficiary_requests', COUNT(*) FROM beneficiary_requests
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'wheelchair_projects', COUNT(*) FROM wheelchair_projects;
```

**Resultado esperado:**
- contributors: 185 ✅
- parts: 48 ✅
- part_templates: 24 ✅
- profiles: 20 ✅
- beneficiary_requests: 3 ✅
- user_roles: 3 ✅
- wheelchair_projects: 2 ✅

### 3.4 Configurar RLS (Row Level Security)

**Authentication → Policies:**

Para cada tabela, criar policies apropriadas (usar backup de `rls_policies.sql`)

Exemplo básico:
```sql
-- Permitir leitura pública de contributors
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON contributors
  FOR SELECT TO anon, authenticated
  USING (true);

-- Adicionar policies conforme necessário
```

### 3.5 Configurar Auth URLs

**Authentication → URL Configuration:**

Adicionar:
- **Site URL**: `http://localhost:5173` (temporário)
- **Redirect URLs**: `http://localhost:5173/**`

(Atualizar depois com URL da Vercel)

---

## 🔧 FASE 4: Atualizar Código Local

### 4.1 Backup do .env Atual

```bash
cp .env .env.lovable.backup
```

### 4.2 Atualizar .env com Novas Credenciais

Editar `.env`:

```env
# Novo Supabase
VITE_SUPABASE_PROJECT_ID="[NOVO_PROJECT_ID]"
VITE_SUPABASE_URL="https://[NOVO_PROJECT_ID].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="[NOVO_ANON_KEY]"
```

### 4.3 Testar Localmente

```bash
npm run dev
```

**Verificar:**
- ✅ Página inicial carrega
- ✅ Mapa regional aparece
- ✅ Dashboard admin funciona
- ✅ Dados aparecem (contributors, parts, etc.)
- ✅ Formulários funcionam
- ✅ Sem erros no console

### 4.4 Commit dos Ficheiros de Configuração

```bash
git add vercel.json .vercelignore
git commit -m "chore: add Vercel configuration files"
git push
```

---

## 🚀 FASE 5: Deploy na Vercel

### 5.1 Importar Projeto

**No Dashboard da Vercel:**

1. Click "Add New" → "Project"
2. Importar do GitHub: `anapsousa/impact-print-connect`
3. Configurar:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 5.2 Adicionar Environment Variables

**Before Deploy → Environment Variables:**

Adicionar:
```
VITE_SUPABASE_PROJECT_ID = [NOVO_PROJECT_ID]
VITE_SUPABASE_URL = https://[NOVO_PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = [NOVO_ANON_KEY]
```

⚠️ **IMPORTANTE**: Usar o **novo** Supabase, não o Lovable!

### 5.3 Deploy

1. Click **"Deploy"**
2. Aguardar build (~2-3 min)
3. Ver logs de build
4. Quando terminar, copiar URL: `https://impact-print-connect.vercel.app`

---

## ✅ FASE 6: Testes e Validação

### 6.1 Atualizar URLs no Supabase

**No Supabase → Authentication → URL Configuration:**

Adicionar:
- **Site URL**: `https://impact-print-connect.vercel.app`
- **Redirect URLs**: `https://impact-print-connect.vercel.app/**`

### 6.2 Testar Aplicação em Produção

Abrir: `https://impact-print-connect.vercel.app`

**Checklist de testes:**
- [ ] Página inicial carrega
- [ ] Mapa de Portugal aparece corretamente
- [ ] Estatísticas aparecem (185 contributors, etc.)
- [ ] Formulário de voluntários funciona
- [ ] Formulário de beneficiários funciona
- [ ] Dashboard admin acede (se tiver auth)
- [ ] Tabelas mostram dados
- [ ] Sem erros no console (F12)
- [ ] Mobile responsivo funciona
- [ ] Todas as páginas carregam (routing funciona)

### 6.3 Verificar Performance

**Vercel Dashboard → Project → Analytics:**
- Ver métricas de performance
- Verificar Core Web Vitals

### 6.4 Configurar Domínio Custom (Opcional)

**Se tiveres domínio próprio:**

1. Vercel → Settings → Domains
2. Add Domain
3. Seguir instruções de DNS

---

## 🎉 FASE 7: Go Live

### 7.1 Backup Final do Lovable

Fazer backup final antes de desativar.

### 7.2 Monitorizar Primeiras 24h

- Ver logs na Vercel
- Verificar erros
- Confirmar que tudo funciona

### 7.3 Desativar Lovable (quando confiante)

Após 1-2 semanas de testes bem-sucedidos:
- Desativar deployment no Lovable
- Manter backup dos dados

---

## 📞 Ajuda e Troubleshooting

### Problema: Build falha na Vercel

**Solução:**
1. Ver logs de build completos
2. Verificar que todas as env vars estão configuradas
3. Testar `npm run build` localmente

### Problema: Dados não aparecem

**Solução:**
1. Verificar env vars na Vercel (corretas?)
2. Ver Network tab (F12) para erros de API
3. Verificar RLS policies no Supabase

### Problema: Erro 404 nas rotas

**Solução:**
- Confirmar que `vercel.json` existe e está correto
- Re-deploy

### Problema: CORS errors

**Solução:**
- Adicionar URL da Vercel nas Redirect URLs do Supabase
- Verificar que anon key está correto

---

## 🔐 Segurança

### Ficheiros a NUNCA fazer commit:
- ✅ `.env` (já no `.gitignore`)
- ✅ `new_supabase_credentials.txt`
- ✅ `backup/` folder
- ✅ Service role key

### Variáveis de ambiente seguras:
- ✅ Configuradas na Vercel (não no código)
- ✅ Não partilhar service_role key publicamente
- ✅ Usar anon key para frontend

---

## 📊 Custos Finais

| Serviço | Custo Mensal | Custo Anual |
|---------|--------------|-------------|
| **Vercel Free** | €0 | €0 |
| **Supabase Free** | €0 | €0 |
| **TOTAL** | **€0** | **€0** |

**vs. Contabo**: €4.50/mês = €54/ano 💰

---

## ✅ Checklist Final

- [ ] Backup completo criado
- [ ] Novo Supabase configurado
- [ ] Dados migrados (contagens conferem)
- [ ] RLS configurado
- [ ] Código atualizado (.env)
- [ ] Teste local passou
- [ ] vercel.json criado
- [ ] Deploy na Vercel bem-sucedido
- [ ] URLs atualizados no Supabase
- [ ] Testes em produção passaram
- [ ] Performance verificada
- [ ] Lovable em standby (manter por segurança)

---

## 🎯 Próximos Passos (Após Migração)

1. **Monitorizar** primeiras semanas
2. **Documentar** problemas encontrados
3. **Otimizar** performance se necessário
4. **Configurar** monitoring (Sentry, LogRocket - opcionais)
5. **Candidatar** a Supabase for Good (non-profit program)

---

**Boa sorte! 🚀**

Se tiveres dúvidas durante a migração, consulta:
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [GitHub Issues do projeto](https://github.com/anapsousa/impact-print-connect/issues)
