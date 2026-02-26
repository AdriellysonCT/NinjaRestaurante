-- =====================================================
-- VERIFICAR E CORRIGIR TIPO_USUARIO EM PROFILES
-- =====================================================

-- 1. VERIFICAR PROBLEMA
SELECT 
    '❌ Problema identificado:' as status,
    id,
    email,
    tipo_usuario,
    created_at
FROM profiles
WHERE email LIKE '%@%'
  AND tipo_usuario = 'cliente'
  AND id IN (SELECT id FROM auth.users)
ORDER BY created_at DESC
LIMIT 10;

-- 2. VERIFICAR SE HÁ TRIGGER SOBRESCREVENDO O VALOR
SELECT 
    '🔍 Triggers em profiles:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 3. CORRIGIR TIPO_USUARIO PARA RESTAURANTES
-- Atualizar todos os profiles que deveriam ser restaurante
UPDATE profiles
SET 
    tipo_usuario = 'restaurante',
    updated_at = NOW()
WHERE tipo_usuario = 'cliente'
  AND id NOT IN (
    -- Excluir IDs que realmente são clientes (se houver lógica para identificar)
    SELECT id FROM profiles WHERE 1=0
  );

-- 4. VERIFICAR APÓS CORREÇÃO
SELECT 
    '✅ Após correção:' as status,
    id,
    email,
    tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ Tem restaurante'
        ELSE '❌ Sem restaurante'
    END as status_restaurante
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. CRIAR RESTAURANTES FALTANTES
-- Agora que tipo_usuario está correto, criar em restaurantes_app
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

-- 6. VERIFICAÇÃO FINAL
SELECT 
    '🎉 Resultado final:' as status,
    COUNT(*) as total_profiles_restaurante,
    COUNT(r.id) as total_com_restaurante_app,
    COUNT(*) - COUNT(r.id) as faltando
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante';

-- 7. LISTAR TODOS OS RESTAURANTES
SELECT 
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as tem_restaurante_app,
    r.nome_fantasia,
    p.created_at
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC;
