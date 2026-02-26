-- ============================================
-- TESTE URGENTE: Status Ativo
-- ============================================

-- 1. Ver o restaurante atual
SELECT 
  id,
  user_id,
  nome_fantasia,
  ativo,
  created_at,
  updated_at
FROM restaurantes_app
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- 2. TESTE MANUAL: Atualizar para TRUE
UPDATE restaurantes_app 
SET ativo = true 
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- 3. Verificar se funcionou
SELECT 
  id,
  nome_fantasia,
  ativo,
  updated_at
FROM restaurantes_app
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- 4. Verificar permissões RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurantes_app';

-- 5. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'restaurantes_app';

-- 6. Ver todas as colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;

-- ============================================
-- SE O UPDATE MANUAL NÃO FUNCIONAR
-- ============================================

-- Desabilitar RLS temporariamente (APENAS PARA TESTE)
-- ALTER TABLE restaurantes_app DISABLE ROW LEVEL SECURITY;

-- Tentar UPDATE novamente
-- UPDATE restaurantes_app 
-- SET ativo = true 
-- WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- Reabilitar RLS
-- ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CRIAR/ATUALIZAR POLÍTICAS RLS
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem atualizar próprio restaurante" ON restaurantes_app;
DROP POLICY IF EXISTS "Users can update own restaurant" ON restaurantes_app;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON restaurantes_app;

-- Criar política permissiva para UPDATE
CREATE POLICY "Permitir UPDATE para próprio restaurante"
ON restaurantes_app
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Criar política permissiva para SELECT
CREATE POLICY "Permitir SELECT para próprio restaurante"
ON restaurantes_app
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- VERIFICAR NOVAMENTE
-- ============================================

-- Ver políticas criadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurantes_app';

-- Testar UPDATE novamente
UPDATE restaurantes_app 
SET ativo = true 
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- Verificar resultado
SELECT id, nome_fantasia, ativo, updated_at
FROM restaurantes_app
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';
