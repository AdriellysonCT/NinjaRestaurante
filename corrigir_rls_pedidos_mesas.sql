-- Corrigir/garantir RLS para pedidos_padronizados e mesas
-- Execute no painel SQL do Supabase com usuário com permissão (owner)

-- PEDIDOS_PADRONIZADOS ---------------------------------------------------
ALTER TABLE IF EXISTS public.pedidos_padronizados ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas conflitantes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pedidos_padronizados'
  ) THEN
    DELETE FROM pg_policies WHERE schemaname='public' AND tablename='pedidos_padronizados';
  END IF;
END $$;

-- Políticas corretas
CREATE POLICY pedidos_select ON public.pedidos_padronizados
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = pedidos_padronizados.id_restaurante
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY pedidos_insert ON public.pedidos_padronizados
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = pedidos_padronizados.id_restaurante
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY pedidos_update ON public.pedidos_padronizados
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = pedidos_padronizados.id_restaurante
      AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = pedidos_padronizados.id_restaurante
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY pedidos_delete ON public.pedidos_padronizados
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = pedidos_padronizados.id_restaurante
      AND r.user_id = auth.uid()
  )
);

-- MESAS ------------------------------------------------------------------
ALTER TABLE IF EXISTS public.mesas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mesas'
  ) THEN
    DELETE FROM pg_policies WHERE schemaname='public' AND tablename='mesas';
  END IF;
END $$;

CREATE POLICY mesas_select ON public.mesas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = mesas.id_restaurante
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY mesas_insert ON public.mesas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = mesas.id_restaurante
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY mesas_update ON public.mesas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = mesas.id_restaurante
      AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = mesas.id_restaurante
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY mesas_delete ON public.mesas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurantes_app r
    WHERE r.id = mesas.id_restaurante
      AND r.user_id = auth.uid()
  )
);

-- Verificações rápidas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename in ('pedidos_padronizados','mesas')
ORDER BY tablename, cmd;


