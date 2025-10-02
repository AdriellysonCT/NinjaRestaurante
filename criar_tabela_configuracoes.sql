-- Script para criar a tabela configuracoes (settings em português)
-- Execute este script no painel SQL do Supabase

-- 1. Criar a tabela configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_restaurante TEXT,
    endereco TEXT,
    telefone TEXT,
    horarios_funcionamento JSONB, -- Ex: {"segunda": {"abertura": "08:00", "fechamento": "22:00"}}
    configuracoes_entrega JSONB,   -- Ex: {"taxa_entrega": 5.00, "raio_entrega": 10, "tempo_minimo": 30}
    configuracoes_notificacao JSONB, -- Ex: {"email": true, "sms": false, "push": true}
    formas_pagamento JSONB,        -- Ex: ["dinheiro", "cartao_credito", "pix", "vale_refeicao"]
    logo_url TEXT,                 -- URL do logo do restaurante
    cor_tema TEXT DEFAULT '#ff6b35', -- Cor principal do tema
    taxa_servico NUMERIC DEFAULT 0, -- Taxa de serviço (%)
    pedido_minimo NUMERIC DEFAULT 0, -- Valor mínimo do pedido
    tempo_preparo_padrao INTEGER DEFAULT 30, -- Tempo padrão de preparo (minutos)
    aceita_agendamento BOOLEAN DEFAULT FALSE, -- Se aceita pedidos agendados
    observacoes_gerais TEXT,       -- Observações gerais do restaurante
    ativo BOOLEAN DEFAULT TRUE,    -- Se o restaurante está ativo
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    id_restaurante UUID NOT NULL REFERENCES restaurantes_app(id) ON DELETE CASCADE
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_restaurante ON configuracoes(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_configuracoes_ativo ON configuracoes(ativo);

-- 3. Criar trigger para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_configuracoes_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_atualizado_em_trigger
    BEFORE UPDATE ON configuracoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_configuracoes_atualizado_em();

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para configuracoes
CREATE POLICY "Restaurantes podem ver suas próprias configurações" ON configuracoes
    FOR SELECT USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem inserir suas próprias configurações" ON configuracoes
    FOR INSERT WITH CHECK (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem atualizar suas próprias configurações" ON configuracoes
    FOR UPDATE USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem deletar suas próprias configurações" ON configuracoes
    FOR DELETE USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

-- 5. Inserir configurações padrão para restaurantes existentes
INSERT INTO configuracoes (
    nome_restaurante,
    endereco,
    telefone,
    horarios_funcionamento,
    configuracoes_entrega,
    formas_pagamento,
    id_restaurante
)
SELECT 
    r.nome_fantasia,
    'Endereço não informado',
    r.telefone,
    '{"segunda": {"abertura": "08:00", "fechamento": "22:00"}, "terca": {"abertura": "08:00", "fechamento": "22:00"}, "quarta": {"abertura": "08:00", "fechamento": "22:00"}, "quinta": {"abertura": "08:00", "fechamento": "22:00"}, "sexta": {"abertura": "08:00", "fechamento": "22:00"}, "sabado": {"abertura": "08:00", "fechamento": "22:00"}, "domingo": {"fechado": true}}'::jsonb,
    '{"taxa_entrega": 5.00, "raio_entrega": 10, "tempo_minimo": 30, "tempo_maximo": 60}'::jsonb,
    '["dinheiro", "cartao_credito", "cartao_debito", "pix"]'::jsonb,
    r.id
FROM restaurantes_app r
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes c WHERE c.id_restaurante = r.id
);

-- 6. Verificar se a tabela foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'configuracoes'
ORDER BY ordinal_position;