-- Trigger para calcular automaticamente o valor_total do pedido
-- baseado nos itens adicionados
-- Execute este script no SQL Editor do Supabase

-- 1. Criar função que calcula o total
CREATE OR REPLACE FUNCTION calcular_valor_total_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_id_pedido UUID;
  v_total DECIMAL;
BEGIN
  -- Determinar o ID do pedido baseado na operação
  IF TG_OP = 'DELETE' THEN
    v_id_pedido := OLD.id_pedido;
  ELSE
    v_id_pedido := NEW.id_pedido;
  END IF;

  -- Calcular total dos itens
  SELECT COALESCE(SUM(preco_total), 0) INTO v_total
  FROM itens_pedido
  WHERE id_pedido = v_id_pedido;

  -- Atualizar pedido com o novo total
  UPDATE pedidos_padronizados
  SET 
    subtotal = v_total,
    valor_total = v_total
  WHERE id = v_id_pedido;

  RAISE NOTICE 'Total recalculado para pedido %: R$ %', v_id_pedido, v_total;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trigger_calcular_total_insert ON itens_pedido;
DROP TRIGGER IF EXISTS trigger_calcular_total_update ON itens_pedido;
DROP TRIGGER IF EXISTS trigger_calcular_total_delete ON itens_pedido;

-- 3. Criar triggers para INSERT, UPDATE e DELETE
CREATE TRIGGER trigger_calcular_total_insert
AFTER INSERT ON itens_pedido
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_pedido();

CREATE TRIGGER trigger_calcular_total_update
AFTER UPDATE ON itens_pedido
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_pedido();

CREATE TRIGGER trigger_calcular_total_delete
AFTER DELETE ON itens_pedido
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_pedido();

-- 4. Recalcular totais de pedidos existentes que estão zerados
UPDATE pedidos_padronizados p
SET 
  subtotal = (
    SELECT COALESCE(SUM(ip.preco_total), 0)
    FROM itens_pedido ip
    WHERE ip.id_pedido = p.id
  ),
  valor_total = (
    SELECT COALESCE(SUM(ip.preco_total), 0)
    FROM itens_pedido ip
    WHERE ip.id_pedido = p.id
  )
WHERE (p.valor_total = 0 OR p.valor_total IS NULL)
  AND EXISTS (
    SELECT 1 FROM itens_pedido ip WHERE ip.id_pedido = p.id
  );

-- 5. Verificar resultado
SELECT 
  p.numero_pedido,
  p.nome_cliente,
  p.valor_total,
  COUNT(ip.id) as total_itens,
  COALESCE(SUM(ip.preco_total), 0) as soma_itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE p.status IN ('disponivel', 'aceito')
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.valor_total
ORDER BY p.criado_em DESC
LIMIT 10;

-- ✅ Se os valores estiverem corretos, o trigger está funcionando!
