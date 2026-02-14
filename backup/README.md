# 📦 Backup da Migração

Esta pasta contém os backups da base de dados Lovable antes da migração para Supabase.

## 📂 Estrutura

```
backup/
├── README.md (este ficheiro)
├── schema_info.txt (estrutura das tabelas)
├── rls_policies.sql (políticas de segurança)
├── storage_info.txt (informação sobre ficheiros)
├── config.md (configurações do Lovable)
└── csv/
    ├── beneficiary_requests.csv (3 rows)
    ├── contributors.csv (185 rows) ⚠️ IMPORTANTE
    ├── parts.csv (48 rows)
    ├── part_templates.csv (24 rows)
    ├── profiles.csv (20 rows)
    ├── user_roles.csv (3 rows)
    └── wheelchair_projects.csv (2 rows)
```

## ⚠️ IMPORTANTE

**Estes ficheiros contêm dados sensíveis!**
- ❌ NÃO fazer commit no Git
- ❌ NÃO partilhar publicamente
- ✅ Guardar em local seguro
- ✅ Criar cópia de segurança externa

## 📋 Checklist de Backup

- [ ] schema_info.txt criado
- [ ] rls_policies.sql criado
- [ ] storage_info.txt criado
- [ ] config.md criado
- [ ] beneficiary_requests.csv exportado
- [ ] contributors.csv exportado (185 rows)
- [ ] parts.csv exportado
- [ ] part_templates.csv exportado
- [ ] profiles.csv exportado
- [ ] user_roles.csv exportado
- [ ] wheelchair_projects.csv exportado

## 🔍 Verificação de Dados

Após importar no novo Supabase, executar:

```sql
-- Verificar contagens
SELECT 'beneficiary_requests' as table_name, COUNT(*) FROM beneficiary_requests
UNION ALL SELECT 'contributors', COUNT(*) FROM contributors
UNION ALL SELECT 'parts', COUNT(*) FROM parts
UNION ALL SELECT 'part_templates', COUNT(*) FROM part_templates
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL SELECT 'wheelchair_projects', COUNT(*) FROM wheelchair_projects;
```

**Resultado esperado:**
```
beneficiary_requests | 3
contributors         | 185
parts                | 48
part_templates       | 24
profiles             | 20
user_roles           | 3
wheelchair_projects  | 2
```

## 📅 Data do Backup

- **Data**: 2026-02-14
- **Origem**: Lovable Cloud (Supabase Project: gbfahkeamspmzptetkqc)
- **Destino**: Novo Supabase (a definir)

## 🔐 Segurança

Este backup contém:
- ✅ Emails de contributors
- ✅ Telefones (alguns)
- ✅ Tokens de acesso
- ✅ Informação pessoal de beneficiários

**Manter confidencial!**
