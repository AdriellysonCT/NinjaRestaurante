-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS - RESTAURANTES
-- ============================================
-- Este script corrige o problema de recursão infinita
-- nas políticas RLS da tabela restaurantes_app

-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "select_own_restaurant" ON restaurantes_app;
DROP POLICY IF EXISTS "insert_own_restaurant" ON restaurantes_app;
DROP POLICY IF EXISTS "update_own_restaurant" ON restaurantes_app;
DROP POLICY IF EXISTS "delete_own_restaurant" ON restaurantes_app;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS SIMPLES E SEGURAS (SEM RECURSÃO)

-- Política para SELECT (leitura)
CREATE POLICY "restaurantes_select_policy"
ON restaurantes_app
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Política para INSERT (criação)
CREATE POLICY "restaurantes_insert_policy"
ON restaurantes_app
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Política para UPDATE (atualização)
CREATE POLICY "restaurantes_update_policy"
ON restaurantes_app
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Política para DELETE (exclusão)
CREATE POLICY "restaurantes_delete_policy"
ON restaurantes_app
FOR DELETE
USING (
  auth.uid() = user_id
);

-- 4. VERIFICAR SE A TABELA TEM A COLUNA user_id
-- Se não tiver, este comando falhará e você precisará adicionar a coluna

-- 5. GARANTIR QUE EXISTE UM ÍNDICE NA COLUNA user_id
CREATE INDEX IF NOT EXISTS idx_restaurantes_app_user_id 
ON restaurantes_app(user_id);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- COMO USAR:
-- 1. Copie todo este código
-- 2. Acesse o Supabase Dashboard
-- 3. Vá em SQL Editor
-- 4. Cole e execute o código
-- 5. Recarregue a aplicação

-- VERIFICAÇÃO:
-- Execute para ver as políticas criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'restaurantes_app';

