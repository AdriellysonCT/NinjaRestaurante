-- Script para adicionar as colunas faltantes na tabela itens_cardapio
-- Execute este script no painel SQL do Supabase

-- Adicionar coluna destaque
ALTER TABLE itens_cardapio 
ADD COLUMN destaque BOOLEAN DEFAULT FALSE;

-- Adicionar coluna tempo_preparo
ALTER TABLE itens_cardapio 
ADD COLUMN tempo_preparo INTEGER DEFAULT 0;

-- Adicionar coluna ingredientes
ALTER TABLE itens_cardapio 
ADD COLUMN ingredientes JSONB;

-- Verificar se as colunas foram adicionadas corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'itens_cardapio'
ORDER BY ordinal_position;