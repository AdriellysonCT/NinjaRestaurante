# 🚀 Guia de Instalação - Integração Webhook InfinitePay

Este guia contém os passos necessários para configurar a integração completa com webhook da InfinitePay.

---

## 📋 Pré-requisitos

- ✅ Projeto Supabase configurado
- ✅ Conta na InfinitePay
- ✅ Acesso ao painel de administração do Supabase
- ✅ Node.js e npm instalados (para Supabase CLI)

---

## 🔧 Passo 1: Instalar Supabase CLI

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Verificar instalação
supabase --version
```

---

## 🗄️ Passo 2: Executar Scripts SQL

Execute os scripts SQL na seguinte ordem no **SQL Editor** do Supabase:

### 2.1. Adicionar Campos para Webhook

```bash
# Copie o conteúdo do arquivo:
meu-fome-ninja/adicionar_campos_webhook.sql

# Cole no SQL Editor do Supabase e execute
```

**Este script adiciona:**
- `transacao_id` - ID da transação InfinitePay
- `pago_em` - Data de confirmação do pagamento
- `motivo_estorno` - Motivo do estorno (se houver)
- `estornado_em` - Data do estorno
- `endereco_entrega` - Endereço completo (JSONB)
- `nome_cliente` - Nome do cliente

### 2.2. Criar Tabela de Pagamentos Recusados

```bash
# Copie o conteúdo do arquivo:
meu-fome-ninja/criar_tabela_pagamentos_recusados.sql

# Cole no SQL Editor do Supabase e execute
```

**Este script cria:**
- Tabela `pagamentos_recusados` para auditoria
- Índices para performance
- Políticas RLS para segurança

### 2.3. Criar Views e Funções

```bash
# Copie o conteúdo do arquivo:
meu-fome-ninja/criar_view_pedidos_validos.sql

# Cole no SQL Editor do Supabase e execute
```

**Este script cria:**
- View `pedidos_validos` - Apenas pedidos com pagamento válido
- View `pedidos_faturamento` - Apenas pedidos pagos para relatórios
- Função `obter_resumo_pagamentos()` - Resumo por período

---

## ⚡ Passo 3: Deploy da Edge Function

### 3.1. Fazer Login no Supabase

```bash
# Fazer login
supabase login

# Vincular ao projeto
supabase link --project-ref seu-project-ref
```

### 3.2. Configurar Variáveis de Ambiente

```bash
# Definir secret do webhook (obtido no painel InfinitePay)
supabase secrets set INFINITEPAY_WEBHOOK_SECRET="seu-secret-aqui"

# Verificar secrets
supabase secrets list
```

### 3.3. Deploy da Function

```bash
# Fazer deploy da function
supabase functions deploy webhook-infinitepay

# Verificar se foi deployada
supabase functions list
```

### 3.4. Anotar URL da Function

Após o deploy, anote a URL da function:

```
https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay
```

---

## 🔗 Passo 4: Configurar Webhook na InfinitePay

### 4.1. Acessar Dashboard InfinitePay

1. Faça login no painel da InfinitePay
2. Vá em **Configurações** → **Webhooks** (ou **Integrações** → **Webhooks**)

### 4.2. Criar Novo Webhook

Clique em **Criar Webhook** ou **Adicionar Webhook**:

**Configurações:**
- **Nome:** `Webhook Restaurante - Produção`
- **URL:** `https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay`
- **Método:** `POST`
- **Content-Type:** `application/json`

**Eventos para assinar:**
- ✅ `payment.approved` - Pagamento aprovado
- ✅ `payment.rejected` - Pagamento recusado
- ✅ `payment.cancelled` - Pagamento cancelado
- ✅ `payment.refunded` - Pagamento estornado
- ✅ `payment.pending` - Pagamento pendente (opcional)

### 4.3. Copiar Secret

Após criar o webhook, copie o **Webhook Secret** fornecido pela InfinitePay.

### 4.4. Atualizar Secret no Supabase

```bash
# Atualizar com o secret real da InfinitePay
supabase secrets set INFINITEPAY_WEBHOOK_SECRET="secret-copiado-da-infinitepay"
```

---

## 🧪 Passo 5: Testar Integração

### 5.1. Testar com Simulação de Pagamento

Na InfinitePay, use o **Modo de Teste** para simular pagamentos:

1. Crie um pagamento de teste no app do cliente
2. Aprove o pagamento no sandbox da InfinitePay
3. Verifique se o pedido aparece no painel do restaurante

### 5.2. Verificar Logs

**No Supabase:**

```bash
# Ver logs da function
supabase functions logs webhook-infinitepay --tail
```

**No SQL Editor:**

```sql
-- Verificar pedidos criados
SELECT 
  id,
  numero_pedido,
  status,
  status_pagamento,
  transacao_id,
  valor_total,
  criado_em
