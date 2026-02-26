-- Verificar se a tabela itens_cardapio existe e qual é o nome correto

-- 1. Listar todas as tabelas que contêm "item" ou "cardapio"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%item%' OR table_name LIKE '%cardapio%')
ORDER BY table_name;

-- 2. Ver estrutura da tabela de itens do cardápio
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name LIKE '%item%cardapio%'
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
