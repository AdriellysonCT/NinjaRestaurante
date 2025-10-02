-- Script para verificar a estrutura completa da tabela itens_cardapio
-- Execute este script no painel SQL do Supabase

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'itens_cardapio'
ORDER BY ordinal_position;

-- Verificar se a extensão uuid-ossp está habilitada
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Verificar constraints da tabela
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'itens_cardapio';