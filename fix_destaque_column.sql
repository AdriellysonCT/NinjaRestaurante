-- Script para corrigir a coluna destaque na tabela itens_cardapio
-- Execute este script no painel SQL do Supabase se a tabela já existe mas está faltando a coluna

-- Verificar se a tabela existe e adicionar a coluna destaque se não existir
DO $$ 
BEGIN
    -- Adicionar coluna destaque se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_cardapio' 
        AND column_name = 'destaque'
    ) THEN
        ALTER TABLE itens_cardapio ADD COLUMN destaque BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Adicionar coluna tempo_preparo se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_cardapio' 
        AND column_name = 'tempo_preparo'
    ) THEN
        ALTER TABLE itens_cardapio ADD COLUMN tempo_preparo INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar coluna ingredientes se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_cardapio' 
        AND column_name = 'ingredientes'
    ) THEN
        ALTER TABLE itens_cardapio ADD COLUMN ingredientes JSONB;
    END IF;
END $$;

-- Verificar a estrutura da tabela após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'itens_cardapio'
ORDER BY ordinal_position;