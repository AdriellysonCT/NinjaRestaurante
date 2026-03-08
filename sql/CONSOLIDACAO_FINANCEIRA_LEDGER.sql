-- 1. VIEW DE RESUMO FINANCEIRO DO RESTAURANTE
CREATE OR REPLACE VIEW view_resumo_financeiro_restaurante AS
SELECT
    conta_recebedora_id AS restaurante_id,
    COALESCE(SUM(CASE 
        WHEN tipo_lancamento = 'OBRIGACAO_RESTAURANTE' AND status = 'CONFIRMADO' THEN valor 
        -- 👉 CORREÇÃO: Subtrai PENDENTE para evitar duplo saque
        WHEN tipo_lancamento = 'PAGAMENTO_RESTAURANTE' AND status IN ('PENDENTE', 'CONFIRMADO') THEN -valor
        ELSE 0 
    END), 0) AS saldo_disponivel,
    COALESCE(SUM(CASE WHEN tipo_lancamento = 'OBRIGACAO_RESTAURANTE' AND status = 'CONFIRMADO' THEN valor ELSE 0 END), 0) AS total_vendido,
    COALESCE(SUM(CASE WHEN tipo_lancamento = 'PAGAMENTO_RESTAURANTE' AND status = 'CONFIRMADO' THEN valor ELSE 0 END), 0) AS total_repassado,
    COALESCE(SUM(CASE WHEN tipo_lancamento = 'TAXA_PLATAFORMA' AND status = 'CONFIRMADO' THEN valor ELSE 0 END), 0) AS total_taxas
FROM
    ledger_lancamentos
GROUP BY
    conta_recebedora_id;

-- 2. VIEW DE EXTRATO DETALHADO (TODOS OS LANÇAMENTOS)
CREATE OR REPLACE VIEW view_extrato_restaurante AS
SELECT
    id,
    conta_recebedora_id,
    tipo_lancamento,
    natureza,
    valor,
    status,
    referencia_id,
    criado_em
FROM
    ledger_lancamentos
ORDER BY
    criado_em DESC;

-- 3. ÍNDICE DE UNICIDADE ROBUSTO
DROP INDEX IF EXISTS idx_ledger_obrigacao_restaurante_unica;
CREATE UNIQUE INDEX idx_ledger_obrigacao_restaurante_unica 
ON ledger_lancamentos (referencia_id, tipo_lancamento) 
WHERE (tipo_lancamento = 'OBRIGACAO_RESTAURANTE');

-- 4. FUNÇÃO RPC PARA PROCESSAMENTO ATÔMICO
-- 👉 Garante que Pedido + Ledger rodem em uma ÚNICA TRANSAÇÃO (BEGIN...COMMIT)
CREATE OR REPLACE FUNCTION processar_confirmacao_pagamento(
    p_pedido_id UUID
) RETURNS VOID AS $$
DECLARE
    v_id_restaurante UUID;
    v_id_entregador UUID;
    v_valor_total NUMERIC;
    v_taxa_entrega NUMERIC;
    v_valor_produtos NUMERIC;
    v_taxa_plataforma NUMERIC;
    v_valor_liquido NUMERIC;
BEGIN
    -- Obter dados do pedido
    SELECT id_restaurante, id_entregador, valor_total, taxa_entrega 
    INTO v_id_restaurante, v_id_entregador, v_valor_total, v_taxa_entrega
    FROM pedidos_padronizados
    WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado';
    END IF;

    -- Cálculos (Regra: 5% sobre produtos)
    v_valor_produtos := v_valor_total - COALESCE(v_taxa_entrega, 0);
    v_taxa_plataforma := v_valor_produtos * 0.05;
    v_valor_liquido := v_valor_produtos - v_taxa_plataforma;

    -- INSERSÕES NO LEDGER (O transaction manager do Postgres garante o COMMIT final)
    
    -- 1. Entrada total
    INSERT INTO ledger_lancamentos (conta_recebedora_id, tipo_lancamento, natureza, valor, status, referencia_id, criado_em)
    VALUES (v_id_restaurante, 'ENTRADA_PAGAMENTO_CLIENTE', 'CREDITO', v_valor_total, 'CONFIRMADO', p_pedido_id, NOW());

    -- 2. Taxa Plataforma
    INSERT INTO ledger_lancamentos (conta_recebedora_id, tipo_lancamento, natureza, valor, status, referencia_id, criado_em)
    VALUES ('PLATAFORMA', 'TAXA_PLATAFORMA', 'CREDITO', v_taxa_plataforma, 'CONFIRMADO', p_pedido_id, NOW());

    -- 3. Obrigação Restaurante (SALDO DISPONÍVEL)
    INSERT INTO ledger_lancamentos (conta_recebedora_id, tipo_lancamento, natureza, valor, status, referencia_id, criado_em)
    VALUES (v_id_restaurante, 'OBRIGACAO_RESTAURANTE', 'CREDITO', v_valor_liquido, 'CONFIRMADO', p_pedido_id, NOW());

    -- 4. Taxa de Entrega (Se houver entregador)
    IF v_taxa_entrega > 0 THEN
        INSERT INTO ledger_lancamentos (conta_recebedora_id, tipo_lancamento, natureza, valor, status, referencia_id, criado_em)
        VALUES (COALESCE(v_id_entregador, 'AGUARDANDO_ENTREGADOR'), 'OBRIGACAO_ENTREGADOR', 'CREDITO', v_taxa_entrega, 'CONFIRMADO', p_pedido_id, NOW());
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO RPC PARA SOLICITAR REPASSE (SAQUE)
-- 👉 Garante que o restaurante só saque o próprio saldo e isolamento de banco de dados
CREATE OR REPLACE FUNCTION solicitar_repasse_ledger(
    p_restaurante_id UUID,
    p_valor NUMERIC
) RETURNS UUID AS $$
DECLARE
    v_saldo_atual NUMERIC;
    v_lancamento_id UUID;
BEGIN
    -- Calcular saldo disponível no momento (via View)
    SELECT saldo_disponivel INTO v_saldo_atual
    FROM view_resumo_financeiro_restaurante
    WHERE restaurante_id = p_restaurante_id;

    IF v_saldo_atual IS NULL OR v_saldo_atual < p_valor THEN
        RAISE EXCEPTION 'Saldo insuficiente para saque. Disponível: %, Solicitado: %', COALESCE(v_saldo_atual, 0), p_valor;
    END IF;

    -- Inserir o débito pendente no Ledger
    INSERT INTO ledger_lancamentos (
        conta_recebedora_id, 
        tipo_lancamento, 
        natureza, 
        status, 
        valor, 
        referencia_id, 
        criado_em
    ) VALUES (
        p_restaurante_id,
        'PAGAMENTO_RESTAURANTE',
        'DEBITO',
        'PENDENTE',
        p_valor,
        'SAQUE_' || EXTRACT(EPOCH FROM NOW())::TEXT,
        NOW()
    ) RETURNING id INTO v_lancamento_id;

    RETURN v_lancamento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
