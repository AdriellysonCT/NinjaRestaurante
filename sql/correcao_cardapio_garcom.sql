-- CORRECAO FINAL COMANDAS PWA
-- Resolve o problema de itens não aparecerem buscando pelo ID de Auth ou ID da Tabela

-- 1. PRODUTOS DO CARDAPIO
CREATE OR REPLACE FUNCTION get_produtos_garcom(p_restaurante_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultado json;
    v_real_rest_id UUID;
BEGIN
    SELECT id INTO v_real_rest_id
    FROM restaurantes_app
    WHERE id = p_restaurante_id OR user_id = p_restaurante_id
    LIMIT 1;

    SELECT json_agg(row_to_json(p)) INTO v_resultado
    FROM (
        SELECT id, nome, descricao, preco, categoria, imagem_url
        FROM itens_cardapio
        WHERE (id_restaurante = v_real_rest_id OR id_restaurante = p_restaurante_id)
          AND disponivel = true
        ORDER BY categoria, nome
    ) p;
    
    RETURN COALESCE(v_resultado, '[]');
END;
$$;

-- 2. LISTAR MESAS
CREATE OR REPLACE FUNCTION get_mesas_garcom(p_restaurante_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultado json;
    v_real_rest_id UUID;
BEGIN
    SELECT id INTO v_real_rest_id
    FROM restaurantes_app
    WHERE id = p_restaurante_id OR user_id = p_restaurante_id
    LIMIT 1;

    SELECT json_agg(row_to_json(m)) INTO v_resultado
    FROM (
        SELECT id, numero, status, capacidade, id_pedido, id_garcom_atual
        FROM mesas
        WHERE (id_restaurante = v_real_rest_id OR id_restaurante = p_restaurante_id)
        ORDER BY numero ASC
    ) m;
    
    RETURN COALESCE(v_resultado, '[]');
END;
$$;

-- 3. ABRIR MESA
CREATE OR REPLACE FUNCTION abrir_mesa_garcom(p_restaurante_id UUID, p_mesa_id UUID, p_garcom_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pedido_id UUID;
    v_real_rest_id UUID;
    v_garcom_nome TEXT;
BEGIN
    -- Valida Restaurante
    SELECT id INTO v_real_rest_id
    FROM restaurantes_app
    WHERE id = p_restaurante_id OR user_id = p_restaurante_id
    LIMIT 1;

    -- Pega o Nome do Garçom
    SELECT nome INTO v_garcom_nome
    FROM garcons
    WHERE id = p_garcom_id;

    -- Cria o Pedido Novo vinculado à Mesa (Tipo SALAO)
    INSERT INTO pedidos_padronizados (
        restaurante_id,
        status, 
        total,
        origem,
        mesa_id,
        id_garcom,
        customer_name
    ) VALUES (
        COALESCE(v_real_rest_id, p_restaurante_id),
        'pendente', -- Começa zerado, esperando itens
        0.00,
        'SALAO', -- Marcador para aparecer diferente no Painel
        p_mesa_id,
        p_garcom_id,
        'Mesa (Aberto por ' || COALESCE(v_garcom_nome, 'Garçom') || ')'
    ) RETURNING id INTO v_pedido_id;

    -- Atualiza a Mesa para OCUPADA (Azul) e vincula o ID do pedido
    UPDATE mesas
    SET status = 'ocupada',
        id_pedido = v_pedido_id,
        id_garcom_atual = p_garcom_id
    WHERE id = p_mesa_id;

    RETURN json_build_object('sucesso', true, 'pedido_id', v_pedido_id);
END;
$$;