FROM pedidos_padronizados
ORDER BY criado_em DESC
LIMIT 10;

-- Verificar pagamentos recusados
SELECT 
  transacao_id,
  valor,
  metodo_pagamento,
  criado_em
FROM pagamentos_recusados
ORDER BY criado_em DESC
LIMIT 10;
```

### 5.3. Testar com cURL

```bash
# Testar endpoint diretamente
curl -X POST \
  https://SEU-PROJECT-REF.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU-ANON-KEY' \
  -d '{
    "event": "payment.approved",
    "data": {
      "transaction_id": "test_txn_' $(date +%s) '",
      "status": "approved",
      "amount": 50.00,
      "payment_method": "pix",
      "metadata": {
        "order_data": {
          "id_restaurante": "SEU-UUID-RESTAURANTE",
          "tipo_pedido": "delivery",
          "nome_cliente": "Teste Cliente",
          "telefone_cliente": "(11) 99999-9999",
          "itens": [
            {
              "id_item_cardapio": "UUID-ITEM-TESTE",
              "quantidade": 1,
              "preco_unitario": 50.00
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

---

## ✅ Passo 6: Validar Funcionamento

### 6.1. Checklist de Validação

- [ ] **Pagamento Aprovado:** Pedido aparece no painel com 🟢 Pago
- [ ] **Pagamento Recusado:** Pedido NÃO aparece no painel
- [ ] **Pagamento Dinheiro:** Pedido aparece com 🟡 Pendente
- [ ] **Relatório Financeiro:** Apenas pedidos 'pago' no faturamento
- [ ] **Indicadores Visuais:** Badges corretos nos cards
- [ ] **Resumo Dashboard:** Contadores funcionando

### 6.2. Queries de Verificação

```sql
-- 1. Verificar configuração dos campos
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos_padronizados'
  AND column_name IN (
    'transacao_id', 
    'status_pagamento', 
    'pago_em', 
    'estornado_em', 
    'motivo_estorno'
  );

-- 2. Verificar constraint de status_pagamento
SELECT 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pedidos_padronizados'
  AND constraint_name = 'check_status_pagamento_valido';

-- 3. Testar view de pedidos válidos
SELECT 
  id,
  numero_pedido,
  status_pagamento,
  status_pagamento_label,
  incluir_no_faturamento
FROM pedidos_validos
LIMIT 5;

-- 4. Testar função de resumo
SELECT * FROM obter_resumo_pagamentos(
  'SEU-UUID-RESTAURANTE'::uuid,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

---

## 🐛 Troubleshooting

### Problema: Function não está recebendo webhooks

**Solução:**

1. Verifique se a URL está correta no painel InfinitePay
2. Verifique os logs da function:
   ```bash
   supabase functions logs webhook-infinitepay --tail
   ```
3. Teste manualmente com cURL

### Problema: Pedidos recusados aparecem no painel

**Solução:**

1. Verifique o filtro no `orderService.js`:
   ```javascript
   .in('status_pagamento', ['pago', 'pendente'])
   ```
2. Limpe cache do navegador
3. Verifique se o webhook está enviando o status correto

### Problema: Erro ao criar pedido

**Solução:**

1. Verifique se todos os campos obrigatórios estão sendo enviados
2. Verifique as constraints do banco:
   ```sql
   SELECT * FROM pg_constraint 
   WHERE conrelid = 'pedidos_padronizados'::regclass;
   ```
3. Verifique os logs da function

### Problema: Assinatura inválida

**Solução:**

1. Verifique se o secret está configurado corretamente:
   ```bash
   supabase secrets list
   ```
2. Atualize o secret com o valor correto da InfinitePay
3. Redesploy a function:
   ```bash
   supabase functions deploy webhook-infinitepay
   ```

---

## 📚 Recursos Adicionais

- **Documentação Supabase Functions:** https://supabase.com/docs/guides/functions
- **Documentação InfinitePay:** https://docs.infinitepay.io
- **Exemplos de Webhook:** Ver arquivo `DOCUMENTACAO_INTEGRACAO_INFINITEPAY.md`

---

## 🎉 Próximos Passos

Após a instalação completa:

1. ✅ Monitorar logs nas primeiras semanas
2. ✅ Configurar alertas para falhas de webhook
3. ✅ Treinar equipe sobre indicadores de pagamento
4. ✅ Revisar relatórios financeiros regularmente

---

**Última atualização:** 23 de outubro de 2025

**Suporte:** Para dúvidas sobre a instalação, consulte a documentação completa em `DOCUMENTACAO_INTEGRACAO_INFINITEPAY.md`

