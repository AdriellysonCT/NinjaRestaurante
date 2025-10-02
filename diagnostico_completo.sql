-- Script de diagnóstico completo
-- Execute este script no painel SQL do Supabase para identificar os problemas

-- 1. Verificar se as tabelas existem
SELECT 
    'orders' as tabela,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') as existe
UNION ALL
SELECT 
    'itens_pedido' as tabela,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'itens_pedido') as existe
UNION ALL
SELECT 
    'itens_cardapio' as tabela,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'itens_cardapio') as existe
UNION ALL
SELECT 
    'restaurantes_app' as tabela,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'restaurantes_app') as existe;

-- 2. Verificar usuário atual e restaurante
SELECT 
    auth.uid() as usuario_atual,
    (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()) as id_restaurante,
    (SELECT nome_fantasia FROM restaurantes_app WHERE user_id = auth.uid()) as nome_restaurante;

-- 3. Verificar itens do cardápio
SELECT 
    'Itens no cardápio' as info,
    COUNT(*) as quantidade
FROM itens_cardapio;

-- 4. Verificar itens do cardápio do usuário atual
SELECT 
    ic.id,
    ic.nome,
    ic.id_restaurante,
    r.nome_fantasia
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON ic.id_restaurante = r.id
WHERE ic.id_restaurante = (SELECT id FROM restaurantes_app WHERE user_id = auth.uid());

-- 5. Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('orders', 'itens_pedido', 'itens_cardapio');