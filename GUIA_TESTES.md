# 🧪 Guia de Testes - Sistema de Pagamentos

## 📋 Objetivo

Este guia contém todos os testes necessários para validar a integração completa do sistema de pagamentos com webhook.

---

## ✅ Pré-requisitos

Antes de começar os testes, certifique-se de que:

- [x] Scripts SQL foram executados
- [x] Edge Function foi deployada
- [x] Webhook foi configurado na InfinitePay
- [x] Secret está configurado no Supabase
- [x] Frontend está rodando

---

## 🧪 Testes Funcionais

### **Teste 1: Pagamento PIX Aprovado**

**Objetivo:** Verificar se pedido com PIX aprovado aparece no painel

**Passos:**
1. Simular webhook de pagamento aprovado:
```bash
curl -X POST \
  https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "payment.approved",
    "data": {
      "transaction_id": "test_pix_'$(date +%s)'",
      "status": "approved",
      "amount": 50.00,
      "payment_method": "pix",
      "metadata": {
        "order_data": {
          "id_restaurante": "SEU-UUID-AQUI",
          "tipo_pedido": "delivery",
          "nome_cliente": "Teste PIX Aprovado",
          "telefone_cliente": "(11) 99999-9999",
          "itens": [
            {
              "id_item_cardapio": "UUID-ITEM-VALIDO",
              "quantidade": 2,
              "preco_unitario": 25.00
            }
          ],
          "subtotal": 50.00,
          "taxa_entrega": 0,
          "desconto": 0
        }
      }
    }
  }'
```

2. Verificar no painel do restaurante
3. Verificar no banco de dados:
```sql
SELECT 
  numero_pedido,
  status,
  status_pagamento,
  transacao_id,
  valor_total
FROM pedidos_padronizados
WHERE nome_cliente = 'Teste PIX Aprovado';
```

**Resultado Esperado:**
- ✅ Pedido aparece no painel
- ✅ Badge 🟢 Pago está visível
- ✅ `status_pagamento = 'pago'`
- ✅ `transacao_id` está preenchido

---

### **Teste 2: Pagamento Cartão Recusado**

**Objetivo:** Verificar se pedido recusado NÃO aparece no painel

**Passos:**
1. Simular webhook de pagamento recusado:
```bash
curl -X POST \
  https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "payment.rejected",
    "data": {
      "transaction_id": "test_card_rejected_'$(date +%s)'",
      "status": "rejected",
      "amount": 75.00,
      "payment_method": "credit_card",
      "metadata": {
        "order_data": {
          "id_restaurante": "SEU-UUID-AQUI",
          "tipo_pedido": "delivery",
          "nome_cliente": "Teste Cartão Recusado",
          "telefone_cliente": "(11) 98888-8888",
          "itens": [
            {
              "id_item_cardapio": "UUID-ITEM-VALIDO",
              "quantidade": 3,
              "preco_unitario": 25.00
            }
          ]
        }
      }
    }
  }'
```

2. Verificar no painel do restaurante
3. Verificar na tabela de auditoria:
```sql
SELECT 
  transacao_id,
  valor,
  metodo_pagamento,
  criado_em
FROM pagamentos_recusados
WHERE transacao_id LIKE 'test_card_rejected_%';
```

**Resultado Esperado:**
- ✅ Pedido NÃO aparece no painel
- ✅ Tentativa registrada em `pagamentos_recusados`
- ✅ Não existe registro em `pedidos_padronizados`

---

### **Teste 3: Pagamento em Dinheiro**

**Objetivo:** Verificar se pedido em dinheiro aparece como pendente

**Passos:**
1. Criar pedido com dinheiro via frontend ou API:
```javascript
import { criarPedidoDinheiro } from './services/webhookService';

await criarPedidoDinheiro({
  id_restaurante: 'SEU-UUID-AQUI',
  tipo_pedido: 'delivery',
  nome_cliente: 'Teste Dinheiro',
  telefone_cliente: '(11) 97777-7777',
  valor_total: 60.00,
  troco: 10.00,
  itens: [
    {
      id_item_cardapio: 'UUID-ITEM-VALIDO',
      quantidade: 2,
      preco_unitario: 30.00
    }
  ]
});
```

2. Verificar no painel do restaurante
3. Verificar no banco:
```sql
SELECT 
  numero_pedido,
  status_pagamento,
  troco,
  valor_total
FROM pedidos_padronizados
WHERE nome_cliente = 'Teste Dinheiro';
```

**Resultado Esperado:**
- ✅ Pedido aparece no painel
- ✅ Badge 🟡 Pendente está visível
- ✅ Troco exibido (R$ 10,00)
- ✅ `status_pagamento = 'pendente'`

---

