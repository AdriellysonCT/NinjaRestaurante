-- ============================================================================
-- INSTALAÇÃO COMPLETA DE SINCRONIZAÇÃO DE STATUS
-- ============================================================================
-- 
-- Este script instala TUDO necessário para sincronização bidirecional entre
-- pedidos_padronizados e entregas_padronizadas.
-- 
-- EXECUTE ESTE ARQUIVO NO SUPABASE SQL EDITOR
-- 
-- O que será instalado:
-- 1. Trigger: pedidos -> entregas (se não existir)
-- 2. Trigger: entregas -> pedidos (NOVA)
-- 3. Correção de pedidos inconsistentes
-- 4. Verificação final
-- ============================================================================

BEGIN;

RAISE NOTICE '🚀 Iniciando instalação de sincronização completa...';

-- ============================================================================
-- PARTE 1: TRIGGER PEDIDOS -> ENTREGAS
-- ============================================================================

RAISE NOTICE '📦 Verificando trigger pedidos -> entregas...';

-- Criar função se não existir
CREATE OR REPLACE FUNCTION sync_pedido_para_entrega()
RETURNS TRIGGER AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Apenas quando o status muda para 'pronto_para_entrega'
  IF TG_OP = 'UPDATE' 
     AND NEW.status = 'pronto_para_entrega' 
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.tipo_pedido = 'delivery' THEN
    
    -- Verificar se já existe entrega para este pedido
    SELECT EXISTS (
      SELECT 1 FROM entregas_padronizadas e WHERE e.id_pedido = NEW.id
    ) INTO v_exists;

    IF NOT v_exists THEN
      INSERT INTO entregas_padronizadas (
        id_pedido,
        id_restaurante,
        numero_pedido,
        nome_cliente,
        telefone_cliente,
        endereco,
        bairro,
        numero,
        valor_total,
        metodo_pagamento,
        status,
        observacoes,
        id_publico
      ) VALUES (
        NEW.id,
        NEW.id_restaurante,
        NEW.numero_pedido,
        COALESCE(NEW.nome_cliente, NULL),
        COALESCE(NEW.telefone_cliente, NULL),
        COALESCE(NEW.endereco, NULL),
        COALESCE(NEW.bairro, NULL),
        COALESCE(NEW.numero, NULL),
        COALESCE(NEW.valor_total, NEW.total, 0),
        COALESCE(NEW.metodo_pagamento, NEW.payment_method, NULL),
        'disponivel',
        COALESCE(NEW.observacoes, NULL),
        COALESCE(NEW.numero_pedido::text, substr(NEW.id::text, 1, 8))
      );
      
      RAISE NOTICE '✅ Entrega criada para pedido %', NEW.numero_pedido;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trg_sync_pedido_para_entrega ON pedidos_padronizados;
CREATE TRIGGER trg_sync_pedido_para_entrega
  AFTER UPDATE OF status ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION sync_pedido_para_entrega();

RAISE NOTICE '✅ Trigger pedidos -> entregas instalada';

-- ============================================================================
-- PARTE 2: TRIGGER ENTREGAS -> PEDIDOS (NOVA)
-- ============================================================================

RAISE NOTICE '📦 Instalando trigger entregas -> pedidos...';

-- Remover trigger antiga se existir
DROP TRIGGER IF EXISTS trg_sync_entrega_para_pedido ON entregas_padronizadas;
DROP FUNCTION IF EXISTS sync_entrega_para_pedido();

-- Criar função de sincronização
CREATE OR REPLACE FUNCTION sync_entrega_para_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_pedido_status TEXT;
  v_pedido_entregador UUID;
