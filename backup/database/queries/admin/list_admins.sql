-- ============================================
-- LISTAR ADMINS A CRIAR
-- ============================================
-- Mostra quem tinha role de admin no Lovable
-- ============================================

SELECT
    p.id as user_uuid,
    p.email,
    p.full_name,
    ur.role
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'admin'
ORDER BY p.email;

-- ============================================
-- RESULTADO: Lista de admins que precisam ser recriados
-- ============================================
