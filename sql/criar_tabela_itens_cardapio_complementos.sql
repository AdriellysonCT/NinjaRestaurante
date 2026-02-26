-- Criar tabela para armazenar quais complementos específicos estão disponíveis para cada item
-- Esta tabela define a relação: Item → Grupo → Complementos Específicos

CREATE TABLE IF NOT EXISTS itens_cardapio_complementos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_cardapio_id UUID NOT NULL,
    grupo_id UUID NOT NULL REFERENCES grupos_complementos(id) ON DELETE CASCADE,
    complemento_id UUID NOT NULL REFERENCES complementos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_cardapio_id, grupo_id, complemento_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_complementos_item 
    ON itens_cardapio_complementos(item_cardapio_id);

CREATE INDEX IF NOT EXISTS idx_itens_cardapio_complementos_grupo 
    ON itens_cardapio_complementos(grupo_id);

CREATE INDEX IF NOT EXISTS idx_itens_cardapio_complementos_complemento 
    ON itens_cardapio_complementos(complemento_id);

-- RLS (Row Level Security)
ALTER TABLE itens_cardapio_complementos ENABLE ROW LEVEL SECURITY;

-- Policy para permitir acesso baseado no restaurante
CREATE POLICY "Acesso a itens_cardapio_complementos"
    ON itens_cardapio_complementos FOR ALL
    USING (
        item_cardapio_id IN (
            SELECT id FROM itens_cardapio WHERE id_restaurante IN (
                SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
            )
        )
    );

-- Comentário
COMMENT ON TABLE itens_cardapio_complementos IS 
'Define quais complementos específicos de um grupo estão disponíveis para cada item do cardápio';

-- Verificar se foi criada
SELECT 
    'itens_cardapio_complementos' as tabela,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio_complementos'
  AND table_schema = 'public'
ORDER BY ordinal_position;
