-- SCRIPT PARA O SUPABASE SQL EDITOR
-- Funções de Banco de Dados (RPC) para o App Garçom Ninja (Fase 3)
-- Isso permite que o PWA acesse os dados de forma super segura sem precisar de usuário Auth ou desativar o RLS do dono!

-- 1. LOGIN DO GARÇOM
CREATE OR REPLACE FUNCTION login_garcom_pwa(p_restaurante_id UUID, p_codigo TEXT, p_pin TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios de admin para ignorar o RLS de leitura
SET search_path = public
AS $$
DECLARE
    v_garcom_id UUID;
    v_nome TEXT;
BEGIN
    SELECT id, nome INTO v_garcom_id, v_nome
    FROM garcons
    WHERE id_restaurante = p_restaurante_id
      AND codigo_login = p_codigo
      AND pin = p_pin
      AND ativo = true;

    IF v_garcom_id IS NOT NULL THEN
        RETURN json_build_object('sucesso', true, 'id', v_garcom_id, 'nome', v_nome);
    ELSE
        RETURN json_build_object('sucesso', false, 'mensagem', 'Código ou PIN inválidos');
    END IF;
END;
$$;

-- 2. BUSCAR MESAS DO RESTAURANTE (PARA O GARÇOM VER)
CREATE OR REPLACE FUNCTION get_mesas_garcom(p_restaurante_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultado json;
BEGIN
    SELECT json_agg(row_to_json(m)) INTO v_resultado
    FROM (
        SELECT id, numero, status, capacidade, id_pedido, id_garcom_atual
        FROM mesas
        WHERE id_restaurante = p_restaurante_id
        ORDER BY numero ASC
    ) m;
    
    RETURN COALESCE(v_resultado, '[]');
END;
$$;

-- Comentários
COMMENT ON FUNCTION login_garcom_pwa IS 'Valida o acesso do Garçom no PWA Ninja';
COMMENT ON FUNCTION get_mesas_garcom IS 'Busca as mesas para o garçom exibir no salão (ignora RLS do Dash)';
