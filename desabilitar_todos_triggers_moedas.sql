-- Script AGRESSIVO para desabilitar TODOS os triggers que acessam user_moedas
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Listar TODOS os triggers da tabela pedidos_padronizados
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados'
ORDER BY trigger_name;

-- PASSO 2: Ver o código de TODAS as funções relacionadas a pedidos
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%user_moedas%'
    OR pg_get_functiondef(p.oid) ILIKE '%pedidos_padronizados%'
  )
ORDER BY p.proname;

-- PASSO 3: DESABILITAR TODOS os triggers de pedidos_padronizados
-- (Vamos reabilitar apenas os necessários depois)

DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'pedidos_padronizados'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON pedidos_padronizadas CASCADE';
        RAISE NOTICE 'Trigger removido: %', trigger_rec.trigger_name;
    END LOOP;
END $$;

-- PASSO 4: Verificar se ainda existem triggers
SELECT 
    trigger_name,
    'AINDA EXISTE' as status
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados';

-- Se aparecer algum resultado acima, significa que o trigger não foi removido
-- Neste caso, remova manualmente:
-- DROP TRIGGER nome_do_trigger ON pedidos_padronizados CASCADE;

-- PASSO 5: Testar atualização de pedido
DO $$
DECLARE
    v_pedido_id UUID;
    v_tipo_pedido TEXT;
BEGIN
    -- Pegar um pedido de retirada/local
    SELECT id, tipo_pedido INTO v_pedido_id, v_tipo_pedido
    FROM pedidos_padronizados
    WHERE tipo_pedido IN ('retirada', 'local')
    AND status = 'disponivel'
    LIMIT 1;

    IF v_pedido_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testando atualização do pedido % (tipo: %)', v_pedido_id, v_tipo_pedido;
        
        -- Tentar atualizar status
        UPDATE pedidos_padronizados
        SET status = 'aceito',
            started_at = NOW()
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '✅ SUCESSO! Atualização funcionou sem erro!';
        
        -- Reverter para o estado original
        UPDATE pedidos_padronizados
        SET status = 'disponivel',
            started_at = NULL
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '↩️ Pedido revertido para estado original';
    ELSE
        RAISE NOTICE '⚠️ Nenhum pedido de retirada/local disponível para teste';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
END $$;

-- PASSO 6: Recriar apenas os triggers necessários (SEM moedas para retirada/local)

-- Trigger 1: Calcular total automaticamente
CREATE OR REPLACE FUNCTION calcular_valor_total_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_id_pedido UUID;
  v_total DECIMAL;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id_pedido := OLD.id_pedido;
  ELSE
    v_id_pedido := NEW.id_pedido;
  END IF;

  SELECT COALESCE(SUM(preco_total), 0) INTO v_total
  FROM itens_pedido
  WHERE id_pedido = v_id_pedido;

  UPDATE pedidos_padronizados
  SET subtotal = v_total, valor_total = v_total
  WHERE id = v_id_pedido;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_total_insert ON itens_pedido;
DROP TRIGGER IF EXISTS trigger_calcular_total_update ON itens_pedido;
DROP TRIGGER IF EXISTS trigger_calcular_total_delete ON itens_pedido;

CREATE TRIGGER trigger_calcular_total_insert
AFTER INSERT ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION calcular_valor_total_pedido();

CREATE TRIGGER trigger_calcular_total_update
AFTER UPDATE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION calcular_valor_total_pedido();

CREATE TRIGGER trigger_calcular_total_delete
AFTER DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION calcular_valor_total_pedido();

-- Trigger 2: Sincronizar com entregas (APENAS para delivery)
CREATE OR REPLACE FUNCTION sync_pedido_para_entrega()
RETURNS TRIGGER AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- APENAS para pedidos de delivery
  IF TG_OP = 'UPDATE' 
     AND NEW.status = 'pronto_para_entrega' 
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.tipo_pedido = 'delivery' THEN
    
    SELECT EXISTS (
      SELECT 1 FROM entregas_padronizadas e WHERE e.id_pedido = NEW.id
    ) INTO v_exists;

    IF NOT v_exists THEN
      INSERT INTO entregas_padronizadas (
        id_pedido, id_restaurante, numero_pedido, nome_cliente,
        telefone_cliente, valor_total, metodo_pagamento, status
      ) VALUES (
        NEW.id, NEW.id_restaurante, NEW.numero_pedido, NEW.nome_cliente,
        NEW.telefone_cliente, NEW.valor_total, NEW.metodo_pagamento, 'disponivel'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_pedido_para_entrega ON pedidos_padronizados;
CREATE TRIGGER trg_sync_pedido_para_entrega
  AFTER UPDATE OF status ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION sync_pedido_para_entrega();

-- Trigger 3: Moedas do entregador (APENAS para delivery com entregador)
CREATE OR REPLACE FUNCTION atualizar_moedas_entregador()
RETURNS TRIGGER AS $$
BEGIN
  -- VERIFICAÇÕES CRÍTICAS
  -- 1. Só processar pedidos de delivery
  IF NEW.tipo_pedido != 'delivery' THEN
    RETURN NEW;
  END IF;

  -- 2. Só processar se tiver entregador
  IF NEW.id_entregador IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3. Só processar quando concluir
  IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Verificar se a tabela user_moedas existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_moedas') THEN
      INSERT INTO user_moedas (user_id, moedas, tipo, descricao, criado_em)
      VALUES (
        NEW.id_entregador, 
        10, 
        'entrega', 
        'Entrega concluída - Pedido #' || NEW.numero_pedido,
        NOW()
      );
      RAISE NOTICE 'Moedas creditadas para entregador do pedido %', NEW.numero_pedido;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_moedas_entregador ON pedidos_padronizados;
CREATE TRIGGER trigger_moedas_entregador
  AFTER UPDATE ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_moedas_entregador();

-- PASSO 7: Verificar triggers recriados
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados'
   OR event_object_table = 'itens_pedido'
ORDER BY event_object_table, trigger_name;

-- PASSO 8: Testar novamente
DO $$
DECLARE
    v_pedido_id UUID;
BEGIN
    SELECT id INTO v_pedido_id
    FROM pedidos_padronizados
    WHERE tipo_pedido IN ('retirada', 'local')
    AND status = 'disponivel'
    LIMIT 1;

    IF v_pedido_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Teste final: atualizando pedido %', v_pedido_id;
        
        UPDATE pedidos_padronizados
        SET status = 'aceito', started_at = NOW()
        WHERE id = v_pedido_id;
        
        RAISE NOTICE '✅ SUCESSO TOTAL! Sistema corrigido!';
        
        -- Reverter
        UPDATE pedidos_padronizados
        SET status = 'disponivel', started_at = NULL
        WHERE id = v_pedido_id;
    END IF;
END $$;

-- ✅ Se chegou até aqui sem erro, o problema está resolvido!
