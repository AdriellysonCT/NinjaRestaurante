-- ============================================
-- CORREÇÃO: Tabela restaurantes_horarios
-- ============================================

-- 1. Ver estrutura atual
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

-- 3. Criar RPC atualizada para a estrutura correta
CREATE OR REPLACE FUNCTION restaurante_esta_aberto(restaurante_id_param uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  dia_atual text;
  hora_atual time;
  horario_hoje record;
  resultado json;
BEGIN
  -- Obter dia da semana atual em português
  dia_atual := CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
  END;
  
  -- Obter hora atual
  hora_atual := CURRENT_TIME;
  
  -- Buscar horário configurado para hoje
  SELECT * INTO horario_hoje
  FROM restaurantes_horarios
  WHERE restaurantes_horarios.restaurante_id = restaurante_id_param
    AND dia_semana = dia_atual
  LIMIT 1;
  
  -- Se não encontrou horário configurado para hoje
  IF NOT FOUND THEN
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'sem_horario_configurado'
    );
    RETURN resultado;
  END IF;
  
  -- Se o restaurante não abre hoje (ativo = false)
  IF NOT horario_hoje.ativo THEN
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'fechado_hoje'
    );
    RETURN resultado;
  END IF;
  
  -- Verificar se está dentro do horário de funcionamento
  IF hora_atual >= horario_hoje.hora_abre::time AND hora_atual <= horario_hoje.hora_fecha::time THEN
    resultado := json_build_object(
      'aberto', true,
      'metodo', 'horario_definido'
    );
  ELSE
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'fora_do_horario'
    );
  END IF;
  
  RETURN resultado;
END;
$$;

-- 4. Testar a RPC
-- SELECT * FROM restaurante_esta_aberto('seu-restaurante-id');

-- 5. Criar políticas RLS se não existirem
DO $$ 
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'restaurantes_horarios' 
      AND policyname = 'horarios_select_policy'
  ) THEN
    CREATE POLICY "horarios_select_policy"
    ON restaurantes_horarios FOR SELECT TO authenticated
    USING (
      restaurante_id IN (
        SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE '✅ Política SELECT criada';
  END IF;
  
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'restaurantes_horarios' 
      AND policyname = 'horarios_insert_policy'
  ) THEN
    CREATE POLICY "horarios_insert_policy"
    ON restaurantes_horarios FOR INSERT TO authenticated
    WITH CHECK (
      restaurante_id IN (
        SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE '✅ Política INSERT criada';
  END IF;
  
  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'restaurantes_horarios' 
      AND policyname = 'horarios_update_policy'
  ) THEN
    CREATE POLICY "horarios_update_policy"
    ON restaurantes_horarios FOR UPDATE TO authenticated
    USING (
      restaurante_id IN (
        SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
      )
    );
    RAISE NOTICE '✅ Política UPDATE criada';
  END IF;
END $$;

-- 6. Habilitar RLS
ALTER TABLE restaurantes_horarios ENABLE ROW LEVEL SECURITY;

-- 7. Ver políticas criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'restaurantes_horarios';

-- ============================================
-- TESTE MANUAL
-- ============================================

-- Inserir horário de teste
-- INSERT INTO restaurantes_horarios 
-- (restaurante_id, dia_semana, hora_abre, hora_fecha, ativo)
-- VALUES 
-- ('seu-restaurante-id', 'segunda', '10:00', '22:00', true);

-- Ver horários do restaurante
-- SELECT * FROM restaurantes_horarios 
-- WHERE restaurante_id = 'seu-restaurante-id'
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
