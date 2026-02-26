-- =====================================================
-- SCRIPT DE TESTE DO NOVO FLUXO DE CADASTRO
-- =====================================================
-- Execute este script para validar se tudo está funcionando
-- =====================================================

-- 1. VERIFICAR SE AS TRIGGERS EXISTEM
-- =====================================================

SELECT '=== VERIFICANDO TRIGGERS ===' as status;

SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante')
ORDER BY trigger_name;

-- Se não aparecer nenhuma trigger, execute: \i EXECUTAR_AGORA_CORRECAO.sql

-- 2. VERIFICAR ESTRUTURA DAS FUNÇÕES
-- =====================================================

SELECT '=== VERIFICANDO FUNÇÕES ===' as status;

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'handle_new_profile_restaurante')
ORDER BY routine_name;

-- 3. VERIFICAR CÓDIGO DAS FUNÇÕES
-- =====================================================

SELECT '=== CÓDIGO DA FUNÇÃO handle_new_user ===' as status;

SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT '=== CÓDIGO DA FUNÇÃO handle_new_profile_restaurante ===' as status;

SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_profile_restaurante';

-- 4. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT '=== VERIFICANDO POLÍTICAS RLS ===' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'Sem USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'Sem WITH CHECK'
    END as with_check_clause
FROM pg_policies
WHERE tablename IN ('itens_cardapio', 'grupos_complementos', 'complementos', 'pedidos_padronizados', 'restaurantes_app')
ORDER BY tablename, policyname;

-- 5. VERIFICAR RESTAURANTES EXISTENTES
-- =====================================================

SELECT '=== RESTAURANTES EM PROFILES ===' as status;

SELECT 
    id,
    email,
    tipo_cliente,
    nome_fantasia,
    tipo_restaurante,
    created_at
FROM profiles
WHERE tipo_cliente = 'restaurante'
ORDER BY created_at DESC
LIMIT 10;

SELECT '=== RESTAURANTES EM RESTAURANTES_APP ===' as status;

SELECT 
    id,
    email,
    nome_fantasia,
    tipo_restaurante,
    cnpj,
    telefone,
    created_at
FROM restaurantes_app
ORDER BY created_at DESC
LIMIT 10;

-- 6. VERIFICAR INCONSISTÊNCIAS
-- =====================================================

SELECT '=== VERIFICANDO INCONSISTÊNCIAS ===' as status;

-- Profiles de restaurante sem registro em restaurantes_app
SELECT 
    '❌ Profile sem restaurante_app' as problema,
    p.id,
    p.email,
    p.nome_fantasia
FROM profiles p
WHERE p.tipo_cliente = 'restaurante'
  AND NOT EXISTS (
    SELECT 1 FROM restaurantes_app r WHERE r.id = p.id
  );

-- Profiles com tipo_cliente errado
SELECT 
    '❌ Profile com tipo_cliente errado' as problema,
    p.id,
    p.email,
    p.tipo_cliente,
    p.nome_fantasia
FROM profiles p
WHERE p.nome_fantasia IS NOT NULL 
  AND p.nome_fantasia != ''
  AND p.tipo_cliente != 'restaurante';

-- 7. TESTE DE METADADOS (SIMULAÇÃO)
-- =====================================================

SELECT '=== TESTE DE LEITURA DE METADADOS ===' as status;

-- Simular leitura de metadados como a trigger faz
SELECT 
    id,
    email,
    raw_user_meta_data->>'tipo_usuario' as tipo_usuario_lido,
    raw_user_meta_data->>'user_type' as user_type_lido,
    raw_user_meta_data->>'nome_fantasia' as nome_fantasia_lido,
    COALESCE(
        raw_user_meta_data->>'tipo_usuario',
        raw_user_meta_data->>'user_type',
        'cliente'
    ) as tipo_final
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 8. RESUMO DO STATUS
-- =====================================================

SELECT '=== RESUMO DO STATUS ===' as status;

SELECT 
    'Triggers Criadas' as item,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante')

UNION ALL

SELECT 
    'Funções Criadas' as item,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'handle_new_profile_restaurante')

UNION ALL

SELECT 
    'Restaurantes em Profiles' as item,
    COUNT(*) as quantidade,
    '📊 INFO' as status
FROM profiles
WHERE tipo_cliente = 'restaurante'

UNION ALL

SELECT 
    'Restaurantes em App' as item,
    COUNT(*) as quantidade,
    '📊 INFO' as status
FROM restaurantes_app

UNION ALL

SELECT 
    'Inconsistências' as item,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '⚠️ ATENÇÃO'
    END as status
FROM profiles p
WHERE p.tipo_cliente = 'restaurante'
  AND NOT EXISTS (
    SELECT 1 FROM restaurantes_app r WHERE r.id = p.id
  );

-- 9. INSTRUÇÕES FINAIS
-- =====================================================

SELECT '=== PRÓXIMOS PASSOS ===' as status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.triggers 
              WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante')) = 2
        THEN '✅ Triggers OK - Pode testar cadastro no front-end'
        ELSE '❌ Execute: \i EXECUTAR_AGORA_CORRECAO.sql'
    END as instrucao;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles p
              WHERE p.tipo_cliente = 'restaurante'
                AND NOT EXISTS (SELECT 1 FROM restaurantes_app r WHERE r.id = p.id)) > 0
        THEN '⚠️ Há inconsistências - Execute: \i EXECUTAR_AGORA_CORRECAO.sql'
        ELSE '✅ Sem inconsistências - Sistema pronto'
    END as instrucao;
