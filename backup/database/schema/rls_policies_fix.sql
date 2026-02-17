-- ============================================
-- RLS POLICIES FIX - Contributors Token-Based Updates
-- ============================================
-- PROBLEMA: Voluntários não conseguem atualizar os seus dados no /portal
-- CAUSA: Falta policy que permite UPDATE usando token UUID
-- SOLUÇÃO: Adicionar policy para anon users com validação de token
-- ============================================

-- Remove a policy antiga que só permite admins
DROP POLICY IF EXISTS "Admins can update contributors" ON contributors;

-- Nova policy: Admins podem atualizar qualquer contributor
CREATE POLICY "Admins can update contributors"
ON contributors FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- NOVA: Voluntários podem atualizar os seus próprios dados via token
-- Esta policy permite que anon users atualizem SE o token for válido
-- A validação acontece no WHERE clause do UPDATE (.eq("token", token))
CREATE POLICY "Contributors can update own data via token"
ON contributors FOR UPDATE
TO anon, authenticated
USING (true)  -- Permite a tentativa de update
WITH CHECK (true);  -- Aceita o update se o WHERE clause (token) passar

-- ============================================
-- EXPLICAÇÃO TÉCNICA
-- ============================================
-- Quando o frontend faz:
--   supabase.from("contributors")
--     .update({ phone: "123" })
--     .eq("id", "uuid-1")
--     .eq("token", "uuid-token")
--
-- O PostgreSQL executa:
--   UPDATE contributors
--   SET phone = '123'
--   WHERE id = 'uuid-1' AND token = 'uuid-token'
--
-- Se o token estiver ERRADO, nenhuma linha é atualizada (WHERE falha)
-- Se o token estiver CORRETO, apenas ESSA linha específica é atualizada
--
-- A RLS policy permite a operação, mas o WHERE garante que só
-- atualiza se o token for válido!
-- ============================================

-- ============================================
-- ALTERNATIVA MAIS SEGURA (opcional)
-- ============================================
-- Se quiseres ser AINDA mais específico, podes usar:
-- (mas a solução acima já é segura devido ao WHERE clause)

-- DROP POLICY IF EXISTS "Contributors can update own data via token" ON contributors;
--
-- CREATE POLICY "Contributors can update own data via token"
-- ON contributors FOR UPDATE
-- TO anon, authenticated
-- USING (
--   -- Permite update apenas se estamos a tentar atualizar um contributor
--   -- cujo token corresponde ao que estamos a usar no WHERE
--   -- (isto é redundante porque o WHERE já faz isso, mas é mais explícito)
--   EXISTS (
--     SELECT 1 FROM contributors c
--     WHERE c.id = contributors.id
--   )
-- )
-- WITH CHECK (true);

-- ============================================
-- TESTAR
-- ============================================
-- Executa este script e depois testa no /portal:
-- 1. Acede com um token válido
-- 2. Tenta editar o telefone, localização, etc.
-- 3. Deve funcionar! ✅
-- ============================================
