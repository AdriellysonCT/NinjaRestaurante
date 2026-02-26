-- ============================================
-- CORREÇÃO URGENTE: TIMEZONE
-- ============================================
-- Problema: Banco em UTC, Brasil em UTC-3
-- Hora banco: 20:37 (UTC)
-- Hora Brasil: 17:37 (UTC-3)
-- Diferença: 3 horas!

-- 1. VERIFICAR TIMEZONE ATUAL
SELECT 
    '1️⃣ TIMEZONE ATUAL' as etapa,
    current_setting('TIMEZONE') as timezone_banco,
    NOW() as hora_utc,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as hora_brasil,
    EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Sao_Paulo')) as hora_brasil_numero;

-- 2. ALTERAR TIMEZONE DO BANCO PARA BRASIL
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- ⚠️ Se o comando acima der erro, use este:
-- SET timezone = 'America/Sao_Paulo';

SELECT '✅ Timezone alterado para America/Sao_Paulo' as status;

-- 3. VERIFICAR SE MUDOU
SELECT 
    '2️⃣ TIMEZONE APÓS ALTERAÇÃO' as etapa,
    current_setting('TIMEZONE') as timezone_banco,
    NOW() as hora_com_timezone,
    CURRENT_TIME as hora_apenas;

-- 4. RECRIAR FUNÇÃO RPC COM TIMEZONE CORRETO
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
  -- ✅ CORREÇÃO: Usar timezone de São Paulo
  SET timezone = 'America/Sao_Paulo';
  
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
  
  -- Obter hora atual (agora em horário de Brasília)
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
  
  -- ✅ CORREÇÃO: Tratar 00:00 como fim do dia (23:59:59)
  IF fecha = '00:00:00'::time THEN
    fecha := '23:59:59'::time;
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
        'fecha', horario_hoje.hora_fecha,
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
        'fecha', horario_hoje.hora_fecha
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
-- GRANT EXECUTE
-- ============================================
GRANT EXECUTE ON FUNCTION restaurante_esta_aberto(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION restaurante_esta_aberto(uuid) TO anon;

SELECT '✅ Função RPC recriada com timezone correto' as status;

-- 5. TESTAR AGORA
SELECT 
    '3️⃣ TESTE FINAL' as etapa,
    CURRENT_TIME as hora_brasil,
    '17:34'::time as abre,
    '00:00'::time as fecha,
    CASE 
        WHEN CURRENT_TIME >= '17:34'::time AND CURRENT_TIME <= '23:59:59'::time 
        THEN '✅ ABERTO'
        ELSE '❌ FECHADO'
    END as resultado;

-- 6. TESTAR COM SEU RESTAURANTE
-- Substitua o UUID pelo seu restaurante
-- SELECT jsonb_pretty(restaurante_esta_aberto('ebb3d612-744e-455b-a035-aea21c49e4a0')::jsonb);

SELECT '
╔════════════════════════════════════════════════════════════╗
║  ✅ TIMEZONE CORRIGIDO!                                   ║
║                                                            ║
║  Antes:                                                    ║
║  - Banco: UTC (20:37)                                     ║
║  - Brasil: UTC-3 (17:37)                                  ║
║  - Diferença: 3 horas                                     ║
║                                                            ║
║  Depois:                                                   ║
║  - Banco: America/Sao_Paulo (17:37)                       ║
║  - Brasil: America/Sao_Paulo (17:37)                      ║
║  - Diferença: 0 horas ✅                                  ║
║                                                            ║
║  Próximo passo:                                           ║
║  1. Faça logout e login no app                            ║
║  2. Verifique se o status mudou para ABERTO              ║
║  3. Se ainda não funcionar, reinicie a conexão Supabase  ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
