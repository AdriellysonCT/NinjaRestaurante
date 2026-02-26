-- Script para criar a tabela pedidos_padronizados e configurar RLS
-- Execute este script no painel SQL do Supabase

-- 1. Criar a tabela pedidos_padronizados
CREATE TABLE IF NOT EXISTS pedidos_padronizados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID REFERENCES clientes_app(id) ON DELETE SET NULL,
    id_restaurante UUID NOT NULL REFERENCES restaurantes_app(id) ON DELETE CASCADE,
    id_entregador UUID REFERENCES entregadores_app(id) ON DELETE SET NULL,
    numero_pedido SERIAL,
    tipo_pedido TEXT NOT NULL CHECK (tipo_pedido IN ('delivery', 'mesa', 'balcao', 'online')),
    status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'aceito', 'coletado', 'concluido', 'cancelado')),
    total NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    taxa_entrega NUMERIC DEFAULT 0,
    desconto NUMERIC DEFAULT 0,
    payment_method TEXT,
    pagamento_recebido_pelo_sistema BOOLEAN DEFAULT FALSE,
    prep_time INTEGER,
    delivery_time INTEGER,
    is_vip BOOLEAN DEFAULT FALSE,
    mesa_numero TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- 2. Habilitar RLS
ALTER TABLE pedidos_padronizados ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
-- Permitir leitura para autenticados do restaurante
CREATE POLICY "Restaurantes podem ler seus pedidos" ON pedidos_padronizados
    FOR SELECT
    USING (id_restaurante IN (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()));

-- Permitir inserção para autenticados
CREATE POLICY "Autenticados podem criar pedidos" ON pedidos_padronizados
    FOR INSERT
    WITH CHECK (true);

-- Permitir atualização para donos do restaurante
CREATE POLICY "Restaurantes podem atualizar seus pedidos" ON pedidos_padronizados
    FOR UPDATE
    USING (id_restaurante IN (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()));

-- Permitir deleção para donos do restaurante
CREATE POLICY "Restaurantes podem deletar seus pedidos" ON pedidos_padronizados
    FOR DELETE
    USING (id_restaurante IN (SELECT id FROM restaurantes_app WHERE user_id = auth.uid()));

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pedidos_padronizados_updated_at
    BEFORE UPDATE ON pedidos_padronizados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Índices úteis
CREATE INDEX idx_pedidos_padronizados_status ON pedidos_padronizados(status);
CREATE INDEX idx_pedidos_padronizados_tipo ON pedidos_padronizados(tipo_pedido);
CREATE INDEX idx_pedidos_padronizados_restaurante ON pedidos_padronizados(id_restaurante);