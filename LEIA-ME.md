# 🚀 Sistema de Pagamentos - Painel Restaurantes

## 📋 O que foi implementado?

✅ **Sistema completo de integração com webhook InfinitePay**

O painel do restaurante agora **só exibe pedidos válidos**:
- 🟢 **Pago** - PIX ou Cartão aprovado
- 🟡 **Pendente** - Pagamento em dinheiro (aguardando confirmação)
- ❌ **Recusados não aparecem** - Pedidos com pagamento recusado são bloqueados

---

## 📁 Arquivos Importantes

### **Para Instalação:**
1. 📖 `GUIA_INSTALACAO_WEBHOOK.md` - **COMECE POR AQUI**
2. 🗄️ Scripts SQL:
   - `adicionar_campos_webhook.sql`
   - `criar_tabela_pagamentos_recusados.sql`
   - `criar_view_pedidos_validos.sql`

### **Documentação Técnica:**
- 📘 `DOCUMENTACAO_INTEGRACAO_INFINITEPAY.md` - Fluxo completo
- 📊 `RESUMO_IMPLEMENTACAO_WEBHOOK.md` - Resumo das alterações

### **Código:**
- 🔧 `src/services/webhookService.js` - Serviço de webhook
- ⚡ `supabase/functions/webhook-infinitepay/index.ts` - Edge Function

---

## ⚡ Instalação Rápida

```bash
# 1. Executar scripts SQL no Supabase (em ordem)
#    - adicionar_campos_webhook.sql
#    - criar_tabela_pagamentos_recusados.sql
#    - criar_view_pedidos_validos.sql

# 2. Configurar e fazer deploy da Edge Function
supabase login
supabase link --project-ref seu-project-ref
supabase secrets set INFINITEPAY_WEBHOOK_SECRET="seu-secret"
supabase functions deploy webhook-infinitepay

# 3. Configurar webhook na InfinitePay
#    URL: https://seu-projeto.supabase.co/functions/v1/webhook-infinitepay
#    Eventos: payment.approved, payment.rejected, payment.cancelled
```

**📖 Instruções detalhadas:** Ver `GUIA_INSTALACAO_WEBHOOK.md`

---

## 🎯 Como Funciona

### **Pagamento PIX/Cartão:**
```
Cliente → Escolhe PIX/Cartão → InfinitePay processa
  ├─ Aprovado ✅ → Webhook cria pedido → Painel mostra 🟢 Pago
  └─ Recusado ❌ → Registra auditoria → Pedido NÃO aparece
```

### **Pagamento Dinheiro:**
```
Cliente → Escolhe Dinheiro → App cria pedido imediato
  → Painel mostra 🟡 Pendente (com valor do troco)
  → Entregador confirma → Muda para 🟢 Pago
```

---

## 📊 Relatórios

✅ **Faturamento Total:**
- Inclui APENAS pedidos com `status_pagamento = 'pago'`
- Pedidos pendentes (dinheiro) NÃO entram até serem confirmados

✅ **Pendentes:**
- Visíveis no painel
- Não contabilizados no faturamento

✅ **Estornos:**
- Aparecem no histórico
- Status: 🔴 Estornado

---

## 🔐 Segurança

✅ RLS (Row Level Security) aplicado  
✅ Validação de assinatura do webhook  
✅ Auditoria de pagamentos recusados  
✅ Constraints no banco de dados  

---

## 🧪 Como Testar

### **1. Teste com cURL:**
```bash
curl -X POST \
  https://seu-projeto.supabase.co/functions/v1/webhook-infinitepay \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "payment.approved",
    "data": {
      "transaction_id": "test_123",
      "status": "approved",
      "amount": 50.00,
      "payment_method": "pix",
      "metadata": {
        "order_data": {
          "id_restaurante": "seu-uuid",
          "tipo_pedido": "delivery",
          "nome_cliente": "Teste",
          "itens": [...]
        }
      }
    }
  }'
```

### **2. Verificar no SQL Editor:**
```sql
-- Ver pedidos criados
SELECT * FROM pedidos_validos ORDER BY criado_em DESC LIMIT 10;

-- Ver pagamentos recusados
SELECT * FROM pagamentos_recusados ORDER BY criado_em DESC LIMIT 10;

-- Obter resumo
SELECT * FROM obter_resumo_pagamentos(
  'seu-uuid-restaurante'::uuid,
  CURRENT_DATE - 30,
  CURRENT_DATE
);
```

---

## 🎨 Interface

### **Card do Pedido:**
```
┌─────────────────────────┐
│ Pedido #1234           │
│ João Silva             │
│ PIX  🟢 Pago  🚚       │
│ ──────────────────────│
│ 2x Hambúrguer          │
│ 1x Batata Frita        │
│ ──────────────────────│
│ R$ 45,90               │
└─────────────────────────┘
```

### **Resumo Dashboard:**
```
┌───────────────────────┐
│ Status de Pagamentos  │
├───────────────────────┤
│ 🟢 Pagos        │ 45 │
│ 🟡 Pendentes    │ 12 │
│ 🔴 Estornados   │  2 │
└───────────────────────┘
```

---

## ✅ Checklist de Validação

Após instalação, verifique:

- [ ] Scripts SQL executados com sucesso
- [ ] Edge Function deployada
- [ ] Webhook configurado na InfinitePay
- [ ] Secret configurado no Supabase
- [ ] Teste de pagamento aprovado funciona
- [ ] Pedidos recusados não aparecem
- [ ] Indicadores visuais corretos (🟢/🟡/🔴)
- [ ] Relatórios mostram valores corretos

---

## 📞 Ajuda

- ❓ **Problemas na instalação?** → Ver `GUIA_INSTALACAO_WEBHOOK.md`
- 📖 **Dúvidas técnicas?** → Ver `DOCUMENTACAO_INTEGRACAO_INFINITEPAY.md`
- 🐛 **Bugs/Erros?** → Ver seção Troubleshooting no guia de instalação

---

## 🎉 Pronto!

Sistema 100% funcional. O painel agora só mostra pedidos válidos e os relatórios são confiáveis! 🚀

**Status:** ✅ Pronto para produção

---

**Última atualização:** 23 de outubro de 2025

