-- ============================================
-- RPC ATUALIZADA: restaurante_esta_aberto v3 (Com Ativo/Pausado)
-- ============================================
-- Retorna informações completas sobre o status do restaurante
-- Considera os campos 'ativo' e 'pausado' da tabela restaurantes_app

CREATE OR REPLACE FUNCTION restaurante_esta_aberto(restaurante_id_param uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  dia_atual text;
  hora_atual time;
  horario_hoje record;
  dados_app record;
  resultado json;
  abre time;
  fecha time;
  is_madrugada boolean := false;
BEGIN
  -- 1. Verificar status global na tabela restaurantes_app
  SELECT ativo, pausado INTO dados_app
  FROM restaurantes_app
  WHERE id = restaurante_id_param;

  -- Se o restaurante não existe ou está marcado como inativo globalmente
  IF NOT FOUND OR NOT COALESCE(dados_app.ativo, true) THEN
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'desativado_manualmente',
      'hora_atual', CURRENT_TIME::text,
      'pausado', COALESCE(dados_app.pausado, false)
    );
    RETURN resultado;
  END IF;

  -- Se o restaurante está pausado
  IF COALESCE(dados_app.pausado, false) THEN
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'pausado_manualmente',
      'hora_atual', CURRENT_TIME::text,
      'pausado', true
    );
    RETURN resultado;
  END IF;

  -- 2. Lógica de horários (dia da semana)
  dia_atual := CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
  END;
  
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
      'metodo', 'sem_horario_configurado',
      'hora_atual', hora_atual::text,
      'dia', dia_atual,
      'abre', null,
      'fecha', null
    );
    RETURN resultado;
  END IF;
  
  -- Se o restaurante não abre no dia de hoje conforme configuração
  IF NOT horario_hoje.ativo THEN
    resultado := json_build_object(
      'aberto', false,
      'metodo', 'fechado_hoje',
      'hora_atual', hora_atual::text,
      'dia', dia_atual,
      'abre', horario_hoje.hora_abre,
      'fecha', horario_hoje.hora_fecha
    );
    RETURN resultado;
  END IF;
  
  -- Converter horários para time
  abre := horario_hoje.hora_abre::time;
  fecha := horario_hoje.hora_fecha::time;
  
  -- Verificar se o horário passa da meia-noite (ex: 22:00 às 02:00)
  IF fecha < abre THEN
    is_madrugada := true;
    
    IF hora_atual >= abre OR hora_atual <= fecha THEN
      resultado := json_build_object(
        'aberto', true,
        'metodo', 'horario_madrugada',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', fecha::text
      );
    ELSE
      resultado := json_build_object(
        'aberto', false,
        'metodo', 'fora_do_horario',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', fecha::text
      );
    END IF;
  ELSE
    -- Horário normal
    IF hora_atual >= abre AND hora_atual <= fecha THEN
      resultado := json_build_object(
        'aberto', true,
        'metodo', 'horario_definido',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', fecha::text
      );
    ELSE
      resultado := json_build_object(
        'aberto', false,
        'metodo', 'fora_do_horario',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', fecha::text
      );
    END IF;
  END IF;
  
  RETURN resultado;
END;
$$;
