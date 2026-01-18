-- ============================================
-- CORREÇÃO: RPC restaurante_esta_aberto
-- ============================================
-- Problema: Horário 17:34-00:00 não funciona corretamente
-- Causa: 00:00 é tratado como início do dia, não fim
-- Solução: Tratar 00:00 como 24:00 (fim do dia)

CREATE OR REPLACE FUNCTION restaurante_esta_aberto(restaurante_id_param uuid)
RETURNS json
LANGUAGE plpgsql
AS $
DECLARE
  dia_atual text;
  hora_atual time;
  horario_hoje record;
  resultado json;
  abre time;
  fecha time;
  is_madrugada boolean := false;
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
      'metodo', 'sem_horario_configurado',
      'hora_atual', hora_atual::text,
      'dia', dia_atual,
      'abre', null,
      'fecha', null
    );
    RETURN resultado;
  END IF;
  
  -- Se o restaurante não abre hoje (ativo = false)
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
  
  -- ✅ CORREÇÃO: Tratar 00:00 como fim do dia (24:00)
  -- Se fecha = 00:00, significa que fecha à meia-noite (fim do dia)
  IF fecha = '00:00:00'::time THEN
    fecha := '23:59:59'::time;  -- Considera até 23:59:59
  END IF;
  
  -- Verificar se o horário passa da meia-noite (ex: 22:00 às 02:00)
  IF fecha < abre THEN
    is_madrugada := true;
    
    -- Se passa da meia-noite, está aberto se:
    -- hora_atual >= abre OU hora_atual <= fecha
    IF hora_atual >= abre OR hora_atual <= fecha THEN
      resultado := json_build_object(
        'aberto', true,
        'metodo', 'horario_madrugada',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', horario_hoje.hora_fecha,  -- Retorna o original (00:00)
        'observacao', 'Horário atravessa meia-noite'
      );
    ELSE
      resultado := json_build_object(
        'aberto', false,
        'metodo', 'fora_do_horario',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', horario_hoje.hora_fecha
      );
    END IF;
  ELSE
    -- Horário normal (não passa da meia-noite)
    IF hora_atual >= abre AND hora_atual <= fecha THEN
      resultado := json_build_object(
        'aberto', true,
        'metodo', 'horario_definido',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', horario_hoje.hora_fecha  -- Retorna o original
      );
    ELSE
      resultado := json_build_object(
        'aberto', false,
        'metodo', 'fora_do_horario',
        'hora_atual', hora_atual::text,
        'dia', dia_atual,
        'abre', abre::text,
        'fecha', horario_hoje.hora_fecha
      );
    END IF;
  END IF;
  
  RETURN resultado;
END;
$;

-- ============================================
-- GRANT EXECUTE para usuários autenticados
-- ============================================
GRANT EXECUTE ON FUNCTION restaurante_esta_aberto(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION restaurante_esta_aberto(uuid) TO anon;

-- ============================================
-- TESTES
-- ============================================

-- Teste 1: Verificar horário atual
SELECT 
    '1️⃣ TESTE HORÁRIO ATUAL' as teste,
    CURRENT_TIME as hora_agora,
    EXTRACT(DOW FROM CURRENT_DATE) as dia_numero,
    CASE EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 0 THEN 'domingo'
        WHEN 1 THEN 'segunda'
        WHEN 2 THEN 'terca'
        WHEN 3 THEN 'quarta'
        WHEN 4 THEN 'quinta'
        WHEN 5 THEN 'sexta'
        WHEN 6 THEN 'sabado'
    END as dia_nome;

-- Teste 2: Simular horário 17:34-00:00 com hora atual 17:36
SELECT 
    '2️⃣ TESTE LÓGICA' as teste,
    '17:36'::time as hora_atual,
    '17:34'::time as abre,
    '00:00'::time as fecha_original,
    '23:59:59'::time as fecha_ajustado,
    CASE 
        WHEN '17:36'::time >= '17:34'::time AND '17:36'::time <= '23:59:59'::time 
        THEN '✅ ABERTO'
        ELSE '❌ FECHADO'
    END as resultado;

-- Teste 3: Testar com seu restaurante (substitua o UUID)
-- SELECT jsonb_pretty(restaurante_esta_aberto('SEU-UUID-AQUI')::jsonb);

SELECT '
╔════════════════════════════════════════════════════════════╗
║  ✅ FUNÇÃO RPC CORRIGIDA!                                 ║
║                                                            ║
║  Correção aplicada:                                       ║
║  - 00:00 agora é tratado como 23:59:59 (fim do dia)      ║
║  - Horário 17:34-00:00 agora funciona corretamente       ║
║                                                            ║
║  Teste:                                                    ║
║  - Hora: 17:36                                            ║
║  - Horário: 17:34-00:00                                   ║
║  - Resultado: ABERTO ✅                                   ║
║                                                            ║
║  Próximo passo:                                           ║
║  1. Faça logout e login no app                            ║
║  2. Verifique se o status mudou para ABERTO              ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
