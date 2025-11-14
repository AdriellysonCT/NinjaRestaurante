-- Script de diagnóstico para verificar a estrutura de itens_pedido e relacionamentos
-- Execute este script no SQL Editor do Supabase para diagnosticar o problema

-- 1. Verificar estrutura da tabela itens_pedido
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'itens_pedido'
ORDER BY ordinal_position;

-- 2. Verificar todas as foreign keys da tabela itens_pedido
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'itens_pedido';

-- 3. Testar query de pedidos com itens (igual ao orderService.js)
SELECT 
    p.id,
    p.numero_pedido,
    p.tipo_pedido,
    p.status,
    p.valor_total,
    json_agg(
        json_build_object(
            'id', ip.id,
            'quantidade', ip.quantidade,
            'preco_unitario', ip.preco_unitario,
            'id_item_cardapio', ip.id_item_cardapio,
            'itens_cardapio', json_build_object(
                'nome', ic.nome,
                'preco', ic.preco,
                'tempo_preparo', ic.tempo_preparo
            )
        )
    ) as itens_pedido
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE p.status IN ('disponivel', 'aceito', 'pronto_para_entrega', 'coletado', 'concluido')
GROUP BY p.id
ORDER BY p.criado_em DESC
LIMIT 5;

-- 4. Verificar se existem itens_pedido sem relacionamento com itens_cardapio
SELECT 
    ip.id,
    ip.id_pedido,
    ip.id_item_cardapio,
    ip.quantidade,
    CASE 
        WHEN ic.id IS NULL THEN '❌ Item do cardápio não encontrado'
        ELSE '✅ OK'
    END as status_relacionamento
FROM itens_pedido ip
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE ic.id IS NULL
LIMIT 10;

-- 5. Contar pedidos e seus itens
SELECT 
    p.numero_pedido,
    p.status,
    COUNT(ip.id) as total_itens,
    COUNT(ic.id) as itens_com_cardapio_valido
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE p.status IN ('disponivel', 'aceito')
GROUP BY p.id, p.numero_pedido, p.status
ORDER BY p.criado_em DESC
LIMIT 10;
