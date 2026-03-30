-- Script para criação da estrutura do Módulo Garçom Ninja no Supabase

-- 1. Criação da Tabela de Garçons (waiters)
CREATE TABLE IF NOT EXISTS public.garcons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_restaurante UUID NOT NULL REFERENCES public.restaurantes_app(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    codigo_login TEXT NOT NULL, -- Exemplo: "101" (Matrícula)
    pin TEXT NOT NULL, -- Exemplo: "1234" (Senha curta)
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(id_restaurante, codigo_login) -- O código de login deve ser único por restaurante
);

-- 2. Atualização da tabela de Pedidos Padronizados (pedidos_padronizados)
-- Adiciona a referência do garçom para calcular comissões e rastrear vendas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='pedidos_padronizados' AND column_name='id_garcom') THEN
        ALTER TABLE public.pedidos_padronizados ADD COLUMN id_garcom UUID REFERENCES public.garcons(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Atualização da tabela de Mesas (mesas)
-- Adiciona uma referência para saber qual garçom "abriu" a mesa ou está atendendo ela no momento
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mesas' AND column_name='id_garcom_atual') THEN
        ALTER TABLE public.mesas ADD COLUMN id_garcom_atual UUID REFERENCES public.garcons(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 4. RLS (Row Level Security) para a tabela Garçons
ALTER TABLE public.garcons ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Somente usuários do restaurante podem ver seus garçons
CREATE POLICY "Permitir leitura de garçons pelo dono do restaurante" 
ON public.garcons FOR SELECT 
USING (
    id_restaurante IN (
        SELECT id FROM public.restaurantes_app WHERE user_id = auth.uid()
    )
);

-- Política de inserção: Somente usuários do restaurante podem criar garçons para si mesmos
CREATE POLICY "Permitir inserção de garçons pelo dono do restaurante" 
ON public.garcons FOR INSERT 
WITH CHECK (
    id_restaurante IN (
        SELECT id FROM public.restaurantes_app WHERE user_id = auth.uid()
    )
);

-- Política de atualização
CREATE POLICY "Permitir atualização de garçons pelo dono do restaurante" 
ON public.garcons FOR UPDATE 
USING (
    id_restaurante IN (
        SELECT id FROM public.restaurantes_app WHERE user_id = auth.uid()
    )
);

-- Política de deleção
CREATE POLICY "Permitir deleção de garçons pelo dono do restaurante" 
ON public.garcons FOR DELETE 
USING (
    id_restaurante IN (
        SELECT id FROM public.restaurantes_app WHERE user_id = auth.uid()
    )
);

-- Comentários para documentação do banco
COMMENT ON TABLE public.garcons IS 'Tabela de cadastro dos garçons do restaurante para acesso ao PWA Garçom Ninja';
COMMENT ON COLUMN public.garcons.codigo_login IS 'Código curto (matrícula) usado pelo garçom para entrar no PWA (Ex: 101, 102)';
COMMENT ON COLUMN public.garcons.pin IS 'Senha PIN numérica (Ex: 1234) para segurança do acesso no salão';
