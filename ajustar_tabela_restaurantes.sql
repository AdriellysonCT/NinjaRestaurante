-- Script para ajustar a tabela restaurantes_app com campos de endereço separados
-- Execute este script no painel SQL do Supabase

-- 1. Adicionar colunas de endereço se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna rua se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'rua'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN rua TEXT;
    END IF;
    
    -- Adicionar coluna numero se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'numero'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN numero TEXT;
    END IF;
    
    -- Adicionar coluna bairro se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'bairro'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN bairro TEXT;
    END IF;
    
    -- Adicionar coluna cidade se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'cidade'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN cidade TEXT;
    END IF;
    
    -- Adicionar coluna complemento se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'complemento'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN complemento TEXT;
    END IF;
    
    -- Adicionar coluna cep se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'cep'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN cep TEXT;
    END IF;
    
    -- Adicionar coluna estado se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE restaurantes_app ADD COLUMN estado TEXT;
    END IF;
END $$;

-- 2. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurantes_app' 
AND column_name IN ('rua', 'numero', 'bairro', 'cidade', 'complemento', 'cep', 'estado')
ORDER BY column_name;