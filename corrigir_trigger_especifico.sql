-- CORREÇÃO DO TRIGGER ESPECÍFICO: trigger_add_coins_on_order_completion
-- Este é o trigger que está causando o erro!

-- 1. Ver o código atual da função
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'add_coins_on_delivery_completion';

-- 2. REMOVER o trigger problemático
DROP TRIGGER IF EXISTS trigger_add_coins_on_order_completion ON pedidos_padronizados CASCADE;

-- 3. CORRIGIR a função add_coins_on_delivery_completion
CREATE OR REPLACE FUNCTION add_coins_on_delivery_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ VERIFICAÇÃO CRÍTICA 1: Só processar pedidos de DELIVERY
  IF NEW.tipo_pedido IS NULL OR NEW.tipo_pedido != 'delivery' THEN
    RAISE NOTICE '⏭️ Pedido % não é delivery (tipo: %), pulando moedas', 
                 NEW.numero_pedido, COALESCE(NEW.tipo_pedido, 'NULL');
    RETURN NEW;
  END IF;

  -- ✅ VERIFICAÇÃO CRÍTICA 2: Só processar se tiver ENTREGADOR
  IF NEW.id_entregador IS NULL THEN
    RAISE NOTICE '⏭️ Pedido % não tem entregador, pulando moedas', NEW.numero_pedido;
    RETURN NEW;
  END IF;

  -- ✅ VERIFICAÇÃO CRÍTICA 3: Só processar quando STATUS mudar para CONCLUÍDO
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Verificar se a tabela user_moedas existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_moedas') THEN
      BEGIN
        -- Creditar moedas ao entregador
        INSERT INTO user_moedas (user_id, moedas, tipo, descricao, criado_em)
        VALUES (
          NEW.id_entregador, 
          10, 
          'entrega', 
          'Entrega concluída - Pedido #' || COALESCE(NEW.numero_pedido::text, 'N/A'),
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET moedas = user_moedas.moedas + 10,
            atualizado_em = NOW();
        
        RAISE NOTICE '✅ 10 moedas creditadas para entregador % (Pedido #%)', 
                     NEW.id_entregador, NEW.numero_pedido;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao creditar moedas para pedido %: %', 
                      NEW.numero_pedido, SQLERRM;
        -- Não bloqueia a atualização do pedido se houver erro nas moedas
      END;
    ELSE
      RAISE NOTICE '⚠️ Tabela user_moedas não existe, pulando crédito de moedas';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. RECRIAR o trigger com a função corrigida
CREATE TRIGGER trigger_add_coins_on_order_completion
  AFTER UPDATE ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION add_coins_on_delivery_completion();

-- 5. TESTAR com pedido de RETIRADA (não deve dar erro)
DO $$
DECLARE
    v_pedido_id UUID;
    v_tipo TEXT;
    v_numero INTEGER;
BEGIN
    -- Pegar pedido de retirada/local
    SELECT id, tipo_pedido, numero_pedido 
    INTO v_pedido_id, v_tipo, v_numero
    FROM pedidos_padronizados
    WHERE tipo_pedido IN ('retirada', 'local')
    AND status = 'disponivel'
    LIMIT 1;

    IF v_pedido_id IS NOT NULL THEN
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE '🧪 TESTE 1: Pedido RETIRADA/LOCAL';
        RAISE NOTICE '   Pedido #% (tipo: %)', v_numero, v_tipo;
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        
        -- Atualizar para aceito
        UPDATE pedidos_padronizados
        SET status = 'aceito', started_at = NOW()
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '✅ Status atualizado para ACEITO sem erro!';
        
        -- Atualizar para concluído
        UPDATE pedidos_padronizados
        SET status = 'concluido'
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '✅ Status atualizado para CONCLUÍDO sem erro!';
        RAISE NOTICE '✅ TESTE 1 PASSOU! Pedido retirada/local não tentou dar moedas!';
        
        -- Reverter
        UPDATE pedidos_padronizados
        SET status = 'disponivel', started_at = NULL
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '↩️ Pedido revertido';
    ELSE
        RAISE NOTICE '⚠️ Nenhum pedido de retirada/local disponível para teste';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '❌ TESTE 1 FALHOU!';
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 6. TESTAR com pedido de DELIVERY (deve creditar moedas se tiver entregador)
DO $$
DECLARE
    v_pedido_id UUID;
    v_tipo TEXT;
    v_numero INTEGER;
    v_entregador UUID;
BEGIN
    -- Pegar pedido de delivery
    SELECT id, tipo_pedido, numero_pedido, id_entregador
    INTO v_pedido_id, v_tipo, v_numero, v_entregador
    FROM pedidos_padronizados
    WHERE tipo_pedido = 'delivery'
    AND status IN ('coletado', 'pronto_para_entrega')
    LIMIT 1;

    IF v_pedido_id IS NOT NULL THEN
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE '🧪 TESTE 2: Pedido DELIVERY';
        RAISE NOTICE '   Pedido #% (tipo: %)', v_numero, v_tipo;
        RAISE NOTICE '   Entregador: %', COALESCE(v_entregador::text, 'NULL');
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        
        -- Atualizar para concluído
        UPDATE pedidos_padronizados
        SET status = 'concluido'
        WHERE id = v_pedido_id;
        
        IF v_entregador IS NOT NULL THEN
            RAISE NOTICE '✅ TESTE 2 PASSOU! Moedas devem ter sido creditadas!';
        ELSE
            RAISE NOTICE '✅ TESTE 2 PASSOU! Sem entregador, não creditou moedas!';
        END IF;
        
        -- Reverter
        UPDATE pedidos_padronizados
        SET status = 'coletado'
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '↩️ Pedido revertido';
    ELSE
        RAISE NOTICE '⚠️ Nenhum pedido de delivery disponível para teste';
    END IF;
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '❌ TESTE 2 FALHOU!';
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 7. VERIFICAR triggers ativos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados'
ORDER BY trigger_name;

-- ✅ Se os testes acima passaram, o problema está RESOLVIDO!
-- Agora você pode atualizar pedidos de retirada/local sem erro!
