# 📘 Documentação - Integração InfinitePay

## 🎯 Objetivo

Garantir que o **Painel do Restaurante** só receba pedidos confirmados via webhook da InfinitePay (PIX/cartão) ou pendentes (dinheiro), nunca pedidos recusados.

---

## 🔄 Fluxo de Integração

### 1. **Cliente Faz Pedido no App**

```
┌─────────────┐
│   Cliente   │
│   no App    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Escolhe método  │
│  de pagamento   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
```

### 2A. **Pagamento Online (PIX/Cartão)**

```
┌──────────────┐
│ PIX / Cartão │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│   InfinitePay    │
│  Processa Pag.   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Webhook →      │
│   Backend        │
└──────┬───────────┘
       │
    ┌──┴──┐
    │     │
    ▼     ▼
```

#### **Se Aprovado ✅**
```
┌─────────────────────┐
│ Cria pedido com:    │
│ status_pagamento =  │
│      'pago'         │
│                     │
│ status = 'disponivel'│
└──────────┬──────────┘
           │
           ▼
   ┌───────────────┐
   │ Aparece no    │
   │ Painel 🟢     │
   └───────────────┘
```

#### **Se Recusado ❌**
```
┌─────────────────────┐
│ NÃO cria pedido     │
│                     │
│ Registra tentativa  │
│ em:                 │
│ pagamentos_recusados│
└──────────┬──────────┘
           │
           ▼
   ┌───────────────┐
   │ Cliente vê    │
   │ erro no App   │
   └───────────────┘
```

### 2B. **Pagamento em Dinheiro 💵**

```
┌──────────────┐
│   Dinheiro   │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Cria pedido com:    │
│ status_pagamento =  │
│     'pendente'      │
│                     │
│ status = 'disponivel'│
└──────────┬──────────┘
           │
           ▼
   ┌───────────────┐
   │ Aparece no    │
   │ Painel 🟡     │
   └───────────────┘
```

---

## 🗂️ Estrutura de Dados

### **Tabela: `pedidos_padronizados`**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do pedido |
| `status_pagamento` | TEXT | **'pago'**, **'pendente'**, 'estornado', 'cancelado' |
| `pagamento_recebido_pelo_sistema` | BOOLEAN | `true` se pago online |
| `transacao_id` | TEXT | ID da transação InfinitePay |
| `pago_em` | TIMESTAMP | Data/hora da confirmação |
| `troco` | DECIMAL | Valor do troco (dinheiro) |
| `motivo_estorno` | TEXT | Motivo se estornado |
| `estornado_em` | TIMESTAMP | Data/hora do estorno |

### **Status de Pagamento**

| Status | Ícone | Significado | Aparece no Painel? |
|--------|-------|-------------|--------------------|
| `pago` | 🟢 | Pagamento aprovado (PIX/Cartão) | ✅ Sim |
| `pendente` | 🟡 | Pagamento em dinheiro | ✅ Sim |
| `estornado` | 🔴 | Pagamento reembolsado | ⚠️ Sim (histórico) |
| `cancelado` | ⚪ | Pagamento recusado | ❌ Não |

---

## 🔧 Implementação

### **1. Backend - Webhook Endpoint**

**Arquivo:** `supabase/functions/webhook-infinitepay/index.ts`

**Endpoint:** `https://seu-projeto.supabase.co/functions/v1/webhook-infinitepay`

**Método:** `POST`

**Headers:**
- `Content-Type: application/json`
- `x-infinitepay-signature: [assinatura]` (para segurança)