### **Teste 4: Confirmação de Pagamento Pendente**

**Objetivo:** Verificar se pedido pendente pode ser confirmado

**Passos:**
1. Usar o ID do pedido do Teste 3
2. Confirmar pagamento:
```javascript
import { confirmarPagamentoPendente } from './services/webhookService';

await confirmarPagamentoPendente('UUID-DO-PEDIDO');
```

3. Verificar mudança de status:
```sql
SELECT 
  numero_pedido,
  status_pagamento,
  pago_em
FROM pedidos_padronizados
WHERE id = 'UUID-DO-PEDIDO';
```

**Resultado Esperado:**
- ✅ `status_pagamento` mudou de 'pendente' para 'pago'
- ✅ `pago_em` está preenchido
- ✅ Badge mudou para 🟢 Pago

---

### **Teste 5: Estorno de Pagamento**

**Objetivo:** Verificar registro de estorno

**Passos:**
1. Simular webhook de estorno:
```bash
curl -X POST \
  https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "payment.refunded",
    "data": {
      "transaction_id": "test_refund_'$(date +%s)'",
      "status": "refunded",
      "amount": 45.00,
      "payment_method": "pix",
      "metadata": {
        "order_data": {
          "id_restaurante": "SEU-UUID-AQUI"
        }
      }
    }
  }'
```

2. Registrar estorno manualmente:
```javascript
import { registrarEstorno } from './services/webhookService';

await registrarEstorno('UUID-DO-PEDIDO', 'Cliente solicitou cancelamento');
```

3. Verificar:
```sql
SELECT 
  numero_pedido,
  status,
  status_pagamento,
  motivo_estorno,
  estornado_em
FROM pedidos_padronizados
WHERE id = 'UUID-DO-PEDIDO';
```

**Resultado Esperado:**
- ✅ `status_pagamento = 'estornado'`
- ✅ `status = 'cancelado'`
- ✅ `motivo_estorno` está preenchido
- ✅ Badge 🔴 Estornado

---

## 📊 Testes de Relatórios

### **Teste 6: Faturamento Total**

**Objetivo:** Verificar se faturamento considera apenas pedidos pagos

**Passos:**
1. Criar cenário de teste:
```sql
-- Inserir pedidos de teste
INSERT INTO pedidos_padronizados (
  id_restaurante, 
  status, 
  status_pagamento, 
  valor_total,
  criado_em
) VALUES
  ('SEU-UUID', 'concluido', 'pago', 100.00, NOW()),
  ('SEU-UUID', 'concluido', 'pago', 150.00, NOW()),
  ('SEU-UUID', 'aceito', 'pendente', 80.00, NOW()),
  ('SEU-UUID', 'cancelado', 'estornado', 50.00, NOW());
```

2. Executar query de faturamento:
```sql
SELECT 
  SUM(valor_total) AS faturamento_total
FROM pedidos_padronizados
WHERE id_restaurante = 'SEU-UUID'
  AND status = 'concluido'
  AND status_pagamento = 'pago';
```

3. Usar função de resumo:
```sql
SELECT * FROM obter_resumo_pagamentos(
  'SEU-UUID'::uuid,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

**Resultado Esperado:**
- ✅ Faturamento = R$ 250,00 (apenas 'pago')
- ✅ Pendentes = R$ 80,00 (não contabilizado)
- ✅ Estornados = R$ 50,00 (excluído)

---

### **Teste 7: Resumo de Pagamentos no Dashboard**

**Objetivo:** Verificar contadores no dashboard

**Passos:**
1. Abrir painel do restaurante
2. Verificar widget "Status de Pagamentos"
3. Conferir contadores

**Resultado Esperado:**
- ✅ Contagem correta de pedidos pagos
- ✅ Contagem correta de pedidos pendentes
- ✅ Contagem correta de estornos
- ✅ Total geral correto

---

## 🔐 Testes de Segurança

### **Teste 8: Validação de Assinatura**

**Objetivo:** Verificar se webhooks sem assinatura são rejeitados

**Passos:**
1. Enviar webhook sem header de assinatura:
```bash
curl -X POST \
  https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -d '{"invalid": "payload"}'
