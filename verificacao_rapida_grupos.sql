-- ============================================
-- VERIFICAÇÃO RÁPIDA: Grupos e Associações
-- ============================================

-- 1. Contar grupos
SELECT 
    'TOTAL DE GRUPOS' as info,
    COUNT(*) as quantidade
FROM grupos_complementos;

-- 2. Contar complementos
SELECT 
    'TOTAL DE COMPLEMENTOS' as info,
    COUNT(*) as quantidade
FROM complementos;

-- 3. Contar associações
SELECT 
    'TOTAL DE ASSOCIAÇÕES' as info,
    COUNT(*) as quantidade
FROM grupos_complementos_itens;

-- 4. Ver grupos com suas associações
SELECT 
    g.nome as grupo,
    COUNT(gci.id) as total_complementos,
    STRING_AGG(c.nome, ', ') as complementos
FROM grupos_complementos g
LEFT JOIN grupos_complementos_itens gci ON g.id = gci.id_grupo
LEFT JOIN complementos c ON gci.id_complemento = c.id
GROUP BY g.id, g.nome
ORDER BY g.nome;

-- 5. Se não houver associações, criar algumas de teste
-- DESCOMENTE AS LINHAS ABAIXO SE NECESSÁRIO:

/*
-- Associar todos os complementos ao primeiro grupo
INSERT INTO grupos_complementos_itens (id_grupo, id_complemento)
SELECT 
    (SELECT id FROM grupos_complementos LIMIT 1),
    id
FROM complementos
WHERE NOT EXISTS (
    SELECT 1 FROM grupos_complementos_itens 
    WHERE id_complemento = complementos.id
);
*/
