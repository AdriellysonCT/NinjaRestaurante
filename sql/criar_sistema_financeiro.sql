-- Script para criar o sistema financeiro completo
-- Execute este script no painel SQL do Supabase

-- 1. Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    cor TEXT DEFAULT '#3B82F6', -- Cor para gráficos
    icone TEXT DEFAULT 'dollar-sign',
    ativa BOOLEAN DEFAULT TRUE,
    id_restaurante UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    categoria_id UUID REFERENCES categorias_financeiras(id),
    data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE, -- Para contas a pagar/receber
    status TEXT DEFAULT 'confirmada' CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
    forma_pagamento TEXT, -- dinheiro, cartao, pix, transferencia
    observacoes TEXT,
    anexo_url TEXT, -- Para comprovantes/notas fiscais
    recorrente BOOLEAN DEFAULT FALSE,
    frequencia_recorrencia TEXT, -- mensal, semanal, anual
    pedido_id UUID, -- Referência para vendas do POS
    id_restaurante UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de metas financeiras
CREATE TABLE IF NOT EXISTS metas_financeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'lucro')),
    valor_meta NUMERIC NOT NULL,
    periodo TEXT NOT NULL CHECK (periodo IN ('mensal', 'trimestral', 'anual')),
    mes_referencia INTEGER, -- 1-12
    ano_referencia INTEGER NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    id_restaurante UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    cnpj_cpf TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    categoria TEXT, -- alimenticios, bebidas, limpeza, equipamentos
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    id_restaurante UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de contas a pagar/receber
CREATE TABLE IF NOT EXISTS contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
    categoria_id UUID REFERENCES categorias_financeiras(id),
    fornecedor_id UUID REFERENCES fornecedores(id),
    forma_pagamento TEXT,
    observacoes TEXT,
    valor_pago NUMERIC, -- Pode ser diferente do valor original
    juros_multa NUMERIC DEFAULT 0,
    desconto NUMERIC DEFAULT 0,
    parcela_atual INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    recorrente BOOLEAN DEFAULT FALSE,
    id_restaurante UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_restaurante ON transacoes_financeiras(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_contas_vencimento ON contas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_status ON contas(status);
CREATE INDEX IF NOT EXISTS idx_contas_restaurante ON contas(id_restaurante);

-- 7. Triggers para atualização automática
CREATE OR REPLACE FUNCTION update_financeiro_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_financeiras_atualizado_em
    BEFORE UPDATE ON categorias_financeiras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_financeiro_atualizado_em();

CREATE TRIGGER update_transacoes_financeiras_atualizado_em
    BEFORE UPDATE ON transacoes_financeiras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_financeiro_atualizado_em();

CREATE TRIGGER update_metas_financeiras_atualizado_em
    BEFORE UPDATE ON metas_financeiras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_financeiro_atualizado_em();

CREATE TRIGGER update_fornecedores_atualizado_em
    BEFORE UPDATE ON fornecedores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_financeiro_atualizado_em();

CREATE TRIGGER update_contas_atualizado_em
    BEFORE UPDATE ON contas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_financeiro_atualizado_em();

-- 8. RLS (Row Level Security)
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias_financeiras
CREATE POLICY "Usuários podem gerenciar suas categorias" ON categorias_financeiras
    FOR ALL USING (auth.uid() = id_restaurante);

-- Políticas RLS para transacoes_financeiras
CREATE POLICY "Usuários podem gerenciar suas transações" ON transacoes_financeiras
    FOR ALL USING (auth.uid() = id_restaurante);

-- Políticas RLS para metas_financeiras
CREATE POLICY "Usuários podem gerenciar suas metas" ON metas_financeiras
    FOR ALL USING (auth.uid() = id_restaurante);

-- Políticas RLS para fornecedores
CREATE POLICY "Usuários podem gerenciar seus fornecedores" ON fornecedores
    FOR ALL USING (auth.uid() = id_restaurante);

-- Políticas RLS para contas
CREATE POLICY "Usuários podem gerenciar suas contas" ON contas
    FOR ALL USING (auth.uid() = id_restaurante);

-- 9. Inserir categorias padrão para novos restaurantes
INSERT INTO categorias_financeiras (nome, tipo, cor, icone, id_restaurante)
SELECT 
    categoria.nome,
    categoria.tipo,
    categoria.cor,
    categoria.icone,
    r.id
FROM restaurantes_app r
CROSS JOIN (
    VALUES 
    -- Entradas
    ('Vendas Balcão', 'entrada', '#10B981', 'cash-register'),
    ('Vendas Delivery', 'entrada', '#059669', 'truck'),
    ('Vendas Comandas', 'entrada', '#047857', 'clipboard-list'),
    ('Outras Receitas', 'entrada', '#065F46', 'plus-circle'),
    
    -- Saídas
    ('Ingredientes', 'saida', '#EF4444', 'shopping-cart'),
    ('Bebidas', 'saida', '#DC2626', 'coffee'),
    ('Funcionários', 'saida', '#B91C1C', 'users'),
    ('Aluguel', 'saida', '#991B1B', 'home'),
    ('Energia', 'saida', '#7F1D1D', 'zap'),
    ('Água', 'saida', '#7C2D12', 'droplets'),
    ('Internet/Telefone', 'saida', '#78350F', 'phone'),
    ('Marketing', 'saida', '#F59E0B', 'megaphone'),
    ('Equipamentos', 'saida', '#D97706', 'settings'),
    ('Limpeza', 'saida', '#B45309', 'spray-can'),
    ('Impostos', 'saida', '#92400E', 'file-text'),
    ('Outras Despesas', 'saida', '#78350F', 'minus-circle')
) AS categoria(nome, tipo, cor, icone)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_financeiras cf 
    WHERE cf.id_restaurante = r.id
);

