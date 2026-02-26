-- =====================================================
-- EXECUTE ESTE SCRIPT AGORA NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script corrige todos os 3 problemas de uma vez
-- =====================================================

BEGIN;

-- 1. CORRIGIR TRIGGERS
-- =====================================================

-- Remover triggers antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_restaurante ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile_restaurante() CASCADE;

-- Criar função para inserir em profiles quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_type TEXT;
BEGIN
    -- Tentar ler tipo_usuario primeiro, depois user_type, padrão 'cliente'
    v_user_type := COALESCE(
        NEW.raw_user_meta_data->>'tipo_usuario',
        NEW.raw_user_meta_data->>'user_type',
        'cliente'
    );
    
    INSERT INTO public.profiles (
        id, email, tipo_cliente, nome_fantasia, tipo_restaurante,
        cnpj, telefone, nome_responsavel, created_at, updated_at
    ) VALUES (
        NEW.id, NEW.email, v_user_type,
        COALESCE(NEW.raw_user_meta_data->>'nome_fantasia', ''),
        COALESCE(NEW.raw_user_meta_data->>'tipo_restaurante', ''),
        COALESCE(NEW.raw_user_meta_data->>'cnpj', ''),
        COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
        COALESCE(NEW.raw_user_meta_data->>'nome_responsavel', ''),
        NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        tipo_cliente = EXCLUDED.tipo_cliente,
        nome_fantasia = EXCLUDED.nome_fantasia,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar função para inserir em restaurantes_app quando profile de restaurante é criado
CREATE OR REPLACE FUNCTION public.handle_new_profile_restaurante()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo_cliente = 'restaurante' THEN
        INSERT INTO public.restaurantes_app (
            id, nome_fantasia, tipo_restaurante, cnpj, telefone,
            email, nome_responsavel, rua, numero, bairro, cidade,
            complemento, created_at, updated_at
        ) VALUES (
            NEW.id, COALESCE(NEW.nome_fantasia, ''),
            COALESCE(NEW.tipo_restaurante, ''),
            COALESCE(NEW.cnpj, ''), COALESCE(NEW.telefone, ''),
            NEW.email, COALESCE(NEW.nome_responsavel, ''),
            '', '', '', '', '', NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            nome_fantasia = EXCLUDED.nome_fantasia,
            tipo_restaurante = EXCLUDED.tipo_restaurante,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_restaurante
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_restaurante();

-- 2. CORRIGIR CRISTAL PIZZARIA
-- =====================================================

-- Atualizar tipo_cliente para restaurante
UPDATE public.profiles
SET tipo_cliente = 'restaurante', updated_at = NOW()
WHERE nome_fantasia ILIKE '%cristal%' AND tipo_cliente != 'restaurante';

-- Inserir em restaurantes_app
INSERT INTO public.restaurantes_app (
    id, nome_fantasia, tipo_restaurante, cnpj, telefone,
    email, nome_responsavel, rua, numero, bairro, cidade,
    complemento, created_at, updated_at
)
SELECT 
    p.id, p.nome_fantasia, p.tipo_restaurante, p.cnpj, p.telefone,
    p.email, p.nome_responsavel, '', '', '', '', '', NOW(), NOW()
FROM public.profiles p
WHERE p.nome_fantasia ILIKE '%cristal%'
  AND NOT EXISTS (SELECT 1 FROM public.restaurantes_app r WHERE r.id = p.id);

-- 3. CORRIGIR POLÍTICAS RLS
-- =====================================================

-- itens_cardapio
ALTER TABLE itens_cardapio DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem inserir seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Restaurantes podem deletar seus próprios itens" ON itens_cardapio;
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem ver seus próprios itens"
    ON itens_cardapio FOR SELECT TO authenticated
    USING (restaurante_id = auth.uid());

CREATE POLICY "Restaurantes podem inserir seus próprios itens"
    ON itens_cardapio FOR INSERT TO authenticated
    WITH CHECK (restaurante_id = auth.uid());

CREATE POLICY "Restaurantes podem atualizar seus próprios itens"
    ON itens_cardapio FOR UPDATE TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

CREATE POLICY "Restaurantes podem deletar seus próprios itens"
    ON itens_cardapio FOR DELETE TO authenticated
    USING (restaurante_id = auth.uid());

-- grupos_complementos
ALTER TABLE grupos_complementos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus grupos" ON grupos_complementos;
ALTER TABLE grupos_complementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem gerenciar seus grupos"
    ON grupos_complementos FOR ALL TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

-- complementos
ALTER TABLE complementos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus complementos" ON complementos;
ALTER TABLE complementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem gerenciar seus complementos"
    ON complementos FOR ALL TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

-- pedidos_padronizados
ALTER TABLE pedidos_padronizados DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurantes podem gerenciar seus pedidos" ON pedidos_padronizados;
ALTER TABLE pedidos_padronizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurantes podem gerenciar seus pedidos"
    ON pedidos_padronizados FOR ALL TO authenticated
    USING (restaurante_id = auth.uid())
    WITH CHECK (restaurante_id = auth.uid());

COMMIT;

-- 4. VERIFICAÇÃO
-- =====================================================

SELECT '✅ CORREÇÃO CONCLUÍDA!' as status;

SELECT 'Cristal Pizzaria em profiles:' as info;
SELECT id, email, tipo_cliente, nome_fantasia 
FROM profiles WHERE nome_fantasia ILIKE '%cristal%';

SELECT 'Cristal Pizzaria em restaurantes_app:' as info;
SELECT id, email, nome_fantasia 
FROM restaurantes_app WHERE nome_fantasia ILIKE '%cristal%';

SELECT 'Triggers criados:' as info;
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');

SELECT '✅ Agora faça logout e login novamente com o Cristal Pizzaria!' as proxima_acao;
