-- ============================================
-- DEBUG: Status Ativo do Restaurante
-- ============================================

-- 1. Ver todos os restaurantes e seu status atual
SELECT 
  id,
  user_id,
  nome_fantasia,
  ativo,
  created_at,
  updated_at
FROM restaurantes_app
ORDER BY updated_at DESC;

-- 2. Ver apenas restaurantes ONLINE
SELECT 
  id,
  user_id,
  nome_fantasia,
  ativo,
  updated_at
FROM restaurantes_app
WHERE ativo = true;

-- 3. Ver apenas restaurantes OFFLINE
SELECT 
  id,
  user_id,
  nome_fantasia,
  ativo,
  updated_at
FROM restaurantes_app
WHERE ativo = false;

-- 4. Verificar se a coluna 'ativo' existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app' 
  AND column_name = 'ativo';

-- 5. Verificar permissões RLS para UPDATE
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurantes_app'
  AND cmd = 'UPDATE';

-- ============================================
-- TESTES MANUAIS
-- ============================================

-- Teste 1: Marcar um restaurante como ONLINE manualmente
-- Substitua 'seu-restaurante-id' pelo ID real
-- UPDATE restaurantes_app 
-- SET ativo = true 
-- WHERE id = 'seu-restaurante-id';

-- Teste 2: Marcar um restaurante como OFFLINE manualmente
-- UPDATE restaurantes_app 
-- SET ativo = false 
-- WHERE id = 'seu-restaurante-id';

-- Teste 3: Verificar se o UPDATE funciona para o seu user_id
-- Substitua 'seu-user-id' pelo user_id real
-- UPDATE restaurantes_app 
-- SET ativo = true 
-- WHERE user_id = 'seu-user-id';

-- Teste 4: Ver histórico de mudanças (se houver trigger de auditoria)
-- SELECT * FROM audit_log 
-- WHERE table_name = 'restaurantes_app' 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- ============================================
-- CRIAR POLÍTICA RLS SE NÃO EXISTIR
-- ============================================

-- Permitir UPDATE para usuários autenticados no próprio restaurante
DO $$ 
BEGIN
  -- Verificar se a política já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'restaurantes_app' 
      AND policyname = 'Usuários podem atualizar próprio restaurante'
  ) THEN
    -- Criar política
    CREATE POLICY "Usuários podem atualizar próprio restaurante"
    ON restaurantes_app
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
    
    RAISE NOTICE '✅ Política RLS criada com sucesso!';
  ELSE
    RAISE NOTICE '✅ Política RLS já existe!';
  END IF;
END $$;

-- ============================================
-- VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'restaurantes_app';

-- Se rowsecurity = false, habilitar RLS:
-- ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÃO PARA MONITORAR MUDANÇAS (OPCIONAL)
-- ============================================

-- Criar função para logar mudanças no campo 'ativo'
CREATE OR REPLACE FUNCTION log_status_ativo_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ativo IS DISTINCT FROM NEW.ativo THEN
    RAISE NOTICE 'Status ativo mudou: restaurante_id=%, de % para %, timestamp=%',
      NEW.id, OLD.ativo, NEW.ativo, NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger (execute apenas uma vez)
-- DROP TRIGGER IF EXISTS trigger_log_status_ativo ON restaurantes_app;
-- CREATE TRIGGER trigger_log_status_ativo
-- BEFORE UPDATE ON restaurantes_app
-- FOR EACH ROW
-- EXECUTE FUNCTION log_status_ativo_change();

-- ============================================
-- COMANDOS ÚTEIS PARA DEBUG
-- ============================================

-- Ver último UPDATE em restaurantes_app
-- SELECT * FROM restaurantes_app 
-- ORDER BY updated_at DESC 
-- LIMIT 5;

-- Resetar todos para OFFLINE (útil para testes)
-- UPDATE restaurantes_app SET ativo = false;

-- Marcar todos como ONLINE (útil para testes)
-- UPDATE restaurantes_app SET ativo = true;

-- Ver quantos estão online/offline
SELECT 
  ativo,
  COUNT(*) as total
FROM restaurantes_app
GROUP BY ativo;
