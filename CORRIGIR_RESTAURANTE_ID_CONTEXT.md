# 🔧 CORREÇÃO: restauranteId não disponível

## 🎯 Problemas Identificados

### 1. Erro ao Salvar Horários

```
ERRO: restauranteId não disponível!
```

### 2. Cardápio Mostrando Itens de Outros Restaurantes

Mesmo após corrigir RLS, ainda há vazamento de dados.

## 🔍 Causa Raiz

O `restauranteId` no `AuthContext` vem de `restaurante?.id`, mas:

1. **Timing Issue**: Quando o componente Settings monta, `restaurante` pode ainda estar sendo carregado
2. **Estrutura Errada**: O `restaurante.id` pode não ser o `user_id` correto para filtrar itens

## ✅ Solução

### PASSO 1: Usar `user.id` Diretamente

O `restauranteId` deve ser o `user.id` (ID do auth.users), não o `restaurante.id` (ID da tabela restaurantes_app).

**Por quê?**

- A tabela `itens_cardapio` usa `id_restaurante` que referencia `auth.users.id`
- A tabela `restaurantes_horarios` usa `restaurante_id` que também referencia o user_id

### PASSO 2: Atualizar AuthContext

Edite `src/context/AuthContext.jsx` linha ~570:

**ANTES:**

```javascript
restauranteId: restaurante?.id || null,
```

**DEPOIS:**

```javascript
restauranteId: user?.id || null,  // ✅ Usar user.id diretamente
```

### PASSO 3: Verificar Estrutura do Banco

Execute este SQL no Supabase para confirmar a estrutura:

```sql
-- 1. Verificar estrutura de itens_cardapio
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cardapio'
  AND column_name IN ('id', 'id_restaurante')
ORDER BY ordinal_position;

-- 2. Verificar estrutura de restaurantes_horarios
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurantes_horarios'
  AND column_name IN ('id', 'restaurante_id')
ORDER BY ordinal_position;

-- 3. Verificar relacionamento
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('itens_cardapio', 'restaurantes_horarios');
```

**Resultado Esperado:**

- `itens_cardapio.id_restaurante` → `auth.users.id`
- `restaurantes_horarios.restaurante_id` → `auth.users.id`

### PASSO 4: Rebuild do Projeto

Após alterar o AuthContext:

```bash
# Parar o servidor de desenvolvimento (Ctrl+C)

# Limpar cache do Vite
rm -rf node_modules/.vite

# Reiniciar
npm run dev
```

## 🧪 Teste

### 1. Teste de Horários

1. Faça login
2. Vá para Configurações → Horários
3. Altere um horário
4. Verifique no console (F12) se aparece o `restauranteId`
5. Não deve mais aparecer o erro "restauranteId não disponível"

### 2. Teste de Cardápio

1. Faça login no Restaurante A
2. Vá para Cardápio
3. Anote os itens que aparecem
4. Faça logout e login no Restaurante B
5. Vá para Cardápio
6. Deve aparecer itens DIFERENTES

## 📊 Verificação no Console

Após fazer login, abra o console (F12) e digite:

```javascript
// Verificar user.id
console.log("User ID:", window.localStorage.getItem("supabase.auth.token"));

// Ou no React DevTools, procure o AuthContext e veja:
// - user.id
// - restauranteId
// Ambos devem ser iguais!
```

## 🔄 Alternativa: Fallback Duplo

Se ainda houver problemas, use um fallback duplo no AuthContext:

```javascript
restauranteId: user?.id || restaurante?.user_id || null,
```

Isso garante que sempre teremos um ID válido.

## 🆘 Se Ainda Não Funcionar

1. **Limpe TUDO:**

   ```bash
   # Limpar localStorage
   # No console do navegador (F12):
   localStorage.clear();

   # Limpar cache do navegador
   Ctrl+Shift+Delete → Limpar tudo

   # Fazer logout e login novamente
   ```

2. **Verifique os logs:**
   - Abra o console (F12)
   - Vá para a aba Network
   - Filtre por "supabase"
   - Veja se as requisições estão usando o `user.id` correto

3. **Verifique o RLS:**
   - Execute `LIMPAR_RLS_ITENS_CARDAPIO.sql` novamente
   - Confirme que as políticas usam `auth.uid()`

---

**Resumo da Correção:**

1. Mudar `restauranteId: restaurante?.id` para `restauranteId: user?.id`
2. Rebuild do projeto
3. Limpar cache e fazer novo login
4. Testar horários e cardápio

**Tempo estimado:** 5 minutos
