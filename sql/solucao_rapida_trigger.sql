-- SOLUÇÃO RÁPIDA: Remove TODOS os triggers e recria apenas os corretos
-- Execute este script COMPLETO de uma vez no SQL Editor

-- 1. REMOVER TODOS OS TRIGGERS DE pedidos_padronizados
DROP TRIGGER IF EXISTS trigger_moedas_entregador ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trg_moedas_entregador ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trigger_recompensa_entregador ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trg_recompensa_entregador ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trigger_atualizar_moedas ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trg_atualizar_moedas ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trigger_creditar_moedas ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trg_creditar_moedas ON pedidos_padronizadas CASCADE;
DROP TRIGGER IF EXISTS on_pedido_concluido ON pedidos_padronizados CASCADE;
DROP TRIGGER IF EXISTS trg_pedido_concluido ON pedidos_padronizados CASCADE;

-- 2. RECRIAR TRIGGER DE MOEDAS CORRIGIDO
CREATE OR REPLACE FUNCTION atualizar_moedas_entregador()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ VERIFICAÇÃO 1: Só delivery
  IF NEW.tipo_pedido IS NULL OR NEW.tipo_pedido != 'delivery' THEN
    RETURN NEW;
  END IF;

  -- ✅ VERIFICAÇÃO 2: Só se tiver entregador
  IF NEW.id_entregador IS NULL THEN
    RETURN NEW;
  END IF;

  -- ✅ VERIFICAÇÃO 3: Só ao concluir
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Verificar se tabela existe antes de inserir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_moedas') THEN
      BEGIN
        INSERT INTO user_moedas (user_id, moedas, tipo, descricao, criado_em)
        VALUES (
          NEW.id_entregador, 
          10, 
          'entrega', 
          'Entrega concluída - Pedido #' || COALESCE(NEW.numero_pedido::text, 'N/A'),
          NOW()
        );
        RAISE NOTICE '✅ Moedas creditadas para entregador do pedido %', NEW.numero_pedido;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao creditar moedas: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGER
CREATE TRIGGER trigger_moedas_entregador
  AFTER UPDATE ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_moedas_entregador();

-- 4. TESTAR
DO $$
DECLARE
    v_pedido_id UUID;
    v_tipo TEXT;
    v_status_old TEXT;
BEGIN
    -- Pegar pedido de retirada
    SELECT id, tipo_pedido, status 
    INTO v_pedido_id, v_tipo, v_status_old
    FROM pedidos_padronizados
    WHERE tipo_pedido IN ('retirada', 'local')
    AND status = 'disponivel'
    LIMIT 1;

    IF v_pedido_id IS NOT NULL THEN
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE '🧪 TESTE: Atualizando pedido % (tipo: %)', v_pedido_id, v_tipo;
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        
        -- Atualizar
        UPDATE pedidos_padronizados
        SET status = 'aceito', started_at = NOW()
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '✅ SUCESSO! Pedido atualizado sem erro!';
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        
        -- Reverter
        UPDATE pedidos_padronizados
        SET status = v_status_old, started_at = NULL
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '↩️ Pedido revertido para estado original';
    ELSE
        RAISE NOTICE '⚠️ Nenhum pedido de retirada/local disponível';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 5. VERIFICAR TRIGGERS ATIVOS
SELECT 
    '✅ Triggers ativos:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados'
ORDER BY trigger_name;

-- ✅ Se o teste acima mostrou SUCESSO, o problema está resolvido!
-- ❌ Se ainda deu erro, execute o próximo comando para ver TODOS os triggers:

SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%user_moedas%'
   OR action_statement ILIKE '%moeda%';
