-- Script para adicionar itens de teste ao pedido #33
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Verificar o ID do pedido #33 e do restaurante
SELECT 
    p.id as id_pedido,
    p.numero_pedido,
    p.id_restaurante,
    p.nome_cliente,
    p.valor_total,
    p.status
FROM pedidos_padronizados p
WHERE p.numero_pedido = 33;

-- PASSO 2: Verificar itens disponíveis no cardápio do restaurante
-- (Substitua 'UUID_DO_RESTAURANTE' pelo id_restaurante do resultado acima)
SELECT 
    id as id_item,
    nome,
    preco,
    tempo_preparo,
    disponivel
FROM itens_cardapio
WHERE id_restaurante = 'UUID_DO_RESTAURANTE'  -- ← SUBSTITUA AQUI
  AND disponivel = true
LIMIT 5;

-- PASSO 3: Adicionar itens ao pedido
-- (Substitua os UUIDs pelos valores reais dos passos 1 e 2)

-- Exemplo: Adicionar 1x Pizza Margherita
INSERT INTO itens_pedido (
    id_pedido,
    id_item_cardapio,
    quantidade,
    preco_unitario,
    preco_total,
    id_restaurante
) VALUES (
    'UUID_DO_PEDIDO',           -- ← ID do pedido #33
    'UUID_DO_ITEM_CARDAPIO_1',  -- ← ID do primeiro item do cardápio
    1,                          -- Quantidade
    35.00,                      -- Preço unitário
    35.00,                      -- Preço total (quantidade * preço)
    'UUID_DO_RESTAURANTE'       -- ← ID do restaurante
);

-- Exemplo: Adicionar 2x Coca-Cola
INSERT INTO itens_pedido (
    id_pedido,
    id_item_cardapio,
    quantidade,
    preco_unitario,
    preco_total,
    id_restaurante
) VALUES (
    'UUID_DO_PEDIDO',           -- ← ID do pedido #33
    'UUID_DO_ITEM_CARDAPIO_2',  -- ← ID do segundo item do cardápio
    2,                          -- Quantidade
    6.00,                       -- Preço unitário
    12.00,                      -- Preço total (2 * 6.00)
    'UUID_DO_RESTAURANTE'       -- ← ID do restaurante
);

-- PASSO 4: Atualizar o valor total do pedido
UPDATE pedidos_padronizados
SET 
    subtotal = 47.00,
    valor_total = 47.00
WHERE numero_pedido = 33;

-- PASSO 5: Verificar se os itens foram adicionados
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.valor_total,
    ip.quantidade,
    ic.nome as nome_item,
    ip.preco_unitario,
    ip.preco_total
FROM pedidos_padronizados p
JOIN itens_pedido ip ON ip.id_pedido = p.id
JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE p.numero_pedido = 33;

-- ✅ Se aparecer os itens, está funcionando!
