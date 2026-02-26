-- Adicionar coluna 'disponivel' na tabela complementos

-- 1. Adicionar a coluna se não existir
ALTER TABLE complementos 
ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT true;

-- 2. Atualizar todos os registros existentes para disponível
UPDATE complementos 
SET disponivel = true 
WHERE disponivel IS NULL;

-- 3. Verificar se foi criada
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'complementos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Ver os dados atualizados
SELECT 
    id,
    nome,
    preco,
    disponivel,
    '✅ Coluna criada e dados atualizados!' as status
FROM complementos
ORDER BY nome;
