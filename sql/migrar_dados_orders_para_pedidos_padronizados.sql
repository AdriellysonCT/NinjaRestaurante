-- Script de migração de dados da tabela orders para pedidos_padronizados
-- Execute este script no painel SQL do Supabase APÓS criar pedidos_padronizados e ajustar itens_pedido
-- ATENÇÃO: Faça backup antes de executar!

-- 1. Inserir dados de orders para pedidos_padronizados
INSERT INTO pedidos_padronizados (
    id,
    id_cliente,  -- Pode ser NULL, assumindo que não há mapeamento direto
    id_restaurante,
    id_entregador,  -- Pode ser NULL
    numero_pedido,
    tipo_pedido,
    status,
    total,
    subtotal,
    taxa_entrega,
    desconto,
    payment_method,
    pagamento_recebido_pelo_sistema,  -- Default false, ajuste se necessário
    prep_time,
    delivery_time,
    is_vip,
    mesa_numero,
    observacoes,
    created_at,
    updated_at,
    delivered_at
)
SELECT 
    id,
    NULL AS id_cliente,  -- Ajuste se houver mapeamento para clientes
    id_restaurante,
    NULL AS id_entregador,  -- Ajuste se houver dados de entregador
    numero_pedido,
    tipo_pedido,
    CASE 
        WHEN status = 'pendente' THEN 'disponivel'
        WHEN status = 'confirmado' THEN 'aceito'
        WHEN status = 'preparando' THEN 'aceito'
        WHEN status = 'pronto' THEN 'coletado'
        WHEN status = 'saiu_entrega' THEN 'coletado'
        WHEN status = 'entregue' THEN 'concluido'
        WHEN status = 'cancelado' THEN 'cancelado'
        ELSE 'disponivel'
    END AS status,
    total,
    subtotal,
    taxa_entrega,
    desconto,
    payment_method,
    CASE WHEN payment_status = 'pago' THEN TRUE ELSE FALSE END AS pagamento_recebido_pelo_sistema,
    prep_time,
    NULL AS delivery_time,  -- Mapear se houver dado equivalente
    is_vip,
    mesa_numero,
    observacoes,
    created_at,
    updated_at,
    delivered_at
FROM orders;

-- 2. Atualizar itens_pedido para apontar para os novos IDs em pedidos_padronizados
-- Assumindo que os IDs são os mesmos, não é necessário atualizar se IDs forem preservados

-- 3. Verificar contagem de registros migrados
SELECT 
    (SELECT COUNT(*) FROM orders) AS count_orders_original,
    (SELECT COUNT(*) FROM pedidos_padronizados) AS count_pedidos_nova;

-- 4. Opcional: Deletar dados de orders após verificação
-- DELETE FROM orders;
-- Comente a linha acima e execute manualmente após confirmação