-- Ajustes na tabela entregas_padronizadas para campos exigidos pelo app do entregador

-- Adicionar colunas separadas de endereço e id_publico
ALTER TABLE entregas_padronizadas
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS id_publico TEXT;

-- Índice/uniqueness opcional para id_publico (se for usado externamente como referência pública)
CREATE UNIQUE INDEX IF NOT EXISTS uq_entregas_id_publico ON entregas_padronizadas(id_publico);



