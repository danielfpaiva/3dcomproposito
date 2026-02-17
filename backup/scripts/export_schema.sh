#!/bin/bash

# Script para exportar schema do Supabase
# Uso: ./export_schema.sh [descrição da alteração]

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Exportar Schema do Supabase${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar se tem descrição
DESCRIPTION="$*"
if [ -z "$DESCRIPTION" ]; then
    echo -e "${YELLOW}⚠️  Nenhuma descrição fornecida.${NC}"
    read -p "Descrição da alteração: " DESCRIPTION
    if [ -z "$DESCRIPTION" ]; then
        echo -e "${RED}❌ Descrição obrigatória!${NC}"
        exit 1
    fi
fi

# Data atual
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Diretórios
SCHEMA_DIR="backup/database/schema"
ARCHIVE_DIR="$SCHEMA_DIR/archive"

# Criar diretório de arquivo se não existir
mkdir -p "$ARCHIVE_DIR"

echo -e "${YELLOW}📋 Descrição:${NC} $DESCRIPTION"
echo -e "${YELLOW}📅 Data:${NC} $DATE"
echo ""

# Verificar se schema.sql existe
if [ -f "$SCHEMA_DIR/schema.sql" ]; then
    echo -e "${YELLOW}📦 Arquivando schema anterior...${NC}"

    # Arquivar schema anterior
    cp "$SCHEMA_DIR/schema.sql" "$ARCHIVE_DIR/schema_$TIMESTAMP.sql"

    # Adicionar nota ao arquivo
    echo "-- Schema arquivado em: $TIMESTAMP" >> "$ARCHIVE_DIR/schema_$TIMESTAMP.sql"
    echo "-- Motivo: $DESCRIPTION" >> "$ARCHIVE_DIR/schema_$TIMESTAMP.sql"

    echo -e "${GREEN}✅ Schema anterior arquivado em:${NC} $ARCHIVE_DIR/schema_$TIMESTAMP.sql"
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  INSTRUÇÕES${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "1️⃣  Ir ao Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/editor"
echo ""
echo "2️⃣  No SQL Editor, executar:"
echo "   (clicar em 'Schema' -> copiar todo o SQL)"
echo ""
echo "3️⃣  Ou usar supabase CLI:"
echo "   supabase db dump --schema public > backup/database/schema/schema.sql"
echo ""
echo "4️⃣  Guardar o schema em:"
echo "   $SCHEMA_DIR/schema.sql"
echo ""
echo "5️⃣  Criar CHANGELOG.md com as alterações:"
echo "   - O que foi alterado?"
echo "   - Porquê?"
echo "   - Impacto no código?"
echo ""

# Perguntar se quer abrir o editor
read -p "Abrir $SCHEMA_DIR/schema.sql no editor? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Tentar abrir no editor padrão
    if command -v code &> /dev/null; then
        code "$SCHEMA_DIR/schema.sql"
    elif command -v nano &> /dev/null; then
        nano "$SCHEMA_DIR/schema.sql"
    elif command -v vim &> /dev/null; then
        vim "$SCHEMA_DIR/schema.sql"
    else
        echo -e "${YELLOW}⚠️  Nenhum editor encontrado. Abre manualmente:${NC} $SCHEMA_DIR/schema.sql"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  PRÓXIMOS PASSOS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Após guardar o schema:"
echo ""
echo "  git add backup/database/schema/"
echo "  git commit -m \"docs(schema): $DESCRIPTION\""
echo "  git push"
echo ""
echo -e "${YELLOW}⚠️  NÃO esquecer de atualizar:${NC}"
echo "  - CLAUDE.md (se estrutura mudou)"
echo "  - TypeScript types (src/integrations/supabase/types.ts)"
echo "  - React Query hooks (se necessário)"
echo ""
echo -e "${GREEN}✅ Processo completo!${NC}"
