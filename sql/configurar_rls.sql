-- Script para configurar Row Level Security (RLS) na tabela itens_cardapio
-- Execute este script no painel SQL do Supabase

-- 1. Habilitar RLS na tabela
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes (se houver conflitos)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios itens" ON itens_cardapio;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios itens" ON itens_cardapio;

-- 3. Criar políticas RLS corretas
-- Política para SELECT (visualizar)
CREATE POLICY "Usuários podem ver seus próprios itens" ON itens_cardapio
    FOR SELECT USING (auth.uid() = id_restaurante);

-- Política para INSERT (inserir)
CREATE POLICY "Usuários podem inserir seus próprios itens" ON itens_cardapio
    FOR INSERT WITH CHECK (auth.uid() = id_restaurante);

-- Política para UPDATE (atualizar)
CREATE POLICY "Usuários podem atualizar seus próprios itens" ON itens_cardapio
    FOR UPDATE USING (auth.uid() = id_restaurante);

-- Política para DELETE (deletar)
CREATE POLICY "Usuários podem deletar seus próprios itens" ON itens_cardapio
    FOR DELETE USING (auth.uid() = id_restaurante);

-- 4. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'itens_cardapio';