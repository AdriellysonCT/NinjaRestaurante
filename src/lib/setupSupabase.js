import { supabase } from './supabase';

// Função para criar as tabelas no Supabase
async function setupDatabase() {
  try {
    console.log('Verificando configuração do banco de dados...');
    
    // Nota: As tabelas devem ser criadas manualmente no painel do Supabase
    // Este arquivo serve apenas como referência para a estrutura das tabelas
    
    // Estrutura da tabela restaurantes_app
    /*
    CREATE TABLE restaurantes_app (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      nome_fantasia TEXT NOT NULL,
      tipo_restaurante TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT NOT NULL,
      nome_responsavel TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    */
    
    // Estrutura da tabela orders
    /*
    CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_name TEXT NOT NULL,
      items JSONB NOT NULL,
      total NUMERIC NOT NULL,
      status TEXT NOT NULL,
      prep_time INTEGER NOT NULL,
      is_vip BOOLEAN DEFAULT FALSE,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      payment_method TEXT,
      comments TEXT
    );
    */
    
    // Estrutura da tabela itens_cardapio
    /*
    CREATE TABLE itens_cardapio (
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
      id_categoria UUID,
      destaque BOOLEAN DEFAULT FALSE,
      tempo_preparo INTEGER DEFAULT 0,
      ingredientes JSONB
    );
    
    -- Índices para melhor performance
    CREATE INDEX idx_itens_cardapio_restaurante ON itens_cardapio(id_restaurante);
    CREATE INDEX idx_itens_cardapio_categoria ON itens_cardapio(categoria);
    CREATE INDEX idx_itens_cardapio_disponivel ON itens_cardapio(disponivel);
    
    -- Trigger para atualizar automaticamente o campo atualizado_em
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
    
    -- RLS (Row Level Security)
    ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuários podem ver seus próprios itens" ON itens_cardapio
        FOR SELECT USING (auth.uid() = id_restaurante);
    
    CREATE POLICY "Usuários podem inserir seus próprios itens" ON itens_cardapio
        FOR INSERT WITH CHECK (auth.uid() = id_restaurante);
    
    CREATE POLICY "Usuários podem atualizar seus próprios itens" ON itens_cardapio
        FOR UPDATE USING (auth.uid() = id_restaurante);
    
    CREATE POLICY "Usuários podem deletar seus próprios itens" ON itens_cardapio
        FOR DELETE USING (auth.uid() = id_restaurante);
    */
    
    // Estrutura da tabela settings
    /*
    CREATE TABLE settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      restaurant_name TEXT,
      address TEXT,
      phone TEXT,
      opening_hours JSONB,
      delivery_settings JSONB,
      notification_settings JSONB,
      payment_methods JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    */
    
    // Estrutura da tabela controle_caixa
    /*
    CREATE TABLE controle_caixa (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID REFERENCES auth.users(id),
      valor_abertura NUMERIC NOT NULL,
      valor_fechamento NUMERIC,
      diferenca NUMERIC,
      data_abertura TIMESTAMPTZ DEFAULT NOW(),
      data_fechamento TIMESTAMPTZ,
      observacoes_abertura TEXT,
      observacoes_fechamento TEXT,
      status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    */
    
    // Estrutura da tabela movimentacoes_caixa
    /*
    CREATE TABLE movimentacoes_caixa (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      caixa_id UUID REFERENCES controle_caixa(id) ON DELETE CASCADE,
      usuario_id UUID REFERENCES auth.users(id),
      tipo TEXT NOT NULL CHECK (tipo IN ('sangria', 'reforco')),
      valor NUMERIC NOT NULL,
      motivo TEXT NOT NULL,
      observacoes TEXT,
      data_movimentacao TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    */
    
    console.log('Verificação do banco de dados concluída!');
  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
  }
}

// Não executamos mais a configuração automaticamente
// setupDatabase();

export { setupDatabase };