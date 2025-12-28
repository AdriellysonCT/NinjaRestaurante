-- ============================================
-- CORREÇÃO RLS ITENS_CARDAPIO
-- ============================================
-- Problema: Restaurantes estão vendo itens de outros restaurantes
-- Solução: Garantir que cada restaurante veja apenas seus próprios itens

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 
    'Estrutura da tabela itens_cardapio' as info,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR POLÍTICAS RLS EXISTENTES
SELECT 
    'Políticas RLS atuais' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'itens_cardapio';

-- 3. REMOVER TODAS AS POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Usuários podem ver seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Acesso público aos itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus itens" ON itens_cardapio;

-- 4. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR NOVAS POLÍTICAS CORRETAS

-- Política SELECT: Restaurante vê apenas seus próprios itens
CREATE POLICY "restaurante_select_proprios_itens" ON itens_cardapio
    FOR SELECT 
    USING (
        id_restaurante = auth.uid()
    );

-- Política INSERT: Restaurante pode inserir apenas com seu próprio ID
CREATE POLICY "restaurante_insert_proprios_itens" ON itens_cardapio
    FOR INSERT 
    WITH CHECK (
        id_restaurante = auth.uid()
    );

-- Política UPDATE: Restaurante pode atualizar apenas seus próprios itens
CREATE POLICY "restaurante_update_proprios_itens" ON itens_cardapio
    FOR UPDATE 
    USING (
        id_restaurante = auth.uid()
    )
    WITH CHECK (
        id_restaurante = auth.uid()
    );

-- Política DELETE: Restaurante pode deletar apenas seus próprios itens
CREATE POLICY "restaurante_delete_proprios_itens" ON itens_cardapio
    FOR DELETE 
    USING (
        id_restaurante = auth.uid()
    );

-- 6. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS CORRETAMENTE
SELECT 
    'Novas políticas RLS' as info,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'Sem USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'Sem WITH CHECK'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY policyname;

-- 7. VERIFICAR DADOS EXISTENTES
SELECT 
    'Itens por restaurante' as info,
    id_restaurante,
    COUNT(*) as total_itens,
    COUNT(CASE WHEN disponivel THEN 1 END) as itens_disponiveis
FROM itens_cardapio
GROUP BY id_restaurante
ORDER BY id_restaurante;

-- 8. TESTE: Verificar se o usuário atual consegue ver apenas seus itens
SELECT 
    'Teste - Itens do usuário atual' as info,
    id,
    nome,
    categoria,
    preco,
    disponivel,
    id_restaurante
FROM itens_cardapio
WHERE id_restaurante = auth.uid()
ORDER BY categoria, nome;

-- 9. VERIFICAR SE EXISTE ALGUM ITEM SEM RESTAURANTE_ID
SELECT 
    'Itens sem restaurante_id' as info,
    COUNT(*) as total
FROM itens_cardapio
WHERE id_restaurante IS NULL;

-- 10. CORRIGIR ITENS SEM RESTAURANTE_ID (se necessário)
-- ATENÇÃO: Execute apenas se houver itens sem restaurante_id
-- UPDATE itens_cardapio 
-- SET id_restaurante = (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com')
-- WHERE id_restaurante IS NULL;

SELECT '✅ Correção RLS concluída!' as status;
