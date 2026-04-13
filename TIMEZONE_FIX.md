# 🕐 Correção de Timezone - America/Sao_Paulo (v2)

## ✅ Problemas Corrigidos

**1. Conversão Dupla de Datas** ❌ → ✅

- A função `utcToSaoPaulo()` estava convertendo duas vezes
- Resultado: horários deslocados em mais 3 horas

**2. Ranking de Produtos Vazio** ❌ → ✅

- Filtro usava apenas `originalStatus === 'aceito'`
- Pedidos com status `concluido`, `pronto`, etc. eram excluídos
- **Agora**: Inclui TODOS os pedidos válidos do dia

**3. Financeiro do Dia Incorreto** ❌ → ✅

- Range de datas agora respeita o timezone brasileiro

## Solução Técnica

### timezone.ts (REESCRITO)

```typescript
// Abordagem simplificada:
// - JS Date() já converte UTC → local automaticamente
// - Intl.DateTimeFormat garante timezone correto
// - startOfDayUTC() retorna YYYY-MM-DDT00:00:00.000Z
// - endOfDayUTC() retorna YYYY-MM-DDT23:59:59.999Z
```

### Dashboard.jsx

```javascript
// Ranking inclui TODOS os pedidos válidos do dia
const excludedStatuses = [
  "pendente",
  "novo",
  "disponivel",
  "cancelado",
  "falha_pagamento",
];
const periodOrders = orders.filter(
  (o) =>
    insidePeriod(o.created_at) && !excludedStatuses.includes(o.originalStatus),
);
```

## Como Testar

### No Dashboard:

1. **Card laranja**: "25 pedidos no sistema hoje!" ✅
2. **Total de Hoje**: R$ 497.80 deve estar correto
3. **Ranking de Produtos**: deve mostrar os 3 mais vendidos HOJE
   - Antes: "Nenhum produto vendido no período" ❌
   - Agora: Mostra os produtos vendidos ✅
4. **Pedidos de dias anteriores**: NÃO devem aparecer

### No Financeiro:

1. Filtre por "Hoje" → valores devem bater com os pedidos do dia

### Nos Pedidos:

1. Ranking inclui todos os status (aceito, pronto, concluido, coletado)
2. Tempo restante de preparo correto
3. "Desde 00:00" mostra meia-noite de Brasília

## Arquivos Modificados

- `src/utils/timezone.ts` (REESCRITO)
- `src/utils/dateFormatter.ts`
- `src/pages/Dashboard.jsx`
- `src/services/dashboardFinanceiroService.js`
- `vite.config.js`

## Funções Principais

```typescript
import { utcToSaoPaulo, nowInSaoPaulo, isTodayInSaoPaulo } from "./timezone";

// Converter UTC para horário de SP
const spTime = utcToSaoPaulo("2024-01-01T20:37:00Z"); // → 17:37

// Verificar se é hoje
if (isTodayInSaoPaulo(order.created_at)) {
  // Pedido é de hoje no Brasil
}

// Agora em SP
const now = nowInSaoPaulo();
```

## Notas Importantes

⚠️ Os timestamps no banco **continuam em UTC** (isso é correto!)
⚠️ A conversão acontece **apenas na exibição e filtragem**
⚠️ Após deploy, faça logout e login para limpar cache
⚠️ Execute o SQL no Supabase para alterar o timezone do banco (opcional, mas recomendado)
