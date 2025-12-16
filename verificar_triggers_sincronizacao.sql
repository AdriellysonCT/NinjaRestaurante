-- ============================================================================
-- VERIFICAÇÃO DE TRIGGERS DE SINCRONIZAÇÃO
-- ============================================================================
-- 
-- Este script verifica se as triggers de sincronização estão configuradas
-- corretamente e não causam loops infinitos.
-- ============================================================================

-- 1. Listar todas as triggers relacionadas a sincronização
SELECT 
  trigger_name,
  event_object_table AS tabela,
  event_manipulation AS evento,
  action_timing AS timing,
  action_statement AS funcao
FROM information_schema.triggers
WHERE trigger_name LIKE '%sync%'
ORDER BY event_object_table, trigger_name;

-- 2. Verificar funções de sincronização
SELECT 
  routine_name AS funcao,
  routine_type AS tipo,
  routine_definition AS definicao
FROM information_schema.routines
WHERE routine_name LIKE '%sync%'
ORDER BY routine_name;

-- 3. Verificar se há triggers conflitantes
SELECT 
  t1.trigger_name AS trigger1,
  t2.trigger_name AS trigger2,
  t1.event_object_table AS tabela,
  t1.event_manipulation AS evento
FROM information_schema.triggers t1
JOIN information_schema.triggers t2 
  ON t1.event_object_table = t2.event_object_table
  AND t1.event_manipulation = t2.event_manipulation
  AND t1.trigger_name < t2.trigger_name
WHERE t1.trigger_name LIKE '%sync%' OR t2.trigger_name LIKE '%sync%';

-- 4. Análise de Prevenção de Loops
-- ============================================================================
-- 
-- TRIGGER 1: trg_sync_pedido_para_entrega
-- - Tabela: pedidos_padronizados
-- - Evento: AFTER UPDATE OF status
-- - Ação: INSERT em entregas_padronizadas (quando status = 'pronto_para_entrega')
-- - Prevenção de loop: Apenas INSERT, nunca UPDATE
-- 
-- TRIGGER 2: trg_sync_entrega_para_pedido
-- - Tabela: entregas_padronizadas
-- - Evento: AFTER UPDATE OF status
-- - Ação: UPDATE em pedidos_padronizados
-- - Prevenção de loop: Verifica se status já é o mesmo antes de atualizar
-- 
-- CONCLUSÃO: NÃO HÁ RISCO DE LOOP INFINITO
-- - Trigger 1 apenas faz INSERT (não dispara Trigger 2)
-- - Trigger 2 verifica status antes de UPDATE (não dispara Trigger 1 novamente)
-- ============================================================================

-- 5. Teste de Integridade
-- Verificar se há pedidos com status diferente de suas entregas
SELECT 
  p.numero_pedido,
  p.status AS status_pedido,
  e.status AS status_entrega,
  p.id_entregador AS entregador_pedido,
  e.id_entregador AS entregador_entrega,
  CASE 
    WHEN p.status != e.status THEN '⚠️ INCONSISTENTE'
    ELSE '✅ OK'
  END AS situacao
FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'
  AND p.status IN ('aceito', 'coletado', 'concluido')
ORDER BY p.criado_em DESC
LIMIT 20;

-- 6. Estatísticas de Sincronização
SELECT 
  'Total de pedidos delivery' AS metrica,
  COUNT(*) AS valor
FROM pedidos_padronizados
WHERE tipo_pedido = 'delivery'

UNION ALL

SELECT 
  'Total de entregas' AS metrica,
  COUNT(*) AS valor
FROM entregas_padronizadas

UNION ALL

SELECT 
  'Pedidos com entrega sincronizada' AS metrica,
  COUNT(*) AS valor
FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'

UNION ALL

SELECT 
  'Pedidos delivery sem entrega' AS metrica,
  COUNT(*) AS valor
FROM pedidos_padronizados p
LEFT JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'
  AND e.id IS NULL;

-- 7. Verificar logs recentes de sincronização
-- (Se o PostgreSQL tiver logging habilitado)
-- Procure por mensagens como:
-- - "Sincronizando entrega -> pedido"
-- - "Pedido X atualizado para ACEITO"

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- 
-- ✅ Duas triggers devem aparecer:
--    - trg_sync_pedido_para_entrega (em pedidos_padronizados)
--    - trg_sync_entrega_para_pedido (em entregas_padronizadas)
-- 
-- ✅ Duas funções devem aparecer:
--    - sync_pedido_para_entrega()
--    - sync_entrega_para_pedido()
-- 
-- ✅ Não deve haver triggers conflitantes
-- 
-- ✅ Pedidos e entregas devem estar sincronizados (status iguais)
-- 
-- ⚠️ Se houver inconsistências, execute o script de correção:
--    corrigir_sincronizacao_status.sql
-- ============================================================================
