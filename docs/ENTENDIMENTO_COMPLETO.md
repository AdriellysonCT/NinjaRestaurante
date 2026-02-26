# 🎯 Entendimento Completo do Problema

## ✅ Trigger NÃO É o Problema

A trigger `trg_sync_cliente_com_profile` está **CORRETA** e deve permanecer:

```sql
CREATE FUNCTION sync_cliente_com_profile()
BEGIN
  -- Só executa se o usuário for um CLIENTE
  IF NEW.tipo_usuario = 'cliente' THEN
    INSERT INTO clientes_app (...)
  END IF;
  RETURN NEW;
END;
```

**Por quê está OK?**
- Só executa se `tipo_usuario = 'cliente'`
- Não interfere com restaurantes
- É necessária para cadastro de clientes

## ❌ Problema Real

O `tipo_usuario` está chegando como **"cliente"** ao invés de **"restaurante"** em `profiles`.

### Fluxo Atual (Problemático)

```
1. Front-end insere em profiles com tipo_usuario = 'restaurante' ✅
2. Algo sobrescreve para tipo_usuario = 'cliente' ❌
3. Código tenta inserir em restaurantes_app ❌
4. Falha (silenciosamente ou por RLS)
```

## 🔍 Possíveis Causas

### Causa 1: Valor Padrão na Tabela

```sql
-- Verificar se há valor padrão
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'tipo_usuario';
```

**Se retornar:** `'cliente'::text` → Este é o problema!

**Solução:**
```sql
ALTER TABLE profiles 
ALTER COLUMN tipo_usuario 
SET DEFAULT 'restaurante';
```

### Causa 2: Código do Front-end

Verificar se o código está realmente passando `tipo_usuario`:

```javascript
// authService.js - linha ~50
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: userId,
    email: dadosRestaurante.email,
    tipo_usuario: 'restaurante', // ✅ Está correto
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

### Causa 3: Políticas RLS

RLS pode estar bloqueando o INSERT com `tipo_usuario = 'restaurante'`.

## 🛠️ Solução Completa

### Execute Agora

```sql
-- No Supabase SQL Editor:
-- Copie e cole o conteúdo de: SOLUCAO_FINAL.sql
```

Este script:
1. ✅ Corrige `tipo_usuario` para "restaurante" em todos os profiles
2. ✅ Configura políticas RLS corretas
3. ✅ Cria registros faltantes em `restaurantes_app`
4. ✅ **NÃO remove** a trigger `sync_cliente_com_profile` (ela está correta)

### Verificar Valor Padrão

```sql
-- Verificar valor padrão de tipo_usuario
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'tipo_usuario';

-- Se for 'cliente', alterar para NULL ou 'restaurante'
ALTER TABLE profiles 
ALTER COLUMN tipo_usuario 
DROP DEFAULT;

-- Ou definir como 'restaurante'
ALTER TABLE profiles 
ALTER COLUMN tipo_usuario 
SET DEFAULT 'restaurante';
```

## 🧪 Teste Após Correção

### 1. Novo Cadastro

1. Abra o console (F12)
2. Faça um novo cadastro
3. Observe os logs:

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

### 2. Verificar no Banco

```sql
-- Verificar tipo_usuario
SELECT id, email, tipo_usuario
FROM profiles
WHERE email = 'seu_teste@email.com';

-- Deve retornar: tipo_usuario = 'restaurante'

-- Verificar se criou em restaurantes_app
SELECT id, email, nome_fantasia
FROM restaurantes_app
WHERE email = 'seu_teste@email.com';

-- Deve retornar 1 linha
```

## 📊 Estrutura Correta

### Profiles
```
id (UUID) - PK
email (TEXT)
tipo_usuario (TEXT) - 'restaurante' ou 'cliente'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Restaurantes_app
```
id (UUID) - PK (mesmo do profiles)
user_id (UUID) - FK para profiles
nome_fantasia (TEXT)
tipo_restaurante (TEXT)
cnpj (TEXT)
telefone (TEXT)
email (TEXT)
... outros campos
```

### Clientes_app
```
user_id (UUID) - PK (mesmo do profiles)
nome (TEXT)
telefone (TEXT)
cpf (TEXT)
... outros campos
```

## 🎯 Fluxo Correto

### Para Restaurantes

```
1. Front-end cria Auth User ✅
2. Front-end insere em profiles com tipo_usuario = 'restaurante' ✅
3. Trigger sync_cliente_com_profile NÃO executa (tipo != 'cliente') ✅
4. Front-end insere em restaurantes_app ✅
5. Sucesso! 🎉
```

### Para Clientes (Futuro)

```
1. Front-end cria Auth User ✅
2. Front-end insere em profiles com tipo_usuario = 'cliente' ✅
3. Trigger sync_cliente_com_profile EXECUTA ✅
4. Trigger insere em clientes_app automaticamente ✅
5. Sucesso! 🎉
```

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| **SOLUCAO_FINAL.sql** | ⭐ Execute este |
| **ENTENDIMENTO_COMPLETO.md** | Este arquivo |
| src/services/authService.js | Código do cadastro |

## ✅ Checklist Final

```
[ ] Executar SOLUCAO_FINAL.sql
[ ] Verificar valor padrão de tipo_usuario
[ ] Testar novo cadastro
[ ] Verificar logs no console
[ ] Confirmar criação em profiles (tipo_usuario = 'restaurante')
[ ] Confirmar criação em restaurantes_app
[ ] Trigger sync_cliente_com_profile permanece (está correta)
```

## 🎉 Conclusão

- ✅ Trigger `sync_cliente_com_profile` está correta (não remover)
- ✅ Problema é o `tipo_usuario` chegando como "cliente"
- ✅ Solução: Corrigir profiles + configurar RLS + criar registros faltantes
- ✅ Script `SOLUCAO_FINAL.sql` resolve tudo

---

**Execute agora:** `SOLUCAO_FINAL.sql` 🚀
