-- ============================================================================
-- CORREÇÃO DE SINCRONIZAÇÃO DE STATUS
-- ============================================================================
-- 
-- Este script corrige pedidos que estão com status inconsistente entre
-- pedidos_padronizados e entregas_padronizadas.
-- 
-- IMPORTANTE: Execute este script APÓS criar a trigger de sincronização
-- ============================================================================

-- 1. Identificar pedidos inconsistentes
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pedidos_padronizados p
  JOIN entregas_padronizadas e ON e.id_pedido = p.id
  WHERE p.tipo_pedido = 'delivery'
    AND p.status != e.status
    AND e.status IN ('aceito', 'coletado', 'concluido');
  
  RAISE NOTICE '📊 Encontrados % pedidos com status inconsistente', v_count;
END $$;

-- 2. Corrigir pedidos onde a entrega foi aceita mas o pedido não
UPDATE pedidos_padronizados p
SET 
  status = e.status,
  id_entregador = COALESCE(e.id_entregador, p.id_entregador),
  nome_entregador = COALESCE(e.nome_entregador, p.nome_entregador),
  atualizado_em = NOW()
FROM entregas_padronizadas e
WHERE e.id_pedido = p.id
  AND p.tipo_pedido = 'delivery'
  AND e.status = 'aceito'
  AND p.status != 'aceito';

-- Log do resultado
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ % pedidos atualizados para status ACEITO', v_updated;
END $$;

-- 3. Corrigir pedidos onde a entrega foi coletada mas o pedido não
UPDATE pedidos_padronizados p
SET 
  status = e.status,
  id_entregador = COALESCE(e.id_entregador, p.id_entregador),
  nome_entregador = COALESCE(e.nome_entregador, p.nome_entregador),
  atualizado_em = NOW()
FROM entregas_padronizadas e
WHERE e.id_pedido = p.id
  AND p.tipo_pedido = 'delivery'
  AND e.status = 'coletado'
  AND p.status != 'coletado';

-- Log do resultado
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ % pedidos atualizados para status COLETADO', v_updated;
END $$;

-- 4. Corrigir pedidos onde a entrega foi concluída mas o pedido não
UPDATE pedidos_padronizados p
SET 
  status = e.status,
  id_entregador = COALESCE(e.id_entregador, p.id_entregador),
  nome_entregador = COALESCE(e.nome_entregador, p.nome_entregador),
  atualizado_em = NOW()
FROM entregas_padronizadas e
WHERE e.id_pedido = p.id
  AND p.tipo_pedido = 'delivery'
  AND e.status = 'concluido'
  AND p.status != 'concluido';

-- Log do resultado
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ % pedidos atualizados para status CONCLUÍDO', v_updated;
END $$;

-- 5. Sincronizar informações do entregador
UPDATE pedidos_padronizados p
SET 
  id_entregador = e.id_entregador,
  nome_entregador = e.nome_entregador,
  atualizado_em = NOW()
FROM entregas_padronizadas e
WHERE e.id_pedido = p.id
  AND p.tipo_pedido = 'delivery'
  AND e.id_entregador IS NOT NULL
  AND (p.id_entregador IS NULL OR p.id_entregador != e.id_entregador);

-- Log do resultado
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ % pedidos atualizados com informações do entregador', v_updated;
END $$;

-- 6. Verificação final
SELECT 
  'Pedidos inconsistentes restantes' AS status,
  COUNT(*) AS quantidade
FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'
  AND p.status != e.status
  AND e.status IN ('aceito', 'coletado', 'concluido');

-- 7. Relatório de pedidos corrigidos
SELECT 
  p.numero_pedido,
  p.status AS status_atual,
  p.nome_entregador,
  p.atualizado_em,
  '✅ Sincronizado' AS situacao
FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'
  AND p.status = e.status
  AND p.status IN ('aceito', 'coletado', 'concluido')
  AND p.atualizado_em > NOW() - INTERVAL '5 minutes'
ORDER BY p.atualizado_em DESC
LIMIT 20;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- 
-- ✅ Todos os pedidos delivery devem ter status sincronizado com suas entregas
-- ✅ Pedidos aceitos por entregadores devem ter id_entregador preenchido
-- ✅ O painel do restaurante deve refletir o status correto
-- 
-- PRÓXIMOS PASSOS:
-- 1. Verificar o painel do restaurante
-- 2. Testar aceitação de nova entrega
-- 3. Confirmar atualização em tempo real
-- ============================================================================

RAISE NOTICE '🎉 Correção de sincronização concluída!';
