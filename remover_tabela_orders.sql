-- remover_tabela_orders.sql

-- Este script remove a tabela `orders` após confirmação da migração.
-- Certifique-se de que todos os dados foram migrados para `pedidos_padronizados` antes de executar.

DROP TABLE IF EXISTS orders;

-- Verificação final
SELECT COUNT(*) FROM pedidos_padronizados; -- Deve corresponder ao número esperado de pedidos migrados