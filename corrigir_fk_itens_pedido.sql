-- corrigir_fk_itens_pedido.sql
-- Script para corrigir foreign keys duplicadas entre itens_pedido e itens_cardapio
-- Execute no painel SQL do Supabase

-- 1. Listar todas as foreign keys existentes entre itens_pedido e itens_cardapio
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'itens_pedido'
    AND ccu.table_name = 'itens_cardapio';

-- 2. Remover todas as foreign keys exceto a principal (itens_pedido_id_item_cardapio_fkey)
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'itens_pedido'
            AND ccu.table_name = 'itens_cardapio'
            AND tc.constraint_name != 'itens_pedido_id_item_cardapio_fkey'
    ) LOOP
        EXECUTE 'ALTER TABLE itens_pedido DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- 3. Garantir que a foreign key principal existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'itens_pedido_id_item_cardapio_fkey'
        AND table_name = 'itens_pedido'
    ) THEN
        ALTER TABLE itens_pedido 
        ADD CONSTRAINT itens_pedido_id_item_cardapio_fkey 
        FOREIGN KEY (id_item_cardapio) REFERENCES itens_cardapio(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Created constraint: itens_pedido_id_item_cardapio_fkey';
    END IF;
END $$;

-- 4. Verificar o resultado final
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'itens_pedido'
    AND ccu.table_name = 'itens_cardapio';