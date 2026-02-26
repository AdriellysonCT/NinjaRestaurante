# ⏱️ Lógica Inteligente de Tempo de Preparo

## 🎯 Objetivo

Implementar um cálculo realista do tempo total de preparo dos pedidos, considerando que os itens são preparados **em paralelo** na cozinha, não sequencialmente.

## 🧠 Lógica Implementada

### Antes (Problema)
```javascript
// Somava todos os tempos (irreal)
totalPrepTime = item1.prepTime + item2.prepTime + item3.prepTime
```

❌ **Resultado:** 2 pizzas de 25 min = 50 minutos (espanta o cliente!)

### Agora (Solução)
```javascript
1. Identifica o item mais demorado (base)
2. Para cada item adicional com 25+ minutos: +15 min
3. Itens rápidos (< 25 min): 0 min adicional (paralelo)
```

✅ **Resultado:** 2 pizzas de 25 min = 40 minutos (realista!)

## 📊 Exemplos Práticos

### Exemplo 1: 2 Pizzas
**Pedido:**
- 1x Pizza Margherita (25 min)
- 1x Pizza Calabresa (25 min)

**Cálculo:**
```
Base: 25 min (primeira pizza)
+ 15 min (segunda pizza, item complexo adicional)
= 40 minutos
```

---

### Exemplo 2: Pizza + Bebida
**Pedido:**
- 1x Pizza Margherita (25 min)
- 1x Coca-Cola (2 min)

**Cálculo:**
```
Base: 25 min (pizza)
+ 0 min (bebida < 25 min, feita em paralelo)
= 25 minutos
```

---

### Exemplo 3: Múltiplos Pratos Complexos
**Pedido:**
- 1x Feijoada (30 min)
- 1x Pizza (25 min)
- 1x Lasanha (28 min)
- 1x Salada (5 min)

**Cálculo:**
```
Base: 30 min (feijoada, item mais demorado)
+ 15 min (lasanha, item complexo adicional)
+ 15 min (pizza, item complexo adicional)
+ 0 min (salada < 25 min)
= 60 minutos
```

---

### Exemplo 4: Apenas Itens Rápidos
**Pedido:**
- 3x Refrigerante (2 min cada)
- 2x Sorvete (5 min cada)

**Cálculo:**
```
Base: 5 min (sorvete, item mais demorado)
+ 0 min (outros itens < 25 min)
= 5 minutos
```

---

### Exemplo 5: Lanches
**Pedido:**
- 2x X-Burger (15 min cada)
- 1x Batata Frita (10 min)

**Cálculo:**
```
Base: 15 min (primeiro burger)
+ 0 min (segundo burger < 25 min)
+ 0 min (batata < 25 min)
= 15 minutos
```

## 🔧 Implementação Técnica

### Código (`src/services/orderService.js`)

```javascript
const totalPrepTime = (() => {
  if (items.length === 0) return 0;
  
  // Ordena itens por tempo de preparo (decrescente)
  const sortedItems = [...items].sort((a, b) => b.prepTime - a.prepTime);
  
  // Tempo base é o item mais demorado
  let totalTime = sortedItems[0].prepTime || 0;
  
  // Conta itens complexos adicionais (25+ min, excluindo o primeiro)
  const complexItems = sortedItems.slice(1).filter(item => item.prepTime >= 25);
  
  // Para cada item complexo adicional, soma apenas 15 minutos
  totalTime += complexItems.length * 15;
  
  return totalTime;
})();
```

## 📋 Regras

| Situação | Tempo Adicionado |
|----------|------------------|
| Primeiro item (mais demorado) | Tempo total do item |
| Item adicional ≥ 25 min | +15 minutos |
| Item adicional < 25 min | 0 minutos (paralelo) |

## 🎯 Benefícios

✅ **Realista:** Reflete o preparo paralelo da cozinha  
✅ **Não espanta clientes:** Tempos razoáveis  
✅ **Automático:** Calcula baseado no `tempo_preparo` de cada item  
✅ **Escalável:** Funciona com qualquer quantidade de itens  

## 🔄 Fluxo Visual

```
Pedido: Pizza (25) + Feijoada (30) + Coca (2)

Ordenação: [30, 25, 2]
           ↓   ↓   ↓
          base +15  +0

Resultado: 30 + 15 = 45 minutos ⏱️
```

## 📱 Na Interface

```
┌─────────────────────────────┐
│ Pedido #20                  │
│ Natsu Costa                 │
│                             │
│ 1x Pizza Margherita (25min) │
│ 1x Lasanha (28min)          │
│ 1x Coca-Cola (2min)         │
│                             │
│ Tempo Restante: ⏱️ 35 MIN   │
│ [███████████░░░░░░░] 75%    │
│                             │
│ [Pronto Para Entrega]       │
└─────────────────────────────┘
```

## 🧪 Como Testar

1. Crie um pedido com 2 pizzas (25 min cada)
2. Aceite o pedido
3. Verifique que mostra ~40 minutos (não 50)
4. Adicione uma bebida (2 min)
5. Tempo não deve mudar significativamente

## 💡 Ajustes Futuros (Opcional)

Caso queira ajustar a lógica:

```javascript
// Aumentar buffer de itens complexos para 20 min
totalTime += complexItems.length * 20;

// Ou mudar threshold de "complexo" para 20 min
const complexItems = sortedItems.slice(1).filter(item => item.prepTime >= 20);

// Ou adicionar um multiplicador de quantidade
const multiplier = item.qty > 2 ? 1.5 : 1;
```

## ✅ Status

🟢 **Implementado e funcionando**  
📍 Arquivo: `src/services/orderService.js` (linhas 12-31)  
🎯 Lógica: Base + (Complexos × 15 min)