**Payload Exemplo:**
```json
{
  "event": "payment.approved",
  "data": {
    "id": "txn_123456",
    "transaction_id": "infinitepay_xyz789",
    "status": "approved",
    "amount": 45.90,
    "payment_method": "pix",
    "metadata": {
      "order_data": {
        "id_restaurante": "uuid-restaurante",
        "id_cliente": "uuid-cliente",
        "tipo_pedido": "delivery",
        "nome_cliente": "João Silva",
        "telefone_cliente": "(11) 98765-4321",
        "endereco_entrega": {
          "rua": "Rua Exemplo",
          "numero": "123",
          "bairro": "Centro",
          "cidade": "São Paulo",
          "uf": "SP",
          "cep": "01234-567"
        },
        "itens": [
          {
            "id_item_cardapio": "uuid-item-1",
            "quantidade": 2,
            "preco_unitario": 15.90
          },
          {
            "id_item_cardapio": "uuid-item-2",
            "quantidade": 1,
            "preco_unitario": 14.10
          }
        ],
        "subtotal": 45.90,
        "taxa_entrega": 5.00,
        "desconto": 0,
        "observacoes": "Sem cebola, por favor"
      }
    }
  }
}
```

### **2. Frontend - Serviço de Webhook**

**Arquivo:** `src/services/webhookService.js`

**Funções Principais:**

```javascript
// Processar webhook da InfinitePay
processarWebhookInfinitePay(webhookData)

// Criar pedido com dinheiro (pendente)
criarPedidoDinheiro(orderData)

// Confirmar pagamento pendente
confirmarPagamentoPendente(pedidoId)

// Registrar estorno
registrarEstorno(pedidoId, motivo)
```

### **3. Filtros no Painel**

**Arquivo:** `src/services/orderService.js`

```javascript
// Buscar apenas pedidos válidos
const { data, error } = await supabase
  .from('pedidos_padronizados')
  .select('*')
  .eq('id_restaurante', restaurante.id)
  .in('status_pagamento', ['pago', 'pendente']) // ✅ Filtro aplicado
  .in('status', ['disponivel', 'aceito', 'pronto_para_entrega', 'coletado', 'concluido'])
  .order('criado_em', { ascending: false });
```

### **4. Relatórios Financeiros**

**Arquivo:** `src/services/dashboardFinanceiroService.js`

```javascript
// Buscar pedidos concluídos para faturamento
const { data: pedidos } = await supabase
  .from('pedidos_padronizados')
  .select('*')
  .eq('id_restaurante', restauranteId)
  .in('status', ['concluido'])
  .in('status_pagamento', ['pago', 'pendente']) // Busca ambos
  .gte('criado_em', dataInicio)
  .lte('criado_em', dataFim);

// Processar dados - só incluir 'pago' no faturamento
pedidos.forEach(pedido => {
  const valor = parseFloat(pedido.valor_total) || 0;
  
  // ✅ Apenas pedidos 'pago' entram no faturamento
  if (pedido.status_pagamento === 'pago') {
    totalFaturado += valor;
  }
});
```

---

## 📊 Indicadores Visuais

### **No Card do Pedido**

```jsx
<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
  order.paymentStatus === 'pago' ? 'bg-green-600 text-white' :
  order.paymentStatus === 'pendente' ? 'bg-yellow-600 text-white' :
  'bg-red-600 text-white'
}`}>
  {order.paymentStatus === 'pago' ? '🟢 Pago' :
   order.paymentStatus === 'pendente' ? '🟡 Pendente' :
   '🔴 Estornado'}
</span>
```

### **No Dashboard - Resumo de Pagamentos**

```jsx
<div className="space-y-2">
  <div className="flex justify-between items-center">
    <span className="text-green-400">🟢 Pagos (PIX/Cartão)</span>
    <span className="text-white font-bold">
      {orders.filter(o => o.paymentStatus === 'pago').length}
    </span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-yellow-400">🟡 Pendentes (Dinheiro)</span>
    <span className="text-white font-bold">
      {orders.filter(o => o.paymentStatus === 'pendente').length}
    </span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-red-400">🔴 Estornados</span>
    <span className="text-white font-bold">
      {orders.filter(o => o.paymentStatus === 'estornado').length}
    </span>
  </div>
</div>
```

---

## 🚀 Configuração do Webhook InfinitePay

### **1. No Dashboard da InfinitePay**

1. Acesse o painel da InfinitePay
2. Vá em **Configurações** → **Webhooks**
3. Adicione um novo webhook:
   - **URL:** `https://seu-projeto.supabase.co/functions/v1/webhook-infinitepay`
   - **Eventos:** Selecione:
     - ✅ `payment.approved`
     - ✅ `payment.rejected`
     - ✅ `payment.cancelled`
     - ✅ `payment.refunded`

