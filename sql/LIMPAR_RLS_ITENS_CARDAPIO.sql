-- ============================================
-- LIMPEZA COMPLETA E CORREÇÃO RLS ITENS_CARDAPIO
-- ============================================
-- Remove TODAS as políticas duplicadas e cria apenas as necessárias

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES (LIMPEZA TOTAL)
DROP POLICY IF EXISTS "Acesso completo aos próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Leitura pública de itens" ON itens_cardapio;  -- ❌ ESTA É A VILÃ!
DROP POLICY IF EXISTS "Restaurante pode criar seus itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurante pode deletar seus itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurante pode editar seus itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurante pode ver seus itens" ON itens_cardapio;
DROP POLICY IF EXISTS "restaurante_delete_proprios_itens" ON itens_cardapio;
DROP POLICY IF EXISTS "restaurante_insert_proprios_itens" ON itens_cardapio;
DROP POLICY IF EXISTS "restaurante_select_proprios_itens" ON itens_cardapio;
DROP POLICY IF EXISTS "restaurante_update_proprios_itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios itens" ON itens_cardapio;

SELECT '✅ Todas as políticas antigas removidas' as status;

-- 2. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;

SELECT '✅ RLS habilitado' as status;

-- 3. CRIAR APENAS 4 POLÍTICAS SIMPLES E CORRETAS

-- SELECT: Restaurante vê APENAS seus próprios itens
CREATE POLICY "rls_itens_select" ON itens_cardapio
    FOR SELECT 
    USING (id_restaurante = auth.uid());

-- INSERT: Restaurante cria APENAS com seu próprio ID
CREATE POLICY "rls_itens_insert" ON itens_cardapio
    FOR INSERT 
    WITH CHECK (id_restaurante = auth.uid());

-- UPDATE: Restaurante atualiza APENAS seus próprios itens
CREATE POLICY "rls_itens_update" ON itens_cardapio
    FOR UPDATE 
    USING (id_restaurante = auth.uid())
    WITH CHECK (id_restaurante = auth.uid());

-- DELETE: Restaurante deleta APENAS seus próprios itens
CREATE POLICY "rls_itens_delete" ON itens_cardapio
    FOR DELETE 
    USING (id_restaurante = auth.uid());

SELECT '✅ 4 novas políticas criadas' as status;

-- 4. VERIFICAR AS POLÍTICAS CRIADAS
SELECT 
    '📋 Políticas ativas' as info,
    policyname,
    cmd,
    qual as filtro_using,
    with_check as filtro_with_check
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY cmd, policyname;

 
-- 6. VERIFICAR SE HÁ ITENS SEM RESTAURANTE_ID
SELECT 
    '⚠️ Itens órfãos (sem restaurante)' as info,
    COUNT(*) as total
FROM itens_cardapio
WHERE id_restaurante IS NULL;

SELECT '
╔════════════════════════════════════════════════════════════╗
║  ✅ LIMPEZA E CORREÇÃO CONCLUÍDA!                         ║
║                                                            ║
║  Políticas antigas: REMOVIDAS                             ║
║  Políticas novas: 4 (SELECT, INSERT, UPDATE, DELETE)     ║
║                                                            ║
║  Agora cada restaurante vê APENAS seus próprios itens!   ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
