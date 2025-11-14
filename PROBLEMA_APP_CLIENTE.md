# 🚨 Problema Identificado: App do Cliente Não Grava Itens

## 🔍 Descoberta

Você identificou corretamente o problema:

### **Pedidos Criados (Painel):**
```
Pedido #34 → R$ 55,40
Pedido #33 → R$ 47,00
Pedido #32 → R$ 45,30
```

### **Itens na Tabela `itens_pedido`:**
```
R$ 15,00
R$ 39,90
R$ 19,90
R$ 15,00
R$ 11,00
```

**Nenhum valor bate!** Isso significa:
- ✅ Pedidos estão sendo criados
- ❌ Itens NÃO estão sendo gravados
- ❌ Os itens na tabela são de pedidos antigos/outros restaurantes

---

## 🐛 Possíveis Causas

### **1. Erro no App do Cliente (Mais Provável)**

O app pode estar fazendo isso:

```javascript
// Passo 1: Criar pedido ✅
const pedido = await criarPedido({
  nome_cliente: "Natsu Costa",
  valor_total: 55.40,
  metodo_pagamento: "dinheiro"
});

// Passo 2: Criar itens ❌ (FALHA AQUI)
try {
  await criarItens(pedido.id, [
    { id_item_cardapio: "...", quantidade: 2, preco: 25.00 },
    { id_item_cardapio: "...", quantidade: 1, preco: 5.40 }
  ]);
} catch (error) {
  // Erro é ignorado silenciosamente
  console.error(error); // Mas pedido já foi criado!
}
```

**Resultado:**
- Pedido criado com sucesso
- Itens falharam mas erro foi ignorado
- Painel mostra pedido sem itens

---

### **2. Problema de Permissão (RLS)**

As políticas RLS podem estar bloqueando:

```sql
-- Política pode estar assim:
CREATE POLICY "Inserir itens" ON itens_pedido
FOR INSERT WITH CHECK (
  id_restaurante IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
);
```

**Problema:**
- O app do cliente não tem `auth.uid()` do restaurante
- Inserção é bloqueada
- Pedido foi criado mas itens não

---

### **3. Foreign Key Inválida**

O app pode estar enviando IDs errados:

```javascript
{
  id_item_cardapio: "uuid-que-nao-existe",  // ❌
  quantidade: 2,
  preco_unitario: 25.00
}
```

**Resultado:**
- INSERT falha por violação de foreign key
- Pedido já foi criado
- Itens não são inseridos

---

## 🔧 Como Investigar

### **Passo 1: Execute o Script de Investigação**

```bash
meu-fome-ninja/investigar_problema_itens.sql
```

Este script vai mostrar:
1. ✅ Quais pedidos têm itens e quais não têm
2. ✅ Se há erros de RLS
3. ✅ Se há problemas de foreign key
4. ✅ Se há triggers bloqueando

---

### **Passo 2: Verificar Logs do App do Cliente**

Se você tem acesso ao código do app do cliente, procure por:

```javascript
// Onde os pedidos são criados
async function criarPedido(dados) {
  // 1. Criar pedido
  const pedido = await supabase
    .from('pedidos_padronizados')
    .insert([...])
    .select()
    .single();

  // 2. Criar itens ← VERIFICAR AQUI
  const { error } = await supabase
    .from('itens_pedido')
    .insert(itens);

  if (error) {
    console.error('Erro ao criar itens:', error);  // ← PROCURAR ESTE LOG
  }
}
```

---

### **Passo 3: Testar Inserção Manual**

Execute no SQL Editor:

```sql
-- Pegar IDs do pedido #33
SELECT 
    p.id as id_pedido,
    p.id_restaurante,
    (SELECT id FROM itens_cardapio 
     WHERE id_restaurante = p.id_restaurante 
     LIMIT 1) as id_item
FROM pedidos_padronizados p
WHERE p.numero_pedido = 33;

-- Tentar inserir item manualmente
INSERT INTO itens_pedido (
    id_pedido,
    id_item_cardapio,
    quantidade,
    preco_unitario,
    preco_total,
    id_restaurante
) VALUES (
    'ID_PEDIDO_AQUI',
    'ID_ITEM_AQUI',
    1,
    10.00,
    10.00,
    'ID_RESTAURANTE_AQUI'
);
```

**Se funcionar:** Problema é no app do cliente  
**Se falhar:** Problema é no banco (RLS ou constraints)

---

## ✅ Soluções

### **Solução 1: Corrigir RLS (Se for o problema)**

