-- Script para corrigir o trigger que está tentando acessar user_moedas
-- para pedidos de retirada/local (que não devem ter entregador)

-- 1. Listar todos os triggers da tabela pedidos_padronizados
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados'
ORDER BY trigger_name;

-- 2. Listar todas as funções que podem estar relacionadas
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
  AND (
    routine_definition ILIKE '%user_moedas%'
    OR routine_definition ILIKE '%moeda%'
    OR routine_definition ILIKE '%recompensa%'
    OR routine_definition ILIKE '%entregador%'
  )
ORDER BY routine_name;

-- 3. Ver o código completo das funções suspeitas
-- (Execute manualmente para cada função encontrada acima)
-- \df+ nome_da_funcao

-- 4. SOLUÇÃO: Modificar triggers para verificar tipo_pedido antes de acessar user_moedas

-- Exemplo de como o trigger DEVERIA ser:
/*
CREATE OR REPLACE FUNCTION atualizar_moedas_entregador()
RETURNS TRIGGER AS $$
BEGIN
  -- IMPORTANTE: Só processar se for pedido de delivery
  IF NEW.tipo_pedido = 'delivery' AND NEW.status = 'concluido' THEN
    -- Lógica de moedas aqui
    INSERT INTO user_moedas (user_id, moedas, ...)
    VALUES (...);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- 5. Verificar se há triggers problemáticos e desabilitá-los temporariamente
-- (Descomente as linhas abaixo se encontrar triggers problemáticos)

-- DROP TRIGGER IF EXISTS trigger_moedas_entregador ON pedidos_padronizados;
-- DROP TRIGGER IF EXISTS trigger_recompensa_entregador ON pedidos_padronizados;
-- DROP TRIGGER IF EXISTS trigger_atualizar_moedas ON pedidos_padronizados;

-- 6. Criar trigger corrigido (exemplo genérico)
-- Substitua pelo código real do seu trigger após identificá-lo

CREATE OR REPLACE FUNCTION atualizar_moedas_entregador_corrigido()
RETURNS TRIGGER AS $$
BEGIN
  -- VERIFICAÇÃO CRÍTICA: Só processar pedidos de delivery
  IF NEW.tipo_pedido != 'delivery' THEN
    RETURN NEW;
  END IF;

  -- VERIFICAÇÃO: Só processar se tiver entregador
  IF NEW.id_entregador IS NULL THEN
    RETURN NEW;
  END IF;

  -- VERIFICAÇÃO: Só processar quando concluir
  IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Aqui vai a lógica de moedas
    -- Exemplo:
    -- INSERT INTO user_moedas (user_id, moedas, tipo, descricao)
    -- VALUES (NEW.id_entregador, 10, 'entrega', 'Entrega concluída');
    
    RAISE NOTICE 'Moedas creditadas para entregador do pedido %', NEW.numero_pedido;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Recriar trigger (se necessário)
-- DROP TRIGGER IF EXISTS trigger_moedas_entregador ON pedidos_padronizados;
-- CREATE TRIGGER trigger_moedas_entregador
--   AFTER UPDATE ON pedidos_padronizados
--   FOR EACH ROW
--   EXECUTE FUNCTION atualizar_moedas_entregador_corrigido();

-- 8. Testar atualização de pedido de retirada
-- (Substitua os UUIDs pelos valores reais)
/*
DO $$
DECLARE
  v_pedido_id UUID;
BEGIN
  -- Pegar um pedido de retirada
  SELECT id INTO v_pedido_id
  FROM pedidos_padronizados
  WHERE tipo_pedido IN ('retirada', 'local')
  AND status = 'disponivel'
  LIMIT 1;

  IF v_pedido_id IS NOT NULL THEN
    RAISE NOTICE 'Testando atualização do pedido: %', v_pedido_id;
    
    -- Tentar atualizar status
    UPDATE pedidos_padronizados
    SET status = 'aceito'
    WHERE id = v_pedido_id;
    
    RAISE NOTICE '✅ Atualização bem-sucedida!';
  ELSE
    RAISE NOTICE '⚠️ Nenhum pedido de retirada/local disponível para teste';
  END IF;
END $$;
*/

-- 9. Verificar resultado
SELECT 
    'Triggers ativos' as tipo,
    trigger_name as nome
FROM information_schema.triggers
WHERE event_object_table = 'pedidos_padronizados'
UNION ALL
SELECT 
    'Funções com moedas' as tipo,
    routine_name as nome
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
  AND routine_definition ILIKE '%user_moedas%';
