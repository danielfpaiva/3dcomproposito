# 📚 Documentação - 3D com Propósito

Esta pasta contém toda a documentação técnica do projeto 3D com Propósito.

## 📂 Estrutura

```
docs/
├── README.md (este ficheiro)
│
├── deployment/                    # Guias de deployment
│   ├── DEPLOY_EDGE_FUNCTIONS.md  # Como fazer deploy de edge functions
│   ├── DEPLOY_RAPIDO.md           # Guia rápido de deployment
│   └── RESEND_SETUP.md            # Configuração do serviço Resend (emails)
│
├── guides/                        # Guias técnicos
│   ├── CRIAR_ADMINS_GUIA.md       # Como criar utilizadores admin
│   ├── DATABASE_CHANGES_WORKFLOW.md  # Workflow para alterações na BD
│   └── IMPORT_GUIDE.md            # Como importar dados para a BD
│
├── checklists/                    # Checklists úteis
│   ├── PRODUCAO_CHECKLIST.md      # Checklist de deployment para produção
│   └── PROXIMOS_PASSOS.md         # Próximos passos e features planeadas
│
├── database/                      # Documentação da base de dados
│   ├── README.md                  # Visão geral dos backups
│   ├── migrations_README.md       # Info sobre migrações
│   └── schema_migrations_README.md  # Info sobre schema migrations
│
└── archive/                       # Documentação antiga/histórica
    ├── EMAIL_IMPLEMENTATION_PLAN.md  # Plano de implementação de emails (concluído)
    └── lovable_plan.md            # Plano antigo do Lovable (legacy)
```

## 🚀 Links Rápidos

### Para Desenvolvedores
- [Workflow de Alterações na BD](guides/DATABASE_CHANGES_WORKFLOW.md)
- [Deploy de Edge Functions](deployment/DEPLOY_EDGE_FUNCTIONS.md)
- [Guia de Importação de Dados](guides/IMPORT_GUIDE.md)

### Para Deployment
- [Guia Rápido de Deployment](deployment/DEPLOY_RAPIDO.md)
- [Checklist de Produção](checklists/PRODUCAO_CHECKLIST.md)

### Para Administração
- [Criar Utilizadores Admin](guides/CRIAR_ADMINS_GUIA.md)
- [Configurar Resend (Emails)](deployment/RESEND_SETUP.md)

## 📖 Documentação Principal

Para informações gerais sobre o projeto, consulte:
- [README.md](../README.md) - Visão geral do projeto
- [CLAUDE.md](../CLAUDE.md) - Guia para trabalhar com Claude Code