```sql
-- Remover política restritiva
DROP POLICY IF EXISTS "Inserir itens" ON itens_pedido;

-- Criar política mais permissiva
CREATE POLICY "Qualquer um pode inserir itens" ON itens_pedido
FOR INSERT WITH CHECK (true);

-- OU permitir apenas para o restaurante correto
CREATE POLICY "Inserir itens do restaurante" ON itens_pedido
FOR INSERT WITH CHECK (
  id_restaurante IN (
    SELECT id FROM restaurantes_app
  )
);
```

---

### **Solução 2: Corrigir App do Cliente**

No código do app, garantir que itens sejam criados:

```javascript
async function criarPedido(dados) {
  try {
    // 1. Criar pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_padronizados')
      .insert([dados])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // 2. Criar itens (OBRIGATÓRIO)
    if (!dados.itens || dados.itens.length === 0) {
      throw new Error('Pedido deve ter pelo menos 1 item');
    }

    const itensParaInserir = dados.itens.map(item => ({
      id_pedido: pedido.id,
      id_item_cardapio: item.id_item_cardapio,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      preco_total: item.preco_unitario * item.quantidade,
      id_restaurante: dados.id_restaurante
    }));

    const { error: itensError } = await supabase
      .from('itens_pedido')
      .insert(itensParaInserir);

    if (itensError) {
      // Se falhar, deletar o pedido criado
      await supabase
        .from('pedidos_padronizados')
        .delete()
        .eq('id', pedido.id);

      throw new Error('Erro ao criar itens: ' + itensError.message);
    }

    return { success: true, pedido };

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }
}
```

---

### **Solução 3: Usar Transação (Melhor Solução)**

Criar uma função no Supabase que garante atomicidade:

```sql
CREATE OR REPLACE FUNCTION criar_pedido_completo(
  p_dados_pedido JSONB,
  p_itens JSONB[]
) RETURNS UUID AS $$
DECLARE
  v_pedido_id UUID;
  v_item JSONB;
BEGIN
  -- Criar pedido
  INSERT INTO pedidos_padronizados (
    id_restaurante,
    nome_cliente,
    valor_total,
    metodo_pagamento,
    status,
    status_pagamento,
    tipo_pedido
  ) VALUES (
    (p_dados_pedido->>'id_restaurante')::UUID,
    p_dados_pedido->>'nome_cliente',
    (p_dados_pedido->>'valor_total')::DECIMAL,
    p_dados_pedido->>'metodo_pagamento',
    'disponivel',
    'pendente',
    p_dados_pedido->>'tipo_pedido'
  ) RETURNING id INTO v_pedido_id;

  -- Criar itens
  FOREACH v_item IN ARRAY p_itens LOOP
    INSERT INTO itens_pedido (
      id_pedido,
      id_item_cardapio,
      quantidade,
      preco_unitario,
      preco_total,
      id_restaurante
    ) VALUES (
      v_pedido_id,
      (v_item->>'id_item_cardapio')::UUID,
      (v_item->>'quantidade')::INTEGER,
      (v_item->>'preco_unitario')::DECIMAL,
      (v_item->>'preco_total')::DECIMAL,
      (p_dados_pedido->>'id_restaurante')::UUID
    );
  END LOOP;

  RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql;
```

**Uso no app:**

```javascript
const { data, error } = await supabase.rpc('criar_pedido_completo', {
  p_dados_pedido: {
    id_restaurante: "...",
    nome_cliente: "Natsu Costa",
    valor_total: 55.40,
    metodo_pagamento: "dinheiro",
    tipo_pedido: "delivery"
  },
  p_itens: [
    {
      id_item_cardapio: "...",
      quantidade: 2,
      preco_unitario: 25.00,
      preco_total: 50.00
    },
    {
      id_item_cardapio: "...",
      quantidade: 1,
      preco_unitario: 5.40,
      preco_total: 5.40
    }
  ]
});
```

---

## 🎯 Próximos Passos

1. **Execute:** `investigar_problema_itens.sql`
2. **Analise:** Os resultados vão mostrar onde está o erro
3. **Corrija:** Use uma das soluções acima
4. **Teste:** Crie um novo pedido pelo app do cliente
5. **Verifique:** Se os itens foram gravados

---

## 📊 Checklist de Verificação

- [ ] Executar script de investigação
- [ ] Verificar se RLS está bloqueando
- [ ] Verificar logs do app do cliente
- [ ] Testar inserção manual de item
- [ ] Identificar causa raiz
- [ ] Aplicar solução apropriada
- [ ] Testar criação de novo pedido
- [ ] Confirmar que itens são gravados

---

**Criado em**: 08/11/2025  
**Status**: 🔍 Investigação em andamento
