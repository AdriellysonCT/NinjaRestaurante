# 🔍 Diagnóstico Completo: Itens Não Aparecem

## 📊 Resultado do Diagnóstico

```json
{
  "numero_pedido": 33,
  "status": "disponivel",
  "total_itens": 0,           ← ❌ PROBLEMA AQUI
  "itens_com_cardapio_valido": 0
}
```

## ✅ O que está FUNCIONANDO:

1. ✅ **Foreign keys estão corretas** - Relacionamento entre tabelas OK
2. ✅ **Código do webhook está correto** - Cria itens quando recebe dados
3. ✅ **Estrutura do banco está OK** - Tabelas configuradas corretamente

## ❌ O que está ERRADO:

**O pedido #33 foi criado SEM itens!**

Isso pode acontecer por 3 motivos:

### **1. Pedido de Teste Manual**
- Alguém criou o pedido direto no banco de dados
- Não passou pelo fluxo normal (webhook ou app)
- Não incluiu os itens

### **2. Webhook Recebeu Dados Incompletos**
- O app do cliente enviou o pedido sem a lista de itens
- O campo `orderData.itens` estava vazio ou null
- O webhook criou o pedido mas pulou os itens

### **3. Erro no Processo de Criação**
- Houve um erro ao inserir os itens
- O pedido foi criado mas os itens falharam
- Erro foi silencioso (não bloqueou a criação do pedido)

---

## 🔧 Como o Sistema DEVERIA Funcionar

### **Fluxo Correto (Webhook):**

```javascript
// 1. Cliente faz pedido no app
const orderData = {
  id_restaurante: "uuid-restaurante",
  nome_cliente: "João Silva",
  valor_total: 47.00,
  itens: [                        ← DEVE TER ITENS
    {
      id_item_cardapio: "uuid-pizza",
      quantidade: 1,
      preco_unitario: 35.00
    },
    {
      id_item_cardapio: "uuid-coca",
      quantidade: 2,
      preco_unitario: 6.00
    }
  ]
};

// 2. Webhook cria o pedido
const pedido = await criarPedido(orderData);

// 3. Webhook cria os itens
if (orderData.itens && orderData.itens.length > 0) {
  await criarItens(pedido.id, orderData.itens);  ← AQUI
}
```

### **O que aconteceu com o pedido #33:**

```javascript
// Pedido foi criado assim:
const orderData = {
  id_restaurante: "uuid-restaurante",
  nome_cliente: "Cliente não informado",
  valor_total: 47.00,
  itens: []  ← ❌ VAZIO OU NULL
};

// Resultado:
// ✅ Pedido criado
// ❌ Itens NÃO criados
```

---

## 🚀 Soluções

### **Solução 1: Adicionar Itens Manualmente (Teste Rápido)**

Use o script: `adicionar_itens_teste_pedido.sql`

**Passos:**
1. Execute o PASSO 1 para pegar os IDs
2. Execute o PASSO 2 para ver itens do cardápio
3. Substitua os UUIDs no PASSO 3
4. Execute os INSERTs
5. Recarregue o painel

**Resultado:** Pedido #33 terá itens e aparecerá corretamente

---

### **Solução 2: Criar Novo Pedido de Teste (Recomendado)**

Vou criar um script para você criar um pedido completo com itens:

```sql
-- Script: criar_pedido_teste_completo.sql
```

---

### **Solução 3: Verificar o App do Cliente**

Se os pedidos continuarem chegando sem itens, o problema está no **app do cliente**.

**Verifique:**
1. O app está enviando o array `itens` no payload?
2. Os itens têm `id_item_cardapio` válido?
3. O webhook está recebendo os dados completos?

**Como verificar:**
- Veja os logs da Edge Function do Supabase
- Procure por: `console.log('🔔 Webhook InfinitePay recebido:', webhookData)`
- Verifique se `webhookData.order_data.itens` tem dados

---

## 📋 Checklist de Verificação

