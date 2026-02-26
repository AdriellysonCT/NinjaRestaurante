-- =====================================================
-- INVESTIGAR CADASTRO QUE NÃO CRIOU EM RESTAURANTES_APP
-- =====================================================

-- 1. Ver último cadastro em profiles
SELECT 
    id,
    email,
    tipo_usuario,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver se existe em restaurantes_app
SELECT 
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ Existe'
        ELSE '❌ NÃO EXISTE'
    END as status_restaurante
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. Ver estrutura da tabela restaurantes_app
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS em restaurantes_app
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'restaurantes_app';

-- 5. Verificar se há triggers que podem estar bloqueando
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'restaurantes_app';
