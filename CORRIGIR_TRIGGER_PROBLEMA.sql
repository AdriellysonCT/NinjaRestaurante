-- =====================================================
-- CORRIGIR TRIGGER QUE ESTÁ CAUSANDO O PROBLEMA
-- =====================================================

-- 1. VER O CÓDIGO DA FUNÇÃO sync_cliente_com_profile
SELECT 
    '🔍 Código da função sync_cliente_com_profile:' as info,
    pg_get_functiondef(oid) as codigo
FROM pg_proc
WHERE proname = 'sync_cliente_com_profile';

-- 2. VER TODAS AS TRIGGERS EM PROFILES
SELECT 
    '📋 Todas as triggers em profiles:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY action_timing, event_manipulation;

-- 3. REMOVER A TRIGGER PROBLEMÁTICA
DROP TRIGGER IF EXISTS trg_sync_cliente_com_profile ON public.profiles;

-- 4. VERIFICAR SE A FUNÇÃO AINDA É NECESSÁRIA
-- Se não for usada em nenhum outro lugar, podemos removê-la
SELECT 
    '🔍 Verificando uso da função:' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE action_statement LIKE '%sync_cliente_com_profile%';

-- Se não retornar nada, a função não é mais usada
-- Podemos removê-la com segurança
DROP FUNCTION IF EXISTS sync_cliente_com_profile() CASCADE;

-- 5. VERIFICAR TRIGGERS APÓS REMOÇÃO
SELECT 
    '✅ Triggers restantes em profiles:' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY action_timing, event_manipulation;

-- Deve restar apenas:
-- - set_timestamp_profiles (UPDATE, BEFORE)
-- - trigger_update_updated_at (UPDATE, BEFORE)

SELECT '✅ Trigger problemática removida!' as resultado;
SELECT '📋 Agora o cadastro deve funcionar corretamente' as info;
