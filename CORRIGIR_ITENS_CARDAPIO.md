# 🔧 CORREÇÃO: Restaurantes Vendo Itens de Outros

## 🎯 Problema Identificado
Cada restaurante está carregando itens de cardápio de OUTROS restaurantes, quando deveria ver apenas os seus próprios itens.

## 📋 Causa Raiz
As políticas RLS (Row Level Security) da tabela `itens_cardapio` não estão configuradas corretamente ou não existem, permitindo que todos os restaurantes vejam todos os itens.

## ✅ Solução em 3 Passos

### PASSO 1: Diagnóstico
Execute o arquivo `diagnostico_itens_restaurante.sql` no Supabase SQL Editor para entender o estado atual:

```sql
-- Este script vai mostrar:
-- 1. Todos os restaurantes cadastrados
-- 2. Quantos itens cada restaurante tem
-- 3. Se as políticas RLS existem
-- 4. Se há itens sem restaurante_id
```

**O que observar:**
- Quantos restaurantes existem?
- Cada item tem um `id_restaurante` válido?
- As políticas RLS existem?

### PASSO 2: Aplicar Correção
Execute o arquivo `corrigir_rls_itens_cardapio.sql` no Supabase SQL Editor:

```sql
-- Este script vai:
-- 1. Remover políticas antigas (se existirem)
-- 2. Criar novas políticas corretas
-- 3. Garantir que cada restaurante veja apenas seus itens
```

### PASSO 3: Verificar no App
1. Faça logout de todos os restaurantes
2. Faça login no Restaurante A
3. Vá para a página de Cardápio
4. Verifique se aparecem APENAS os itens do Restaurante A
5. Faça login no Restaurante B
6. Verifique se aparecem APENAS os itens do Restaurante B

## 🔍 Como Funciona a Correção

### Antes (ERRADO)
```
Restaurante A faz login
  ↓
Busca: SELECT * FROM itens_cardapio
  ↓
Retorna: TODOS os itens (A, B, C...)  ❌
```

### Depois (CORRETO)
```
Restaurante A faz login (auth.uid() = UUID_A)
  ↓
Busca: SELECT * FROM itens_cardapio
  ↓
RLS aplica filtro: WHERE id_restaurante = auth.uid()
  ↓
Retorna: APENAS itens do Restaurante A  ✅
```

## 🛡️ Políticas RLS Criadas

### 1. SELECT (Leitura)
```sql
CREATE POLICY "restaurante_select_proprios_itens" ON itens_cardapio
    FOR SELECT 
    USING (id_restaurante = auth.uid());
```
**Efeito:** Restaurante só vê seus próprios itens

### 2. INSERT (Criação)
```sql
CREATE POLICY "restaurante_insert_proprios_itens" ON itens_cardapio
    FOR INSERT 
    WITH CHECK (id_restaurante = auth.uid());
```
**Efeito:** Restaurante só pode criar itens com seu próprio ID

### 3. UPDATE (Atualização)
```sql
CREATE POLICY "restaurante_update_proprios_itens" ON itens_cardapio
    FOR UPDATE 
    USING (id_restaurante = auth.uid())
    WITH CHECK (id_restaurante = auth.uid());
```
**Efeito:** Restaurante só pode atualizar seus próprios itens

### 4. DELETE (Exclusão)
```sql
CREATE POLICY "restaurante_delete_proprios_itens" ON itens_cardapio
    FOR DELETE 
    USING (id_restaurante = auth.uid());
```
**Efeito:** Restaurante só pode deletar seus próprios itens

## ⚠️ Problemas Comuns

### Problema 1: Itens sem `id_restaurante`
**Sintoma:** Alguns itens não aparecem para ninguém

**Solução:**
```sql
-- Verificar itens órfãos
SELECT * FROM itens_cardapio WHERE id_restaurante IS NULL;

-- Atribuir ao restaurante correto
UPDATE itens_cardapio 
SET id_restaurante = 'UUID-DO-RESTAURANTE'
WHERE id_restaurante IS NULL;
```

### Problema 2: RLS não está habilitado
**Sintoma:** Todos veem todos os itens mesmo após aplicar políticas

**Solução:**
```sql
ALTER TABLE itens_cardapio ENABLE ROW LEVEL SECURITY;
```

### Problema 3: Código do app não passa `id_restaurante`
**Sintoma:** Erro ao criar novos itens

**Solução:** Verificar se o código está passando o `id_restaurante` ao criar itens:
```javascript
// ERRADO
const { data } = await supabase
  .from('itens_cardapio')
  .insert({ nome, preco, categoria });

// CORRETO
const { data } = await supabase
  .from('itens_cardapio')
  .insert({ 
    nome, 
    preco, 
    categoria,
    id_restaurante: user.id  // ✅ Importante!
  });
```

## 🧪 Teste Manual

Execute este SQL substituindo o UUID pelo ID do seu restaurante de teste:

```sql
-- 1. Ver todos os itens (como admin)
SELECT 
    ic.nome,
    ic.categoria,
    r.nome_restaurante,
    ic.id_restaurante
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
ORDER BY r.nome_restaurante, ic.nome;

-- 2. Simular acesso de um restaurante específico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'UUID-DO-RESTAURANTE';

SELECT * FROM itens_cardapio;
-- Deve retornar APENAS os itens deste restaurante
```

## 📊 Resultado Esperado

Após a correção:
- ✅ Restaurante A vê apenas seus itens
- ✅ Restaurante B vê apenas seus itens
- ✅ Novos itens são criados com o `id_restaurante` correto
- ✅ Nenhum restaurante consegue ver/editar itens de outros

## 🆘 Se Ainda Não Funcionar

1. Verifique se o usuário está autenticado: `SELECT auth.uid();`
2. Verifique se o RLS está habilitado: Execute o diagnóstico novamente
3. Limpe o cache do navegador e faça logout/login
4. Verifique os logs do Supabase para erros de permissão
5. Confirme que o código do app está usando `auth.uid()` corretamente

---

**Criado em:** 28/12/2024
**Problema:** Restaurantes vendo itens de outros restaurantes
**Status:** Pronto para execução