### **2. Configurar Variáveis de Ambiente**

**No Supabase (Edge Function):**

```bash
supabase secrets set INFINITEPAY_WEBHOOK_SECRET="seu-secret-aqui"
```

---

## 🔐 Segurança

### **Validação de Assinatura**

O webhook da InfinitePay envia uma assinatura para validar a autenticidade:

```typescript
const signature = req.headers.get('x-infinitepay-signature');
const webhookSecret = Deno.env.get('INFINITEPAY_WEBHOOK_SECRET');

// Validar assinatura
const isValid = await validarAssinatura(payload, signature, webhookSecret);
if (!isValid) {
  throw new Error('Assinatura inválida');
}
```

### **RLS (Row Level Security)**

```sql
-- Restaurantes só veem seus próprios pedidos
CREATE POLICY "Restaurantes veem apenas seus pedidos"
  ON pedidos_padronizados FOR SELECT
  USING (
    id_restaurante IN (
      SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
    )
  );
```

---

## 📈 Relatórios

### **Receita Total**

```sql
SELECT 
  SUM(valor_total) AS receita_total
FROM pedidos_padronizados
WHERE id_restaurante = 'uuid-restaurante'
  AND status = 'concluido'
  AND status_pagamento = 'pago' -- ✅ Apenas pedidos pagos
  AND criado_em >= '2025-01-01'
  AND criado_em <= '2025-12-31';
```

### **Pendentes (Dinheiro)**

```sql
SELECT 
  COUNT(*) AS total_pendentes,
  SUM(valor_total) AS valor_pendente
FROM pedidos_padronizados
WHERE id_restaurante = 'uuid-restaurante'
  AND status_pagamento = 'pendente' -- 🟡 Pedidos pendentes
  AND status IN ('disponivel', 'aceito', 'pronto_para_entrega', 'coletado');
```

### **Estornos**

```sql
SELECT 
  COUNT(*) AS total_estornos,
  SUM(valor_total) AS valor_estornado
FROM pedidos_padronizados
WHERE id_restaurante = 'uuid-restaurante'
  AND status_pagamento = 'estornado' -- 🔴 Pedidos estornados
  AND estornado_em >= '2025-01-01';
```

---

## ✅ Resultado Esperado

- ✅ Restaurante só vê pedidos válidos (pago ou pendente)
- ✅ Nenhum pedido recusado aparece no painel
- ✅ Relatórios confiáveis e consistentes
- ✅ Indicadores visuais claros por status de pagamento
- ✅ Pedidos em dinheiro marcados como pendentes
- ✅ Estornos aparecem no histórico para auditoria

---

## 🧪 Testes

### **Testar Webhook Localmente**

Use ferramentas como **ngrok** ou **localtunnel** para expor o endpoint local:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 54321

# Usar URL do ngrok no dashboard InfinitePay
# Ex: https://abc123.ngrok.io/functions/v1/webhook-infinitepay
```

### **Simular Webhook com cURL**

```bash
curl -X POST \
  https://seu-projeto.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "payment.approved",
    "data": {
      "transaction_id": "test_txn_123",
      "status": "approved",
      "amount": 50.00,
      "payment_method": "pix",
      "metadata": {
        "order_data": {
          "id_restaurante": "seu-uuid-aqui",
          "tipo_pedido": "delivery",
          "nome_cliente": "Teste Cliente",
          "telefone_cliente": "(11) 99999-9999",
          "itens": [
            {
              "id_item_cardapio": "uuid-item",
              "quantidade": 1,
              "preco_unitario": 50.00
            }
          ]
        }
      }
    }
  }'
```

---

## 📞 Suporte

- **Documentação InfinitePay:** [https://docs.infinitepay.io](https://docs.infinitepay.io)
- **Suporte Supabase:** [https://supabase.com/support](https://supabase.com/support)

---

**Última atualização:** 23 de outubro de 2025

