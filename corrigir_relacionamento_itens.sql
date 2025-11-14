-- Script para corrigir o relacionamento entre itens_pedido e itens_cardapio
-- Execute este script APÓS rodar o diagnostico_itens_pedido.sql

-- IMPORTANTE: Este script vai garantir que a foreign key existe com o nome correto
-- para que a query do Supabase funcione corretamente

-- 1. Remover constraint antiga se existir (pode ter nome diferente)
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Remover todas as foreign keys entre itens_pedido e itens_cardapio
    FOR constraint_rec IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'itens_pedido'
            AND kcu.column_name = 'id_item_cardapio'
            AND ccu.table_name = 'itens_cardapio'
    ) LOOP
        EXECUTE 'ALTER TABLE itens_pedido DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name;
        RAISE NOTICE 'Removida constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- 2. Criar a foreign key com o nome que o Supabase espera
-- O Supabase usa o padrão: fk_<tabela_origem>_<tabela_destino>
ALTER TABLE itens_pedido 
ADD CONSTRAINT fk_itens_pedido_itens_cardapio 
FOREIGN KEY (id_item_cardapio) 
REFERENCES itens_cardapio(id) 
ON DELETE CASCADE;

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'itens_pedido'
    AND kcu.column_name = 'id_item_cardapio';

-- 4. Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_itens_pedido_item_cardapio 
ON itens_pedido(id_item_cardapio);

-- 5. Testar a query que o frontend usa
SELECT 
    p.id,
    p.numero_pedido,
    p.nome_cliente,
    p.valor_total,
    json_agg(
        json_build_object(
            'quantidade', ip.quantidade,
            'preco_unitario', ip.preco_unitario,
            'nome_item', ic.nome,
            'preco_item', ic.preco
        )
    ) as itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
LEFT JOIN itens_cardapio ic ON ic.id = ip.id_item_cardapio
WHERE p.status = 'disponivel'
GROUP BY p.id
LIMIT 3;

RAISE NOTICE '✅ Correção concluída! Teste a aplicação agora.';
