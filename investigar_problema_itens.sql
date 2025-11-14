-- Script para investigar por que os itens não estão sendo criados
-- Execute este script no SQL Editor do Supabase

-- 1. Ver todos os pedidos recentes e seus itens
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.valor_total,
    p.criado_em,
    p.id_restaurante,
    COUNT(ip.id) as total_itens,
    COALESCE(SUM(ip.preco_total), 0) as soma_itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE p.numero_pedido IN (32, 33, 34)
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.valor_total, p.criado_em, p.id_restaurante
ORDER BY p.numero_pedido DESC;

-- 2. Ver quais pedidos têm itens e quais não têm
SELECT 
    p.numero_pedido,
    p.valor_total,
    CASE 
        WHEN COUNT(ip.id) = 0 THEN '❌ SEM ITENS'
        ELSE '✅ COM ITENS'
    END as status_itens,
    COUNT(ip.id) as total_itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE p.criado_em >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.numero_pedido, p.valor_total
ORDER BY p.criado_em DESC
LIMIT 20;

-- 3. Ver os itens que EXISTEM na tabela (de quais pedidos são?)
SELECT 
    ip.id,
    ip.id_pedido,
    p.numero_pedido,
    ip.quantidade,
    ip.preco_unitario,
    ip.preco_total,
    ic.nome as nome_item,
    ip.criado_em
FROM itens_pedido ip
LEFT JOIN pedidos_padronizados p ON p.id = ip.id_pedido
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
ORDER BY ip.criado_em DESC
LIMIT 10;

-- 4. Verificar políticas RLS da tabela itens_pedido
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
WHERE tablename = 'itens_pedido';

-- 5. Verificar se há erros de foreign key
-- (Tentar inserir um item de teste)
DO $$
DECLARE
    v_id_pedido UUID;
    v_id_restaurante UUID;
    v_id_item_cardapio UUID;
    v_erro TEXT;
BEGIN
    -- Pegar pedido #33
    SELECT id, id_restaurante INTO v_id_pedido, v_id_restaurante
    FROM pedidos_padronizados
    WHERE numero_pedido = 33;

    -- Pegar um item do cardápio
    SELECT id INTO v_id_item_cardapio
    FROM itens_cardapio
    WHERE id_restaurante = v_id_restaurante
    AND disponivel = true
    LIMIT 1;

    RAISE NOTICE 'Pedido: %', v_id_pedido;
    RAISE NOTICE 'Restaurante: %', v_id_restaurante;
    RAISE NOTICE 'Item cardápio: %', v_id_item_cardapio;

    -- Tentar inserir item
    BEGIN
        INSERT INTO itens_pedido (
            id_pedido,
            id_item_cardapio,
            quantidade,
            preco_unitario,
            preco_total,
            id_restaurante
        ) VALUES (
            v_id_pedido,
            v_id_item_cardapio,
            1,
            10.00,
            10.00,
            v_id_restaurante
        );
        
        RAISE NOTICE '✅ SUCESSO: Item inserido sem erros!';
        
        -- Remover o item de teste
        DELETE FROM itens_pedido 
        WHERE id_pedido = v_id_pedido 
        AND preco_unitario = 10.00;
        
        RAISE NOTICE '✅ Item de teste removido';
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_erro = MESSAGE_TEXT;
        RAISE NOTICE '❌ ERRO ao inserir item: %', v_erro;
    END;
END $$;

-- 6. Verificar constraints da tabela itens_pedido
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'itens_pedido'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 7. Ver se há triggers que podem estar bloqueando
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'itens_pedido';
