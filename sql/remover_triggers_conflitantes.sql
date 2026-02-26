-- =====================================================
-- REMOVER TRIGGERS QUE PODEM ESTAR SOBRESCREVENDO tipo_usuario
-- =====================================================

-- 1. LISTAR TODAS AS TRIGGERS EM PROFILES
SELECT 
    '🔍 Triggers atuais em profiles:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 2. LISTAR TODAS AS TRIGGERS EM AUTH.USERS
SELECT 
    '🔍 Triggers atuais em auth.users:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- 3. REMOVER TRIGGERS ANTIGAS QUE PODEM ESTAR CAUSANDO CONFLITO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_restaurante ON public.profiles;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS handle_new_profile ON public.profiles;

-- 4. REMOVER FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile_restaurante() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;

-- 5. VERIFICAR SE FORAM REMOVIDAS
SELECT 
    '✅ Triggers após remoção:' as status,
    COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE (event_object_table = 'profiles' AND event_object_schema = 'public')
   OR (event_object_table = 'users' AND event_object_schema = 'auth');

-- Se retornar 0, todas as triggers foram removidas com sucesso

-- 6. VERIFICAR FUNÇÕES RESTANTES
SELECT 
    '✅ Funções após remoção:' as status,
    routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%handle%'
  AND routine_schema = 'public';

-- Deve retornar 0 linhas

SELECT '✅ Triggers conflitantes removidas!' as resultado;
SELECT '📋 Agora o front-end tem controle total do cadastro' as info;
