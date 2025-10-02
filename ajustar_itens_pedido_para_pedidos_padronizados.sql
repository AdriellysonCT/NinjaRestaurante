-- Script para ajustar a tabela itens_pedido para referenciar pedidos_padronizados
-- Execute este script no painel SQL do Supabase APÓS criar pedidos_padronizados

-- 1. Verificar estrutura atual da tabela itens_pedido
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'itens_pedido'
ORDER BY ordinal_position;

-- 2. Remover foreign key antiga para orders (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'itens_pedido_id_pedido_fkey'
        AND table_name = 'itens_pedido'
    ) THEN
        ALTER TABLE itens_pedido 
        DROP CONSTRAINT itens_pedido_id_pedido_fkey;
    END IF;
END $$;

-- 3. Adicionar nova foreign key para pedidos_padronizados
ALTER TABLE itens_pedido 
ADD CONSTRAINT itens_pedido_id_pedido_fkey 
FOREIGN KEY (id_pedido) REFERENCES pedidos_padronizados(id) ON DELETE CASCADE;

-- 4. Verificar se a nova constraint foi adicionada
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'itens_pedido'
AND tc.constraint_type = 'FOREIGN KEY';

-- 5. Ajustar colunas se necessário (adicionar observacao_item se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_pedido' 
        AND column_name = 'observacao_item'
    ) THEN
        ALTER TABLE itens_pedido ADD COLUMN observacao_item TEXT;
    END IF;
END $$;

-- 6. Garantir que as colunas principais existam
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_pedido' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE itens_pedido ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_pedido' 
        AND column_name = 'quantidade'
    ) THEN
        ALTER TABLE itens_pedido ADD COLUMN quantidade INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_pedido' 
        AND column_name = 'preco_unitario'
    ) THEN
        ALTER TABLE itens_pedido ADD COLUMN preco_unitario NUMERIC NOT NULL DEFAULT 0;
    END IF;
END $$;