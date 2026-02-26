-- ============================================
-- SISTEMA DE COMPLEMENTOS - FOME NINJA
-- ============================================
-- Este script cria as tabelas necessárias para o módulo de complementos
-- Permite criar complementos, grupos e associá-los aos itens do cardápio

-- Tabela de Complementos
CREATE TABLE IF NOT EXISTS complementos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
    imagem TEXT,
    disponivel BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Grupos de Complementos
CREATE TABLE IF NOT EXISTS grupos_complementos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo_selecao VARCHAR(20) NOT NULL CHECK (tipo_selecao IN ('single', 'multiple')),
    obrigatorio BOOLEAN DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Relacionamento: Complementos <-> Grupos
CREATE TABLE IF NOT EXISTS complementos_grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complemento_id UUID NOT NULL REFERENCES complementos(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos_complementos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(complemento_id, grupo_id)
);

-- Tabela de Relacionamento: Itens do Cardápio <-> Grupos de Complementos
CREATE TABLE IF NOT EXISTS itens_cardapio_grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_cardapio_id UUID NOT NULL REFERENCES itens_cardapio(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos_complementos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_cardapio_id, grupo_id)
);

-- Tabela de Relacionamento: Itens do Cardápio <-> Grupos <-> Complementos Selecionados
-- Esta tabela define quais complementos específicos de um grupo estão disponíveis para um item
CREATE TABLE IF NOT EXISTS itens_cardapio_complementos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_cardapio_id UUID NOT NULL REFERENCES itens_cardapio(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos_complementos(id) ON DELETE CASCADE,
    complemento_id UUID NOT NULL REFERENCES complementos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_cardapio_id, grupo_id, complemento_id)
);

-- Tabela para armazenar complementos selecionados em pedidos
CREATE TABLE IF NOT EXISTS pedidos_complementos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_pedido_id UUID NOT NULL, -- Referência ao item do pedido
    complemento_id UUID NOT NULL REFERENCES complementos(id) ON DELETE RESTRICT,
    quantidade INTEGER DEFAULT 1,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_complementos_restaurante ON complementos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_complementos_disponivel ON complementos(disponivel);
CREATE INDEX IF NOT EXISTS idx_grupos_restaurante ON grupos_complementos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_complementos_grupos_complemento ON complementos_grupos(complemento_id);
CREATE INDEX IF NOT EXISTS idx_complementos_grupos_grupo ON complementos_grupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_grupos_item ON itens_cardapio_grupos(item_cardapio_id);
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_grupos_grupo ON itens_cardapio_grupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_complementos_item ON itens_cardapio_complementos(item_cardapio_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_complementos_item ON pedidos_complementos(item_pedido_id);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp_complementos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_complementos
    BEFORE UPDATE ON complementos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_complementos();

CREATE TRIGGER trigger_atualizar_grupos_complementos
    BEFORE UPDATE ON grupos_complementos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_complementos();

-- RLS (Row Level Security) Policies
ALTER TABLE complementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_complementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE complementos_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_cardapio_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_cardapio_complementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_complementos ENABLE ROW LEVEL SECURITY;

-- Policies para Complementos
CREATE POLICY "Restaurantes podem ver seus complementos"
    ON complementos FOR SELECT
    USING (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

CREATE POLICY "Restaurantes podem inserir complementos"
    ON complementos FOR INSERT
    WITH CHECK (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

CREATE POLICY "Restaurantes podem atualizar seus complementos"
    ON complementos FOR UPDATE
    USING (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

CREATE POLICY "Restaurantes podem deletar seus complementos"
    ON complementos FOR DELETE
    USING (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

-- Policies para Grupos de Complementos
CREATE POLICY "Restaurantes podem ver seus grupos"
    ON grupos_complementos FOR SELECT
    USING (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

CREATE POLICY "Restaurantes podem inserir grupos"
    ON grupos_complementos FOR INSERT
    WITH CHECK (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

CREATE POLICY "Restaurantes podem atualizar seus grupos"
    ON grupos_complementos FOR UPDATE
    USING (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

CREATE POLICY "Restaurantes podem deletar seus grupos"
    ON grupos_complementos FOR DELETE
    USING (restaurante_id IN (
        SELECT id FROM restaurantes WHERE user_id = auth.uid()
    ));

-- Policies para relacionamentos (acesso baseado no restaurante)
CREATE POLICY "Acesso a complementos_grupos"
    ON complementos_grupos FOR ALL
    USING (
        complemento_id IN (
            SELECT id FROM complementos WHERE restaurante_id IN (
                SELECT id FROM restaurantes WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Acesso a itens_cardapio_grupos"
    ON itens_cardapio_grupos FOR ALL
    USING (
        item_cardapio_id IN (
            SELECT id FROM itens_cardapio WHERE restaurante_id IN (
                SELECT id FROM restaurantes WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Acesso a itens_cardapio_complementos"
    ON itens_cardapio_complementos FOR ALL
    USING (
        item_cardapio_id IN (
            SELECT id FROM itens_cardapio WHERE restaurante_id IN (
                SELECT id FROM restaurantes WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Acesso a pedidos_complementos"
    ON pedidos_complementos FOR ALL
    USING (true); -- Ajustar conforme lógica de pedidos

-- Comentários nas tabelas
COMMENT ON TABLE complementos IS 'Armazena os complementos disponíveis (ex: Cheddar Extra, Bacon, Molhos)';
COMMENT ON TABLE grupos_complementos IS 'Grupos de complementos (ex: Molhos, Adicionais, Bordas)';
COMMENT ON TABLE complementos_grupos IS 'Relacionamento N:N entre complementos e grupos';
COMMENT ON TABLE itens_cardapio_grupos IS 'Define quais grupos estão disponíveis para cada item do cardápio';
COMMENT ON TABLE itens_cardapio_complementos IS 'Define quais complementos específicos de um grupo estão disponíveis para um item';
COMMENT ON TABLE pedidos_complementos IS 'Armazena os complementos selecionados em cada item de pedido';

-- Dados de exemplo (opcional - remover em produção)
-- INSERT INTO complementos (restaurante_id, nome, preco, disponivel) VALUES
-- ((SELECT id FROM restaurantes LIMIT 1), 'Cheddar Extra', 3.00, true),
-- ((SELECT id FROM restaurantes LIMIT 1), 'Bacon', 4.50, true),
-- ((SELECT id FROM restaurantes LIMIT 1), 'Molho Barbecue', 2.00, true);

-- INSERT INTO grupos_complementos (restaurante_id, nome, descricao, tipo_selecao, obrigatorio) VALUES
-- ((SELECT id FROM restaurantes LIMIT 1), 'Adicionais', 'Ingredientes extras para seu lanche', 'multiple', false),
-- ((SELECT id FROM restaurantes LIMIT 1), 'Molhos', 'Escolha seu molho favorito', 'single', false);
