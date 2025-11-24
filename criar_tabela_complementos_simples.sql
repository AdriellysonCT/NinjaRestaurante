-- Script simplificado para criar a tabela itens_cardapio_complementos
-- Execute este script no SQL Editor do Supabase

-- Criar a tabela
CREATE TABLE IF NOT EXISTS itens_cardapio_complementos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_cardapio_id UUID NOT NULL,
    grupo_id UUID NOT NULL,
    complemento_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_complementos_item 
    ON itens_cardapio_complementos(item_cardapio_id);

CREATE INDEX IF NOT EXISTS idx_itens_cardapio_complementos_grupo 
    ON itens_cardapio_complementos(grupo_id);

-- Criar constraint de unicidade
ALTER TABLE itens_cardapio_complementos 
    DROP CONSTRAINT IF EXISTS itens_cardapio_complementos_unique;

ALTER TABLE itens_cardapio_complementos 
    ADD CONSTRAINT itens_cardapio_complementos_unique 
    UNIQUE(item_cardapio_id, grupo_id, complemento_id);

-- Habilitar RLS
ALTER TABLE itens_cardapio_complementos ENABLE ROW LEVEL SECURITY;

-- Criar policy permissiva (ajustar depois se necessário)
DROP POLICY IF EXISTS "Permitir tudo em itens_cardapio_complementos" ON itens_cardapio_complementos;

CREATE POLICY "Permitir tudo em itens_cardapio_complementos"
    ON itens_cardapio_complementos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificar se foi criada
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio_complementos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar mensagem de sucesso
SELECT '✅ Tabela itens_cardapio_complementos criada com sucesso!' as status;
