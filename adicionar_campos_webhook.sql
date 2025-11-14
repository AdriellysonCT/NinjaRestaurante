-- ============================================
-- Script: Adicionar Campos para Integração Webhook
-- Descrição: Adiciona campos necessários para integração com InfinitePay
-- ============================================

-- Adicionar campos na tabela pedidos_padronizados (se não existirem)
DO $$ 
BEGIN
    -- Campo para ID da transação (InfinitePay)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos_padronizados' 
        AND column_name = 'transacao_id'
    ) THEN
        ALTER TABLE pedidos_padronizados 
        ADD COLUMN transacao_id TEXT UNIQUE;
        
        CREATE INDEX idx_pedidos_transacao_id ON pedidos_padronizados(transacao_id);
        COMMENT ON COLUMN pedidos_padronizados.transacao_id IS 'ID da transação de pagamento (InfinitePay)';
    END IF;

    -- Campo para data de pagamento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos_padronizados' 
        AND column_name = 'pago_em'
    ) THEN
        ALTER TABLE pedidos_padronizados 
        ADD COLUMN pago_em TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN pedidos_padronizados.pago_em IS 'Data e hora em que o pagamento foi confirmado';
    END IF;

    -- Campo para motivo de estorno
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos_padronizados' 
        AND column_name = 'motivo_estorno'
    ) THEN
        ALTER TABLE pedidos_padronizados 
        ADD COLUMN motivo_estorno TEXT;
        
        COMMENT ON COLUMN pedidos_padronizados.motivo_estorno IS 'Motivo do estorno do pagamento';
    END IF;

    -- Campo para data de estorno
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos_padronizados' 
        AND column_name = 'estornado_em'
    ) THEN
        ALTER TABLE pedidos_padronizados 
        ADD COLUMN estornado_em TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN pedidos_padronizados.estornado_em IS 'Data e hora do estorno';
    END IF;

    -- Campo para endereço de entrega (se não existir)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos_padronizados' 
        AND column_name = 'endereco_entrega'
    ) THEN
        ALTER TABLE pedidos_padronizados 
        ADD COLUMN endereco_entrega JSONB;
        
        COMMENT ON COLUMN pedidos_padronizados.endereco_entrega IS 'Endereço completo de entrega (JSON)';
    END IF;

    -- Campo para nome do cliente (se não existir)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos_padronizados' 
        AND column_name = 'nome_cliente'
    ) THEN
        ALTER TABLE pedidos_padronizados 
        ADD COLUMN nome_cliente TEXT;
        
        COMMENT ON COLUMN pedidos_padronizados.nome_cliente IS 'Nome do cliente para exibição rápida';
    END IF;

END $$;

-- Criar constraint para validar status_pagamento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_status_pagamento_valido'
    ) THEN
        ALTER TABLE pedidos_padronizados
        ADD CONSTRAINT check_status_pagamento_valido
        CHECK (status_pagamento IN ('pago', 'pendente', 'estornado', 'cancelado'));
    END IF;
END $$;

-- Criar índice composto para queries de painel do restaurante
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante_status_pagamento 
ON pedidos_padronizados(id_restaurante, status_pagamento, status);

-- Comentários adicionais
COMMENT ON COLUMN pedidos_padronizados.status_pagamento IS 'Status do pagamento: pago (aprovado), pendente (dinheiro), estornado (reembolsado), cancelado';
COMMENT ON COLUMN pedidos_padronizados.pagamento_recebido_pelo_sistema IS 'Indica se o pagamento foi processado pelo sistema de pagamento online';

-- Resultado
SELECT 'Campos adicionados com sucesso!' AS resultado;

