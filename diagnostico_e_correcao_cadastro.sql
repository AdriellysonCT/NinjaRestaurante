-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO DO CADASTRO DE RESTAURANTES
-- =====================================================

-- 1. VERIFICAR O PROBLEMA ATUAL
-- =====================================================

-- Verificar o usuário "Cristal Pizzaria" em profiles
SELECT 
    id,
    email,
    tipo_cliente,
    nome_fantasia,
    created_at
FROM profiles
WHERE nome_fantasia ILIKE '%cristal%'
ORDER BY created_at DESC;

-- Verificar se existe em restaurantes_app
SELECT 
    id,
    nome_fantasia,
    email,
    created_at
FROM restaurantes_app
WHERE nome_fantasia ILIKE '%cristal%'
ORDER BY created_at DESC;

-- Verificar todos os triggers relacionados a profiles
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. VERIFICAR PROBLEMA DE ISOLAMENTO (RLS)
-- =====================================================

-- Ver políticas RLS da tabela itens_cardapio
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
WHERE tablename = 'itens_cardapio';

-- Ver se há itens do Fenix Carnes sem restaurante_id correto
SELECT 
    id,
    nome,
    restaurante_id,
    created_at
FROM itens_cardapio
WHERE restaurante_id IS NULL 
   OR restaurante_id NOT IN (SELECT id FROM restaurantes_app)
ORDER BY created_at DESC
LIMIT 20;