### **Para o Pedido #33 (Teste):**
- [ ] Executar `adicionar_itens_teste_pedido.sql`
- [ ] Substituir UUIDs corretos
- [ ] Verificar se itens aparecem no painel
- [ ] Abrir modal e confirmar detalhes

### **Para Novos Pedidos (Produção):**
- [ ] Verificar logs do webhook
- [ ] Confirmar que `orderData.itens` não está vazio
- [ ] Testar criar pedido pelo app do cliente
- [ ] Verificar se itens são criados no banco

---

## 🎯 Próximos Passos

### **AGORA (Teste Imediato):**

1. **Execute este comando SQL:**

```sql
-- Pegar IDs necessários
SELECT 
    p.id as id_pedido,
    p.id_restaurante,
    (SELECT id FROM itens_cardapio 
     WHERE id_restaurante = p.id_restaurante 
     AND disponivel = true 
     LIMIT 1) as id_item_1,
    (SELECT id FROM itens_cardapio 
     WHERE id_restaurante = p.id_restaurante 
     AND disponivel = true 
     OFFSET 1 LIMIT 1) as id_item_2
FROM pedidos_padronizados p
WHERE p.numero_pedido = 33;
```

2. **Com os IDs acima, execute:**

```sql
-- Adicionar 1x primeiro item (substitua os UUIDs)
INSERT INTO itens_pedido (
    id_pedido,
    id_item_cardapio,
    quantidade,
    preco_unitario,
    preco_total,
    id_restaurante
) VALUES (
    'ID_PEDIDO_AQUI',
    'ID_ITEM_1_AQUI',
    1,
    35.00,
    35.00,
    'ID_RESTAURANTE_AQUI'
);

-- Adicionar 2x segundo item
INSERT INTO itens_pedido (
    id_pedido,
    id_item_cardapio,
    quantidade,
    preco_unitario,
    preco_total,
    id_restaurante
) VALUES (
    'ID_PEDIDO_AQUI',
    'ID_ITEM_2_AQUI',
    2,
    6.00,
    12.00,
    'ID_RESTAURANTE_AQUI'
);
```

3. **Recarregue o painel (F5)**

---

### **DEPOIS (Investigação):**

1. Criar um novo pedido pelo app do cliente
2. Verificar se os itens são criados
3. Se não forem, o problema está no app
4. Verificar logs do webhook para debug

---

## 💡 Dica Importante

**O código está correto!** O problema é que o pedido #33 foi criado sem itens.

Para garantir que isso não aconteça novamente:

1. **No app do cliente**: Validar que `itens.length > 0` antes de enviar
2. **No webhook**: Adicionar validação:

```javascript
if (!orderData.itens || orderData.itens.length === 0) {
  throw new Error('Pedido sem itens não pode ser criado');
}
```

3. **No banco**: Criar trigger para validar:

```sql
CREATE OR REPLACE FUNCTION validar_pedido_tem_itens()
RETURNS TRIGGER AS $$
BEGIN
  -- Após 5 segundos, verificar se o pedido tem itens
  -- Se não tiver, marcar como inválido
  PERFORM pg_sleep(5);
  
  IF NOT EXISTS (
    SELECT 1 FROM itens_pedido WHERE id_pedido = NEW.id
  ) THEN
    UPDATE pedidos_padronizados 
    SET status = 'cancelado', 
        observacoes = 'Pedido sem itens - cancelado automaticamente'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Resumo

| Item | Status | Ação |
|------|--------|------|
| Foreign keys | ✅ OK | Nenhuma |
| Código webhook | ✅ OK | Nenhuma |
| Estrutura banco | ✅ OK | Nenhuma |
| Pedido #33 | ❌ Sem itens | Adicionar manualmente |
| Novos pedidos | ⚠️ Verificar | Testar app do cliente |

---

**Criado em**: 08/11/2025  
**Status**: 🔍 Diagnóstico completo - Aguardando correção do pedido #33
