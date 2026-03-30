-- Tabelas para o módulo de Marketing com IA

-- Tabela para controle de uso diário
CREATE TABLE IF NOT EXISTS geracoes_marketing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    data_geracao DATE DEFAULT CURRENT_DATE,
    quantidade_dia INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurante_id, data_geracao)
);

-- Tabela para armazenar os materiais gerados
CREATE TABLE IF NOT EXISTS materiais_marketing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    imagem_original_url TEXT,
    imagem_processada_url TEXT,
    nome_sugerido TEXT,
    texto_whatsapp TEXT,
    texto_banner TEXT,
    objetivo TEXT, -- Promoção, Novo Item, Mais Vendido, etc.
    solicitado_destaque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE geracoes_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_marketing ENABLE ROW LEVEL SECURITY;

-- Políticas para geracoes_marketing
CREATE POLICY "Restaurantes podem ver suas próprias gerações"
ON geracoes_marketing FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM usuarios_restaurante WHERE restaurante_id = geracoes_marketing.restaurante_id
));

-- Políticas para materiais_marketing
CREATE POLICY "Restaurantes podem ver seus materiais"
ON materiais_marketing FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM usuarios_restaurante WHERE restaurante_id = materiais_marketing.restaurante_id
));

CREATE POLICY "Restaurantes podem inserir seus materiais"
ON materiais_marketing FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM usuarios_restaurante WHERE restaurante_id = materiais_marketing.restaurante_id
));

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_geracoes_marketing_updated_at
BEFORE UPDATE ON geracoes_marketing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
