-- ============================================
-- VERIFICAR E CRIAR COLUNA 'ativo' NA TABELA restaurantes_app
-- ============================================

-- 1. Verificar se a coluna 'ativo' existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app' 
  AND column_name = 'ativo';

-- 2. Se a coluna não existir, criar ela
-- Execute este comando apenas se a consulta acima não retornar nenhum resultado
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'restaurantes_app' 
      AND column_name = 'ativo'
  ) THEN
    ALTER TABLE restaurantes_app 
    ADD COLUMN ativo BOOLEAN DEFAULT false;
    
    RAISE NOTICE '✅ Coluna ativo criada com sucesso!';
  ELSE
    RAISE NOTICE '✅ Coluna ativo já existe!';
  END IF;
END $$;

-- 3. Verificar a estrutura completa da tabela restaurantes_app
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;

-- 4. Verificar quantos restaurantes estão online/offline
SELECT 
  ativo,
  COUNT(*) as total
FROM restaurantes_app
GROUP BY ativo;

-- 5. Ver todos os restaurantes e seu status
SELECT 
  id,
  nome_fantasia,
  ativo,
  created_at,
  updated_at
FROM restaurantes_app
ORDER BY created_at DESC;

-- ============================================
-- COMANDOS ÚTEIS PARA TESTES
-- ============================================

-- Marcar todos como offline (útil para reset)
-- UPDATE restaurantes_app SET ativo = false;

-- Marcar um restaurante específico como online
-- UPDATE restaurantes_app SET ativo = true WHERE id = 'seu-restaurante-id';

-- Ver apenas restaurantes online
-- SELECT id, nome_fantasia, ativo FROM restaurantes_app WHERE ativo = true;

-- Ver apenas restaurantes offline
-- SELECT id, nome_fantasia, ativo FROM restaurantes_app WHERE ativo = false;
