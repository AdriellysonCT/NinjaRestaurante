-- Adicionar campos necessários para sincronização com entregas, mantendo compatibilidade
ALTER TABLE pedidos_padronizados
  ADD COLUMN IF NOT EXISTS nome_cliente TEXT,
  ADD COLUMN IF NOT EXISTS telefone_cliente TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;

-- Ajustar nomenclatura de valor total, se necessário
-- Se a coluna valor_total não existir e existir total, cria valor_total espelhando
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
     WHERE table_name='pedidos_padronizados' AND column_name='valor_total'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
       WHERE table_name='pedidos_padronizados' AND column_name='total'
    ) THEN
      ALTER TABLE pedidos_padronizados ADD COLUMN valor_total NUMERIC;
      UPDATE pedidos_padronizados SET valor_total = total;
    ELSE
      ALTER TABLE pedidos_padronizados ADD COLUMN valor_total NUMERIC DEFAULT 0;
    END IF;
  END IF;
END $$;



