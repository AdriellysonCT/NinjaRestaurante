-- ============================================
-- Script: Criar Tabela de Pagamentos Recusados
-- Descrição: Registra tentativas de pagamento recusadas para auditoria
-- ============================================

-- Criar tabela de pagamentos recusados
CREATE TABLE IF NOT EXISTS pagamentos_recusados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_id TEXT UNIQUE NOT NULL,
  id_restaurante UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
  id_cliente UUID REFERENCES clientes_app(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  metodo_pagamento TEXT,
  dados_pedido JSONB,
  motivo TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_recusados_restaurante ON pagamentos_recusados(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_pagamentos_recusados_transacao ON pagamentos_recusados(transacao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_recusados_criado_em ON pagamentos_recusados(criado_em);

-- Adicionar comentários
COMMENT ON TABLE pagamentos_recusados IS 'Registro de tentativas de pagamento recusadas para auditoria';
COMMENT ON COLUMN pagamentos_recusados.transacao_id IS 'ID único da transação da InfinitePay';
COMMENT ON COLUMN pagamentos_recusados.dados_pedido IS 'Dados completos do pedido que foi recusado (JSON)';

-- RLS (Row Level Security)
ALTER TABLE pagamentos_recusados ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem pagamentos recusados do próprio restaurante
CREATE POLICY "Restaurantes podem ver seus próprios pagamentos recusados"
  ON pagamentos_recusados FOR SELECT
  USING (
    id_restaurante IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );

-- Política: sistema pode inserir pagamentos recusados
CREATE POLICY "Sistema pode inserir pagamentos recusados"
  ON pagamentos_recusados FOR INSERT
  WITH CHECK (true);

GRANT SELECT, INSERT ON pagamentos_recusados TO authenticated;

