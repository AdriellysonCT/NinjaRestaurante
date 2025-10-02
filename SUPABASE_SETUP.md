# Configuração do Banco de Dados Supabase

## Tabela orders

Execute o seguinte comando SQL no painel do Supabase para criar a tabela de pedidos:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  prep_time INTEGER NOT NULL,
  is_vip BOOLEAN DEFAULT false,
  payment_method TEXT,
  comments TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Políticas de Segurança (RLS) para orders

```sql
-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (todos podem ver)
CREATE POLICY "Todos podem ver pedidos" ON orders FOR SELECT USING (true);

-- Política para INSERT (autenticados)
CREATE POLICY "Autenticados podem criar pedidos" ON orders FOR INSERT TO authenticated WITH CHECK (true);

-- Política para UPDATE (autenticados)
CREATE POLICY "Autenticados podem atualizar pedidos" ON orders FOR UPDATE TO authenticated USING (true);

-- Política para DELETE (autenticados)
CREATE POLICY "Autenticados podem excluir pedidos" ON orders FOR DELETE TO authenticated USING (true);
```

### Índices para orders

```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_timestamp ON orders(timestamp);
```

### Trigger para updated_at em orders

```sql
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Tabelas para Controle de Caixa

Execute os seguintes comandos SQL no painel do Supabase para criar as tabelas necessárias para o controle de caixa:

### 1. Tabela controle_caixa

```sql
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
```

### 2. Tabela movimentacoes_caixa

```sql
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
```

### 3. Políticas de Segurança (RLS)

#### Para controle_caixa:

```sql
-- Habilitar RLS
ALTER TABLE controle_caixa ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Usuários podem ver seus próprios caixas" ON controle_caixa
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para INSERT
CREATE POLICY "Usuários podem criar seus próprios caixas" ON controle_caixa
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para UPDATE
CREATE POLICY "Usuários podem atualizar seus próprios caixas" ON controle_caixa
  FOR UPDATE USING (auth.uid() = usuario_id);
```

#### Para movimentacoes_caixa:

```sql
-- Habilitar RLS
ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Usuários podem ver movimentações de seus caixas" ON movimentacoes_caixa
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para INSERT
CREATE POLICY "Usuários podem criar movimentações em seus caixas" ON movimentacoes_caixa
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
```

### 4. Índices para Performance

```sql
-- Índices para controle_caixa
CREATE INDEX idx_controle_caixa_usuario_id ON controle_caixa(usuario_id);
CREATE INDEX idx_controle_caixa_status ON controle_caixa(status);
CREATE INDEX idx_controle_caixa_data_abertura ON controle_caixa(data_abertura);

-- Índices para movimentacoes_caixa
CREATE INDEX idx_movimentacoes_caixa_caixa_id ON movimentacoes_caixa(caixa_id);
CREATE INDEX idx_movimentacoes_caixa_usuario_id ON movimentacoes_caixa(usuario_id);
CREATE INDEX idx_movimentacoes_caixa_tipo ON movimentacoes_caixa(tipo);
CREATE INDEX idx_movimentacoes_caixa_data ON movimentacoes_caixa(data_movimentacao);
```

### 5. Triggers para Atualização Automática

```sql
-- Trigger para atualizar updated_at em controle_caixa
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_controle_caixa_updated_at 
    BEFORE UPDATE ON controle_caixa 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verificação das Tabelas

Após executar os comandos acima, você pode verificar se as tabelas foram criadas corretamente:

```sql
-- Verificar estrutura da tabela controle_caixa
\d controle_caixa

-- Verificar estrutura da tabela movimentacoes_caixa
\d movimentacoes_caixa

-- Listar todas as tabelas
\dt
```

## Dados de Teste (Opcional)

Para testar o sistema, você pode inserir alguns dados de exemplo:

```sql
-- Exemplo de caixa aberto (substitua o UUID pelo ID do seu usuário)
INSERT INTO controle_caixa (usuario_id, valor_abertura, observacoes_abertura) 
VALUES ('seu-user-id-aqui', 100.00, 'Abertura de caixa para teste');

-- Exemplo de movimentação
INSERT INTO movimentacoes_caixa (caixa_id, usuario_id, tipo, valor, motivo, observacoes)
VALUES (
  (SELECT id FROM controle_caixa WHERE status = 'aberto' LIMIT 1),
  'seu-user-id-aqui',
  'sangria',
  -50.00,
  'Troco',
  'Retirada para troco'
);
```

## Configuração de Triggers para Usuários

### 1. Criar tabela profiles

```sql
-- Tabela profiles (apenas id e timestamps)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Criar tabela restaurantes_app (se não existir)

```sql
-- Tabela restaurantes_app com dados do restaurante
CREATE TABLE restaurantes_app (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_fantasia TEXT NOT NULL,
  tipo_restaurante TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  rua TEXT DEFAULT '',
  numero TEXT DEFAULT '',
  bairro TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  complemento TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;

-- Políticas para restaurantes_app
CREATE POLICY "Usuários podem ver seus próprios dados" ON restaurantes_app
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios dados" ON restaurantes_app
  FOR UPDATE USING (auth.uid() = id);
```

### 3. Criar função e trigger para criação automática

```sql
-- Função para criar registros automáticos quando usuário é criado
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir registro na tabela profiles (apenas id e timestamps)
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  
  -- Inserir registro na tabela restaurantes_app com dados do metadata
  INSERT INTO restaurantes_app (
    id,
    nome_fantasia,
    tipo_restaurante,
    cnpj,
    telefone,
    email,
    nome_responsavel
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_fantasia', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo_restaurante', ''),
    COALESCE(NEW.raw_user_meta_data->>'cnpj', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_responsavel', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa após inserção de novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 4. Trigger para atualizar updated_at

```sql
-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em restaurantes_app
CREATE TRIGGER update_restaurantes_app_updated_at 
    BEFORE UPDATE ON restaurantes_app 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Notas Importantes

1. **Substitua 'seu-user-id-aqui'** pelo UUID real do usuário autenticado
2. **Execute os comandos na ordem apresentada** para evitar erros de dependência
3. **As políticas RLS garantem** que cada usuário só acesse seus próprios dados
4. **Os índices melhoram a performance** das consultas mais comuns
5. **O trigger atualiza automaticamente** o campo updated_at quando necessário
6. **O trigger handle_new_user()** cria automaticamente registros em profiles e restaurantes_app
7. **Os dados do metadata** são extraídos automaticamente do auth.users