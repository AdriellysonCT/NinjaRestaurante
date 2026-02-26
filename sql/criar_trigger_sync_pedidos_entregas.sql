-- Função + Trigger: sincroniza pedidos_padronizados -> entregas_padronizadas
-- Quando status muda para 'pronto_para_entrega', cria (se não existir) o registro na tabela de entregas

CREATE OR REPLACE FUNCTION sync_pedido_para_entrega()
RETURNS TRIGGER AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Apenas quando o status muda para 'pronto_para_entrega'
  IF TG_OP = 'UPDATE' 
     AND NEW.status = 'pronto_para_entrega' 
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.tipo_pedido = 'delivery' THEN
    -- Verificar se já existe entrega para este pedido
    SELECT EXISTS (
      SELECT 1 FROM entregas_padronizadas e WHERE e.id_pedido = NEW.id
    ) INTO v_exists;

    IF NOT v_exists THEN
      INSERT INTO entregas_padronizadas (
        id_pedido,
        id_restaurante,
        numero_pedido,
        nome_cliente,
        telefone_cliente,
        endereco,
        bairro,
        numero,
        valor_total,
        metodo_pagamento,
        status,
        observacoes,
        id_publico
      ) VALUES (
        NEW.id,
        NEW.id_restaurante,
        NEW.numero_pedido,
        COALESCE(NEW.nome_cliente, NULL),
        COALESCE(NEW.telefone_cliente, NULL),
        COALESCE(NEW.endereco, NULL),
        COALESCE(NEW.bairro, NULL),
        COALESCE(NEW.numero, NULL),
        COALESCE(NEW.valor_total, NEW.total, 0),
        COALESCE(NEW.metodo_pagamento, NEW.payment_method, NULL),
        'disponivel',
        COALESCE(NEW.observacoes, NULL),
        COALESCE(NEW.numero_pedido::text, substr(NEW.id::text, 1, 8))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria a trigger para garantir a ordem
DROP TRIGGER IF EXISTS trg_sync_pedido_para_entrega ON pedidos_padronizados;
CREATE TRIGGER trg_sync_pedido_para_entrega
  AFTER UPDATE OF status ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION sync_pedido_para_entrega();


