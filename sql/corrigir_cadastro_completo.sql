-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE CADASTRO
-- =====================================================

-- PASSO 1: CRIAR/RECRIAR TRIGGER PARA INSERIR EM PROFILES
-- =====================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Criar função que será executada quando um novo usuário for criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_type TEXT;
BEGIN
    -- Extrair o tipo de usuário dos metadados
    -- Tentar tipo_usuario primeiro, depois user_type, padrão 'cliente'
    v_user_type := COALESCE(
        NEW.raw_user_meta_data->>'tipo_usuario',
        NEW.raw_user_meta_data->>'user_type',
        'cliente'
    );
    
    -- Inserir em profiles com o tipo correto
    INSERT INTO public.profiles (
        id,
        email,
        tipo_cliente,
        nome_fantasia,
        tipo_restaurante,
        cnpj,
        telefone,
        nome_responsavel,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        v_user_type, -- Usar o tipo dos metadados
        COALESCE(NEW.raw_user_meta_data->>'nome_fantasia', ''),
        COALESCE(NEW.raw_user_meta_data->>'tipo_restaurante', ''),
        COALESCE(NEW.raw_user_meta_data->>'cnpj', ''),
        COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
        COALESCE(NEW.raw_user_meta_data->>'nome_responsavel', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        tipo_cliente = EXCLUDED.tipo_cliente,
        nome_fantasia = EXCLUDED.nome_fantasia,
        tipo_restaurante = EXCLUDED.tipo_restaurante,
        cnpj = EXCLUDED.cnpj,
        telefone = EXCLUDED.telefone,
        nome_responsavel = EXCLUDED.nome_responsavel,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- PASSO 2: CRIAR/RECRIAR TRIGGER PARA INSERIR EM RESTAURANTES_APP
-- =====================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_profile_created_restaurante ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_profile_restaurante() CASCADE;

-- Criar função que insere em restaurantes_app quando um profile de restaurante é criado
CREATE OR REPLACE FUNCTION public.handle_new_profile_restaurante()
RETURNS TRIGGER AS $$
BEGIN
    -- Só inserir se for um restaurante
    IF NEW.tipo_cliente = 'restaurante' THEN
        INSERT INTO public.restaurantes_app (
            id,
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
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.nome_fantasia, ''),
            COALESCE(NEW.tipo_restaurante, ''),
            COALESCE(NEW.cnpj, ''),
            COALESCE(NEW.telefone, ''),
            NEW.email,
            COALESCE(NEW.nome_responsavel, ''),
            '',
            '',
            '',
            '',
            '',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            nome_fantasia = EXCLUDED.nome_fantasia,
            tipo_restaurante = EXCLUDED.tipo_restaurante,
            cnpj = EXCLUDED.cnpj,
            telefone = EXCLUDED.telefone,
            email = EXCLUDED.email,
            nome_responsavel = EXCLUDED.nome_responsavel,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER on_profile_created_restaurante
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile_restaurante();

-- PASSO 3: CORRIGIR O CADASTRO DO "CRISTAL PIZZARIA"
-- =====================================================

-- Atualizar o tipo_cliente em profiles para "restaurante"
UPDATE public.profiles
SET 
    tipo_cliente = 'restaurante',
    updated_at = NOW()
WHERE nome_fantasia ILIKE '%cristal%'
  AND tipo_cliente != 'restaurante';

-- Inserir em restaurantes_app (caso não exista)
INSERT INTO public.restaurantes_app (
    id,
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
    created_at,
    updated_at
)
SELECT 
    p.id,
    p.nome_fantasia,
    p.tipo_restaurante,
    p.cnpj,
    p.telefone,
    p.email,
    p.nome_responsavel,
    '',
    '',
    '',
    '',
    '',
    NOW(),
    NOW()
FROM public.profiles p
WHERE p.nome_fantasia ILIKE '%cristal%'
  AND NOT EXISTS (
    SELECT 1 FROM public.restaurantes_app r WHERE r.id = p.id
  );

-- PASSO 4: CORRIGIR POLÍTICAS RLS PARA ISOLAMENTO CORRETO
-- =====================================================

-- Desabilitar RLS temporariamente para verificar
ALTER TABLE itens_cardapio DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem inserir seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem deletar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Clientes podem ver itens disponíveis" ON itens_cardapio;

-- Reabilitar RLS
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;

-- Criar políticas corretas com isolamento por restaurante_id
CREATE POLICY "Restaurantes podem ver seus próprios itens"
    ON itens_cardapio
    FOR SELECT
    TO authenticated
    USING (
        restaurante_id = auth.uid()
    );

CREATE POLICY "Restaurantes podem inserir seus próprios itens"
    ON itens_cardapio
    FOR INSERT
    TO authenticated
    WITH CHECK (
        restaurante_id = auth.uid()
    );

CREATE POLICY "Restaurantes podem atualizar seus próprios itens"
    ON itens_cardapio
    FOR UPDATE
    TO authenticated
    USING (
        restaurante_id = auth.uid()
    )
    WITH CHECK (
        restaurante_id = auth.uid()
    );

CREATE POLICY "Restaurantes podem deletar seus próprios itens"
    ON itens_cardapio
    FOR DELETE
    TO authenticated
    USING (
        restaurante_id = auth.uid()
    );

-- PASSO 5: VERIFICAR E CORRIGIR OUTRAS TABELAS IMPORTANTES
-- =====================================================

-- Verificar e corrigir RLS em grupos_complementos
ALTER TABLE grupos_complementos DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus grupos" ON grupos_complementos;
DROP POLICY IF EXISTS "Restaurantes podem ver seus grupos" ON grupos_complementos;

ALTER TABLE grupos_complementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem gerenciar seus grupos"
    ON grupos_complementos
    FOR ALL
    TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

-- Verificar e corrigir RLS em complementos
ALTER TABLE complementos DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus complementos" ON complementos;
DROP POLICY IF EXISTS "Restaurantes podem ver seus complementos" ON complementos;

ALTER TABLE complementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem gerenciar seus complementos"
    ON complementos
    FOR ALL
    TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

-- Verificar e corrigir RLS em pedidos_padronizados
ALTER TABLE pedidos_padronizados DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurantes podem ver seus pedidos" ON pedidos_padronizados;
DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus pedidos" ON pedidos_padronizados;

ALTER TABLE pedidos_padronizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem gerenciar seus pedidos"
    ON pedidos_padronizados
    FOR ALL
    TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

-- PASSO 6: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se o Cristal Pizzaria está correto agora
SELECT 
    'profiles' as tabela,
    id,
    email,
    tipo_cliente,
    nome_fantasia
FROM profiles
WHERE nome_fantasia ILIKE '%cristal%'

UNION ALL

SELECT 
    'restaurantes_app' as tabela,
    id,
    email,
    'N/A' as tipo_cliente,
    nome_fantasia
FROM restaurantes_app
WHERE nome_fantasia ILIKE '%cristal%';

-- Verificar triggers criados
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante')
ORDER BY trigger_name;

-- Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('itens_cardapio', 'grupos_complementos', 'complementos', 'pedidos_padronizados')
ORDER BY tablename, policyname;
