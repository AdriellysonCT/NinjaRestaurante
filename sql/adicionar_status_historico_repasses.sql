-- Adicionar coluna status na tabela historico_repasses se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'historico_repasses' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE historico_repasses 
    ADD COLUMN status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'pago', 'cancelado'));
    
    COMMENT ON COLUMN historico_repasses.status IS 'Status do repasse: pendente, processando, aprovado, pago, cancelado';
  END IF;
END $$;

-- Atualizar registros existentes sem status
UPDATE historico_repasses 
SET status = 'pago' 
WHERE status IS NULL AND data_repasse IS NOT NULL;

UPDATE historico_repasses 
SET status = 'pendente' 
WHERE status IS NULL AND data_repasse IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_repasses_status 
ON historico_repasses(status);

CREATE INDEX IF NOT EXISTS idx_historico_repasses_restaurante_status 
ON historico_repasses(id_restaurante, status);

-- Comentários
COMMENT ON TABLE historico_repasses IS 'Histórico de todos os repasses solicitados e processados pelos restaurantes';
