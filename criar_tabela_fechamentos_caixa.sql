-- Script para criar a tabela fechamentos_caixa se não existir

-- Criar tabela fechamentos_caixa
CREATE TABLE IF NOT EXISTS fechamentos_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('restaurante', 'entregador')),
  data_abertura TIMESTAMPTZ NOT NULL,
  data_fechamento TIMESTAMPTZ NOT NULL,
  total_bruto DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_descontos DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
  qtd_transacoes INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'pago')),
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_id_usuario ON fechamentos_caixa(id_usuario);
CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_tipo_usuario ON fechamentos_caixa(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_status ON fechamentos_caixa(status);
CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_data_fechamento ON fechamentos_caixa(data_fechamento DESC);

-- Criar trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_fechamentos_caixa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fechamentos_caixa_updated_at ON fechamentos_caixa;
CREATE TRIGGER trigger_update_fechamentos_caixa_updated_at
  BEFORE UPDATE ON fechamentos_caixa
  FOR EACH ROW
  EXECUTE FUNCTION update_fechamentos_caixa_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE fechamentos_caixa ENABLE ROW LEVEL SECURITY;

-- Política: Restaurantes podem ver apenas seus próprios fechamentos
DROP POLICY IF EXISTS "Restaurantes podem ver seus fechamentos" ON fechamentos_caixa;
CREATE POLICY "Restaurantes podem ver seus fechamentos"
  ON fechamentos_caixa
  FOR SELECT
  USING (
    id_usuario IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

-- Política: Restaurantes podem criar seus próprios fechamentos
DROP POLICY IF EXISTS "Restaurantes podem criar fechamentos" ON fechamentos_caixa;
CREATE POLICY "Restaurantes podem criar fechamentos"
  ON fechamentos_caixa
  FOR INSERT
  WITH CHECK (
    id_usuario IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

-- Política: Admins podem ver todos os fechamentos
DROP POLICY IF EXISTS "Admins podem ver todos fechamentos" ON fechamentos_caixa;
CREATE POLICY "Admins podem ver todos fechamentos"
  ON fechamentos_caixa
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

-- Política: Admins podem atualizar fechamentos (aprovar/pagar)
DROP POLICY IF EXISTS "Admins podem atualizar fechamentos" ON fechamentos_caixa;
CREATE POLICY "Admins podem atualizar fechamentos"
  ON fechamentos_caixa
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

-- Comentários na tabela
COMMENT ON TABLE fechamentos_caixa IS 'Registros de fechamento de caixa de restaurantes e entregadores';
COMMENT ON COLUMN fechamentos_caixa.id_usuario IS 'ID do restaurante ou entregador';
COMMENT ON COLUMN fechamentos_caixa.tipo_usuario IS 'Tipo: restaurante ou entregador';
COMMENT ON COLUMN fechamentos_caixa.data_abertura IS 'Data/hora de abertura do período';
COMMENT ON COLUMN fechamentos_caixa.data_fechamento IS 'Data/hora de fechamento do período';
COMMENT ON COLUMN fechamentos_caixa.total_bruto IS 'Total de vendas antes dos descontos';
COMMENT ON COLUMN fechamentos_caixa.total_descontos IS 'Total de taxas e descontos';
COMMENT ON COLUMN fechamentos_caixa.total_liquido IS 'Valor líquido a receber';
COMMENT ON COLUMN fechamentos_caixa.qtd_transacoes IS 'Quantidade de transações no período';
COMMENT ON COLUMN fechamentos_caixa.status IS 'Status: pendente, aprovado ou pago';
COMMENT ON COLUMN fechamentos_caixa.observacoes IS 'Observações adicionais';

-- Verificar se a tabela foi criada
SELECT 
  'Tabela fechamentos_caixa criada com sucesso!' as mensagem,
  COUNT(*) as total_fechamentos
FROM fechamentos_caixa;
