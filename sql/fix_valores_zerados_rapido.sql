-- FIX RÁPIDO: Recalcular valores de pedidos zerados
-- Execute este script completo de uma vez

-- Recalcular valores de TODOS os pedidos zerados
UPDATE pedidos_padronizados p
SET 
  subtotal = COALESCE((
    SELECT SUM(ip.preco_total)
    FROM itens_pedido ip
    WHERE ip.id_pedido = p.id
  ), 0),
  valor_total = COALESCE((
    SELECT SUM(ip.preco_total)
    FROM itens_pedido ip
    WHERE ip.id_pedido = p.id
  ), 0)
WHERE (p.valor_total = 0 OR p.valor_total IS NULL OR p.valor_total < 1)
  AND p.status IN ('disponivel', 'aceito', 'pronto_para_entrega', 'coletado', 'concluido');

-- Ver resultado
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.tipo_pedido,
    p.valor_total,
    COUNT(ip.id) as itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE p.numero_pedido IN (38, 39, 40)
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.tipo_pedido, p.valor_total
ORDER BY p.numero_pedido DESC;

-- ✅ Recarregue o painel (F5) após executar!
