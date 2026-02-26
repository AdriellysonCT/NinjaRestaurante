-- Função para aceitar entrega de forma atômica (evita dupla aceitação)
CREATE OR REPLACE FUNCTION aceitar_entrega(p_entrega_id UUID, p_entregador_id UUID)
RETURNS TABLE (id UUID, status TEXT, aceito_em TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  UPDATE entregas_padronizadas e
     SET status = 'aceito',
         aceito_em = NOW()
   WHERE e.id = p_entrega_id
     AND e.status = 'disponivel'
  RETURNING e.id, e.status, e.aceito_em;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Opcional: poderia também gravar o entregador responsável, se a coluna existir.


