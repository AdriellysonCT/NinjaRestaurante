-- Script para verificar e ajustar as tabelas relacionadas ao endereço
-- Execute este script no painel SQL do Supabase

-- 1. Verificar estrutura da tabela restaurantes_app
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;

-- 2. Verificar se existem dados na tabela
SELECT COUNT(*) as total_restaurantes FROM restaurantes_app;

-- 3. Verificar estrutura da tabela configuracoes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'configuracoes'
ORDER BY ordinal_position;