-- Verificar estrutura real das tabelas de complementos

-- 1. Verificar colunas da tabela complementos
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'complementos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar colunas da tabela grupos_complementos
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar colunas da tabela complementos_grupos
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'complementos_grupos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar colunas da tabela itens_cardapio_grupos
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio_grupos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Listar todas as tabelas que contêm "complement" ou "grupo"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%complement%' OR table_name LIKE '%grupo%')
ORDER BY table_name;
