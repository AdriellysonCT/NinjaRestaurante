-- Ajuste de constraint de status para incluir 'pronto_para_entrega'
ALTER TABLE pedidos_padronizados
  DROP CONSTRAINT IF EXISTS pedidos_padronizados_status_check;

ALTER TABLE pedidos_padronizados
  ADD CONSTRAINT pedidos_padronizados_status_check
  CHECK (status IN ('disponivel','aceito','pronto_para_entrega','coletado','concluido','cancelado'));



