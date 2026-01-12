-- ============================================
-- SISTEMA DE CUPONS DE DESCONTO
-- ============================================

-- Tabela principal de cupons
CREATE TABLE IF NOT EXISTS cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_restaurante UUID NOT NULL REFERENCES restaurantes_app(id) ON DELETE CASCADE,
  
  -- Informações do cupom
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  
  -- Tipo de desconto
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percentual', 'valor_fixo', 'frete_gratis')),
  valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Valor mínimo do pedido para usar o cupom
  valor_minimo_pedido DECIMAL(10,2) DEFAULT 0,
  
  -- Valor máximo de desconto (útil para descontos percentuais)
  valor_maximo_desconto DECIMAL(10,2),
  
  -- Limites de uso
  limite_uso_total INT, -- NULL = ilimitado
  limite_uso_por_cliente INT DEFAULT 1,
  uso_atual INT DEFAULT 0,
  
  -- Validade
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Restrições
  apenas_primeira_compra BOOLEAN DEFAULT false,
  categorias_permitidas TEXT[], -- Array de categorias que podem usar o cupom
  itens_permitidos UUID[], -- Array de IDs de itens específicos
  
  -- Metadados
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID, -- Removido REFERENCES pois não há tabela usuarios genérica
  
  -- Observações internas
  observacoes TEXT
);

