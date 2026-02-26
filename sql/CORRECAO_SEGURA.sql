-- =====================================================
-- CORREÇÃO SEGURA - IDENTIFICA TIPO ANTES DE CORRIGIR
-- =====================================================
-- Este script identifica corretamente restaurantes, clientes e entregadores
-- antes de fazer qualquer correção
-- =====================================================

BEGIN;

-- PASSO 1: IDENTIFICAR TIPOS DE USUÁRIOS
-- =====================================================

-- Ver distribuição atual
SELECT 
    '📊 DISTRIBUIÇÃO ATUAL:' as info,
    tipo_usuario,
    COUNT(*) as quantidade
FROM profiles
GROUP BY tipo_usuario
ORDER BY quantidade DESC;

-- Identificar possíveis restaurantes (têm dados de restaurante)
SELECT 
    '🏪 POSSÍVEIS RESTAURANTES (têm nome_fantasia, cnpj ou tipo_restaurante):' as info,
    id,
    email,
    tipo_usuario as tipo_atual,
    CASE 
        WHEN nome_fantasia IS NOT NULL AND nome_fantasia != '' THEN '✅ nome_fantasia'
        ELSE ''
    END as tem_nome_fantasia,
    CASE 
        WHEN cnpj IS NOT NULL AND cnpj != '' THEN '✅ cnpj'
        ELSE ''
    END as tem_cnpj,
    CASE 
        WHEN tipo_restaurante IS NOT NULL AND tipo_restaurante != '' THEN '✅ tipo_restaurante'
        ELSE ''
    END as tem_tipo_restaurante
FROM profiles
WHERE (
    (nome_fantasia IS NOT NULL AND nome_fantasia != '')
    OR (cnpj IS NOT NULL AND cnpj != '')
    OR (tipo_restaurante IS NOT NULL AND tipo_restaurante != '')
  )
  AND (cpf IS NULL OR cpf = '')
ORDER BY created_at DESC;

-- Identificar possíveis clientes (têm CPF)
SELECT 
    '👤 POSSÍVEIS CLIENTES (têm CPF):' as info,
    id,
    email,
    tipo_usuario as tipo_atual,
    cpf
FROM profiles
WHERE cpf IS NOT NULL AND cpf != ''
ORDER BY created_at DESC;

-- PASSO 2: CORRIGIR APENAS RESTAURANTES IDENTIFICADOS
-- =====================================================

-- Atualizar tipo_usuario APENAS para profiles que claramente são restaurantes
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

SELECT '✅ Passo 2: tipo_usuario corrigido para restaurantes identificados' as status;

-- PASSO 3: CONFIGURAR POLÍTICAS RLS
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;
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

SELECT '✅ Passo 3: Políticas RLS configuradas' as status;

-- PASSO 4: CRIAR REGISTROS FALTANTES EM RESTAURANTES_APP
-- =====================================================
-- Apenas para profiles que são restaurantes
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
    COALESCE(p.rua, '') as rua,
    COALESCE(p.numero, '') as numero,
    COALESCE(p.bairro, '') as bairro,
    COALESCE(p.cidade, '') as cidade,
    COALESCE(p.complemento, '') as complemento,
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
SELECT '🎉 CORREÇÃO SEGURA CONCLUÍDA!' as resultado;
SELECT '═══════════════════════════════════════════════════' as separador;

-- Distribuição por tipo
SELECT 
    '📊 DISTRIBUIÇÃO POR TIPO:' as info,
    tipo_usuario,
    COUNT(*) as quantidade
FROM profiles
GROUP BY tipo_usuario
ORDER BY quantidade DESC;

-- Restaurantes com e sem restaurantes_app
SELECT 
    '🏪 RESTAURANTES:' as info,
    COUNT(*) as total_restaurantes,
    COUNT(r.id) as com_restaurante_app,
    COUNT(*) - COUNT(r.id) as sem_restaurante_app
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante';

-- Clientes
SELECT 
    '👤 CLIENTES:' as info,
    COUNT(*) as total_clientes
FROM profiles
WHERE tipo_usuario = 'cliente';

-- Listar restaurantes
SELECT 
    '📋 LISTA DE RESTAURANTES:' as info,
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status_restaurante_app,
    COALESCE(r.nome_fantasia, p.nome_fantasia, '(vazio)') as nome_fantasia
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC;

SELECT '═══════════════════════════════════════════════════' as separador;
SELECT '✅ Agora teste um novo cadastro!' as proxima_acao;
SELECT '═══════════════════════════════════════════════════' as separador;
