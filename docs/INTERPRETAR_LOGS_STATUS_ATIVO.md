# 🔍 Como Interpretar os Logs Detalhados do Status Ativo

## 📋 Logs Adicionados

Adicionei logs SUPER detalhados para identificar exatamente onde está o problema.

## 🧪 Como Testar

1. **Abra o console do navegador (F12)**
2. **Limpe o console (botão 🚫 ou Ctrl+L)**
3. **Faça login**
4. **Copie TODOS os logs que aparecem**

## 📊 Cenários Possíveis

### ✅ **CENÁRIO 1: Tudo Funcionando**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INICIANDO ATUALIZAÇÃO DE STATUS ATIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 User ID: abc123...
📋 Email: seu@email.com

🔎 PASSO 1: Buscando restaurante...
📊 Resultado da busca: {
  restauranteData: {
    id: "ebb3d612-744e-455b-a035-aee21c49e4af",
    user_id: "abc123...",
    nome_fantasia: "American Burguer",
    ativo: false
  },
  selectError: null
}

✅ RESTAURANTE ENCONTRADO!
📋 ID do restaurante: ebb3d612-744e-455b-a035-aee21c49e4af
📋 Nome: American Burguer
📋 Status atual (antes do update): false

🔄 PASSO 2: Atualizando status para TRUE...
📊 Resultado do UPDATE: {
  updateData: [{
    id: "ebb3d612-744e-455b-a035-aee21c49e4af",
    ativo: true,
    ...
  }],
  updateError: null
}

✅✅✅ SUCESSO! Restaurante marcado como ONLINE
📋 Dados atualizados: [...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Resultado:** Status atualizado com sucesso! ✅

---

### ❌ **CENÁRIO 2: Restaurante Não Encontrado**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INICIANDO ATUALIZAÇÃO DE STATUS ATIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 User ID: abc123...
📋 Email: seu@email.com

🔎 PASSO 1: Buscando restaurante...
📊 Resultado da busca: {
  restauranteData: null,
  selectError: {
    code: "PGRST116",
    message: "No rows found"
  }
}

❌ ERRO AO BUSCAR RESTAURANTE: {...}
❌ Código do erro: PGRST116
❌ Mensagem: No rows found
```

**Problema:** Nenhum restaurante encontrado para este `user_id`

**Solução:**
```sql
-- Verificar se o restaurante existe
SELECT * FROM restaurantes_app 
WHERE user_id = 'COLE-O-USER-ID-AQUI';

-- Se não existir, verificar todos os restaurantes
SELECT id, user_id, nome_fantasia 
FROM restaurantes_app;
```

---

### ❌ **CENÁRIO 3: Erro de Permissão RLS no SELECT**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INICIANDO ATUALIZAÇÃO DE STATUS ATIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 User ID: abc123...

🔎 PASSO 1: Buscando restaurante...
📊 Resultado da busca: {
  restauranteData: null,
  selectError: {
    code: "42501",
    message: "permission denied for table restaurantes_app"
  }
}

❌ ERRO AO BUSCAR RESTAURANTE: {...}
❌ Código do erro: 42501
❌ Mensagem: permission denied
```

**Problema:** Permissão RLS bloqueando o SELECT

**Solução:**
```sql
-- Criar política de SELECT
CREATE POLICY "restaurantes_select_policy"
ON restaurantes_app
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

---

### ❌ **CENÁRIO 4: Erro de Permissão RLS no UPDATE**

```
✅ RESTAURANTE ENCONTRADO!
📋 ID do restaurante: ebb3d612-744e-455b-a035-aee21c49e4af
📋 Nome: American Burguer
📋 Status atual (antes do update): false

🔄 PASSO 2: Atualizando status para TRUE...
📊 Resultado do UPDATE: {
  updateData: null,
  updateError: {
    code: "42501",
    message: "permission denied for table restaurantes_app"
  }
}

❌ ERRO AO ATUALIZAR STATUS: {...}
❌ Código do erro: 42501
❌ Mensagem: permission denied
```

**Problema:** Permissão RLS bloqueando o UPDATE

**Solução:**
```sql
-- Criar política de UPDATE
CREATE POLICY "restaurantes_update_policy"
ON restaurantes_app
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

### ❌ **CENÁRIO 5: UPDATE Não Retorna Dados**

```
✅ RESTAURANTE ENCONTRADO!
📋 ID do restaurante: ebb3d612-744e-455b-a035-aee21c49e4af

🔄 PASSO 2: Atualizando status para TRUE...
📊 Resultado do UPDATE: {
  updateData: [],
  updateError: null
}

✅✅✅ SUCESSO! Restaurante marcado como ONLINE
📋 Dados atualizados: []
```

**Problema:** UPDATE executou mas não retornou dados (pode ser RLS no SELECT após UPDATE)

**Verificar no banco:**
```sql
SELECT id, ativo FROM restaurantes_app 
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';
```

---

## 🔧 Script de Correção Rápida

Se encontrar erro de permissão, execute:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "restaurantes_select_policy" ON restaurantes_app;
DROP POLICY IF EXISTS "restaurantes_update_policy" ON restaurantes_app;

-- Criar políticas corretas
CREATE POLICY "restaurantes_select_policy"
ON restaurantes_app FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "restaurantes_update_policy"
ON restaurantes_app FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Garantir que RLS está habilitado
ALTER TABLE restaurantes_app ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist de Debug

Após fazer login, verifique:

- [ ] Aparece "🔍 INICIANDO ATUALIZAÇÃO DE STATUS ATIVO"?
- [ ] Aparece o User ID correto?
- [ ] Aparece "🔎 PASSO 1: Buscando restaurante..."?
- [ ] O `restauranteData` tem dados ou é `null`?
- [ ] O `selectError` é `null` ou tem erro?
- [ ] Aparece "✅ RESTAURANTE ENCONTRADO!"?
- [ ] Aparece "🔄 PASSO 2: Atualizando status..."?
- [ ] O `updateData` tem dados ou é `null`/`[]`?
- [ ] O `updateError` é `null` ou tem erro?
- [ ] Aparece "✅✅✅ SUCESSO!"?

---

## 🎯 O Que Fazer Agora

1. **Faça login**
2. **Copie TODOS os logs do console**
3. **Me envie os logs**
4. **Com os logs, vou identificar exatamente o problema**

Os logs vão mostrar:
- ✅ Se o restaurante foi encontrado
- ✅ Qual o status antes do update
- ✅ Se o UPDATE foi executado
- ✅ Se houve algum erro (e qual)
- ✅ Qual o resultado final

Com essas informações, vou saber EXATAMENTE onde está o problema! 🎯
