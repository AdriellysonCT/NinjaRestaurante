-- ============================================
-- DIAGNÓSTICO: Grupos e Complementos
-- ============================================

-- 1. Ver todos os grupos criados
SELECT 
    'GRUPOS CRIADOS' as secao,
    id,
    nome,
    secao,
    tipo_selecao,
    obrigatorio,
    criado_em
FROM grupos_complementos
ORDER BY criado_em DESC;

-- 2. Ver todos os complementos criados
SELECT 
    'COMPLEMENTOS CRIADOS' as secao,
    id,
    nome,
    preco,
    status,
    criado_em
FROM complementos
ORDER BY criado_em DESC;

-- 3. Ver associações entre complementos e grupos
SELECT 
    'ASSOCIAÇÕES COMPLEMENTO-GRUPO' as secao,
    gci.id,
    g.nome as grupo,
    c.nome as complemento,
    c.preco,
    gci.criado_em
FROM grupos_complementos_itens gci
JOIN grupos_complementos g ON gci.id_grupo = g.id
JOIN complementos c ON gci.id_complemento = c.id
ORDER BY g.nome, c.nome;

-- 4. Ver grupos SEM complementos associados
SELECT 
    'GRUPOS SEM COMPLEMENTOS' as secao,
    g.id,
    g.nome as grupo,
    g.tipo_selecao,
    g.obrigatorio
FROM grupos_complementos g
LEFT JOIN grupos_complementos_itens gci ON g.id = gci.id_grupo
WHERE gci.id IS NULL
ORDER BY g.nome;

-- 5. Ver complementos SEM grupos associados
SELECT 
    'COMPLEMENTOS SEM GRUPOS' as secao,
    c.id,
    c.nome as complemento,
    c.preco,
    c.status
FROM complementos c
LEFT JOIN grupos_complementos_itens gci ON c.id = gci.id_complemento
WHERE gci.id IS NULL
ORDER BY c.nome;

-- 6. Contar associações por grupo
SELECT 
    'CONTAGEM POR GRUPO' as secao,
    g.nome as grupo,
    COUNT(gci.id) as total_complementos
FROM grupos_complementos g
LEFT JOIN grupos_complementos_itens gci ON g.id = gci.id_grupo
GROUP BY g.id, g.nome
ORDER BY total_complementos DESC, g.nome;

-- 7. Ver estrutura da tabela de associações
SELECT 
    'ESTRUTURA TABELA ASSOCIAÇÕES' as secao,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_nulo
FROM information_schema.columns
WHERE table_name = 'grupos_complementos_itens'
ORDER BY ordinal_position;
