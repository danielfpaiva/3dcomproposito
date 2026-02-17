# 📦 Backup e Documentação - 3D com Propósito

Esta pasta contém backups da base de dados, documentação técnica, queries úteis e scripts relacionados com o projeto 3D com Propósito (anteriormente Impact Print Connect).

## 📂 Estrutura Organizada

```
backup/
├── README.md (este ficheiro)
│
├── database/                       # Tudo relacionado com base de dados
│   ├── schema/                     # Schemas e estruturas
│   │   ├── schema.sql             # Schema completo da BD
│   │   ├── rls_policies.sql       # Políticas RLS (Row Level Security)
│   │   └── rls_policies_fix.sql   # Correções às políticas RLS
│   │
│   ├── data/                       # Dados exportados (backups)
│   │   └── 2026-02-16/            # Data do backup
│   │       ├── contributors.csv           (185 rows)
│   │       ├── beneficiary_requests.csv   (3 rows)
│   │       ├── parts.csv                  (48 rows)
│   │       ├── part_templates.csv         (24 rows)
│   │       ├── profiles.csv               (20 rows)
│   │       ├── user_roles.csv             (3 rows)
│   │       ├── wheelchair_projects.csv    (2 rows)
│   │       └── contas.csv                 (contas admin)
│   │
│   └── queries/                    # Queries SQL úteis
│       ├── admin/                  # Queries de administração
│       │   ├── list_admins.sql    # Listar admins existentes
│       │   └── check_auth_users.sql # Verificar users auth
│       └── testing/                # Queries de teste
│           └── test_rls.sql       # Testar políticas RLS
│
├── docs/                           # Documentação técnica
│   ├── deployment/                 # Guias de deployment
│   │   ├── DEPLOY_RAPIDO.md       # Deploy rápido do projeto
│   │   └── DEPLOY_EDGE_FUNCTIONS.md # Deploy de edge functions
│   │
│   ├── guides/                     # Guias passo-a-passo
│   │   ├── IMPORT_GUIDE.md        # Importar dados para Supabase
│   │   └── CRIAR_ADMINS_GUIA.md   # Criar utilizadores admin
│   │
│   └── checklists/                 # Checklists de verificação
│       ├── PRODUCAO_CHECKLIST.md  # Checklist para produção
│       └── PROXIMOS_PASSOS.md     # Próximos passos do projeto
│
└── scripts/                        # Scripts auxiliares
    └── convert_csv_for_supabase.py # Converter CSVs para Supabase
```

---

## 🎯 Guia Rápido

### 📊 Ver Schema da Base de Dados
```bash
cat backup/database/schema/schema.sql
```

### 📥 Restaurar Backup
1. Ver guia: `backup/docs/guides/IMPORT_GUIDE.md`
2. Dados em: `backup/database/data/2026-02-16/`
3. Schema em: `backup/database/schema/schema.sql`

### 👤 Criar Admin
Ver guia completo: `backup/docs/guides/CRIAR_ADMINS_GUIA.md`

### 🚀 Deploy
- **Deploy rápido**: `backup/docs/deployment/DEPLOY_RAPIDO.md`
- **Edge functions**: `backup/docs/deployment/DEPLOY_EDGE_FUNCTIONS.md`

### 🔍 Queries Úteis
- **Listar admins**: `backup/database/queries/admin/list_admins.sql`
- **Testar RLS**: `backup/database/queries/testing/test_rls.sql`

---

## ⚠️ SEGURANÇA E PRIVACIDADE

**Estes ficheiros contêm dados sensíveis!**

### 🔐 Dados Pessoais Incluídos:
- ✅ Emails de voluntários (contributors)
- ✅ Números de telefone
- ✅ Tokens de acesso ao portal
- ✅ Informação pessoal de beneficiários
- ✅ Moradas e contactos

### 🚨 Regras de Segurança:
- ❌ **NÃO** fazer commit de ficheiros `.csv` no Git
- ❌ **NÃO** partilhar publicamente
- ❌ **NÃO** enviar por email não encriptado
- ✅ **SIM** guardar em local seguro (encriptado)
- ✅ **SIM** criar cópia de segurança externa
- ✅ **SIM** limitar acesso apenas a admins

### 📋 Ficheiros a IGNORAR no Git:
```
backup/database/data/**/*.csv
backup/**/*.csv
```

---

## 🔍 Verificação de Dados

Após importar dados para Supabase, executar esta query para verificar contagens:

```sql
-- Verificar contagens de todas as tabelas
SELECT 'beneficiary_requests' as table_name, COUNT(*) as count FROM beneficiary_requests
UNION ALL SELECT 'contributors', COUNT(*) FROM contributors
UNION ALL SELECT 'parts', COUNT(*) FROM parts
UNION ALL SELECT 'part_templates', COUNT(*) FROM part_templates
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL SELECT 'wheelchair_projects', COUNT(*) FROM wheelchair_projects;
```

**Resultado esperado (backup 2026-02-16):**
```
beneficiary_requests | 3
contributors         | 185
parts                | 48
part_templates       | 24
profiles             | 20
user_roles           | 3
wheelchair_projects  | 2
```

---

## 📅 Histórico de Backups

### Backup 2026-02-16
- **Origem**: Lovable Cloud (Supabase Project: gbfahkeamspmzptetkqc)
- **Destino**: Novo Supabase (bsbqmqfznkozqagdhvoj)
- **Migração**: ✅ Concluída com sucesso
- **Produção**: https://3dcomproposito.vercel.app
- **Status**: Projeto rebrandizado para "3D com Propósito"

---

## 🛠️ Manutenção

### Criar Novo Backup
```bash
# 1. Criar pasta para a data
mkdir -p backup/database/data/$(date +%Y-%m-%d)

# 2. Exportar dados do Supabase
# (executar queries de export na dashboard do Supabase)

# 3. Guardar schema atual
# (copiar de Supabase SQL Editor)
```

### Atualizar Documentação
Manter sempre atualizados:
- `CLAUDE.md` (raiz do projeto) - Documentação para Claude Code
- `EMAIL_IMPLEMENTATION_PLAN.md` (raiz) - Plano de emails
- `backup/docs/` - Guias e checklists

---

## 📞 Contacto

Para questões sobre backups ou restauro de dados, contactar:
- **Admin**: Helder, Ana ou Gabriel
- **Supabase Project ID**: bsbqmqfznkozqagdhvoj
- **Vercel Project**: 3dcomproposito

---

**Última atualização**: 2026-02-17
