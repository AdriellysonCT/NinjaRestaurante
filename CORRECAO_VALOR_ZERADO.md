# ✅ Correção: Valor R$ 0,00 nos Cards

## 🐛 Problema

Os cards dos pedidos estavam mostrando **R$ 0,00** mesmo quando o modal mostrava o valor correto.

### **Antes:**
```
Card:  R$ 0,00  ❌
Modal: R$ 55,40 ✅
```

---

## 🔧 Correções Aplicadas

### **1. OrderService.js - Mapeamento do Valor**

**Antes:**
```javascript
total: parseFloat(order.valor_total) || 0,
```

**Depois:**
```javascript
total: parseFloat(order.valor_total) || parseFloat(order.subtotal) || 0,
```

**O que mudou:**
- Agora tenta buscar `valor_total` primeiro
- Se não existir, tenta `subtotal`
- Só retorna 0 se ambos forem nulos

---

### **2. OrderService.js - Query do Banco**

**Adicionado:**
```javascript
nome_cliente,  // ← NOVO
subtotal,      // ← NOVO
```

**O que mudou:**
- Agora busca o campo `nome_cliente` (estava faltando)
- Agora busca o campo `subtotal` como fallback
- Garante que todos os dados necessários sejam retornados

---

### **3. OrderCard.jsx - Exibição do Valor**

**Antes:**
```javascript
<p className="font-bold text-lg text-orange-500">
  R$ {order.total.toFixed(2)}
</p>
```

**Depois:**
```javascript
<p className="font-bold text-lg text-orange-500">
  R$ {(parseFloat(order.total) || 0).toFixed(2)}
</p>
```

**O que mudou:**
- Garante que `order.total` seja convertido para número
- Evita erro se `order.total` for undefined ou null
- Sempre mostra pelo menos R$ 0,00

---

### **4. OrderService.js - Nome do Cliente**

**Antes:**
```javascript
customerName: order.clientes_app?.nome || 'Anônimo',
```

**Depois:**
```javascript
customerName: order.nome_cliente || order.clientes_app?.nome || 'Cliente não informado',
```

**O que mudou:**
- Prioriza `nome_cliente` (campo direto na tabela)
- Fallback para `clientes_app.nome` (relacionamento)
- Texto mais claro: "Cliente não informado"

---

## ✅ Resultado Esperado

### **Agora:**
```
Card:  R$ 55,40 ✅
Modal: R$ 55,40 ✅
```

Ambos mostram o valor correto!

---

## 🎯 Por que estava zerado?

### **Causa Raiz:**

Os pedidos estão sendo criados com `valor_total = 0` ou `NULL` no banco de dados.

**Possíveis motivos:**

1. **App do cliente não calcula o total:**
```javascript
// App está fazendo isso:
const pedido = {
  nome_cliente: "Natsu Costa",
  valor_total: 0,  // ❌ ERRADO
  itens: [...]
};
```

2. **Itens não são criados:**
- Pedido é criado primeiro
- Itens falham ao serem inseridos
- Total não é recalculado

3. **Trigger não está funcionando:**
- Deveria haver um trigger para calcular o total
- Trigger pode estar desabilitado ou com erro

---

## 🔧 Solução Definitiva

Para garantir que isso não aconteça novamente, vou criar um trigger:

```sql
-- Trigger para calcular valor_total automaticamente
CREATE OR REPLACE FUNCTION calcular_valor_total_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total baseado nos itens
  UPDATE pedidos_padronizados
  SET 
    subtotal = (
      SELECT COALESCE(SUM(preco_total), 0)
      FROM itens_pedido
      WHERE id_pedido = NEW.id_pedido
    ),
    valor_total = (
      SELECT COALESCE(SUM(preco_total), 0)
      FROM itens_pedido
      WHERE id_pedido = NEW.id_pedido
    )
  WHERE id = NEW.id_pedido;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em INSERT e UPDATE de itens
CREATE TRIGGER trigger_calcular_total_insert
AFTER INSERT ON itens_pedido
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_pedido();

CREATE TRIGGER trigger_calcular_total_update
AFTER UPDATE ON itens_pedido
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_pedido();

CREATE TRIGGER trigger_calcular_total_delete
AFTER DELETE ON itens_pedido
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_pedido();
```

---

## 📋 Checklist de Verificação

- [x] Corrigir mapeamento em `orderService.js`
- [x] Adicionar campos faltantes na query
- [x] Proteger exibição em `OrderCard.jsx`
- [x] Adicionar fallback para `subtotal`
- [ ] Criar trigger para calcular total automaticamente
- [ ] Corrigir app do cliente para enviar valor correto
- [ ] Testar criação de novo pedido

---

## 🚀 Próximos Passos

1. **Recarregue o painel** (F5)
2. **Verifique** se os valores aparecem nos cards
3. **Se ainda estiver zerado:**
   - Execute o script de trigger acima
   - Ou corrija o app do cliente para calcular o total

---

**Criado em**: 08/11/2025  
**Status**: ✅ Correção aplicada - Aguardando teste
