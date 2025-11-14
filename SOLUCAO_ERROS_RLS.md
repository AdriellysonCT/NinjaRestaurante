# 🔧 Solução: Erros de Recursão Infinita no Supabase

## 🚨 Problema Identificado

Você está enfrentando erros de **recursão infinita nas políticas RLS** do Supabase:

```
Error: infinite recursion detected in policy for relation "profiles"
Error: Restaurante não encontrado
```

---

## 🎯 Causa do Problema

As políticas RLS (Row Level Security) da tabela `restaurantes_app` estão mal configuradas, causando:
1. **Recursão infinita** ao tentar verificar permissões
2. **Falha ao buscar** dados do restaurante
3. **Bloqueio de acesso** mesmo para o usuário autenticado

---

## ✅ Solução Rápida (Recomendada)

### Passo 1: Executar Script SQL

1. **Abra o Supabase Dashboard**
   - https://app.supabase.com

2. **Vá para SQL Editor**
   - Menu lateral → SQL Editor

3. **Execute o script** `corrigir_rls_restaurantes.sql`
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "Run" ou pressione `Ctrl+Enter`

### Passo 2: Verificar Estrutura da Tabela

Execute este SQL para verificar se a tabela está correta:

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;
```

**Colunas necessárias:**
- `id` (uuid, PK)
- `user_id` (uuid, FK para auth.users)
- `nome` (text)
- Outras colunas do restaurante...

### Passo 3: Criar Dados de Teste (se necessário)

Se não houver restaurante cadastrado para o usuário:

```sql
-- Verificar seu user_id
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- Inserir restaurante de teste
INSERT INTO restaurantes_app (id, user_id, nome, created_at)
VALUES (
  gen_random_uuid(),
  'seu-user-id-aqui',  -- Substitua pelo ID do SELECT acima
  'Restaurante Teste',
  NOW()
)
RETURNING *;
```

---

## 🔍 Diagnóstico Detalhado

### Verificar Políticas Atuais

Execute no SQL Editor:

```sql
-- Ver todas as políticas da tabela restaurantes_app
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'restaurantes_app';
```

### Verificar RLS Habilitado

```sql
-- Ver se RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurantes_app';
```

---

## 🛠️ Solução Alternativa (Desenvolvimento)

Se você estiver em **ambiente de desenvolvimento** e quiser desabilitar temporariamente o RLS:

### ⚠️ **APENAS PARA DESENVOLVIMENTO - NUNCA EM PRODUÇÃO!**

```sql
-- DESABILITAR RLS (temporariamente)
ALTER TABLE restaurantes_app DISABLE ROW LEVEL SECURITY;
```

**Para reabilitar depois:**

```sql
-- REABILITAR RLS
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;
```

---

## 🔐 Políticas RLS Corretas

As políticas devem ser simples e diretas:

```sql
-- SELECT: Usuário vê apenas seus restaurantes
CREATE POLICY "restaurantes_select_policy"
ON restaurantes_app FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Usuário cria apenas para si mesmo
CREATE POLICY "restaurantes_insert_policy"
ON restaurantes_app FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário atualiza apenas seus restaurantes
CREATE POLICY "restaurantes_update_policy"
ON restaurantes_app FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuário deleta apenas seus restaurantes
CREATE POLICY "restaurantes_delete_policy"
ON restaurantes_app FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🧪 Testar a Solução

Após executar o script:

### 1. Limpar Cache do Navegador
- Pressione `Ctrl+Shift+R` (Windows/Linux)
- Pressione `Cmd+Shift+R` (Mac)

### 2. Verificar Console
Abra o DevTools (F12) e veja se os erros sumiram:
- ✅ Sem erros de "infinite recursion"
- ✅ Sem erros de "Restaurante não encontrado"
- ✅ Dados carregando corretamente

### 3. Verificar Dashboard
- Dashboard deve carregar
- Pedidos devem aparecer
- Notificações funcionando

---

## 🐛 Problemas Persistentes?

### Problema 1: "Restaurante não encontrado"

**Causa:** Não existe registro na tabela para o usuário logado.

**Solução:**
```sql
-- Verificar se existe
SELECT * FROM restaurantes_app WHERE user_id = auth.uid();

-- Se não existir, criar
INSERT INTO restaurantes_app (id, user_id, nome)
VALUES (gen_random_uuid(), auth.uid(), 'Meu Restaurante');
```

### Problema 2: "User not authenticated"

**Causa:** Sessão expirada ou problemas de autenticação.

**Solução:**
1. Fazer logout
2. Fazer login novamente
3. Verificar se o token está válido

### Problema 3: Políticas ainda causando recursão

**Causa:** Políticas antigas não foram removidas corretamente.

**Solução:**
```sql
-- Remover TODAS as políticas
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'restaurantes_app'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON restaurantes_app', pol.policyname);
  END LOOP;
END $$;

-- Depois execute o script de criação novamente
```

---

## 📊 Estrutura Recomendada

### Tabela `restaurantes_app`

```sql
CREATE TABLE IF NOT EXISTS restaurantes_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT restaurantes_app_user_id_key UNIQUE(user_id)
);

-- Índice
CREATE INDEX idx_restaurantes_app_user_id ON restaurantes_app(user_id);

-- RLS
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 Checklist de Verificação

Após aplicar a solução, verifique:

- [ ] Script SQL executado sem erros
- [ ] Políticas RLS criadas corretamente
- [ ] Índice criado na coluna user_id
- [ ] Existe registro na tabela para o usuário
- [ ] Console do navegador sem erros
- [ ] Dashboard carrega corretamente
- [ ] Pedidos aparecem normalmente
- [ ] Notificações funcionando
- [ ] Filtros funcionando

---

## 📞 Suporte Adicional

Se os erros persistirem:

1. **Compartilhe:**
   - Resultado do SQL: `SELECT * FROM pg_policies WHERE tablename = 'restaurantes_app';`
   - Estrutura da tabela
   - Mensagem de erro completa

2. **Verifique:**
   - Versão do Supabase
   - Configurações de autenticação
   - Logs do Supabase Dashboard

---

## 🚀 Próximos Passos

Após resolver:

1. ✅ Testar todas as funcionalidades
2. ✅ Verificar performance
3. ✅ Documentar configurações
4. ✅ Fazer backup das políticas
5. ✅ Monitorar logs

---

## 📝 Notas Importantes

- **Nunca desabilite RLS em produção**
- Sempre teste políticas em ambiente de desenvolvimento
- Mantenha backup das configurações
- Documente mudanças nas políticas
- Monitore logs de erro regularmente

---

## ✅ Conclusão

Seguindo este guia, você deve resolver todos os erros de recursão infinita e conseguir acessar o dashboard normalmente!

**Tempo estimado:** 5-10 minutos

🎉 **Boa sorte!**

