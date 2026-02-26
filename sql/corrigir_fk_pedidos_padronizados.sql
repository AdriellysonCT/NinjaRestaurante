-- corrigir_fk_pedidos_padronizados.sql
-- Script para corrigir a foreign key na tabela pedidos_padronizados
-- Execute no painel SQL do Supabase

-- 1. Remover a constraint existente
ALTER TABLE pedidos_padronizados
DROP CONSTRAINT IF EXISTS pedidos_padronizados_id_cliente_fkey;

-- 2. Adicionar a constraint correta
ALTER TABLE pedidos_padronizados
ADD CONSTRAINT pedidos_padronizados_id_cliente_fkey
FOREIGN KEY (id_cliente) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 3. Verificar se a constraint foi criada corretamente
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
    AND tc.table_name = 'pedidos_padronizados'
    AND kcu.column_name = 'id_cliente';