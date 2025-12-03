-- ============================================
-- VERIFICAR E CRIAR RPC restaurante_esta_aberto
-- ============================================

-- 1. Verificar se a função RPC existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'restaurante_esta_aberto'
  AND routine_schema = 'public';

-- 2. Se a função não existir, criar ela
-- Execute este comando apenas se a consulta acima não retornar nenhum resultado

CREATE OR REPLACE FUNCTION restaurante_esta_aberto(restaurante_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  dia_atual integer;
  hora_atual time;
  horario_hoje record;
  resultado json;
BEGIN
  -- Obter dia da semana atual (0 = domingo, 6 = sábado)
  dia_atual := EXTRACT(DOW FROM CURRENT_DATE);
  
  -- Obter hora atual
  hora_atual := CURRENT_TIME;
  
  -- Buscar horário configurado para hoje
  SELECT * INTO horario_hoje
  FROM restaurantes_horarios
  WHERE restaurantes_horarios.restaurante_id = restaurante_esta_aberto.restaurante_id
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
  
  -- Se o restaurante não abre hoje (is_open = false)
  IF NOT horario_hoje.is_open THEN
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'fechado_hoje'
    );
    RETURN resultado;
  END IF;
  
  -- Verificar se está dentro do horário de funcionamento
  IF hora_atual >= horario_hoje.abre_as AND hora_atual <= horario_hoje.fecha_as THEN
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

-- 3. Testar a função RPC
-- Substitua 'seu-restaurante-id' pelo ID real do seu restaurante
-- SELECT * FROM restaurante_esta_aberto('seu-restaurante-id');

-- 4. Verificar a estrutura da tabela restaurantes_horarios
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_horarios'
ORDER BY ordinal_position;

-- 5. Ver todos os horários cadastrados
SELECT 
  rh.id,
  ra.nome_fantasia,
  rh.dia_semana,
  CASE rh.dia_semana
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda-feira'
    WHEN 2 THEN 'Terça-feira'
    WHEN 3 THEN 'Quarta-feira'
    WHEN 4 THEN 'Quinta-feira'
    WHEN 5 THEN 'Sexta-feira'
    WHEN 6 THEN 'Sábado'
  END as dia_nome,
  rh.abre_as,
  rh.fecha_as,
  rh.is_open
FROM restaurantes_horarios rh
LEFT JOIN restaurantes_app ra ON ra.id = rh.restaurante_id
ORDER BY rh.restaurante_id, rh.dia_semana;

-- ============================================
-- COMANDOS ÚTEIS PARA TESTES
-- ============================================

-- Testar RPC para um restaurante específico
-- SELECT * FROM restaurante_esta_aberto('seu-restaurante-id');

-- Ver horário de hoje para um restaurante
-- SELECT * FROM restaurantes_horarios 
-- WHERE restaurante_id = 'seu-restaurante-id' 
--   AND dia_semana = EXTRACT(DOW FROM CURRENT_DATE);

-- Atualizar horário de um dia específico
-- UPDATE restaurantes_horarios 
-- SET abre_as = '10:00', fecha_as = '23:00', is_open = true
-- WHERE restaurante_id = 'seu-restaurante-id' AND dia_semana = 1;

-- Marcar um dia como fechado
-- UPDATE restaurantes_horarios 
-- SET is_open = false
-- WHERE restaurante_id = 'seu-restaurante-id' AND dia_semana = 0;
