-- Script para adicionar campos separados de endereço na tabela configuracoes
-- Execute este script no painel SQL do Supabase

-- 1. Adicionar as novas colunas de endereço
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS rua TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT;

-- 2. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'configuracoes' 
AND column_name IN ('rua', 'numero', 'bairro', 'cidade', 'cep', 'estado', 'complemento')
ORDER BY column_name;