-- Script para adicionar campo 'ativo' na tabela restaurantes_app
-- Este campo indica se o restaurante está ativo/operando
-- Execute este script no painel SQL do Supabase

-- 1. Adicionar coluna 'ativo' se não existir (com valor padrão true para logins ativos)
DO $$ 
BEGIN
    -- Verificar se a coluna 'ativo' já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes_app' 
        AND column_name = 'ativo'
    ) THEN
        -- Adicionar coluna 'ativo' com valor padrão true
        ALTER TABLE restaurantes_app ADD COLUMN ativo BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Coluna "ativo" adicionada com sucesso à tabela restaurantes_app';
    ELSE
        RAISE NOTICE 'Coluna "ativo" já existe na tabela restaurantes_app';
    END IF;
END $$;

-- 2. Criar índice para melhorar performance em buscas por status ativo
CREATE INDEX IF NOT EXISTS idx_restaurantes_ativo ON restaurantes_app(ativo);

-- 3. Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurantes_app' 
AND column_name = 'ativo';

-- 4. Opcional: Atualizar todos os restaurantes para ativo = true inicialmente
-- UPDATE restaurantes_app SET ativo = true WHERE ativo IS NULL;

-- Comentário: 
-- Quando o usuário fizer login, o sistema pode atualizar 'ativo = true'
-- Quando encerrar o dia ou fazer logout, o sistema atualiza 'ativo = false'

