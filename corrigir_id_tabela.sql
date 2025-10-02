-- Script para corrigir o problema do ID na tabela itens_cardapio
-- Execute este script no painel SQL do Supabase

-- 1. Habilitar a extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Alterar a coluna id para ter DEFAULT uuid_generate_v4()
ALTER TABLE itens_cardapio 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Verificar se a alteração foi aplicada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'itens_cardapio' AND column_name = 'id';