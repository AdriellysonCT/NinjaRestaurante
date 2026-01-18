-- CORREÇÃO DO ERRO 'valor_entrega_bairro does not exist'

-- O erro acontece porque a função antiga tentava buscar o valor da entrega em uma tabela que não existe.
-- Vamos atualizar a função para usar o valor da taxa de entrega que já está no pedido (NEW.taxa_entrega).

CREATE OR REPLACE FUNCTION copiar_pedido_para_entregas()
RETURNS TRIGGER AS $$
DECLARE
  v_valor_entrega numeric := 0;
BEGIN
  -- Apenas processar se o status for 'pronto_para_entrega' e for delivery
  -- (Adicionado verificação de tipo_pedido para evitar criar entregas para retirada/local)
  IF (NEW.status = 'pronto_para_entrega') AND (NEW.tipo_pedido = 'delivery') THEN

    -- Verificar se já existe entrega para este pedido para evitar duplicação
    IF NOT EXISTS (
      SELECT 1 FROM public.entregas_padronizadas WHERE id_pedido = NEW.id
    ) THEN
      
      -- Usa a taxa_entrega do próprio pedido. Se for nula, assume 0.
      v_valor_entrega := COALESCE(NEW.taxa_entrega, 0);

      INSERT INTO public.entregas_padronizadas (
        id_pedido,
        id_restaurante,
        tipo_pedido,
        status,
        nome_cliente,
        telefone_cliente,
        endereco,
        bairro,
        numero,
        observacoes,
        metodo_pagamento,
        valor_total,
        valor_entrega,
        id_publico,
        criado_em,
        atualizado_em
      ) VALUES (
        NEW.id,
        NEW.id_restaurante,
        NEW.tipo_pedido,
        'disponivel', -- Status 'disponivel' para aparecer para os entregadores
        NEW.nome_cliente,
        NEW.telefone_cliente,
        NEW.endereco,
        NEW.bairro,
        NEW.numero,
        NEW.observacoes,
        NEW.metodo_pagamento,
        NEW.valor_total,
        v_valor_entrega,
        COALESCE(NEW.id_publico, NEW.numero_pedido::text),
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Entrega criada com sucesso para o pedido % (Taxa: %)', NEW.numero_pedido, v_valor_entrega;
      
    ELSE
      RAISE NOTICE 'Entrega já existe para o pedido %', NEW.numero_pedido;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger está correto
DROP TRIGGER IF EXISTS criar_entrega_automatica ON pedidos_padronizados;
CREATE TRIGGER criar_entrega_automatica
  AFTER UPDATE OF status ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION copiar_pedido_para_entregas();

RAISE NOTICE 'Função copiar_pedido_para_entregas corrigida com sucesso.';
