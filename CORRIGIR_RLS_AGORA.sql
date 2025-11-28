-- =====================================================
-- CORREÇÃO IMEDIATA - PERMITIR INSERT EM RESTAURANTES_APP
-- =====================================================
-- Execute este script AGORA no Supabase SQL Editor
-- =====================================================

BEGIN;

-- 1. VERIFICAR POLÍTICAS ATUAIS
SELECT 
    '📋 Políticas atuais em restaurantes_app:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'restaurantes_app';

-- 2. REMOVER POLÍTICAS QUE PODEM ESTAR BLOQUEANDO
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem inserir seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON restaurantes_app;

-- 3. CRIAR POLÍTICA CORRETA PARA INSERT
CREATE POLICY "Permitir INSERT para usuários autenticados"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 4. GARANTIR QUE SELECT TAMBÉM FUNCIONA
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios dados" ON restaurantes_app;

CREATE POLICY "Restaurantes podem ver seus próprios dados"
    ON restaurantes_app
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id);

-- 5. GARANTIR QUE UPDATE FUNCIONA
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios dados" ON restaurantes_app;

CREATE POLICY "Restaurantes podem atualizar seus próprios dados"
    ON restaurantes_app
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

COMMIT;

-- 6. VERIFICAR POLÍTICAS APÓS CORREÇÃO
SELECT 
    '✅ Políticas após correção:' as status,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'restaurantes_app'
ORDER BY cmd, policyname;

-- 7. CORRIGIR CADASTROS INCOMPLETOS
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

-- 8. VERIFICAR RESULTADO
SELECT 
    '✅ Verificação final:' as status,
    p.id,
    p.email,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ AINDA FALTANDO'
    END as status_restaurante
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC
LIMIT 10;

SELECT '🎉 CORREÇÃO CONCLUÍDA! Teste um novo cadastro agora.' as resultado;