-- 10. Função para calcular resumo financeiro
CREATE OR REPLACE FUNCTION calcular_resumo_financeiro(
    p_id_restaurante UUID,
    p_data_inicio DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_data_fim DATE DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'periodo', json_build_object(
            'inicio', p_data_inicio,
            'fim', p_data_fim
        ),
        'entradas', COALESCE(entradas.total, 0),
        'saidas', COALESCE(saidas.total, 0),
        'saldo', COALESCE(entradas.total, 0) - COALESCE(saidas.total, 0),
        'transacoes_count', COALESCE(entradas.count, 0) + COALESCE(saidas.count, 0),
        'por_categoria', json_build_object(
            'entradas', COALESCE(entradas.por_categoria, '[]'::json),
            'saidas', COALESCE(saidas.por_categoria, '[]'::json)
        )
    ) INTO resultado
    FROM (
        SELECT 
            SUM(valor) as total,
            COUNT(*) as count,
            json_agg(
                json_build_object(
                    'categoria', cf.nome,
                    'valor', categoria_total.valor,
                    'cor', cf.cor
                )
            ) as por_categoria
        FROM (
            SELECT 
                categoria_id,
                SUM(valor) as valor
            FROM transacoes_financeiras
            WHERE id_restaurante = p_id_restaurante
                AND tipo = 'entrada'
                AND data_transacao BETWEEN p_data_inicio AND p_data_fim
                AND status = 'confirmada'
            GROUP BY categoria_id
        ) categoria_total
        JOIN categorias_financeiras cf ON cf.id = categoria_total.categoria_id
    ) entradas
    FULL OUTER JOIN (
        SELECT 
            SUM(valor) as total,
            COUNT(*) as count,
            json_agg(
                json_build_object(
                    'categoria', cf.nome,
                    'valor', categoria_total.valor,
                    'cor', cf.cor
                )
            ) as por_categoria
        FROM (
            SELECT 
                categoria_id,
                SUM(valor) as valor
            FROM transacoes_financeiras
            WHERE id_restaurante = p_id_restaurante
                AND tipo = 'saida'
                AND data_transacao BETWEEN p_data_inicio AND p_data_fim
                AND status = 'confirmada'
            GROUP BY categoria_id
        ) categoria_total
        JOIN categorias_financeiras cf ON cf.id = categoria_total.categoria_id
    ) saidas ON true;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;