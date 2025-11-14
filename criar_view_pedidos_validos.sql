-- ============================================
-- Script: Criar View de Pedidos Válidos
-- Descrição: View que retorna apenas pedidos com pagamento válido
-- ============================================

-- Criar ou substituir view de pedidos válidos
CREATE OR REPLACE VIEW pedidos_validos AS
SELECT 
  p.*,
  CASE 
    WHEN p.status_pagamento = 'pago' THEN '🟢 Pago'
    WHEN p.status_pagamento = 'pendente' THEN '🟡 Pendente'
    WHEN p.status_pagamento = 'estornado' THEN '🔴 Estornado'
    ELSE '⚪ Desconhecido'
  END AS status_pagamento_label,
  CASE 
    WHEN p.status_pagamento = 'pago' THEN true
    ELSE false
  END AS incluir_no_faturamento
FROM pedidos_padronizados p
WHERE p.status_pagamento IN ('pago', 'pendente')
  AND p.status != 'cancelado';

-- Adicionar comentário
COMMENT ON VIEW pedidos_validos IS 'Retorna apenas pedidos com pagamento válido (pago ou pendente), excluindo recusados e cancelados';

-- Conceder permissões
GRANT SELECT ON pedidos_validos TO authenticated;

-- Criar view de pedidos para faturamento (apenas pagos)
CREATE OR REPLACE VIEW pedidos_faturamento AS
SELECT 
  p.*,
  EXTRACT(YEAR FROM p.criado_em) AS ano,
  EXTRACT(MONTH FROM p.criado_em) AS mes,
  EXTRACT(DAY FROM p.criado_em) AS dia
FROM pedidos_padronizados p
WHERE p.status_pagamento = 'pago'
  AND p.status = 'concluido';

-- Adicionar comentário
COMMENT ON VIEW pedidos_faturamento IS 'Retorna apenas pedidos pagos e concluídos para cálculo de faturamento';

-- Conceder permissões
GRANT SELECT ON pedidos_faturamento TO authenticated;

-- Criar função para obter resumo de pagamentos
CREATE OR REPLACE FUNCTION obter_resumo_pagamentos(p_id_restaurante UUID, p_data_inicio DATE, p_data_fim DATE)
RETURNS TABLE (
  total_pedidos BIGINT,
  pedidos_pagos BIGINT,
  pedidos_pendentes BIGINT,
  pedidos_estornados BIGINT,
  valor_total_pago DECIMAL,
  valor_total_pendente DECIMAL,
  valor_total_estornado DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_pedidos,
    COUNT(*) FILTER (WHERE status_pagamento = 'pago') AS pedidos_pagos,
    COUNT(*) FILTER (WHERE status_pagamento = 'pendente') AS pedidos_pendentes,
    COUNT(*) FILTER (WHERE status_pagamento = 'estornado') AS pedidos_estornados,
    COALESCE(SUM(valor_total) FILTER (WHERE status_pagamento = 'pago'), 0) AS valor_total_pago,
    COALESCE(SUM(valor_total) FILTER (WHERE status_pagamento = 'pendente'), 0) AS valor_total_pendente,
    COALESCE(SUM(valor_total) FILTER (WHERE status_pagamento = 'estornado'), 0) AS valor_total_estornado
  FROM pedidos_padronizados
  WHERE id_restaurante = p_id_restaurante
    AND criado_em >= p_data_inicio
    AND criado_em <= p_data_fim + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION obter_resumo_pagamentos IS 'Retorna resumo de pagamentos por período para um restaurante';

-- Conceder execução
GRANT EXECUTE ON FUNCTION obter_resumo_pagamentos TO authenticated;

-- Resultado
SELECT 'Views e funções criadas com sucesso!' AS resultado;

