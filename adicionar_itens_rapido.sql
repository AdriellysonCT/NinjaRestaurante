-- Script RÁPIDO para adicionar itens ao pedido #33
-- Execute este script completo de uma vez no SQL Editor

-- Este script pega automaticamente os IDs e adiciona 2 itens do cardápio

DO $$
DECLARE
    v_id_pedido UUID;
    v_id_restaurante UUID;
    v_id_item_1 UUID;
    v_id_item_2 UUID;
    v_preco_item_1 DECIMAL;
    v_preco_item_2 DECIMAL;
    v_nome_item_1 TEXT;
    v_nome_item_2 TEXT;
BEGIN
    -- Pegar ID do pedido #33
    SELECT id, id_restaurante INTO v_id_pedido, v_id_restaurante
    FROM pedidos_padronizados
    WHERE numero_pedido = 33;

    IF v_id_pedido IS NULL THEN
        RAISE EXCEPTION 'Pedido #33 não encontrado!';
    END IF;

    RAISE NOTICE 'Pedido encontrado: %', v_id_pedido;
    RAISE NOTICE 'Restaurante: %', v_id_restaurante;

    -- Pegar primeiro item do cardápio
    SELECT id, nome, preco INTO v_id_item_1, v_nome_item_1, v_preco_item_1
    FROM itens_cardapio
    WHERE id_restaurante = v_id_restaurante
      AND disponivel = true
    ORDER BY criado_em DESC
    LIMIT 1;

    -- Pegar segundo item do cardápio
    SELECT id, nome, preco INTO v_id_item_2, v_nome_item_2, v_preco_item_2
    FROM itens_cardapio
    WHERE id_restaurante = v_id_restaurante
      AND disponivel = true
      AND id != v_id_item_1
    ORDER BY criado_em DESC
    LIMIT 1;

    IF v_id_item_1 IS NULL THEN
        RAISE EXCEPTION 'Nenhum item disponível no cardápio!';
    END IF;

    RAISE NOTICE 'Item 1: % (R$ %)', v_nome_item_1, v_preco_item_1;
    
    IF v_id_item_2 IS NOT NULL THEN
        RAISE NOTICE 'Item 2: % (R$ %)', v_nome_item_2, v_preco_item_2;
    END IF;

    -- Adicionar primeiro item (quantidade 1)
    INSERT INTO itens_pedido (
        id_pedido,
        id_item_cardapio,
        quantidade,
        preco_unitario,
        preco_total,
        id_restaurante
    ) VALUES (
        v_id_pedido,
        v_id_item_1,
        1,
        v_preco_item_1,
        v_preco_item_1,
        v_id_restaurante
    );

    RAISE NOTICE '✅ Item 1 adicionado: 1x %', v_nome_item_1;

    -- Adicionar segundo item se existir (quantidade 2)
    IF v_id_item_2 IS NOT NULL THEN
        INSERT INTO itens_pedido (
            id_pedido,
            id_item_cardapio,
            quantidade,
            preco_unitario,
            preco_total,
            id_restaurante
        ) VALUES (
            v_id_pedido,
            v_id_item_2,
            2,
            v_preco_item_2,
            v_preco_item_2 * 2,
            v_id_restaurante
        );

        RAISE NOTICE '✅ Item 2 adicionado: 2x %', v_nome_item_2;
    END IF;

    -- Atualizar valor total do pedido
    UPDATE pedidos_padronizados
    SET 
        subtotal = v_preco_item_1 + COALESCE(v_preco_item_2 * 2, 0),
        valor_total = v_preco_item_1 + COALESCE(v_preco_item_2 * 2, 0)
    WHERE id = v_id_pedido;

    RAISE NOTICE '✅ Valor total atualizado';

    -- Mostrar resultado
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ ITENS ADICIONADOS COM SUCESSO!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

END $$;

-- Verificar resultado
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.valor_total,
    COUNT(ip.id) as total_itens,
    json_agg(
        json_build_object(
            'quantidade', ip.quantidade,
            'nome', ic.nome,
            'preco_unitario', ip.preco_unitario,
            'preco_total', ip.preco_total
        )
    ) as itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE p.numero_pedido = 33
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.valor_total;

-- ✅ Se aparecer os itens acima, RECARREGUE O PAINEL (F5)
