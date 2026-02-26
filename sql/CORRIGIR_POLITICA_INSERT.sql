-- ============================================
-- CORREÇÃO: Política INSERT de itens_cardapio
-- ============================================
-- Problema: rls_itens_insert não usa auth.uid() no filtro
-- Solução: Recriar a política com WITH CHECK correto

-- 1. VERIFICAR POLÍTICA ATUAL
SELECT 
    'Política INSERT atual' as info,
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'itens_cardapio'
  AND cmd = 'INSERT';

-- 2. REMOVER POLÍTICA ANTIGA
DROP POLICY IF EXISTS "rls_itens_insert" ON itens_cardapio;

SELECT '✅ Política antiga removida' as status;

-- 3. CRIAR NOVA POLÍTICA CORRETA
CREATE POLICY "rls_itens_insert" ON itens_cardapio
    FOR INSERT 
    WITH CHECK (id_restaurante = auth.uid());

SELECT '✅ Nova política INSERT criada' as status;

-- 4. VERIFICAR SE FOI CORRIGIDA
SELECT 
    'Política INSERT corrigida' as info,
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause,
    CASE 
        WHEN with_check LIKE '%auth.uid()%' THEN '✅ Usa auth.uid()'
        ELSE '❌ NÃO usa auth.uid()'
    END as status
FROM pg_policies
WHERE tablename = 'itens_cardapio'
  AND cmd = 'INSERT';

-- 5. VERIFICAR TODAS AS POLÍTICAS
SELECT 
    'Todas as políticas' as info,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✅'
        ELSE '❌'
    END as status
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY cmd;

SELECT '
╔════════════════════════════════════════════════════════════╗
║  ✅ POLÍTICA INSERT CORRIGIDA!                            ║
║                                                            ║
║  Agora todas as 4 políticas usam auth.uid()              ║
║  - SELECT ✅                                              ║
║  - INSERT ✅                                              ║
║  - UPDATE ✅                                              ║
║  - DELETE ✅                                              ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
