-- Verificar estrutura da tabela itens_complementos (ou similar)

-- 1. Listar todas as tabelas que contêm "item" e "complement"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%item%complement%' OR table_name LIKE '%complement%item%')
ORDER BY table_name;

-- 2. Ver estrutura da tabela itens_cardapio_complementos (se existir)
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio_complementos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver dados da tabela item_complemento_grupo
SELECT * FROM item_complemento_grupo LIMIT 10;

-- 4. Ver dados da tabela itens_cardapio_complementos (se existir)
SELECT * FROM itens_cardapio_complementos LIMIT 10;

-- 5. Ver estrutura completa de todas as tabelas de relacionamento
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND (t.table_name LIKE '%item%' AND t.table_name LIKE '%complement%')
ORDER BY t.table_name, c.ordinal_position;
