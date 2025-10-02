-- Script para criar a tabela orders (pedidos)
-- Execute este script no painel SQL do Supabase

-- 1. Criar a tabela orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_pedido SERIAL UNIQUE, -- Número sequencial para identificação (ex: #001, #002)
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    taxa_entrega NUMERIC DEFAULT 0,
    desconto NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado')),
    tipo_pedido TEXT NOT NULL DEFAULT 'delivery' CHECK (tipo_pedido IN ('delivery', 'balcao', 'mesa')),
    payment_method TEXT CHECK (payment_method IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'vale_refeicao')),
    payment_status TEXT DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'cancelado')),
    prep_time INTEGER DEFAULT 30, -- Tempo estimado de preparo em minutos
    delivery_time TIMESTAMPTZ, -- Horário estimado de entrega
    is_vip BOOLEAN DEFAULT FALSE,
    mesa_numero INTEGER, -- Para pedidos de mesa
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    id_restaurante UUID NOT NULL REFERENCES restaurantes_app(id) ON DELETE CASCADE
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurante ON orders(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_numero_pedido ON orders(numero_pedido);

-- 3. Criar trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_orders_updated_at();

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para orders
CREATE POLICY "Restaurantes podem ver seus próprios pedidos" ON orders
    FOR SELECT USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem inserir seus próprios pedidos" ON orders
    FOR INSERT WITH CHECK (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem atualizar seus próprios pedidos" ON orders
    FOR UPDATE USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurantes podem deletar seus próprios pedidos" ON orders
    FOR DELETE USING (
        id_restaurante IN (
            SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
        )
    );

-- 5. Verificar se a tabela foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;