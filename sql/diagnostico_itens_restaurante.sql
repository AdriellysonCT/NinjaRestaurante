-- ============================================
-- DIAGNÓSTICO: ITENS DE CARDÁPIO POR RESTAURANTE
-- ============================================

-- 1. LISTAR TODOS OS RESTAURANTES
SELECT 
    '1. Restaurantes cadastrados' as etapa,
    u.id as user_id,
    u.email,
    r.nome_restaurante,
    r.status_ativo,
    r.criado_em
FROM auth.users u
LEFT JOIN restaurantes_app r ON r.user_id = u.id
ORDER BY r.criado_em DESC;

-- 2. VERIFICAR ESTRUTURA DA TABELA ITENS_CARDAPIO
SELECT 
    '2. Estrutura itens_cardapio' as etapa,
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CONTAR ITENS POR RESTAURANTE
SELECT 
    '3. Itens por restaurante' as etapa,
    ic.id_restaurante,
    r.nome_restaurante,
    u.email,
    COUNT(*) as total_itens,
    COUNT(CASE WHEN ic.disponivel THEN 1 END) as itens_disponiveis,
    COUNT(CASE WHEN NOT ic.disponivel THEN 1 END) as itens_indisponiveis
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
LEFT JOIN auth.users u ON u.id = ic.id_restaurante
GROUP BY ic.id_restaurante, r.nome_restaurante, u.email
ORDER BY total_itens DESC;

-- 4. LISTAR TODOS OS ITENS COM SEUS RESTAURANTES
SELECT 
    '4. Todos os itens' as etapa,
    ic.id,
    ic.nome as item_nome,
    ic.categoria,
    ic.preco,
    ic.disponivel,
    ic.id_restaurante,
    r.nome_restaurante,
    u.email as restaurante_email
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
LEFT JOIN auth.users u ON u.id = ic.id_restaurante
ORDER BY r.nome_restaurante, ic.categoria, ic.nome;

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
    '5. Políticas RLS' as etapa,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY policyname;

-- 6. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    '6. Status RLS' as etapa,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'itens_cardapio';

-- 7. VERIFICAR ITENS SEM RESTAURANTE_ID
SELECT 
    '7. Itens órfãos' as etapa,
    id,
    nome,
    categoria,
    preco,
    id_restaurante
FROM itens_cardapio
WHERE id_restaurante IS NULL;

-- 8. TESTE: Simular consulta como usuário específico
-- (Substitua o UUID pelo ID do restaurante que você quer testar)
SELECT 
    '8. Teste de acesso' as etapa,
    'Execute este SELECT com o UUID do seu restaurante' as instrucao;

-- Exemplo de teste (descomente e substitua o UUID):
-- SELECT 
--     id,
--     nome,
--     categoria,
--     preco,
--     disponivel
-- FROM itens_cardapio
-- WHERE id_restaurante = 'SEU-UUID-AQUI';

-- 9. VERIFICAR SE EXISTEM DUPLICATAS
SELECT 
    '9. Possíveis duplicatas' as etapa,
    nome,
    categoria,
    preco,
    COUNT(*) as quantidade,
    STRING_AGG(DISTINCT id_restaurante::text, ', ') as restaurantes
FROM itens_cardapio
GROUP BY nome, categoria, preco
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

SELECT '✅ Diagnóstico concluído!' as status;
