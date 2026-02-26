# 🔍 PROBLEMA RAIZ IDENTIFICADO!

## 🚨 O Que Estava Errado

### Estrutura INCORRETA (Antes)

```
┌─────────────────┐
│  auth.users     │
│  id: UUID-A     │ ← Usuário A
└─────────────────┘
         │
         ↓ user_id
┌─────────────────┐
│ restaurantes_app│
│ id: 1           │ ← Restaurante A
│ user_id: UUID-A │
└─────────────────┘
         ↑
         │ id_restaurante (FK ERRADA!)
┌─────────────────┐
│ itens_cardapio  │
│ id_restaurante:1│ ← Apontava para restaurantes_app.id
└─────────────────┘
```

**Problema:**
- `itens_cardapio.id_restaurante` apontava para `restaurantes_app.id` (1, 2, 3...)
- Mas `auth.uid()` retorna `auth.users.id` (UUID-A, UUID-B...)
- RLS comparava: `id_restaurante (1) = auth.uid() (UUID-A)` ❌ NUNCA BATIA!
- Resultado: Todos viam todos os itens

### Estrutura CORRETA (Depois)

```
┌─────────────────┐
│  auth.users     │
│  id: UUID-A     │ ← Usuário A
└─────────────────┘
         │
         ├─→ user_id
         │  ┌─────────────────┐
         │  │ restaurantes_app│
         │  │ id: 1           │
         │  │ user_id: UUID-A │
         │  └─────────────────┘
         │
         └─→ id_restaurante (FK CORRETA!)
            ┌─────────────────┐
            │ itens_cardapio  │
            │ id_restaurante: │
            │    UUID-A       │ ← Agora aponta para auth.users.id
            └─────────────────┘
```

**Solução:**
- `itens_cardapio.id_restaurante` agora aponta para `auth.users.id` (UUID-A, UUID-B...)
- RLS compara: `id_restaurante (UUID-A) = auth.uid() (UUID-A)` ✅ BATE!
- Resultado: Cada restaurante vê apenas seus itens

## 📊 Exemplo Prático

### Antes (ERRADO)

```sql
-- Restaurante A faz login
-- auth.uid() retorna: 'abc-123-def-456' (UUID)

-- Busca itens
SELECT * FROM itens_cardapio 
WHERE id_restaurante = auth.uid();

-- id_restaurante na tabela: 1, 2, 3... (INTEGER)
-- auth.uid(): 'abc-123-def-456' (UUID)
-- Comparação: 1 = 'abc-123-def-456' ❌ FALSO
-- Resultado: NENHUM item retornado (ou todos, dependendo da política)
```

### Depois (CORRETO)

```sql
-- Restaurante A faz login
-- auth.uid() retorna: 'abc-123-def-456' (UUID)

-- Busca itens
SELECT * FROM itens_cardapio 
WHERE id_restaurante = auth.uid();

-- id_restaurante na tabela: 'abc-123-def-456' (UUID)
-- auth.uid(): 'abc-123-def-456' (UUID)
-- Comparação: 'abc-123-def-456' = 'abc-123-def-456' ✅ VERDADEIRO
-- Resultado: Apenas itens do Restaurante A
```

## 🔧 O Que o Script Faz

### `CORRIGIR_FOREIGN_KEYS_URGENTE.sql`

1. **Remove FK antigas:**
   ```sql
   ALTER TABLE itens_cardapio 
   DROP CONSTRAINT itens_cardapio_id_restaurante_fkey;
   ```

2. **Atualiza dados existentes:**
   ```sql
   -- Troca restaurantes_app.id por user_id
   UPDATE itens_cardapio ic
   SET id_restaurante = r.user_id
   FROM restaurantes_app r
   WHERE ic.id_restaurante = r.id;
   ```
   
   **Exemplo:**
   ```
   ANTES: id_restaurante = 1
   DEPOIS: id_restaurante = 'abc-123-def-456'
   ```

3. **Faz o mesmo para `restaurantes_horarios`**

## 🎯 Por Que Isso Resolve Tudo?

### Problema 1: Cardápio Mostrando Itens de Outros ✅
- **Causa:** FK errada + RLS não funcionando
- **Solução:** FK correta + RLS funcionando = Isolamento perfeito

### Problema 2: Erro "restauranteId não disponível" ✅
- **Causa:** `restaurante?.id` retornava `1`, mas precisava do UUID
- **Solução:** `user?.id` retorna o UUID correto

### Problema 3: Horários Não Salvando ✅
- **Causa:** Mesma FK errada em `restaurantes_horarios`
- **Solução:** FK corrigida para usar `auth.users.id`

## ⚠️ IMPORTANTE

**Execute os scripts NESTA ORDEM:**

1. `CORRIGIR_FOREIGN_KEYS_URGENTE.sql` ← Corrige a estrutura
2. `LIMPAR_RLS_ITENS_CARDAPIO.sql` ← Limpa políticas duplicadas
3. Commit e push do código
4. Logout e login novamente

**NÃO pule o passo 1!** Sem ele, o RLS nunca vai funcionar corretamente.

## 🧪 Como Testar Se Funcionou

### Teste 1: Verificar IDs no Banco

```sql
-- Deve retornar UUIDs, não números
SELECT id_restaurante FROM itens_cardapio LIMIT 5;

-- Resultado esperado:
-- abc-123-def-456
-- abc-123-def-456
-- xyz-789-ghi-012
-- xyz-789-ghi-012
-- ...
```

### Teste 2: Verificar Isolamento

```sql
-- Contar itens por restaurante
SELECT 
    id_restaurante,
    COUNT(*) as total
FROM itens_cardapio
GROUP BY id_restaurante;

-- Cada UUID deve ter apenas seus itens
```

### Teste 3: No App

1. Login Restaurante A → Vê X itens
2. Logout
3. Login Restaurante B → Vê Y itens (diferente de X)

## 📈 Resultado Final

```
ANTES:
- Restaurante A: 50 itens (misturados)
- Restaurante B: 50 itens (misturados)
- Erro ao salvar horários
- RLS não funcionando

DEPOIS:
- Restaurante A: 30 itens (apenas seus)
- Restaurante B: 20 itens (apenas seus)
- Horários salvando corretamente
- RLS funcionando perfeitamente
```

---

**Criado em:** 28/12/2024  
**Problema:** Foreign keys apontando para tabela errada  
**Impacto:** Crítico - vazamento de dados entre restaurantes  
**Status:** Solução pronta para execução
