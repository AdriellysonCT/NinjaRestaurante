-- Script para ajustar a tabela itens_pedido para trabalhar com orders
-- Execute este script APÓS criar a tabela orders

-- 1. Verificar estrutura atual da tabela itens_pedido
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'itens_pedido'
ORDER BY ordinal_position;

-- 2. Adicionar constraint de foreign key para orders (se não existir)
DO $$ 
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'itens_pedido_id_pedido_fkey'
        AND table_name = 'itens_pedido'
    ) THEN
        -- Adicionar foreign key para orders
        ALTER TABLE itens_pedido 
        ADD CONSTRAINT itens_pedido_id_pedido_fkey 
        FOREIGN KEY (id_pedido) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Adicionar constraint de foreign key para itens_cardapio (se não existir)
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
    END IF;
END $$;

-- 4. Configurar RLS para itens_pedido (se não estiver configurado)
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver conflitos)
DROP POLICY IF EXISTS "Restaurantes podem ver seus próprios itens de pedido" ON itens_pedido;
DROP POLICY IF EXISTS "Restaurantes podem inserir seus próprios itens de pedido" ON itens_pedido;
DROP POLICY IF EXISTS "Restaurantes podem atualizar seus próprios itens de pedido" ON itens_pedido;
DROP POLICY IF EXISTS "Restaurantes podem deletar seus próprios itens de pedido" ON itens_pedido;

-- Criar políticas RLS para itens_pedido
CREATE POLICY "Restaurantes podem ver seus próprios itens de pedido" ON itens_pedido
    FOR SELECT USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem inserir seus próprios itens de pedido" ON itens_pedido
    FOR INSERT WITH CHECK (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem atualizar seus próprios itens de pedido" ON itens_pedido
    FOR UPDATE USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem deletar seus próprios itens de pedido" ON itens_pedido
    FOR DELETE USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(id_pedido);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_item_cardapio ON itens_pedido(id_item_cardapio);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_restaurante ON itens_pedido(id_restaurante);