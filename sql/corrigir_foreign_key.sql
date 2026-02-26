-- Script para corrigir a foreign key da tabela itens_cardapio
-- Execute este script no painel SQL do Supabase

-- 1. Remover a constraint incorreta
ALTER TABLE itens_cardapio 
DROP CONSTRAINT IF EXISTS itens_cardapio_id_restaurante_fkey;

-- 2. Adicionar a constraint correta referenciando auth.users
ALTER TABLE itens_cardapio 
ADD CONSTRAINT itens_cardapio_id_restaurante_fkey 
FOREIGN KEY (id_restaurante) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'itens_cardapio' 
    AND tc.constraint_type = 'FOREIGN KEY';