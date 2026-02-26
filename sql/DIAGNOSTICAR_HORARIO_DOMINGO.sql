-- ============================================
-- DIAGNÓSTICO: Horário de Domingo
-- ============================================
-- Problema: Domingo configurado 17:34-00:00, agora 17:36, mas mostra FECHADO
-- Hora atual: 17:36 (dentro do horário 17:34-00:00)

-- 1. VERIFICAR HORA ATUAL DO SERVIDOR
SELECT 
    '1️⃣ HORA ATUAL' as etapa,
    NOW() as hora_servidor,
    NOW()::time as hora_apenas,
    EXTRACT(DOW FROM NOW()) as dia_semana_numero,
    CASE EXTRACT(DOW FROM NOW())
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
    END as dia_semana_nome;

-- 2. VERIFICAR HORÁRIO DE DOMINGO NO BANCO
SELECT 
    '2️⃣ HORÁRIO DOMINGO' as etapa,
    id,
    restaurante_id,
    dia_semana,
    hora_abre,
    hora_fecha,
    ativo,
    CASE 
        WHEN ativo THEN '✅ Aberto'
        ELSE '❌ Fechado'
    END as status
FROM restaurantes_horarios
WHERE dia_semana = 'domingo';

-- 3. TESTAR LÓGICA DE HORÁRIO
WITH hora_atual AS (
    SELECT NOW()::time as agora
),
horario_domingo AS (
    SELECT 
        hora_abre::time as abre,
        hora_fecha::time as fecha,
        ativo
    FROM restaurantes_horarios
    WHERE dia_semana = 'domingo'
    LIMIT 1
)
SELECT 
    '3️⃣ TESTE DE LÓGICA' as etapa,
    ha.agora as hora_atual,
    hd.abre as hora_abre,
    hd.fecha as hora_fecha,
    hd.ativo as dia_ativo,
    CASE 
        WHEN NOT hd.ativo THEN 'Dia marcado como FECHADO'
        WHEN hd.fecha < hd.abre THEN 'Horário atravessa meia-noite'
        WHEN ha.agora >= hd.abre AND ha.agora < hd.fecha THEN 'DENTRO do horário'
        ELSE 'FORA do horário'
    END as analise,
    CASE 
        WHEN NOT hd.ativo THEN FALSE
        WHEN hd.fecha < hd.abre THEN 
            -- Horário atravessa meia-noite (ex: 18:00-02:00)
            (ha.agora >= hd.abre OR ha.agora < hd.fecha)
        ELSE 
            -- Horário normal (ex: 11:00-22:00)
            (ha.agora >= hd.abre AND ha.agora < hd.fecha)
    END as deveria_estar_aberto
FROM hora_atual ha, horario_domingo hd;

-- 4. VERIFICAR FUNÇÃO RPC
SELECT 
    '4️⃣ TESTAR RPC' as etapa,
    'Execute manualmente: SELECT * FROM restaurante_esta_aberto(''SEU-UUID-AQUI'');' as instrucao;

-- 5. VERIFICAR SE HÁ PROBLEMA COM TIMEZONE
SELECT 
    '5️⃣ TIMEZONE' as etapa,
    current_setting('TIMEZONE') as timezone_banco,
    NOW() as hora_com_timezone,
    NOW() AT TIME ZONE 'UTC' as hora_utc,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as hora_brasil;

-- 6. ANÁLISE DO PROBLEMA
SELECT 
    '6️⃣ ANÁLISE' as etapa,
    CASE 
        WHEN '17:36'::time >= '17:34'::time AND '17:36'::time < '00:00'::time 
        THEN '✅ Deveria estar ABERTO (17:36 está entre 17:34 e 00:00)'
        ELSE '❌ Deveria estar FECHADO'
    END as resultado_esperado,
    CASE 
        WHEN '00:00'::time < '17:34'::time 
        THEN '⚠️ PROBLEMA: Horário atravessa meia-noite (17:34-00:00)'
        ELSE '✅ Horário normal'
    END as tipo_horario;

-- 7. SOLUÇÃO PARA HORÁRIO QUE ATRAVESSA MEIA-NOITE
SELECT 
    '7️⃣ EXPLICAÇÃO' as etapa,
    'Horário 17:34-00:00 significa: Abre 17:34 e fecha à meia-noite' as interpretacao,
    'Se quer ficar aberto até a madrugada, use: 17:34-02:00 (por exemplo)' as sugestao,
    'Lógica correta: hora >= 17:34 OR hora < 00:00 (sempre falso, pois 00:00 é meia-noite)' as logica;

SELECT '
╔════════════════════════════════════════════════════════════╗
║  DIAGNÓSTICO CONCLUÍDO                                     ║
║                                                            ║
║  Problema identificado:                                    ║
║  - Horário: 17:34-00:00                                   ║
║  - Hora atual: 17:36                                      ║
║  - Status: FECHADO (incorreto)                            ║
║                                                            ║
║  Possíveis causas:                                        ║
║  1. Função RPC não trata horário que atravessa meia-noite║
║  2. Timezone diferente entre servidor e banco             ║
║  3. Campo "ativo" está FALSE                              ║
║                                                            ║
║  Próximo passo: Verificar função restaurante_esta_aberto ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
