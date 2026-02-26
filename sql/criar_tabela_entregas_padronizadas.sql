-- Cria a tabela entregas_padronizadas e configura RLS/índices
-- Execute este script no painel SQL do Supabase

-- Extensão para UUID (se ainda não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Tabela de entregas
CREATE TABLE IF NOT EXISTS entregas_padronizadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pedido UUID NOT NULL REFERENCES pedidos_padronizados(id) ON DELETE CASCADE,
    id_restaurante UUID NOT NULL REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    numero_pedido INTEGER,
    nome_cliente TEXT,
    telefone_cliente TEXT,
    endereco_entrega TEXT,
    valor_total NUMERIC,
    metodo_pagamento TEXT,
    status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','aceito','coletado','concluido','cancelado')),
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    aceito_em TIMESTAMPTZ,
    coletado_em TIMESTAMPTZ,
    concluido_em TIMESTAMPTZ
);

-- Evita duplicidade por pedido
CREATE UNIQUE INDEX IF NOT EXISTS uq_entregas_id_pedido ON entregas_padronizadas(id_pedido);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_entregas_restaurante ON entregas_padronizadas(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas_padronizadas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_criado_em ON entregas_padronizadas(criado_em);

-- 2) RLS
ALTER TABLE entregas_padronizadas ENABLE ROW LEVEL SECURITY;

-- Restaurantes podem ler suas entregas
CREATE POLICY IF NOT EXISTS "restaurantes_podem_ler_entregas" ON entregas_padronizadas
  FOR SELECT
  USING (id_restaurante IN (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()));

-- Restaurantes podem inserir (via app/trigger) suas entregas
CREATE POLICY IF NOT EXISTS "restaurantes_podem_inserir_entregas" ON entregas_padronizadas
  FOR INSERT
  WITH CHECK (id_restaurante IN (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()));

-- Restaurantes podem atualizar suas entregas (ex.: cancelar, ajustes)
CREATE POLICY IF NOT EXISTS "restaurantes_podem_atualizar_entregas" ON entregas_padronizadas
  FOR UPDATE
  USING (id_restaurante IN (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()));

-- 3) Trigger de atualizado_em
CREATE OR REPLACE FUNCTION set_atualizado_em_entregas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_atualizado_em_entregas ON entregas_padronizadas;
CREATE TRIGGER trg_set_atualizado_em_entregas
  BEFORE UPDATE ON entregas_padronizadas
  FOR EACH ROW
  EXECUTE FUNCTION set_atualizado_em_entregas();



