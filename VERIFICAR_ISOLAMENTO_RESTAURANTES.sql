-- ============================================
-- VERIFICAÇÃO: ISOLAMENTO ENTRE RESTAURANTES
-- ============================================
-- Confirma que cada restaurante vê apenas seus próprios dados

-- 1. LISTAR TODOS OS RESTAURANTES
SELECT 
    '1️⃣ RESTAURANTES CADASTRADOS' as etapa,
    u.id,
    u.email,
    r.nome_restaurante,
    r.status_ativo
FROM auth.users u
LEFT JOIN restaurantes_app r ON r.user_id = u.id
WHERE r.id IS NOT NULL
ORDER BY r.criado_em DESC;

-- 2. CONTAR ITENS POR RESTAURANTE
SELECT 
    '2️⃣ DISTRIBUIÇÃO DE ITENS' as etapa,
    r.nome_restaurante,
    u.email,
    COUNT(ic.id) as total_itens,
    COUNT(CASE WHEN ic.disponivel THEN 1 END) as disponiveis,
    COUNT(CASE WHEN NOT ic.disponivel THEN 1 END) as indisponiveis
FROM restaurantes_app r
JOIN auth.users u ON u.id = r.user_id
LEFT JOIN itens_cardapio ic ON ic.id_restaurante = r.user_id
GROUP BY r.nome_restaurante, u.email
ORDER BY total_itens DESC;

-- 3. VERIFICAR POLÍTICAS ATIVAS
SELECT 
    '3️⃣ POLÍTICAS RLS ATIVAS' as etapa,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Leitura'
        WHEN cmd = 'INSERT' THEN '➕ Criação'
        WHEN cmd = 'UPDATE' THEN '✏️ Edição'
        WHEN cmd = 'DELETE' THEN '🗑️ Exclusão'
        ELSE cmd
    END as operacao,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ Filtrado por usuário'
        WHEN qual LIKE '%disponivel%' THEN '⚠️ PROBLEMA: Filtro público'
        ELSE '❓ Verificar filtro'
    END as status_filtro
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY cmd;

-- 4. DETECTAR POLÍTICAS PROBLEMÁTICAS
SELECT 
    '4️⃣ POLÍTICAS PROBLEMÁTICAS' as etapa,
    policyname,
    cmd,
    qual as filtro
FROM pg_policies
WHERE tablename = 'itens_cardapio'
  AND (
    qual NOT LIKE '%auth.uid()%'  -- Não filtra por usuário
    OR qual LIKE '%disponivel%'    -- Permite leitura pública
  )
  AND cmd = 'SELECT';  -- Foco em SELECT que causa vazamento

-- 5. SIMULAR ACESSO DE CADA RESTAURANTE
WITH restaurantes AS (
    SELECT 
        r.user_id,
        r.nome_restaurante,
        u.email
    FROM restaurantes_app r
    JOIN auth.users u ON u.id = r.user_id
    WHERE r.status_ativo = true
    LIMIT 5
)
SELECT 
    '5️⃣ SIMULAÇÃO DE ACESSO' as etapa,
    rest.nome_restaurante,
    rest.email,
    COUNT(ic.id) as itens_que_ve,
    COUNT(CASE WHEN ic.id_restaurante = rest.user_id THEN 1 END) as itens_proprios,
    COUNT(CASE WHEN ic.id_restaurante != rest.user_id THEN 1 END) as itens_de_outros,
    CASE 
        WHEN COUNT(CASE WHEN ic.id_restaurante != rest.user_id THEN 1 END) > 0 
        THEN '❌ VAZAMENTO DETECTADO!'
        ELSE '✅ Isolamento OK'
    END as status
FROM restaurantes rest
LEFT JOIN itens_cardapio ic ON ic.id_restaurante = rest.user_id
GROUP BY rest.nome_restaurante, rest.email, rest.user_id;

-- 6. LISTAR EXEMPLOS DE ITENS POR RESTAURANTE
SELECT 
    '6️⃣ AMOSTRA DE ITENS' as etapa,
    r.nome_restaurante,
    ic.nome as item_nome,
    ic.categoria,
    ic.preco,
    ic.disponivel,
    CASE 
        WHEN ic.id_restaurante = r.user_id THEN '✅ Próprio'
        ELSE '❌ De outro restaurante'
    END as propriedade
FROM itens_cardapio ic
JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
ORDER BY r.nome_restaurante, ic.categoria, ic.nome
LIMIT 20;

-- 7. VERIFICAR STATUS DO RLS
SELECT 
    '7️⃣ STATUS RLS' as etapa,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS Desabilitado'
    END as status
FROM pg_tables
WHERE tablename = 'itens_cardapio';

-- 8. RESUMO FINAL
SELECT 
    '8️⃣ RESUMO' as etapa,
    (SELECT COUNT(*) FROM restaurantes_app WHERE status_ativo = true) as total_restaurantes,
    (SELECT COUNT(*) FROM itens_cardapio) as total_itens,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'itens_cardapio') as total_politicas,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'itens_cardapio' 
     AND qual LIKE '%auth.uid()%') as politicas_seguras,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies 
              WHERE tablename = 'itens_cardapio' 
              AND cmd = 'SELECT'
              AND qual NOT LIKE '%auth.uid()%') > 0
        THEN '❌ PROBLEMA: Há políticas vazando dados'
        ELSE '✅ SEGURO: Todas as políticas filtram por usuário'
    END as diagnostico;

SELECT '
╔════════════════════════════════════════════════════════════╗
║  VERIFICAÇÃO CONCLUÍDA                                     ║
║                                                            ║
║  Se aparecer "VAZAMENTO DETECTADO" ou "PROBLEMA",        ║
║  execute o script LIMPAR_RLS_ITENS_CARDAPIO.sql          ║
║                                                            ║
║  Se tudo estiver "OK" e "SEGURO", o problema está        ║
║  resolvido! ✅                                            ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
