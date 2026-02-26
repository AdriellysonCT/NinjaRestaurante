-- ============================================
-- DEBUG: Salvamento de Horários
-- ============================================

-- 1. Ver estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_horarios'
ORDER BY ordinal_position;

-- 2. Ver dados atuais
SELECT * FROM restaurantes_horarios;

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'restaurantes_horarios';

-- 4. Ver políticas RLS
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurantes_horarios';

-- 5. TESTE MANUAL: Inserir um horário
-- Substitua 'seu-restaurante-id' pelo ID real
/*
INSERT INTO restaurantes_horarios 
(restaurante_id, dia_semana, hora_abre, hora_fecha, ativo)
VALUES 
('ebb3d612-744e-455b-a035-aee21c49e4af', 'segunda', '11:00', '22:00', true);
*/

-- 6. Ver se foi inserido
-- SELECT * FROM restaurantes_horarios 
-- WHERE restaurante_id = 'ebb3d612-744e-455b-a035-aee21c49e4af';

-- ============================================
-- CRIAR POLÍTICAS RLS SE NÃO EXISTIREM
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "horarios_select_policy" ON restaurantes_horarios;
DROP POLICY IF EXISTS "horarios_insert_policy" ON restaurantes_horarios;
DROP POLICY IF EXISTS "horarios_update_policy" ON restaurantes_horarios;
DROP POLICY IF EXISTS "horarios_delete_policy" ON restaurantes_horarios;

-- Criar políticas novas
CREATE POLICY "horarios_select_policy"
ON restaurantes_horarios FOR SELECT TO authenticated
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
);

CREATE POLICY "horarios_insert_policy"
ON restaurantes_horarios FOR INSERT TO authenticated
WITH CHECK (
  restaurante_id IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
);

CREATE POLICY "horarios_update_policy"
ON restaurantes_horarios FOR UPDATE TO authenticated
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  restaurante_id IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
);

CREATE POLICY "horarios_delete_policy"
ON restaurantes_horarios FOR DELETE TO authenticated
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
);

-- Habilitar RLS
ALTER TABLE restaurantes_horarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICAR NOVAMENTE
-- ============================================

-- Ver políticas criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'restaurantes_horarios'
ORDER BY cmd;

-- Ver se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurantes_horarios';

-- ============================================
-- TESTE FINAL
-- ============================================

-- Tentar inserir novamente
/*
INSERT INTO restaurantes_horarios 
(restaurante_id, dia_semana, hora_abre, hora_fecha, ativo)
VALUES 
('ebb3d612-744e-455b-a035-aee21c49e4af', 'terca', '11:00', '22:00', true);
*/

-- Ver resultado
-- SELECT * FROM restaurantes_horarios 
-- WHERE restaurante_id = 'ebb3d612-744e-455b-a035-aee21c49e4af'
-- ORDER BY 
--   CASE dia_semana
--     WHEN 'domingo' THEN 0
--     WHEN 'segunda' THEN 1
--     WHEN 'terca' THEN 2
--     WHEN 'quarta' THEN 3
--     WHEN 'quinta' THEN 4
--     WHEN 'sexta' THEN 5
--     WHEN 'sabado' THEN 6
--   END;
