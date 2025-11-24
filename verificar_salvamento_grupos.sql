-- ============================================
-- VERIFICAÇÃO: Onde os grupos são salvos
-- ============================================
-- Execute este script para ver onde os grupos de complementos estão sendo salvos

-- 1. Ver todos os grupos criados
SELECT 
    'GRUPOS CRIADOS' as secao,
    id,
    id_restaurante,
    nome,
    tipo_selecao,
    obrigatorio,
    criado_em,
    atualizado_em
FROM grupos_complementos
ORDER BY criado_em DESC;

-- 2. Ver estrutura da tabela grupos_complementos
SELECT 
    'ESTRUTURA DA TABELA' as secao,
    column_name as coluna, 
    data_type as tipo, 
    is_nullable as permite_nulo,
    column_default as valor_padrao
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
ORDER BY ordinal_position;

-- 3. Ver último grupo criado com detalhes
SELECT 
    'ÚLTIMO GRUPO CRIADO' as secao,
    *
FROM grupos_complementos
ORDER BY criado_em DESC
LIMIT 1;

-- 4. Contar quantos grupos existem por restaurante
SELECT 
    'GRUPOS POR RESTAURANTE' as secao,
    id_restaurante,
    COUNT(*) as total_grupos,
    COUNT(CASE WHEN obrigatorio = true THEN 1 END) as grupos_obrigatorios,
    COUNT(CASE WHEN tipo_selecao = 'single' THEN 1 END) as selecao_unica,
    COUNT(CASE WHEN tipo_selecao = 'multiple' THEN 1 END) as selecao_multipla
FROM grupos_complementos
GROUP BY id_restaurante;

-- 5. Ver complementos associados aos grupos
SELECT 
    'COMPLEMENTOS POR GRUPO' as secao,
    g.nome as grupo,
    COUNT(gci.id) as total_complementos,
    STRING_AGG(c.nome, ', ') as complementos
FROM grupos_complementos g
LEFT JOIN grupos_complementos_itens gci ON g.id = gci.id_grupo
LEFT JOIN complementos c ON gci.id_complemento = c.id
GROUP BY g.id, g.nome
ORDER BY g.nome;

-- 6. Ver itens do cardápio que usam grupos
SELECT 
    'ITENS COM GRUPOS' as secao,
    ic.nome as item_cardapio,
    g.nome as grupo,
    g.tipo_selecao,
    g.obrigatorio,
    icg.ativo
FROM item_complemento_grupo icg
JOIN itens_cardapio ic ON icg.item_id = ic.id
JOIN grupos_complementos g ON icg.grupo_id = g.id
ORDER BY ic.nome, g.nome;