-- Tabela de uso de cupons (histórico)
CREATE TABLE IF NOT EXISTS cupons_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cupom_id UUID NOT NULL REFERENCES cupons(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes_app(user_id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos_padronizados(id) ON DELETE SET NULL,
  
  -- Valores aplicados
  valor_pedido DECIMAL(10,2) NOT NULL,
  valor_desconto_aplicado DECIMAL(10,2) NOT NULL,
  
  -- Metadados
  usado_em TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cupons_id_restaurante ON cupons(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_ativo ON cupons(ativo);
CREATE INDEX IF NOT EXISTS idx_cupons_data_fim ON cupons(data_fim);
CREATE INDEX IF NOT EXISTS idx_cupons_uso_cupom_id ON cupons_uso(cupom_id);
CREATE INDEX IF NOT EXISTS idx_cupons_uso_cliente_id ON cupons_uso(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cupons_uso_pedido_id ON cupons_uso(pedido_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_cupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cupons_updated_at ON cupons;
CREATE TRIGGER trigger_update_cupons_updated_at
  BEFORE UPDATE ON cupons
  FOR EACH ROW
  EXECUTE FUNCTION update_cupons_updated_at();

-- Trigger para incrementar uso_atual quando cupom é usado
CREATE OR REPLACE FUNCTION increment_cupom_uso()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cupons 
  SET uso_atual = uso_atual + 1
  WHERE id = NEW.cupom_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_cupom_uso ON cupons_uso;
CREATE TRIGGER trigger_increment_cupom_uso
  AFTER INSERT ON cupons_uso
  FOR EACH ROW
  EXECUTE FUNCTION increment_cupom_uso();

-- Trigger para desativar cupom automaticamente quando atingir limite
CREATE OR REPLACE FUNCTION check_cupom_limite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uso_atual >= NEW.limite_uso_total AND NEW.limite_uso_total IS NOT NULL THEN
    NEW.ativo = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_cupom_limite ON cupons;
CREATE TRIGGER trigger_check_cupom_limite
  BEFORE UPDATE ON cupons
  FOR EACH ROW
  EXECUTE FUNCTION check_cupom_limite();

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para validar cupom
CREATE OR REPLACE FUNCTION validar_cupom(
  p_codigo TEXT,
  p_cliente_id UUID,
  p_restaurante_id UUID,
  p_valor_pedido DECIMAL,
  p_itens_pedido UUID[] DEFAULT NULL
)
RETURNS TABLE(
  valido BOOLEAN,
  mensagem TEXT,
  cupom_id UUID,
  tipo_desconto TEXT,
  valor_desconto DECIMAL,
  valor_desconto_calculado DECIMAL
) AS $$
DECLARE
  v_cupom RECORD;
  v_uso_cliente INT;
  v_desconto_calculado DECIMAL;
BEGIN
  -- Buscar cupom
  SELECT * INTO v_cupom
  FROM cupons
  WHERE codigo = p_codigo
  AND id_restaurante = p_restaurante_id;

  -- Cupom não existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupom não encontrado', NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;

  -- Cupom inativo
  IF NOT v_cupom.ativo THEN
    RETURN QUERY SELECT false, 'Cupom inativo', v_cupom.id, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;

  -- Verificar data de início
  IF v_cupom.data_inicio > NOW() THEN
    RETURN QUERY SELECT false, 'Cupom ainda não está válido', v_cupom.id, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;

  -- Verificar data de fim
  IF v_cupom.data_fim IS NOT NULL AND v_cupom.data_fim < NOW() THEN
    RETURN QUERY SELECT false, 'Cupom expirado', v_cupom.id, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;

  -- Verificar limite total de uso
  IF v_cupom.limite_uso_total IS NOT NULL AND v_cupom.uso_atual >= v_cupom.limite_uso_total THEN
    RETURN QUERY SELECT false, 'Cupom esgotado', v_cupom.id, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;

  -- Verificar limite de uso por cliente
  SELECT COUNT(*) INTO v_uso_cliente
  FROM cupons_uso
  WHERE cupom_id = v_cupom.id
  AND cliente_id = p_cliente_id;

  IF v_cupom.limite_uso_por_cliente IS NOT NULL AND v_uso_cliente >= v_cupom.limite_uso_por_cliente THEN
    RETURN QUERY SELECT false, 'Você já usou este cupom o máximo de vezes permitido', v_cupom.id, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;

  -- Verificar valor mínimo do pedido
  IF v_cupom.valor_minimo_pedido > 0 AND p_valor_pedido < v_cupom.valor_minimo_pedido THEN
    RETURN QUERY SELECT 
      false, 
      'Valor mínimo do pedido: R$ ' || v_cupom.valor_minimo_pedido::TEXT, 
      v_cupom.id, 
      NULL::TEXT, 
      NULL::DECIMAL, 
      NULL::DECIMAL;
    RETURN;
  END IF;

  -- Verificar se é apenas primeira compra
  IF v_cupom.apenas_primeira_compra THEN
    IF EXISTS (
      SELECT 1 FROM pedidos_padronizados 
      WHERE id_cliente = p_cliente_id 
      AND id_restaurante = p_restaurante_id
      AND status NOT IN ('cancelado')
    ) THEN
      RETURN QUERY SELECT false, 'Cupom válido apenas para primeira compra', v_cupom.id, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
      RETURN;
    END IF;
  END IF;

  -- Calcular desconto
  IF v_cupom.tipo_desconto = 'percentual' THEN
    v_desconto_calculado := (p_valor_pedido * v_cupom.valor_desconto / 100);
    -- Aplicar limite máximo se existir
    IF v_cupom.valor_maximo_desconto IS NOT NULL AND v_desconto_calculado > v_cupom.valor_maximo_desconto THEN
      v_desconto_calculado := v_cupom.valor_maximo_desconto;
    END IF;
  ELSIF v_cupom.tipo_desconto = 'valor_fixo' THEN
    v_desconto_calculado := v_cupom.valor_desconto;
    -- Desconto não pode ser maior que o valor do pedido
    IF v_desconto_calculado > p_valor_pedido THEN
      v_desconto_calculado := p_valor_pedido;
    END IF;
  ELSIF v_cupom.tipo_desconto = 'frete_gratis' THEN
    v_desconto_calculado := 0; -- O desconto do frete será aplicado separadamente
  END IF;

  -- Cupom válido!
  RETURN QUERY SELECT 
    true, 
    'Cupom válido'::TEXT, 
    v_cupom.id, 
    v_cupom.tipo_desconto, 
    v_cupom.valor_desconto, 
    v_desconto_calculado;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar uso do cupom
CREATE OR REPLACE FUNCTION registrar_uso_cupom(
  p_cupom_id UUID,
  p_cliente_id UUID,
  p_pedido_id UUID,
  p_valor_pedido DECIMAL,
  p_valor_desconto_aplicado DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_uso_id UUID;
BEGIN
  INSERT INTO cupons_uso (
    cupom_id,
    cliente_id,
    pedido_id,
    valor_pedido,
    valor_desconto_aplicado
  ) VALUES (
    p_cupom_id,
    p_cliente_id,
    p_pedido_id,
    p_valor_pedido,
    p_valor_desconto_aplicado
  )
  RETURNING id INTO v_uso_id;
  
  RETURN v_uso_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons_uso ENABLE ROW LEVEL SECURITY;

-- Políticas para CUPONS

-- Restaurantes podem ver e gerenciar seus próprios cupons
DROP POLICY IF EXISTS "Restaurantes podem ver seus cupons" ON cupons;
CREATE POLICY "Restaurantes podem ver seus cupons"
  ON cupons FOR SELECT
  USING (
    id_restaurante IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurantes podem criar cupons" ON cupons;
CREATE POLICY "Restaurantes podem criar cupons"
  ON cupons FOR INSERT
  WITH CHECK (
    id_restaurante IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurantes podem atualizar seus cupons" ON cupons;
CREATE POLICY "Restaurantes podem atualizar seus cupons"
  ON cupons FOR UPDATE
  USING (
    id_restaurante IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurantes podem deletar seus cupons" ON cupons;
CREATE POLICY "Restaurantes podem deletar seus cupons"
  ON cupons FOR DELETE
  USING (
    id_restaurante IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

-- Clientes podem ver cupons ativos
DROP POLICY IF EXISTS "Clientes podem ver cupons ativos" ON cupons;
CREATE POLICY "Clientes podem ver cupons ativos"
  ON cupons FOR SELECT
  USING (
    ativo = true 
    AND (data_fim IS NULL OR data_fim > NOW())
    AND (data_inicio IS NULL OR data_inicio <= NOW())
  );

-- Admins podem ver todos os cupons (se houver tabela de admins)
-- DROP POLICY IF EXISTS "Admins podem ver todos cupons" ON cupons;
-- CREATE POLICY "Admins podem ver todos cupons"
--   ON cupons FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin'
--     )
--   );

-- Políticas para CUPONS_USO

-- Clientes podem ver seu próprio histórico
DROP POLICY IF EXISTS "Clientes podem ver seu histórico de cupons" ON cupons_uso;
CREATE POLICY "Clientes podem ver seu histórico de cupons"
  ON cupons_uso FOR SELECT
  USING (cliente_id = auth.uid());

-- Restaurantes podem ver uso de seus cupons
DROP POLICY IF EXISTS "Restaurantes podem ver uso de seus cupons" ON cupons_uso;
CREATE POLICY "Restaurantes podem ver uso de seus cupons"
  ON cupons_uso FOR SELECT
  USING (
    cupom_id IN (
      SELECT c.id FROM cupons c
      WHERE c.id_restaurante IN (
        SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
      )
    )
  );

-- Sistema pode registrar uso
DROP POLICY IF EXISTS "Sistema pode registrar uso de cupons" ON cupons_uso;
CREATE POLICY "Sistema pode registrar uso de cupons"
  ON cupons_uso FOR INSERT
  WITH CHECK (true);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE cupons IS 'Cupons de desconto criados pelos restaurantes';
COMMENT ON COLUMN cupons.codigo IS 'Código único do cupom (ex: BEMVINDO10)';
COMMENT ON COLUMN cupons.tipo_desconto IS 'Tipo: percentual, valor_fixo ou frete_gratis';
COMMENT ON COLUMN cupons.valor_desconto IS 'Valor do desconto (% ou R$)';
COMMENT ON COLUMN cupons.valor_minimo_pedido IS 'Valor mínimo do pedido para usar o cupom';
COMMENT ON COLUMN cupons.valor_maximo_desconto IS 'Valor máximo de desconto (para percentuais)';
COMMENT ON COLUMN cupons.limite_uso_total IS 'Limite total de usos (NULL = ilimitado)';
COMMENT ON COLUMN cupons.limite_uso_por_cliente IS 'Quantas vezes cada cliente pode usar';
COMMENT ON COLUMN cupons.apenas_primeira_compra IS 'Se true, válido apenas para primeira compra';

COMMENT ON TABLE cupons_uso IS 'Histórico de uso de cupons';

-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ============================================

-- Inserir cupons de exemplo (descomente se quiser)
/*
INSERT INTO cupons (
  id_restaurante,
  codigo,
  descricao,
  tipo_desconto,
  valor_desconto,
  valor_minimo_pedido,
  limite_uso_total,
  limite_uso_por_cliente,
  data_fim
) VALUES
  (
    (SELECT id FROM restaurantes_app LIMIT 1),
    'BEMVINDO10',
    'Ganhe 10% de desconto na primeira compra',
    'percentual',
    10,
    30,
    100,
    1,
    NOW() + INTERVAL '30 days'
  ),
  (
    (SELECT id FROM restaurantes_app LIMIT 1),
    'FRETEGRATIS',
    'Frete grátis em pedidos acima de R$ 50',
    'frete_gratis',
    0,
    50,
    NULL,
    3,
    NOW() + INTERVAL '60 days'
  );
*/

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 
  'Tabelas criadas com sucesso!' as mensagem,
  (SELECT COUNT(*) FROM cupons) as total_cupons,
  (SELECT COUNT(*) FROM cupons_uso) as total_usos;
