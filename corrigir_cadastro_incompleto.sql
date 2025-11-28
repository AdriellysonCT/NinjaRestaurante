-- =====================================================
-- CORRIGIR CADASTRO INCOMPLETO
-- =====================================================

-- 1. IDENTIFICAR PROFILES SEM RESTAURANTE
SELECT 
    '❌ Profiles sem restaurante_app:' as problema,
    p.id,
    p.email,
    p.tipo_usuario,
    p.created_at
FROM profiles p
WHERE p.tipo_usuario = 'restaurante'
  AND NOT EXISTS (
    SELECT 1 FROM restaurantes_app r WHERE r.id = p.id
  )
ORDER BY p.created_at DESC;

-- 2. VERIFICAR POLÍTICAS RLS EM RESTAURANTES_APP
SELECT 
    '📋 Políticas RLS em restaurantes_app:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'restaurantes_app';

-- 3. CRIAR REGISTROS FALTANTES EM RESTAURANTES_APP
-- Para cada profile de restaurante sem registro em restaurantes_app
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

-- 4. VERIFICAR SE FOI CORRIGIDO
SELECT 
    '✅ Verificação após correção:' as status,
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

-- 5. VERIFICAR PERMISSÕES RLS
-- Desabilitar RLS temporariamente para INSERT (se necessário)
-- CUIDADO: Isso permite inserções sem restrições
-- ALTER TABLE restaurantes_app DISABLE ROW LEVEL SECURITY;

-- Ou criar política que permite INSERT para usuários autenticados
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;

CREATE POLICY "Permitir INSERT para usuários autenticados"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Verificar políticas após criação
SELECT 
    '📋 Políticas após correção:' as info,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'restaurantes_app'
ORDER BY cmd, policyname;
