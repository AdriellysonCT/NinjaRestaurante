-- Script para adicionar o campo atualizado_em na tabela restaurantes_app
-- Execute este script no painel SQL do Supabase

-- 1. Adicionar coluna atualizado_em se não existir
ALTER TABLE restaurantes_app 
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();

-- 2. Criar trigger para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_restaurantes_app_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Criar o trigger
DROP TRIGGER IF EXISTS update_restaurantes_app_atualizado_em_trigger ON restaurantes_app;
CREATE TRIGGER update_restaurantes_app_atualizado_em_trigger
    BEFORE UPDATE ON restaurantes_app 
    FOR EACH ROW 
    EXECUTE FUNCTION update_restaurantes_app_atualizado_em();

-- 4. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app' 
AND column_name = 'atualizado_em';