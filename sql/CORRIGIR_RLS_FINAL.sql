-- =====================================================
-- CORREÇÃO FINAL DAS POLÍTICAS RLS
-- =====================================================
-- Execute este script para garantir que o INSERT funcione
-- =====================================================

BEGIN;

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA TESTAR
-- (Remova o comentário abaixo APENAS para testar se o problema é RLS)
-- ALTER TABLE restaurantes_app DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem inserir seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON restaurantes_app;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON restaurantes_app;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON restaurantes_app;

-- 3. CRIAR POLÍTICAS CORRETAS E PERMISSIVAS

-- Política para INSERT (permite qualquer usuário autenticado inserir seu próprio registro)
CREATE POLICY "restaurantes_insert_policy"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Permite INSERT para qualquer usuário autenticado

-- Política para SELECT (permite ver apenas seus próprios dados)
CREATE POLICY "restaurantes_select_policy"
    ON restaurantes_app
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id);

-- Política para UPDATE (permite atualizar apenas seus próprios dados)
CREATE POLICY "restaurantes_update_policy"
    ON restaurantes_app
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Política para DELETE (permite deletar apenas seus próprios dados)
CREATE POLICY "restaurantes_delete_policy"
    ON restaurantes_app
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id);

COMMIT;

-- 4. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    '✅ Políticas RLS em restaurantes_app:' as status,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Permite INSERT'
        WHEN cmd = 'SELECT' THEN '✅ Permite SELECT'
        WHEN cmd = 'UPDATE' THEN '✅ Permite UPDATE'
        WHEN cmd = 'DELETE' THEN '✅ Permite DELETE'
    END as descricao
FROM pg_policies
WHERE tablename = 'restaurantes_app'
ORDER BY cmd, policyname;

-- 5. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS Desabilitado'
    END as status_rls
FROM pg_tables
WHERE tablename = 'restaurantes_app';

-- 6. CORRIGIR CADASTROS INCOMPLETOS (profiles sem restaurantes_app)
INSERT INTO restaurantes_app (
    id,
    user_id,
    nome_fantasia,
    tipo_restaurante,
    cnpj,
    telefone,
    email,
    nome_responsavel,
    rua,
    numero,
    bairro,
    cidade,
    complemento,
    ativo,
    imagem_url,
    latitude,
    longitude,
    conta_bancaria,
    created_at,
    updated_at
)
SELECT 
    p.id,
    p.id as user_id,
    '' as nome_fantasia,
    '' as tipo_restaurante,
    '' as cnpj,
    '' as telefone,
    p.email,
    '' as nome_responsavel,
    '' as rua,
    '' as numero,
    '' as bairro,
    '' as cidade,
    '' as complemento,
    true as ativo,
    null as imagem_url,
    null as latitude,
    null as longitude,
    null as conta_bancaria,
    p.created_at,
    NOW() as updated_at
FROM profiles p
WHERE p.tipo_usuario = 'restaurante'
  AND NOT EXISTS (
    SELECT 1 FROM restaurantes_app r WHERE r.id = p.id
  )
ON CONFLICT (id) DO NOTHING;

-- 7. VERIFICAR RESULTADO FINAL
SELECT 
    '📊 Status final dos restaurantes:' as info,
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK - Completo'
        ELSE '❌ FALTANDO em restaurantes_app'
    END as status
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC
LIMIT 10;

SELECT '🎉 CORREÇÃO CONCLUÍDA!' as resultado;
SELECT '📝 Agora teste um novo cadastro no front-end' as proxima_acao;
