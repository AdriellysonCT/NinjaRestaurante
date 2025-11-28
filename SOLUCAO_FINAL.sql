-- =====================================================
-- SOLUÇÃO FINAL - EXECUTE ESTE SCRIPT
-- =====================================================
-- A trigger sync_cliente_com_profile está OK (só executa para clientes)
-- O problema é que tipo_usuario está chegando como "cliente"
-- Vamos corrigir tudo de uma vez
-- =====================================================

BEGIN;

-- PASSO 1: IDENTIFICAR E CORRIGIR APENAS RESTAURANTES
-- =====================================================
-- Atualizar tipo_usuario APENAS para profiles que têm dados de restaurante
-- (nome_fantasia, cnpj, tipo_restaurante preenchidos)
UPDATE profiles
SET 
    tipo_usuario = 'restaurante',
    updated_at = NOW()
WHERE (tipo_usuario != 'restaurante' OR tipo_usuario IS NULL)
  AND (
    -- Tem dados típicos de restaurante
    (nome_fantasia IS NOT NULL AND nome_fantasia != '')
    OR (cnpj IS NOT NULL AND cnpj != '')
    OR (tipo_restaurante IS NOT NULL AND tipo_restaurante != '')
  )
  AND (
    -- NÃO tem dados típicos de cliente
    (cpf IS NULL OR cpf = '')
  );

SELECT '✅ Passo 1: tipo_usuario corrigido apenas para restaurantes' as status;

-- PASSO 2: CONFIGURAR POLÍTICAS RLS EM RESTAURANTES_APP
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios dados" ON restaurantes_app;
DROP POLICY IF EXISTS "Permitir SELECT para próprio restaurante" ON restaurantes_app;
DROP POLICY IF EXISTS "Permitir UPDATE para próprio restaurante" ON restaurantes_app;
DROP POLICY IF EXISTS "Permitir DELETE para próprio restaurante" ON restaurantes_app;

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

SELECT '✅ Passo 2: Políticas RLS configuradas' as status;

-- PASSO 3: CRIAR REGISTROS FALTANTES EM RESTAURANTES_APP
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

SELECT '✅ Passo 3: Registros criados em restaurantes_app' as status;

COMMIT;

-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT '═══════════════════════════════════════════════════' as separador;
SELECT '🎉 CORREÇÃO CONCLUÍDA!' as resultado;
SELECT '═══════════════════════════════════════════════════' as separador;

-- Estatísticas
SELECT 
    '📊 ESTATÍSTICAS:' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN tipo_usuario = 'restaurante' THEN 1 END) as total_restaurantes,
    COUNT(r.id) as total_com_restaurante_app,
    COUNT(*) FILTER (WHERE tipo_usuario = 'restaurante') - COUNT(r.id) as faltando
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id;

-- Listar todos os restaurantes
SELECT 
    '📋 RESTAURANTES:' as info,
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status_restaurante_app,
    COALESCE(r.nome_fantasia, '(vazio)') as nome_fantasia
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

-- Verificar trigger (deve estar presente e OK)
SELECT 
    '🔧 TRIGGER (deve ter sync_cliente_com_profile):' as info,
    trigger_name,
    event_manipulation,
    CASE 
        WHEN trigger_name = 'trg_sync_cliente_com_profile' THEN '✅ OK (só para clientes)'
        ELSE '📋 ' || trigger_name
    END as status
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

SELECT '═══════════════════════════════════════════════════' as separador;
SELECT '✅ Agora teste um novo cadastro!' as proxima_acao;
SELECT '📋 Abra o console (F12) e observe os logs' as dica;
SELECT '═══════════════════════════════════════════════════' as separador;
