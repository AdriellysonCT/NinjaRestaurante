-- SCRIPT: FUNÇÕES DA COMANDA DO GARÇOM (FASE 3 - PARTE 2)

-- 3. BUSCAR PRODUTOS DO RESTAURANTE (PARA O GARÇOM ADICIONAR NA COMANDA)
CREATE OR REPLACE FUNCTION get_produtos_garcom(p_restaurante_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultado json;
BEGIN
    SELECT json_agg(row_to_json(p)) INTO v_resultado
    FROM (
        SELECT id, nome, descricao, preco, categoria, imagem_url
        FROM itens_cardapio
        WHERE id_restaurante = p_restaurante_id
          AND disponivel = true
        ORDER BY categoria, nome
    ) p;
    
    RETURN COALESCE(v_resultado, '[]');
END;
$$;

-- 4. VISUALIZAR A COMANDA DE UMA MESA (Inclui Pedido e Itens)
CREATE OR REPLACE FUNCTION get_comanda_mesa_garcom(p_pedido_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pedido json;
    v_itens json;
BEGIN
    IF p_pedido_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Tenta pegar os itens
    SELECT json_agg(row_to_json(i)) INTO v_itens
    FROM (
        SELECT ip.id, ip.quantidade, ip.preco_unitario, ip.preco_total, ip.observacao_item, ic.nome as nome_produto
        FROM itens_pedido ip
        JOIN itens_cardapio ic ON ip.id_item_cardapio = ic.id
        WHERE ip.id_pedido = p_pedido_id
        ORDER BY ip.id DESC
    ) i;

    -- Tenta pegar o cabeçalho do pedido
    SELECT row_to_json(p) INTO v_pedido
    FROM (
        SELECT id, status, valor_total, subtotal, criado_em, mesa_numero
        FROM pedidos_padronizados
        WHERE id = p_pedido_id
    ) p;

    RETURN json_build_object(
        'pedido', v_pedido,
        'itens', COALESCE(v_itens, '[]'::json)
    );
END;
$$;

-- 5. ABRIR MESA (Apenas marca como ocupada)
CREATE OR REPLACE FUNCTION abrir_mesa_garcom(p_mesa_id UUID, p_mesa_numero TEXT, p_restaurante_id UUID, p_garcom_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Atualizar a mesa (apenas marca status e garcom)
    UPDATE mesas
    SET 
        id_pedido = NULL, -- Removemos a necessidade de um pedido vinculado prematuro
        status = 'ocupada',
        id_garcom_atual = p_garcom_id,
        started_at = NOW()
    WHERE id = p_mesa_id AND id_restaurante = p_restaurante_id;

    RETURN json_build_object('sucesso', true, 'mesa_id', p_mesa_id);
END;
$$;

-- 6. ADICIONAR ITEM NA COMANDA (Apenas registra na itens_pedido se o pedido existir)
-- OBS: O PWA agora usa a tabela 'itens_mesa' via JS para maior isolamento
CREATE OR REPLACE FUNCTION adicionar_item_comanda_garcom(
    p_pedido_id UUID, 
    p_restaurante_id UUID, 
    p_produto_id UUID, 
    p_quantidade INT, 
    p_observacao TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_preco NUMERIC;
    v_preco_total NUMERIC;
    v_subtotal NUMERIC;
BEGIN
    -- Pegar o preço do produto
    SELECT preco INTO v_preco FROM itens_cardapio WHERE id = p_produto_id;
    v_preco_total := v_preco * p_quantidade;

    -- Registrar o item
    INSERT INTO itens_pedido (
        id_pedido,
        id_item_cardapio,
        quantidade,
        preco_unitario,
        preco_total,
        observacao_item,
        id_restaurante
    ) VALUES (
        p_pedido_id,
        p_produto_id,
        p_quantidade,
        v_preco,
        v_preco_total,
        p_observacao,
        p_restaurante_id
    );

    -- Recalcular total do pedido se houver um id_pedido
    IF p_pedido_id IS NOT NULL THEN
        SELECT SUM(COALESCE(preco_total, quantidade * preco_unitario)) INTO v_subtotal
        FROM itens_pedido WHERE id_pedido = p_pedido_id;

        -- Atualizar o pedido
        UPDATE pedidos_padronizados
        SET subtotal = COALESCE(v_subtotal, 0),
            valor_total = COALESCE(v_subtotal, 0)
        WHERE id = p_pedido_id;
    END IF;

    RETURN json_build_object('sucesso', true);
END;
$$;

-- 6. ADICIONAR ITEM NA COMANDA
CREATE OR REPLACE FUNCTION adicionar_item_comanda_garcom(
    p_pedido_id UUID, 
    p_restaurante_id UUID, 
    p_produto_id UUID, 
    p_quantidade INT, 
    p_observacao TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_preco NUMERIC;
    v_preco_total NUMERIC;
    v_subtotal NUMERIC;
BEGIN
    -- Pegar o preço do produto
    SELECT preco INTO v_preco FROM itens_cardapio WHERE id = p_produto_id;
    v_preco_total := v_preco * p_quantidade;

    -- Registrar o item
    INSERT INTO itens_pedido (
        id_pedido,
        id_item_cardapio,
        quantidade,
        preco_unitario,
        preco_total,
        observacao_item,
        id_restaurante
    ) VALUES (
        p_pedido_id,
        p_produto_id,
        p_quantidade,
        v_preco,
        v_preco_total,
        p_observacao,
        p_restaurante_id
    );

    -- Recalcular total do pedido
    SELECT SUM(COALESCE(preco_total, quantidade * preco_unitario)) INTO v_subtotal
    FROM itens_pedido WHERE id_pedido = p_pedido_id;

    -- Atualizar o pedido
    UPDATE pedidos_padronizados
    SET subtotal = COALESCE(v_subtotal, 0),
        valor_total = COALESCE(v_subtotal, 0)
    WHERE id = p_pedido_id;

    RETURN json_build_object('sucesso', true, 'novo_total', v_subtotal);
END;
$$;
