-- ============================================
-- DIAGNÓSTICO RÁPIDO - RESTAURANTES E RLS
-- ============================================
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- 1️⃣ VERIFICAR USUÁRIO AUTENTICADO
SELECT 
  'USUÁRIO ATUAL' as tipo,
  auth.uid() as user_id,
  auth.email() as email;

-- 2️⃣ VERIFICAR SE A TABELA EXISTE
SELECT 
  'TABELA RESTAURANTES_APP' as tipo,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'restaurantes_app'
  ) as existe;

-- 3️⃣ VERIFICAR COLUNAS DA TABELA
SELECT 
  'COLUNAS' as tipo,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;

-- 4️⃣ VERIFICAR RLS HABILITADO
SELECT 
  'RLS STATUS' as tipo,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'restaurantes_app';

-- 5️⃣ VERIFICAR POLÍTICAS EXISTENTES
SELECT 
  'POLÍTICAS ATUAIS' as tipo,
  policyname as nome_politica,
  cmd as operacao,
  permissive as permissivo
FROM pg_policies
WHERE tablename = 'restaurantes_app'
ORDER BY policyname;

-- 6️⃣ VERIFICAR SE EXISTE RESTAURANTE PARA O USUÁRIO
SELECT 
  'RESTAURANTES DO USUÁRIO' as tipo,
  COUNT(*) as quantidade
FROM restaurantes_app
WHERE user_id = auth.uid();

-- 7️⃣ VER DADOS DO RESTAURANTE (se existir)
SELECT 
  'DADOS DO RESTAURANTE' as tipo,
  id,
  user_id,
  nome,
  created_at
FROM restaurantes_app
WHERE user_id = auth.uid()
LIMIT 1;

-- 8️⃣ VERIFICAR TOTAL DE RESTAURANTES (admin)
-- Descomente se você tiver permissões de admin
-- SELECT 
--   'TOTAL DE RESTAURANTES' as tipo,
--   COUNT(*) as total
-- FROM restaurantes_app;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Usuário: deve mostrar seu ID e email
-- ✅ Tabela: deve existir (true)
-- ✅ Colunas: deve ter id, user_id, nome, etc
-- ✅ RLS: deve estar habilitado (true)
-- ✅ Políticas: deve ter 4 políticas (select, insert, update, delete)
-- ✅ Quantidade: deve ser >= 1
-- ✅ Dados: deve mostrar seu restaurante

-- ============================================
-- SE NÃO HOUVER RESTAURANTE
-- ============================================
-- Execute este comando para criar um:

-- INSERT INTO restaurantes_app (id, user_id, nome, created_at)
-- VALUES (
--   gen_random_uuid(),
--   auth.uid(),
--   'Meu Restaurante',
--   NOW()
-- )
-- RETURNING *;

