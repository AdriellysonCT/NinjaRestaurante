# ⏱️ Implementação: Barra de Tempo de Preparo Inteligente

## ✅ Status: Implementado e Funcionando

## 🎯 O que foi implementado

### 1. Lógica Inteligente de Cálculo de Tempo
Substituímos a soma simples por um cálculo realista que considera o preparo paralelo na cozinha.

**Arquivo:** `src/services/orderService.js`

#### Como funciona:
```javascript
// Ao invés de somar todos os tempos:
// ❌ Pizza (25) + Pizza (25) = 50 min (irreal)

// Agora usamos lógica paralela:
// ✅ Pizza (25) + Pizza (25) = 40 min (realista)
```

#### Regras:
1. **Tempo base** = Item mais demorado do pedido
2. **Para cada item adicional ≥ 25 min** = +15 minutos
3. **Itens rápidos (< 25 min)** = +0 minutos (paralelo)

### 2. Barra Visual de Progresso
A barra aparece automaticamente quando:
- ✅ Pedido está com status "aceito" (em preparo)
- ✅ Pedido tem `started_at` definido
- ✅ Pedido tem `prepTime > 0`

**Arquivo:** `src/components/OrderCard.jsx`

#### Visual:
```
Tempo Restante:  ⏱️ 25 MIN
[████████████░░░░░░░] 60%
```

Quando atrasar:
```
Atrasado:  🔴 0 MIN
[████████████████████] 0% (barra vermelha)
```

## 📊 Exemplos de Cálculo

| Pedido | Tempo Calculado |
|--------|-----------------|
| 1x Pizza (25 min) | **25 min** |
| 2x Pizza (25 min) | **40 min** (25 + 15) |
| 1x Pizza (25) + 1x Coca (2) | **25 min** (25 + 0) |
| 1x Feijoada (30) + 1x Pizza (25) + 1x Lasanha (28) | **60 min** (30 + 15 + 15) |
| 3x Refrigerante (2 min) | **2 min** |
| 2x Burger (15 min) + 1x Batata (10) | **15 min** |

## 🔧 Implementação Técnica

### Cálculo do Tempo (orderService.js)
```javascript
let totalPrepTime = 0;
let sortedItems = [];
let complexItems = [];

if (items.length === 0) {
  totalPrepTime = 0;
} else {
  // Ordena itens por tempo de preparo (decrescente)
  sortedItems = [...items].sort((a, b) => b.prepTime - a.prepTime);
  
  // Tempo base = item mais demorado
  totalPrepTime = sortedItems[0].prepTime || 0;
  
  // Conta itens complexos adicionais (≥ 25 min)
  complexItems = sortedItems.slice(1).filter(item => item.prepTime >= 25);
  
  // Adiciona 15 min por item complexo
  totalPrepTime += complexItems.length * 15;
}
```

### Visualização (OrderCard.jsx)
```javascript
// Cálculo do tempo restante (atualiza a cada segundo)
useEffect(() => {
  if (!order.started_at || !order.prepTime) return;

  const calcularTempo = () => {
    const agora = new Date();
    const inicio = new Date(order.started_at);
    const tempoEstimado = order.prepTime * 60 * 1000;
    const passado = agora - inicio;
    const restante = tempoEstimado - passado;

    if (restante <= 0) {
      setStatusTempo('Atrasado');
      setTempoRestante(0);
    } else {
      setStatusTempo('Tempo Restante');
      setTempoRestante(Math.ceil(restante / 60000));
    }
  };

  calcularTempo();
  const interval = setInterval(calcularTempo, 1000);
  return () => clearInterval(interval);
}, [order.started_at, order.prepTime]);
```

## 🎨 Características Visuais

- **Cor laranja:** Tempo dentro do previsto
- **Cor vermelha:** Pedido atrasado
- **Atualização em tempo real:** A cada 1 segundo
- **Animação suave:** Transição de 1 segundo na barra
- **Ícone de relógio:** Indicador visual

## 📱 Onde Aparece

A barra aparece em:
- ✅ Dashboard (coluna "Em Preparo")
- ✅ OrderCard de pedidos aceitos
- ✅ Qualquer componente que use o OrderCard

## 🔄 Fluxo Completo

```
1. Cliente faz pedido
   ↓
2. Restaurante aceita
   ↓
3. Sistema define started_at = agora
   ↓
4. Sistema calcula prepTime baseado nos itens
   ↓
5. Barra aparece no card
   ↓
6. Contagem regressiva inicia
   ↓
7. Barra fica vermelha se atrasar
```

## 📦 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/services/orderService.js` | Lógica inteligente de cálculo |
| `src/components/OrderCard.jsx` | Barra visual + proteção de erros |
| `LOGICA_TEMPO_PREPARO_INTELIGENTE.md` | Documentação completa |

## 🎯 Benefícios

✅ **Realista:** Reflete o preparo paralelo da cozinha  
✅ **Não espanta clientes:** Tempos razoáveis e aceitáveis  
✅ **Automático:** Usa o `tempo_preparo` de cada item do cardápio  
✅ **Visual:** Barra de progresso clara e intuitiva  
✅ **Alertas:** Fica vermelho quando atrasar  
✅ **Tempo real:** Atualiza a cada segundo  

## 💡 Ajustes Futuros (Opcional)

Se quiser ajustar os valores no futuro:

```javascript
// Em src/services/orderService.js

// Mudar o threshold de "complexo" para 20 min:
const complexItems = sortedItems.slice(1).filter(item => item.prepTime >= 20);

// Mudar o buffer para 20 min por item complexo:
totalPrepTime += complexItems.length * 20;

// Adicionar lógica de quantidade:
if (item.qty > 2) {
  totalPrepTime += 5; // +5 min se tiver mais de 2 unidades
}
```

## ✅ Testes Realizados

- ✅ Pedido com 1 item (tempo base)
- ✅ Pedido com 2 pizzas (tempo inteligente)
- ✅ Pedido com itens mistos (rápidos + lentos)
- ✅ Pedido com múltiplos itens complexos
- ✅ Contagem regressiva funcionando
- ✅ Barra ficando vermelha ao atrasar
- ✅ Atualização em tempo real

## 🚀 Como Funciona na Prática

### Cenário 1: Pedido Simples
```
Cliente pede: 1x Pizza Margherita (25 min)
Restaurante aceita às 14:00
Tempo estimado: 14:25

14:10 → "Tempo Restante: ⏱️ 15 MIN" [60%]
14:20 → "Tempo Restante: ⏱️ 5 MIN" [20%]
14:25 → "Tempo Restante: ⏱️ 0 MIN" [0%]
14:26 → "Atrasado: 🔴 0 MIN" (barra vermelha)
```

### Cenário 2: Pedido Múltiplo
```
Cliente pede: 
- 2x Pizza (25 min cada)
- 1x Coca-Cola (2 min)

Tempo calculado: 40 min (não 52!)
25 (base) + 15 (segunda pizza) + 0 (coca) = 40 min

Aceito às 14:00 → Estimativa: 14:40
```

## 📝 Dependências

Para funcionar corretamente, precisa:
- ✅ Itens do cardápio com `tempo_preparo` definido no banco
- ✅ Campo `started_at` ser definido ao aceitar pedido
- ✅ Join correto entre pedidos → itens_pedido → itens_cardapio

## 🎉 Conclusão

A implementação está **completa e funcionando**! A barra de tempo de preparo agora:
- Usa lógica inteligente e realista
- Mostra contagem regressiva em tempo real
- Alerta visualmente quando atrasar
- Não espanta clientes com tempos irreais

**Testado e aprovado! ✅**

