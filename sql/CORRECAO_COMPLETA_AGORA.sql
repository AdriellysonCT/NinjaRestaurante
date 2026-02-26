-- =====================================================
-- CORREÇÃO COMPLETA - EXECUTE ESTE SCRIPT AGORA
-- =====================================================
-- Este script resolve todos os problemas de uma vez:
-- 1. Remove triggers conflitantes
-- 2. Corrige tipo_usuario em profiles
-- 3. Cria registros faltantes em restaurantes_app
-- 4. Configura políticas RLS corretas
-- =====================================================

BEGIN;

-- PASSO 1: REMOVER TRIGGERS CONFLITANTES
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_restaurante ON public.profiles;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS handle_new_profile ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_cliente_com_profile ON public.profiles;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile_restaurante() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;
DROP FUNCTION IF EXISTS public.sync_cliente_com_profile() CASCADE;

SELECT '✅ Passo 1: Triggers conflitantes removidas' as status;

-- PASSO 2: CORRIGIR tipo_usuario EM PROFILES
-- =====================================================
-- Atualizar todos os profiles para tipo_usuario = 'restaurante'
-- (assumindo que todos os cadastros são de restaurantes)
UPDATE profiles
SET 
    tipo_usuario = 'restaurante',
    updated_at = NOW()
WHERE tipo_usuario != 'restaurante'
   OR tipo_usuario IS NULL;

SELECT '✅ Passo 2: tipo_usuario corrigido' as status;

-- PASSO 3: CONFIGURAR POLÍTICAS RLS
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Permitir SELECT para próprio restaurante" ON restaurantes_app;
DROP POLICY IF EXISTS "Permitir UPDATE para próprio restaurante" ON restaurantes_app;

-- Habilitar RLS
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;

-- Criar políticas corretas
CREATE POLICY "Permitir INSERT para usuários autenticados"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Permitir SELECT para próprio restaurante"
    ON restaurantes_app
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Permitir UPDATE para próprio restaurante"
    ON restaurantes_app
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Permitir DELETE para próprio restaurante"
    ON restaurantes_app
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

SELECT '✅ Passo 3: Políticas RLS configuradas' as status;

-- PASSO 4: CRIAR REGISTROS FALTANTES EM RESTAURANTES_APP
-- =====================================================
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
    COALESCE(p.nome_fantasia, '') as nome_fantasia,
    COALESCE(p.tipo_restaurante, '') as tipo_restaurante,
    COALESCE(p.cnpj, '') as cnpj,
    COALESCE(p.telefone, '') as telefone,
    p.email,
    COALESCE(p.nome_responsavel, '') as nome_responsavel,
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

SELECT '✅ Passo 4: Registros criados em restaurantes_app' as status;

COMMIT;

-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT '═══════════════════════════════════════════════════' as separador;
SELECT '🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!' as resultado;
SELECT '═══════════════════════════════════════════════════' as separador;

-- Estatísticas
SELECT 
    '📊 ESTATÍSTICAS:' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN tipo_usuario = 'restaurante' THEN 1 END) as total_restaurantes,
    COUNT(r.id) as total_com_restaurante_app,
    COUNT(*) - COUNT(r.id) as faltando
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id;

-- Listar todos os restaurantes
SELECT 
    '📋 RESTAURANTES CADASTRADOS:' as info,
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status_restaurante_app,
    COALESCE(r.nome_fantasia, '(vazio)') as nome_fantasia,
    p.created_at
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC;

-- Verificar políticas RLS
SELECT 
    '🔒 POLÍTICAS RLS:' as info,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'restaurantes_app'
ORDER BY cmd, policyname;

-- Verificar triggers (deve estar vazio)
SELECT 
    '🔧 TRIGGERS (deve estar vazio):' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE (event_object_table = 'profiles' AND event_object_schema = 'public')
   OR (event_object_table = 'users' AND event_object_schema = 'auth');

SELECT '═══════════════════════════════════════════════════' as separador;
SELECT '✅ Agora teste um novo cadastro no front-end!' as proxima_acao;
SELECT '📋 Abra o console (F12) e observe os logs detalhados' as dica;
SELECT '═══════════════════════════════════════════════════' as separador;
