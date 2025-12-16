-- ============================================================================
-- TRIGGER DE SINCRONIZAÇÃO: entregas_padronizadas -> pedidos_padronizados
-- ============================================================================
-- 
-- OBJETIVO:
-- Garantir que quando o status de uma entrega mudar (ex: entregador aceita),
-- o status do pedido correspondente seja atualizado automaticamente.
--
-- FLUXO:
-- 1. Entregador aceita entrega no app Flutter
-- 2. entregas_padronizadas.status muda para 'aceito'
-- 3. Esta trigger atualiza pedidos_padronizados.status para 'aceito'
-- 4. Supabase Realtime notifica o Dashboard
-- 5. Painel do restaurante atualiza em tempo real
--
-- REGRAS:
-- - Sincroniza apenas status relevantes: aceito, coletado, concluido
-- - Evita loops infinitos verificando se o status já é o mesmo
-- - Mantém id_entregador e nome_entregador sincronizados
-- - Não afeta outros campos do pedido
-- ============================================================================

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
          UPDATE pedidos_padronizadas 
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

-- Comentários para documentação
COMMENT ON FUNCTION sync_entrega_para_pedido() IS 
  'Sincroniza mudanças de status de entregas_padronizadas para pedidos_padronizados. '
  'Garante que o painel do restaurante reflita o status real da entrega em tempo real.';

COMMENT ON TRIGGER trg_sync_entrega_para_pedido ON entregas_padronizadas IS
  'Trigger que mantém pedidos_padronizados sincronizado com entregas_padronizadas. '
  'Executado após INSERT ou UPDATE de status/entregador.';

-- ============================================================================
-- VERIFICAÇÃO E TESTES
-- ============================================================================

-- Verificar se a trigger foi criada
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_sync_entrega_para_pedido';

-- Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'sync_entrega_para_pedido';

-- ============================================================================
-- TESTE MANUAL (OPCIONAL)
-- ============================================================================
-- 
-- Para testar a sincronização:
-- 
-- 1. Criar um pedido de teste:
-- INSERT INTO pedidos_padronizados (id_restaurante, numero_pedido, status, tipo_pedido, valor_total)
-- VALUES ('seu-restaurante-id', 9999, 'pronto_para_entrega', 'delivery', 50.00);
-- 
-- 2. Simular aceitação pelo entregador:
-- UPDATE entregas_padronizadas 
-- SET status = 'aceito', id_entregador = 'entregador-id', nome_entregador = 'João Silva'
-- WHERE numero_pedido = 9999;
-- 
-- 3. Verificar se o pedido foi atualizado:
-- SELECT status, id_entregador, nome_entregador 
-- FROM pedidos_padronizados 
-- WHERE numero_pedido = 9999;
-- 
-- Resultado esperado: status = 'aceito', id_entregador e nome_entregador preenchidos
-- ============================================================================

RAISE NOTICE '✅ Trigger de sincronização entregas -> pedidos criada com sucesso!';
