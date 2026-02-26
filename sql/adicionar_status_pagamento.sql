-- Script para adicionar campos de status de pagamento na tabela pedidos_padronizados
-- Execute este script no painel SQL do Supabase

-- 1. Adicionar coluna status_pagamento
ALTER TABLE pedidos_padronizados
  ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente' 
  CHECK (status_pagamento IN ('pendente', 'pago', 'estornado'));

-- 2. Adicionar coluna troco para pedidos de dinheiro
ALTER TABLE pedidos_padronizados
  ADD COLUMN IF NOT EXISTS troco NUMERIC DEFAULT 0;

-- 3. Atualizar status_pagamento baseado no campo pagamento_recebido_pelo_sistema existente
UPDATE pedidos_padronizados 
SET status_pagamento = CASE 
  WHEN pagamento_recebido_pelo_sistema = true THEN 'pago'
  WHEN metodo_pagamento = 'dinheiro' THEN 'pendente'
  ELSE 'pendente'
END
WHERE status_pagamento = 'pendente';

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_padronizados_status_pagamento 
ON pedidos_padronizados(status_pagamento);

CREATE INDEX IF NOT EXISTS idx_pedidos_padronizados_metodo_pagamento 
ON pedidos_padronizados(metodo_pagamento);

-- 5. Comentários explicativos
COMMENT ON COLUMN pedidos_padronizados.status_pagamento IS 
'Status do pagamento: pendente (dinheiro), pago (PIX/cartão aprovado), estornado (pagamento cancelado)';

COMMENT ON COLUMN pedidos_padronizados.troco IS 
'Valor do troco para pedidos pagos em dinheiro (quando status_pagamento = pendente)';

-- 6. Verificar dados migrados
SELECT 
  status_pagamento,
  metodo_pagamento,
  COUNT(*) as quantidade
FROM pedidos_padronizados 
GROUP BY status_pagamento, metodo_pagamento
ORDER BY status_pagamento, metodo_pagamento;
