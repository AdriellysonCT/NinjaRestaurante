# 🚨 RESOLVA OS ERROS AGORA - Passo a Passo Simples

## ⚡ Solução Rápida (5 minutos)

### 📍 Passo 1: Abrir Supabase

1. Acesse: https://app.supabase.com
2. Entre no seu projeto
3. Clique em **SQL Editor** no menu lateral

---

### 📍 Passo 2: Executar Diagnóstico

Cole e execute no SQL Editor:

```sql
-- Ver seu usuário
SELECT auth.uid() as meu_user_id, auth.email() as meu_email;

-- Ver se tem restaurante
SELECT * FROM restaurantes_app WHERE user_id = auth.uid();
```

**Resultado esperado:**
- ✅ Deve mostrar seu ID e email
- ✅ Deve mostrar seu restaurante OU retornar vazio

---

### 📍 Passo 3a: SE APARECER SEU RESTAURANTE

Execute este script para corrigir as políticas:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios restaurantes" ON restaurantes_app;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios restaurantes" ON restaurantes_app;

-- Criar políticas corretas
CREATE POLICY "restaurantes_select" ON restaurantes_app
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "restaurantes_insert" ON restaurantes_app
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "restaurantes_update" ON restaurantes_app
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "restaurantes_delete" ON restaurantes_app
FOR DELETE USING (auth.uid() = user_id);
```

---

### 📍 Passo 3b: SE NÃO APARECER RESTAURANTE

Primeiro execute o script do Passo 3a, depois crie seu restaurante:

```sql
-- Criar seu restaurante
INSERT INTO restaurantes_app (id, user_id, nome, created_at)
VALUES (
  gen_random_uuid(),
  auth.uid(),
  'Meu Restaurante',  -- Mude o nome se quiser
  NOW()
)
RETURNING *;
```

---

### 📍 Passo 4: Recarregar Aplicação

1. Volte para o painel do restaurante
2. Pressione `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
3. Faça login novamente se necessário

---

## ✅ Verificação

Depois de executar, verifique:

### No Console do Navegador (F12):
- ❌ **ANTES:** Vários erros vermelhos de "infinite recursion"
- ✅ **DEPOIS:** Sem erros, tudo carregando

### No Dashboard:
- ✅ Pedidos aparecem
- ✅ Notificações funcionam
- ✅ Filtros funcionam
- ✅ Sem mensagens de erro

---

## 🆘 Se Ainda Tiver Erros

### Erro: "Restaurante não encontrado"

Execute:
```sql
-- Ver todos os restaurantes (precisa desabilitar RLS temporariamente)
ALTER TABLE restaurantes_app DISABLE ROW LEVEL SECURITY;
SELECT * FROM restaurantes_app;
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;
```

Se não aparecer NENHUM restaurante, crie um:
```sql
INSERT INTO restaurantes_app (user_id, nome)
VALUES (auth.uid(), 'Restaurante Teste');
```

### Erro: "User not authenticated"

1. Faça logout
2. Faça login novamente
3. Tente novamente

### Erro: Ainda tem recursão infinita

Execute este script COMPLETO:

```sql
-- REMOVER TODAS AS POLÍTICAS
DO $$ 
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'restaurantes_app'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON restaurantes_app', pol.policyname);
  END LOOP;
END $$;

-- RECRIAR POLÍTICAS SIMPLES
CREATE POLICY "rls_select" ON restaurantes_app FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "rls_insert" ON restaurantes_app FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rls_update" ON restaurantes_app FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "rls_delete" ON restaurantes_app FOR DELETE 
USING (auth.uid() = user_id);
```

---

## 🎯 Resumo Visual

```
ANTES (com erros):
┌────────────────────────────┐
│ ❌ infinite recursion       │
│ ❌ Restaurante não encontrado│
│ ❌ Dashboard não carrega    │
│ ❌ Dados não aparecem       │
└────────────────────────────┘

DEPOIS (funcionando):
┌────────────────────────────┐
│ ✅ Sem erros no console    │
│ ✅ Restaurante encontrado  │
│ ✅ Dashboard carrega       │
│ ✅ Pedidos aparecem        │
│ ✅ Notificações funcionam  │
└────────────────────────────┘
```

---

## 📱 Contato

Se precisar de ajuda:
1. Mostre o resultado do diagnóstico
2. Mostre os erros do console (F12)
3. Informe qual passo deu erro

---

## ⏱️ Tempo Total

- Diagnóstico: 1 minuto
- Correção: 2 minutos
- Verificação: 2 minutos
- **Total: ~5 minutos**

---

## 🎉 Pronto!

Após seguir estes passos, seu sistema deve estar funcionando perfeitamente! 

🚀 **Boa sorte!**

