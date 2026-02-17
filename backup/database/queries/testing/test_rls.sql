-- ============================================
-- TEST RLS POLICIES
-- ============================================
-- Este script testa se as RLS policies estão corretas
-- Execute no SQL Editor da Supabase
-- ============================================

-- 1. Verificar se RLS está ativado em todas as tabelas
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles',
        'user_roles',
        'contributors',
        'wheelchair_projects',
        'parts',
        'part_templates',
        'beneficiary_requests',
        'donations'
    )
ORDER BY tablename;

-- Esperado: Todas as tabelas devem ter rls_enabled = true

-- ============================================
-- 2. Listar todas as policies criadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 3. Testar acesso público (anon) aos contributors
-- Simula o que acontece quando alguém não autenticado acede /organizadores
SET ROLE anon;
SELECT count(*) as total_contributors FROM contributors;
-- Esperado: 191

-- Testar se pode ver dados individuais
SELECT name, location, region, materials FROM contributors LIMIT 5;
-- Esperado: Deve mostrar 5 voluntários

RESET ROLE;

-- ============================================
-- 4. Testar acesso público às estatísticas
SET ROLE anon;

-- Dashboard stats (view)
SELECT * FROM dashboard_stats;
-- Esperado: Mostrar estatísticas (1 linha)

-- Regional stats (view)
SELECT * FROM regional_stats ORDER BY region;
-- Esperado: Mostrar stats por região

-- Parts (para contar peças)
SELECT count(*) FROM parts;
-- Esperado: 48

-- Projects (para stats)
SELECT count(*) FROM wheelchair_projects;
-- Esperado: 2

RESET ROLE;

-- ============================================
-- 5. Testar inserção pública (contributor registration)
SET ROLE anon;

-- Simular registo de voluntário (NÃO executar - apenas teste de permissão)
-- Esta query vai falhar com erro de permissão se RLS estiver mal configurado
-- OU vai preparar a inserção se estiver correto (não vamos executar de facto)
EXPLAIN (COSTS OFF)
INSERT INTO contributors (name, email, location, region, availability)
VALUES ('Test User', 'test@test.com', 'Test Location', 'centro', 'Flexível');
-- Esperado: Deve mostrar plano de execução (permissão OK)
-- NÃO vamos inserir de facto (é só teste)

RESET ROLE;

-- ============================================
-- 6. Verificar se dados sensíveis estão protegidos
SET ROLE anon;

-- Tentar aceder profiles (deve FALHAR - só authenticated)
SELECT count(*) FROM profiles;
-- Esperado: 0 rows (ou erro de permissão)

-- Tentar aceder user_roles (deve FALHAR - só authenticated)
SELECT count(*) FROM user_roles;
-- Esperado: 0 rows (ou erro de permissão)

RESET ROLE;

-- ============================================
-- RESUMO DOS TESTES
-- ============================================
-- ✅ RLS ativado em todas as tabelas?
-- ✅ Público pode VER contributors? (para /organizadores)
-- ✅ Público pode VER stats/parts/projects? (para homepage)
-- ✅ Público pode INSERIR contributors? (para formulário de registo)
-- ✅ Público NÃO pode ver profiles/user_roles? (proteção de dados sensíveis)
-- ============================================
