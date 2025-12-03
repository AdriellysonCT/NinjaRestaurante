-- ============================================
-- CORREÇÃO IMEDIATA: Permissões RLS para Status Ativo
-- ============================================

-- PASSO 1: Ver o estado atual
SELECT 
  id,
  user_id,
  nome_fantasia,
  ativo
FROM restaurantes_app
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- PASSO 2: Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurantes_app';

-- PASSO 3: Ver políticas atuais
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'restaurantes_app';

-- ============================================
-- SOLUÇÃO 1: Remover todas as políticas antigas
-- ============================================

DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'restaurantes_app'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON restaurantes_app', pol.policyname);
    RAISE NOTICE 'Política removida: %', pol.policyname;
  END LOOP;
END $$;

-- ============================================
-- SOLUÇÃO 2: Criar políticas corretas
-- ============================================

-- Política para SELECT
CREATE POLICY "restaurantes_select_policy"
ON restaurantes_app
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para INSERT
CREATE POLICY "restaurantes_insert_policy"
ON restaurantes_app
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para UPDATE (IMPORTANTE!)
CREATE POLICY "restaurantes_update_policy"
ON restaurantes_app
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para DELETE
CREATE POLICY "restaurantes_delete_policy"
ON restaurantes_app
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- SOLUÇÃO 3: Garantir que RLS está habilitado
-- ============================================

ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TESTE: Atualizar manualmente
-- ============================================

-- Atualizar para TRUE
UPDATE restaurantes_app 
SET ativo = true 
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- Verificar se funcionou
SELECT 
  id,
  nome_fantasia,
  ativo,
  updated_at
FROM restaurantes_app
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Ver políticas criadas
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'restaurantes_app'
ORDER BY cmd;

-- Ver se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'restaurantes_app';

-- ============================================
-- SE AINDA NÃO FUNCIONAR: Solução Temporária
-- ============================================

-- OPÇÃO A: Desabilitar RLS temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)
-- ALTER TABLE restaurantes_app DISABLE ROW LEVEL SECURITY;

-- OPÇÃO B: Criar política super permissiva (APENAS PARA DEBUG)
-- DROP POLICY IF EXISTS "temp_allow_all" ON restaurantes_app;
-- CREATE POLICY "temp_allow_all"
-- ON restaurantes_app
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ============================================
-- LOGS PARA DEBUG
-- ============================================

-- Ver todos os restaurantes
SELECT 
  id,
  user_id,
  nome_fantasia,
  ativo,
  created_at,
  updated_at
FROM restaurantes_app
ORDER BY updated_at DESC;

-- Contar por status
SELECT 
  ativo,
  COUNT(*) as total
FROM restaurantes_app
GROUP BY ativo;
