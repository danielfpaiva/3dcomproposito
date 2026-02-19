-- ============================================================================
-- LIMPEZA DE TABELAS ANTIGAS (Sistema Legacy)
-- ============================================================================
--
-- Este script remove as tabelas do sistema antigo de projetos.
-- IMPORTANTE: Executar APENAS após confirmar que o novo sistema está
-- a funcionar corretamente em produção.
--
-- Data de criação: 2026-02-19
-- ============================================================================

-- 1. Drop foreign keys primeiro (evitar erros de dependências)
-- ===========================================================

ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_assigned_contributor_id_fkey;
ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_project_id_fkey;

-- 2. Drop tabelas antigas
-- =======================

DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS wheelchair_projects CASCADE;
DROP TABLE IF EXISTS part_templates CASCADE;

-- 3. Verificar tabelas restantes
-- ===============================
-- Executar para confirmar que as tabelas foram removidas:
--
-- SELECT tablename
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Deves ver apenas:
--   - beneficiary_requests
--   - contributors
--   - donations
--   - initiative_parts
--   - initiatives
--   - profiles
--   - project_instance_parts
--   - project_instances
--   - user_roles

-- ============================================================================
-- NOTAS:
-- ============================================================================
--
-- Tabelas removidas:
--   - wheelchair_projects: Projetos do sistema antigo
--   - parts: Peças do sistema antigo (referenciavam wheelchair_projects)
--   - part_templates: Templates de peças TMT (24 peças hardcoded)
--
-- Sistema novo usa:
--   - initiatives: Templates de iniciativas (ex: TMT)
--   - initiative_parts: Peças por iniciativa (substituem part_templates)
--   - project_instances: Projetos criados a partir de iniciativas
--   - project_instance_parts: Peças por projeto (snapshot do template)
--
-- ============================================================================