```

2. Verificar logs:
```bash
supabase functions logs webhook-infinitepay --tail
```

**Resultado Esperado:**
- ✅ Webhook rejeitado (se validação estiver ativa)
- ✅ Erro registrado nos logs
- ✅ Pedido não criado

---

### **Teste 9: RLS (Row Level Security)**

**Objetivo:** Verificar se restaurantes só veem seus próprios pedidos

**Passos:**
1. Login como Restaurante A
2. Buscar pedidos:
```sql
SELECT * FROM pedidos_padronizados;
```

3. Tentar acessar pedido de outro restaurante:
```sql
SELECT * FROM pedidos_padronizados
WHERE id_restaurante != 'SEU-UUID';
```

**Resultado Esperado:**
- ✅ Restaurante vê apenas seus pedidos
- ✅ Query retorna vazio para outros restaurantes
- ✅ Erro de permissão ao tentar modificar pedidos de outros

---

## 🎨 Testes de Interface

### **Teste 10: Indicadores Visuais**

**Objetivo:** Verificar badges de status nos cards

**Passos:**
1. Criar pedidos com diferentes status
2. Verificar visualização no painel

**Resultado Esperado:**
```
Pedido #1234
🟢 Pago    (verde)

Pedido #1235
🟡 Pendente (amarelo)

Pedido #1236
🔴 Estornado (vermelho)
```

---

## 📈 Testes de Performance

### **Teste 11: Carga de Webhooks**

**Objetivo:** Verificar performance com múltiplos webhooks simultâneos

**Passos:**
1. Enviar 100 webhooks em paralelo:
```bash
for i in {1..100}; do
  curl -X POST \
    https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay \
    -H 'Content-Type: application/json' \
    -d '{
      "event": "payment.approved",
      "data": {
        "transaction_id": "load_test_'$i'",
        "status": "approved",
        "amount": 50.00,
        "payment_method": "pix",
        "metadata": {
          "order_data": {
            "id_restaurante": "SEU-UUID"
          }
        }
      }
    }' &
done
wait
```

2. Verificar:
```sql
SELECT COUNT(*) FROM pedidos_padronizados
WHERE transacao_id LIKE 'load_test_%';
```

**Resultado Esperado:**
- ✅ Todos os 100 pedidos criados
- ✅ Sem duplicatas
- ✅ Tempo de resposta < 2s por webhook

---

## ✅ Checklist Final

Após executar todos os testes, marque:

### Funcionalidade
- [ ] Pagamento PIX aprovado funciona
- [ ] Pagamento cartão aprovado funciona
- [ ] Pagamento recusado é bloqueado
- [ ] Pagamento dinheiro aparece como pendente
- [ ] Confirmação de pendente funciona
- [ ] Estorno é registrado corretamente

### Relatórios
- [ ] Faturamento considera apenas 'pago'
- [ ] Pendentes não entram no faturamento
- [ ] Resumo de pagamentos correto
- [ ] Views funcionando

### Interface
- [ ] Badge 🟢 Pago aparece corretamente
- [ ] Badge 🟡 Pendente aparece corretamente
- [ ] Badge 🔴 Estornado aparece corretamente
- [ ] Troco exibido para pedidos em dinheiro
- [ ] Resumo no dashboard correto

### Segurança
- [ ] RLS aplicado corretamente
- [ ] Validação de webhook funcionando
- [ ] Auditoria de recusas registrada

### Performance
- [ ] Webhooks processados rapidamente
- [ ] Sem duplicatas
- [ ] Queries otimizadas

---

## 🐛 Troubleshooting de Testes

### **Erro: "Restaurante não encontrado"**

**Solução:**
```sql
-- Verificar se restaurante existe
SELECT * FROM restaurantes_app WHERE id = 'SEU-UUID';

-- Criar restaurante de teste se necessário
INSERT INTO restaurantes_app (id, user_id, nome)
VALUES ('SEU-UUID', auth.uid(), 'Restaurante Teste');
```

### **Erro: "Item de cardápio não encontrado"**

**Solução:**
```sql
-- Criar item de teste
INSERT INTO itens_cardapio (id, id_restaurante, nome, preco)
VALUES ('UUID-ITEM-VALIDO', 'SEU-UUID', 'Item Teste', 25.00);
```

### **Erro: "Edge Function não responde"**

**Solução:**
```bash
# Verificar status
supabase functions list

# Ver logs
supabase functions logs webhook-infinitepay --tail

# Redesenhar se necessário
supabase functions deploy webhook-infinitepay
```

---

## 📝 Registro de Testes

Após executar todos os testes, preencha:

| Teste | Status | Data | Observações |
|-------|--------|------|-------------|
| Teste 1 | ✅ | __/__/____ | |
| Teste 2 | ✅ | __/__/____ | |
| Teste 3 | ✅ | __/__/____ | |
| Teste 4 | ✅ | __/__/____ | |
| Teste 5 | ✅ | __/__/____ | |
| Teste 6 | ✅ | __/__/____ | |
| Teste 7 | ✅ | __/__/____ | |
| Teste 8 | ✅ | __/__/____ | |
| Teste 9 | ✅ | __/__/____ | |
| Teste 10 | ✅ | __/__/____ | |
| Teste 11 | ✅ | __/__/____ | |

---

**Última atualização:** 23 de outubro de 2025

