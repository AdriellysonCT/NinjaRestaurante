-- DIAGNÓSTICO: Mesas Desaparecendo
-- Este script verifica possíveis causas de mesas sumindo após alguns minutos

-- 1. Verificar estrutura da tabela mesas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mesas'
ORDER BY ordinal_position;

-- 2. Verificar se há triggers na tabela mesas
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'mesas';

-- 3. Verificar políticas RLS na tabela mesas
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
WHERE tablename = 'mesas';

-- 4. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'mesas';

-- 5. Listar todas as mesas existentes (sem filtro de restaurante)
SELECT 
    id,
    numero,
    capacidade,
    status,
    id_restaurante,
    id_pedido,
    started_at,
    created_at
FROM mesas
ORDER BY numero;

-- 6. Verificar se há mesas "órfãs" (sem restaurante válido)
SELECT 
    m.id,
    m.numero,
    m.id_restaurante,
    r.id as restaurante_existe
FROM mesas m
LEFT JOIN restaurantes_app r ON m.id_restaurante = r.id
WHERE r.id IS NULL;

-- 7. Verificar pedidos associados às mesas
SELECT 
    m.id as mesa_id,
    m.numero,
    m.status as mesa_status,
    m.id_pedido,
    p.id as pedido_id,
    p.status as pedido_status,
    p.tipo_pedido
FROM mesas m
LEFT JOIN pedidos_padronizados p ON m.id_pedido = p.id
WHERE m.id_pedido IS NOT NULL;
