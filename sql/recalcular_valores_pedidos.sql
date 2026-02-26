-- Script para recalcular valores de pedidos que estão zerados
-- baseado nos itens cadastrados

-- 1. Ver pedidos com valor zerado que têm itens
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.tipo_pedido,
    p.valor_total as valor_atual,
    COUNT(ip.id) as total_itens,
    COALESCE(SUM(ip.preco_total), 0) as valor_calculado
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE (p.valor_total = 0 OR p.valor_total IS NULL)
  AND p.status IN ('disponivel', 'aceito', 'pronto_para_entrega', 'coletado')
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.tipo_pedido, p.valor_total
HAVING COUNT(ip.id) > 0
ORDER BY p.criado_em DESC;

-- 2. Recalcular valores de TODOS os pedidos zerados que têm itens
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

-- 3. Ver resultado da atualização
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.tipo_pedido,
    p.valor_total as valor_atualizado,
    COUNT(ip.id) as total_itens,
    COALESCE(SUM(ip.preco_total), 0) as soma_itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE p.numero_pedido IN (38, 39, 40)
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.tipo_pedido, p.valor_total
ORDER BY p.numero_pedido DESC;

-- 4. Verificar se o trigger de calcular total está ativo
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%calcular%total%'
   OR trigger_name LIKE '%total%'
ORDER BY event_object_table, trigger_name;

-- 5. Se o trigger não existir, criar agora
CREATE OR REPLACE FUNCTION calcular_valor_total_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_id_pedido UUID;
  v_total DECIMAL;
BEGIN
  -- Determinar o ID do pedido
  IF TG_OP = 'DELETE' THEN
    v_id_pedido := OLD.id_pedido;
  ELSE
    v_id_pedido := NEW.id_pedido;
  END IF;

  -- Calcular total dos itens
  SELECT COALESCE(SUM(preco_total), 0) INTO v_total
  FROM itens_pedido
  WHERE id_pedido = v_id_pedido;

  -- Atualizar pedido
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

-- Criar triggers se não existirem
DROP TRIGGER IF EXISTS trigger_calcular_total_insert ON itens_pedido;
DROP TRIGGER IF EXISTS trigger_calcular_total_update ON itens_pedido;
DROP TRIGGER IF EXISTS trigger_calcular_total_delete ON itens_pedido;

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

-- 6. Verificar pedidos específicos
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.tipo_pedido,
    p.valor_total,
    p.subtotal,
    json_agg(
        json_build_object(
            'quantidade', ip.quantidade,
            'nome', ic.nome,
            'preco_unitario', ip.preco_unitario,
            'preco_total', ip.preco_total
        )
    ) as itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE p.numero_pedido = 39
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.tipo_pedido, p.valor_total, p.subtotal;

-- ✅ Após executar este script:
-- 1. Recarregue o painel (F5)
-- 2. Os valores devem aparecer corretamente
-- 3. Novos pedidos terão o total calculado automaticamente
