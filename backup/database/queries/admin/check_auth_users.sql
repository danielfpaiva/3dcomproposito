-- ============================================
-- VERIFICAR AUTH USERS
-- ============================================
-- Este script verifica os users no Supabase Auth
-- ============================================

-- 1. Ver quantos users existem no Auth
SELECT count(*) as total_auth_users
FROM auth.users;

-- 2. Ver detalhes dos users (se existirem)
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- 3. Ver profiles na base de dados
SELECT
    id,
    email,
    full_name,
    created_at
FROM profiles
ORDER BY created_at;

-- 4. Ver user_roles
SELECT
    ur.role,
    p.email,
    p.full_name
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
ORDER BY ur.role;

-- ============================================
-- DIAGNÓSTICO ESPERADO:
-- ============================================
-- Se auth.users tiver 0 rows → Não há users migrados! ❌
-- Se profiles tiver rows mas auth.users não → Dados migrados mas auth não! ❌
-- Se ambos tiverem rows → OK! ✅
-- ============================================
