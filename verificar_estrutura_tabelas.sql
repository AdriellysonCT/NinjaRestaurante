-- Verificar estrutura das tabelas de complementos

-- 1. Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('complementos', 'grupos_complementos', 'grupos_complementos_itens', 'itens_complementos');

-- 2. Verificar colunas da tabela complementos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'complementos'
ORDER BY ordinal_position;

-- 3. Verificar colunas da tabela grupos_complementos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
ORDER BY ordinal_position;

-- 4. Verificar colunas da tabela grupos_complementos_itens
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grupos_complementos_itens'
ORDER BY ordinal_position;

-- 5. Verificar colunas da tabela itens_complementos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_complementos'
ORDER BY ordinal_position;

-- 6. Ver alguns registros de exemplo (se existirem)
SELECT * FROM complementos LIMIT 3;
SELECT * FROM grupos_complementos LIMIT 3;
