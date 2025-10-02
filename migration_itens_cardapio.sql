-- Migração para a nova estrutura itens_cardapio
-- Execute este script no painel SQL do Supabase

-- 1. Criar a nova tabela itens_cardapio
CREATE TABLE IF NOT EXISTS itens_cardapio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_restaurante UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    imagem_url TEXT,
    categoria TEXT NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    id_categoria UUID, -- Para futuras implementações de categorias separadas
    destaque BOOLEAN DEFAULT FALSE,
    tempo_preparo INTEGER DEFAULT 0,
    ingredientes JSONB
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_restaurante ON itens_cardapio(id_restaurante);
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_categoria ON itens_cardapio(categoria);
CREATE INDEX IF NOT EXISTS idx_itens_cardapio_disponivel ON itens_cardapio(disponivel);

-- 3. Criar trigger para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_itens_cardapio_atualizado_em 
    BEFORE UPDATE ON itens_cardapio 
    FOR EACH ROW 
    EXECUTE FUNCTION update_atualizado_em_column();

-- 4. Migrar dados existentes da tabela menu_items (se existir)
-- Descomente as linhas abaixo se você quiser migrar dados existentes
/*
INSERT INTO itens_cardapio (
    nome, 
    descricao, 
    preco, 
    categoria, 
    imagem_url, 
    disponivel, 
    destaque, 
    tempo_preparo, 
    ingredientes,
    id_restaurante
)
SELECT 
    name as nome,
    description as descricao,
    price as preco,
    category as categoria,
    image_url as imagem_url,
    available as disponivel,
    featured as destaque,
    prep_time as tempo_preparo,
    ingredients as ingredientes,
    (SELECT id FROM auth.users LIMIT 1) as id_restaurante -- Pega o primeiro usuário como padrão
FROM menu_items;
*/

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios itens
CREATE POLICY "Usuários podem ver seus próprios itens" ON itens_cardapio
    FOR SELECT USING (auth.uid() = id_restaurante);

-- Política para permitir que usuários insiram apenas seus próprios itens
CREATE POLICY "Usuários podem inserir seus próprios itens" ON itens_cardapio
    FOR INSERT WITH CHECK (auth.uid() = id_restaurante);

-- Política para permitir que usuários atualizem apenas seus próprios itens
CREATE POLICY "Usuários podem atualizar seus próprios itens" ON itens_cardapio
    FOR UPDATE USING (auth.uid() = id_restaurante);

-- Política para permitir que usuários deletem apenas seus próprios itens
CREATE POLICY "Usuários podem deletar seus próprios itens" ON itens_cardapio
    FOR DELETE USING (auth.uid() = id_restaurante);

-- 6. Após confirmar que tudo está funcionando, você pode remover a tabela antiga
-- DROP TABLE IF EXISTS menu_items;