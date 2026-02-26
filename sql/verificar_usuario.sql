-- Script para verificar se o usuário está autenticado corretamente
-- Execute este script no painel SQL do Supabase para debug

-- Verificar usuário atual
SELECT auth.uid() as usuario_atual;

-- Verificar se existem usuários na tabela auth.users
SELECT id, email, created_at 
FROM auth.users 
LIMIT 5;

-- Verificar políticas da tabela
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'itens_cardapio';