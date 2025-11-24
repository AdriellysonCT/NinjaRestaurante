-- Ver todas as tabelas relacionadas a complementos

-- 1. Listar todas as tabelas que contêm "complement" no nome
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%complement%'
ORDER BY table_name;

-- 2. Estrutura da tabela complementos
SELECT 
    'complementos' as tabela,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'complementos'
ORDER BY ordinal_position;

-- 3. Estrutura da tabela grupos_complementos
SELECT 
    'grupos_complementos' as tabela,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
ORDER BY ordinal_position;

-- 4. Estrutura da tabela grupos_complementos_itens
SELECT 
    'grupos_complementos_itens' as tabela,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'grupos_complementos_itens'
ORDER BY ordinal_position;

-- 5. Estrutura da tabela item_complemento_grupo
SELECT 
    'item_complemento_grupo' as tabela,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'item_complemento_grupo'
ORDER BY ordinal_position;

-- 6. Ver foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('complementos', 'grupos_complementos', 'grupos_complementos_itens', 'item_complemento_grupo')
ORDER BY tc.table_name, kcu.column_name;
