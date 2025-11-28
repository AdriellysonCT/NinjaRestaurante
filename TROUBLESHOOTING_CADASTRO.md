# 🔧 Troubleshooting - Cadastro Não Cria em restaurantes_app

## 🚨 Problema

Cadastro cria usuário em `auth.users` e `profiles`, mas **não cria em `restaurantes_app`**.

## 🔍 Diagnóstico

### Passo 1: Verificar o Problema

Execute no Supabase SQL Editor:

```sql
-- Ver profiles sem restaurante_app
SELECT 
    p.id,
    p.email,
    p.tipo_usuario,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_usuario = 'restaurante'
ORDER BY p.created_at DESC
LIMIT 10;
```

### Passo 2: Verificar Logs do Console

Abra o console do navegador (F12) e procure por:

```
🏪 Criando registro em restaurantes_app...
📋 Dados que serão inseridos: {...}
❌ Erro ao criar restaurante: {...}
```

**Se não aparecer erro:** O código não está sendo executado (problema no fluxo)  
**Se aparecer erro:** Anote o código e mensagem do erro

## 🛠️ Causas Comuns e Soluções

### Causa 1: Políticas RLS Bloqueando INSERT

**Sintoma:** Erro no console com código de permissão

**Verificar:**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'restaurantes_app'
  AND cmd = 'INSERT';
```

**Solução:**
```sql
-- Criar política que permite INSERT
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON restaurantes_app;

CREATE POLICY "Permitir INSERT para usuários autenticados"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
```

### Causa 2: Campos Obrigatórios Faltando

**Sintoma:** Erro de "null value in column"

**Verificar:**
```sql
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
  AND is_nullable = 'NO'
  AND column_default IS NULL;
```

**Solução:** Adicionar valores padrão ou tornar campos nullable

### Causa 3: Trigger Conflitante

**Sintoma:** Inserção falha silenciosamente

**Verificar:**
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'restaurantes_app';
```

**Solução:** Remover triggers conflitantes

### Causa 4: Erro Silencioso no Código

**Sintoma:** Nenhum log de erro no console

**Solução:** Código já foi atualizado com logs detalhados. Teste novamente.

## 🔧 Correção Rápida

### Opção A: Corrigir Registros Existentes

Execute no SQL Editor:

```sql
-- Copie o conteúdo de: corrigir_cadastro_incompleto.sql
```

### Opção B: Criar Manualmente

```sql
-- Substituir USER_ID e EMAIL pelos valores corretos
INSERT INTO restaurantes_app (
    id,
    user_id,
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
    ativo,
    created_at,
    updated_at
) VALUES (
    'USER_ID',
    'USER_ID',
    'Nome do Restaurante',
    'Tipo',
    'CNPJ',
    'Telefone',
    'EMAIL',
    'Responsável',
    '',
    '',
    '',
    '',
    '',
    true,
    NOW(),
    NOW()
);
```

## 🧪 Testar Novamente

### 1. Limpar Teste Anterior

```sql
-- Deletar cadastro incompleto
DELETE FROM auth.users WHERE email = 'email_do_teste@teste.com';
```

### 2. Novo Cadastro

1. Abra o console do navegador (F12)
2. Vá para a aba "Console"
3. Faça um novo cadastro
4. Observe os logs detalhados

### 3. Verificar Resultado

```sql
-- Deve retornar 3 linhas com mesmo ID
SELECT 'auth' as origem, id FROM auth.users WHERE email = 'novo_teste@teste.com'
UNION ALL
SELECT 'profiles', id FROM profiles WHERE email = 'novo_teste@teste.com'
UNION ALL
SELECT 'restaurantes', id FROM restaurantes_app WHERE email = 'novo_teste@teste.com';
```

## 📋 Checklist de Verificação

```
[ ] Políticas RLS permitem INSERT em restaurantes_app
[ ] Não há campos obrigatórios sem valor padrão
[ ] Não há triggers conflitantes
[ ] Logs detalhados aparecem no console
[ ] Erro específico é mostrado (se houver)
[ ] Compensação funciona (profile é deletado em caso de erro)
```

## 🔍 Debug Avançado

### Ver Logs do Supabase

1. Acesse o Supabase Dashboard
2. Vá em "Logs" → "Postgres Logs"
3. Procure por erros relacionados a `restaurantes_app`

### Testar INSERT Direto

```sql
-- Testar se consegue inserir manualmente
INSERT INTO restaurantes_app (
    id,
    user_id,
    email,
    nome_fantasia,
    tipo_restaurante,
    ativo,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    'teste@manual.com',
    'Teste Manual',
    'Pizzaria',
    true,
    NOW(),
    NOW()
);

-- Se funcionar: problema é no código/RLS
-- Se não funcionar: problema é na estrutura da tabela
```

## 📞 Próximos Passos

1. **Execute:** `investigar_cadastro_falho.sql`
2. **Identifique:** Qual é o erro específico
3. **Execute:** `corrigir_cadastro_incompleto.sql`
4. **Teste:** Novo cadastro com logs detalhados
5. **Verifique:** Se os 3 registros foram criados

## 🎯 Resultado Esperado

Após correção:

```
🚀 Iniciando processo de cadastro...
🔍 Verificando se o email já está registrado...
👤 Criando usuário no Supabase Auth...
✅ Usuário criado no Auth. ID: xxx
📝 Criando registro em profiles...
✅ Profile criado com sucesso
🏪 Criando registro em restaurantes_app...
📋 Dados que serão inseridos: {...}
✅ Restaurante criado com sucesso: {...}
🎉 Cadastro concluído com sucesso!
```

---

**Ainda com problemas?** Compartilhe os logs do console e o resultado de `investigar_cadastro_falho.sql`