BEGIN
  -- Apenas processar se houver id_pedido válido
  IF NEW.id_pedido IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar status atual do pedido para evitar loops
  SELECT status, id_entregador 
  INTO v_pedido_status, v_pedido_entregador
  FROM pedidos_padronizados 
  WHERE id = NEW.id_pedido;

  -- Se o pedido não existe, não fazer nada
  IF NOT FOUND THEN
    RAISE WARNING 'Pedido % não encontrado para sincronização', NEW.id_pedido;
    RETURN NEW;
  END IF;

  -- Sincronizar apenas se o status mudou
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Log para debug
    RAISE NOTICE 'Sincronizando entrega -> pedido: % (% -> %)', 
      NEW.numero_pedido, OLD.status, NEW.status;

    -- Mapear status da entrega para status do pedido
    CASE NEW.status
      -- Quando entregador aceita a entrega
      WHEN 'aceito' THEN
        IF v_pedido_status != 'aceito' THEN
          UPDATE pedidos_padronizados 
          SET 
            status = 'aceito',
            id_entregador = COALESCE(NEW.id_entregador, id_entregador),
            nome_entregador = COALESCE(NEW.nome_entregador, nome_entregador),
            atualizado_em = NOW()
          WHERE id = NEW.id_pedido;
          
          RAISE NOTICE '✅ Pedido % atualizado para ACEITO (entregador: %)', 
            NEW.numero_pedido, NEW.nome_entregador;
        END IF;

      -- Quando entregador coleta o pedido
      WHEN 'coletado' THEN
        IF v_pedido_status != 'coletado' THEN
          UPDATE pedidos_padronizados 
          SET 
            status = 'coletado',
            id_entregador = COALESCE(NEW.id_entregador, id_entregador),
            nome_entregador = COALESCE(NEW.nome_entregador, nome_entregador),
            atualizado_em = NOW()
          WHERE id = NEW.id_pedido;
          
          RAISE NOTICE '✅ Pedido % atualizado para COLETADO', NEW.numero_pedido;
        END IF;

      -- Quando entrega é concluída
      WHEN 'concluido' THEN
        IF v_pedido_status != 'concluido' THEN
          UPDATE pedidos_padronizados 
          SET 
            status = 'concluido',
            id_entregador = COALESCE(NEW.id_entregador, id_entregador),
            nome_entregador = COALESCE(NEW.nome_entregador, nome_entregador),
            atualizado_em = NOW()
          WHERE id = NEW.id_pedido;
          
          RAISE NOTICE '✅ Pedido % atualizado para CONCLUÍDO', NEW.numero_pedido;
        END IF;

      -- Quando entrega é cancelada
      WHEN 'cancelado' THEN
        IF v_pedido_status != 'cancelado' THEN
          UPDATE pedidos_padronizados 
          SET 
            status = 'cancelado',
            atualizado_em = NOW()
          WHERE id = NEW.id_pedido;
          
          RAISE NOTICE '✅ Pedido % atualizado para CANCELADO', NEW.numero_pedido;
        END IF;

      ELSE
        -- Outros status não precisam sincronizar
        NULL;
    END CASE;
  END IF;

  -- Se for INSERT e já tiver entregador, sincronizar também
  IF TG_OP = 'INSERT' AND NEW.id_entregador IS NOT NULL THEN
    UPDATE pedidos_padronizados 
    SET 
      id_entregador = NEW.id_entregador,
      nome_entregador = NEW.nome_entregador,
      atualizado_em = NOW()
    WHERE id = NEW.id_pedido
      AND (id_entregador IS NULL OR id_entregador IS DISTINCT FROM NEW.id_entregador);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trg_sync_entrega_para_pedido
  AFTER INSERT OR UPDATE OF status, id_entregador, nome_entregador
  ON entregas_padronizadas
  FOR EACH ROW
  EXECUTE FUNCTION sync_entrega_para_pedido();

RAISE NOTICE '✅ Trigger entregas -> pedidos instalada';

-- ============================================================================
-- PARTE 3: CORREÇÃO DE PEDIDOS INCONSISTENTES
-- ============================================================================

RAISE NOTICE '🔧 Corrigindo pedidos inconsistentes...';

-- Corrigir pedidos aceitos
UPDATE pedidos_padronizados p
SET 
  status = e.status,
  id_entregador = COALESCE(e.id_entregador, p.id_entregador),
  nome_entregador = COALESCE(e.nome_entregador, p.nome_entregador),
  atualizado_em = NOW()
FROM entregas_padronizadas e
WHERE e.id_pedido = p.id
  AND p.tipo_pedido = 'delivery'
  AND e.status IN ('aceito', 'coletado', 'concluido')
  AND p.status != e.status;

RAISE NOTICE '✅ Pedidos inconsistentes corrigidos';

-- ============================================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================================================

RAISE NOTICE '🔍 Executando verificação final...';

-- Verificar triggers instaladas
DO $$
DECLARE
  v_trigger1 BOOLEAN;
  v_trigger2 BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_sync_pedido_para_entrega'
  ) INTO v_trigger1;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_sync_entrega_para_pedido'
  ) INTO v_trigger2;
  
  IF v_trigger1 AND v_trigger2 THEN
    RAISE NOTICE '✅ Ambas as triggers estão instaladas';
  ELSE
    RAISE WARNING '⚠️ Alguma trigger não foi instalada corretamente';
  END IF;
END $$;

-- Verificar pedidos inconsistentes
DO $$
DECLARE
  v_inconsistentes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_inconsistentes
  FROM pedidos_padronizados p
  JOIN entregas_padronizadas e ON e.id_pedido = p.id
  WHERE p.tipo_pedido = 'delivery'
    AND p.status != e.status
    AND e.status IN ('aceito', 'coletado', 'concluido');
  
  IF v_inconsistentes = 0 THEN
    RAISE NOTICE '✅ Nenhum pedido inconsistente encontrado';
  ELSE
    RAISE WARNING '⚠️ Ainda existem % pedidos inconsistentes', v_inconsistentes;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '🎉 ============================================';
RAISE NOTICE '🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!';
RAISE NOTICE '🎉 ============================================';
RAISE NOTICE '';
RAISE NOTICE '✅ Trigger 1: pedidos -> entregas (instalada)';
RAISE NOTICE '✅ Trigger 2: entregas -> pedidos (instalada)';
RAISE NOTICE '✅ Pedidos inconsistentes corrigidos';
RAISE NOTICE '✅ Sistema pronto para uso';
RAISE NOTICE '';
RAISE NOTICE '📝 Próximos passos:';
RAISE NOTICE '1. Teste a aceitação de uma entrega no app';
RAISE NOTICE '2. Verifique o painel do restaurante';
RAISE NOTICE '3. Confirme atualização em tempo real';
RAISE NOTICE '';
RAISE NOTICE '📚 Documentação: GUIA_SINCRONIZACAO_STATUS.md';
RAISE NOTICE '';

-- Mostrar estatísticas finais
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
  'Pedidos sincronizados' AS metrica,
  COUNT(*) AS valor
FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'
  AND p.status = e.status;
