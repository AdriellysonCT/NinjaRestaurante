# ⚡ AÇÃO IMEDIATA - Corrigir Cadastro

## 🚨 Problema

Cadastro cria em `profiles` mas **NÃO cria em `restaurantes_app`**

## ✅ Solução (3 passos)

### 1️⃣ Execute no Supabase SQL Editor

```sql
-- Copie e cole TODO o conteúdo de: CORRIGIR_RLS_AGORA.sql
```

Isso vai:
- ✅ Criar políticas RLS corretas para permitir INSERT
- ✅ Corrigir cadastros incompletos existentes
- ✅ Verificar se tudo está OK

### 2️⃣ Teste Novo Cadastro

1. Abra o console do navegador (F12)
2. Vá para `/cadastro`
3. Preencha o formulário
4. Clique em "Cadastrar"
5. Observe os logs:

```
🚀 Iniciando processo de cadastro...
👤 Criando usuário no Supabase Auth...
✅ Usuário criado no Auth. ID: xxx
📝 Criando registro em profiles...
✅ Profile criado com sucesso
🏪 Criando registro em restaurantes_app...
📋 Dados que serão inseridos: {...}
✅ Restaurante criado com sucesso: {...}
🎉 Cadastro concluído com sucesso!
```

**Se aparecer erro:** Copie a mensagem completa

### 3️⃣ Verificar no Banco

```sql
-- Substituir pelo email do teste
SELECT 'auth' as origem, id FROM auth.users WHERE email = 'teste@email.com'
UNION ALL
SELECT 'profiles', id FROM profiles WHERE email = 'teste@email.com'
UNION ALL
SELECT 'restaurantes', id FROM restaurantes_app WHERE email = 'teste@email.com';

-- Deve retornar 3 linhas com o MESMO ID
```

## 🔍 Por Que Estava Falhando?

**Causa:** Políticas RLS em `restaurantes_app` estavam bloqueando INSERT

**Solução:** Script `CORRIGIR_RLS_AGORA.sql` cria a política correta:

```sql
CREATE POLICY "Permitir INSERT para usuários autenticados"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
```

## 📋 O Que o Código Faz (Já Está Correto)

```javascript
// 1. Criar Auth User
const { data: authData } = await supabase.auth.signUp({ email, password });
const userId = authData.user.id;

// 2. Criar Profile
await supabase.from('profiles').insert({
  id: userId,
  email,
  tipo_usuario: 'restaurante'
});

// 3. Criar Restaurante (OBRIGATÓRIO)
await supabase.from('restaurantes_app').insert({
  id: userId,
  user_id: userId,
  nome_fantasia,
  tipo_restaurante,
  cnpj,
  telefone,
  email,
  nome_responsavel,
  rua,
  numero,
  bairro,
  cidade,
  complemento,
  ativo: true
});

// Se falhar em restaurantes_app:
// - Deleta profile
// - Deleta auth user
// - Lança erro
```

## ✅ Após Correção

- ✅ Cadastro cria os 2 registros obrigatoriamente
- ✅ Login funciona corretamente
- ✅ Dashboard carrega normalmente
- ✅ Dados completos e consistentes

## 🎯 Resultado Esperado

```
profiles: 1 registro ✅
restaurantes_app: 1 registro ✅
Mesmo ID: ✅
Login funciona: ✅
Dashboard carrega: ✅
```

---

**Execute AGORA:** `CORRIGIR_RLS_AGORA.sql` no Supabase SQL Editor
