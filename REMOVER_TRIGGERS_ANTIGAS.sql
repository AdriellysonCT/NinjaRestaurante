-- =====================================================
-- REMOVER TRIGGERS ANTIGAS (Não Mais Necessárias)
-- =====================================================
-- O novo fluxo não depende de triggers automáticas
-- O front-end controla todo o processo de cadastro
-- =====================================================

BEGIN;

-- Remover triggers antigas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_restaurante ON public.profiles;

-- Remover funções antigas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile_restaurante() CASCADE;

COMMIT;

-- Verificar se foram removidas
SELECT '=== VERIFICANDO REMOÇÃO ===' as status;

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');

-- Deve retornar 0 linhas

SELECT 
    routine_name
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'handle_new_profile_restaurante');

-- Deve retornar 0 linhas

SELECT '✅ Triggers antigas removidas com sucesso!' as resultado;
SELECT '📋 O cadastro agora é controlado 100% pelo front-end' as info;
