-- ============================================
-- TESTE: Verificar se a coluna 'secao' existe
-- ============================================

-- 1. Verificar se as colunas foram adicionadas
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_nulo
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
    AND column_name IN ('secao', 'descricao')
ORDER BY column_name;

-- 2. Se não retornar nada, execute o comando abaixo:
-- ALTER TABLE grupos_complementos ADD COLUMN IF NOT EXISTS secao VARCHAR(100);
-- ALTER TABLE grupos_complementos ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 3. Ver último grupo criado
SELECT 
    id,
    nome,
    secao,
    descricao,
    tipo_selecao,
    obrigatorio,
    criado_em
FROM grupos_complementos
ORDER BY criado_em DESC
LIMIT 5;
