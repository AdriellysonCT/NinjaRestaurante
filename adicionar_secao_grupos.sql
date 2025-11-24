-- ============================================
-- ADICIONAR CAMPO SEÇÃO AOS GRUPOS
-- ============================================
-- Este script adiciona o campo 'secao' para organizar os grupos de complementos

-- 1. Adicionar coluna 'secao' na tabela grupos_complementos
ALTER TABLE grupos_complementos 
ADD COLUMN IF NOT EXISTS secao VARCHAR(100);

-- 2. Adicionar coluna 'descricao' também (estava faltando)
ALTER TABLE grupos_complementos 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 3. Criar índice para melhorar performance de busca por seção
CREATE INDEX IF NOT EXISTS idx_grupos_complementos_secao 
ON grupos_complementos(secao);

-- 4. Adicionar comentário explicativo
COMMENT ON COLUMN grupos_complementos.secao IS 'Seção/categoria do grupo (ex: Bebidas, Lanches, Sobremesas)';
COMMENT ON COLUMN grupos_complementos.descricao IS 'Descrição detalhada do grupo de complementos';

-- 5. Atualizar grupos existentes com seção padrão (opcional)
UPDATE grupos_complementos 
SET secao = 'Geral' 
WHERE secao IS NULL;

-- 6. Verificar estrutura atualizada
SELECT 
    column_name as coluna, 
    data_type as tipo, 
    is_nullable as permite_nulo,
    column_default as valor_padrao
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
ORDER BY ordinal_position;

-- 7. Ver grupos com as novas colunas
SELECT 
    id,
    nome,
    secao,
    descricao,
    tipo_selecao,
    obrigatorio,
    criado_em
FROM grupos_complementos
ORDER BY secao, nome;
