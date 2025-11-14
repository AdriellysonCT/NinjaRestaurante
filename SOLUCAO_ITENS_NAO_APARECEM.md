# 🔧 Solução: Itens dos Pedidos Não Aparecem

## 🐛 Problema Identificado

Os itens dos pedidos não estão aparecendo nos cards e no modal de detalhes porque:

1. **Foreign Key com nome incorreto**: O código do `orderService.js` usa o nome `fk_itens_pedido_itens_cardapio` na query do Supabase
2. **Relacionamento quebrado**: A foreign key pode ter sido criada com outro nome ou não existe
3. **Query não retorna dados**: Sem a foreign key correta, o Supabase não consegue fazer o JOIN entre as tabelas

## 📍 Onde está o problema?

**Arquivo**: `src/services/orderService.js` (linha 81-85)

```javascript
itens_pedido!itens_pedido_id_pedido_fkey(
  id,
  quantidade,
  preco_unitario,
  preco_total,
  id_item_cardapio,
  itens_cardapio!fk_itens_pedido_itens_cardapio(nome, preco, tempo_preparo)  // ← AQUI
)
```

O Supabase está tentando usar a foreign key `fk_itens_pedido_itens_cardapio` para fazer o relacionamento, mas ela pode não existir ou ter outro nome.

## ✅ Solução em 3 Passos

### **Passo 1: Diagnosticar o Problema**

Execute o script no SQL Editor do Supabase:

```bash
meu-fome-ninja/diagnostico_itens_pedido.sql
```

Este script vai mostrar:
- ✅ Estrutura da tabela `itens_pedido`
- ✅ Todas as foreign keys existentes
- ✅ Se os itens estão relacionados corretamente com o cardápio
- ✅ Quantos pedidos têm itens sem relacionamento

### **Passo 2: Corrigir o Relacionamento**

Execute o script de correção:

```bash
meu-fome-ninja/corrigir_relacionamento_itens.sql
```

Este script vai:
1. Remover foreign keys antigas/duplicadas
2. Criar a foreign key com o nome correto: `fk_itens_pedido_itens_cardapio`
3. Criar índice para melhorar performance
4. Testar se a query funciona

### **Passo 3: Testar a Aplicação**

Após executar os scripts:

1. Recarregue a página do painel (F5)
2. Verifique se os itens aparecem nos cards
3. Abra o modal de detalhes de um pedido
4. Confirme que os itens estão listados corretamente

## 🔍 Como Verificar se Funcionou?

### **No Card do Pedido:**
```
Pedido #33
Cliente não informado
DINHEIRO 🟡 Pendente 🚚 Entrega
─────────────────
2x Pizza Margherita    ← DEVE APARECER
1x Coca-Cola           ← DEVE APARECER
─────────────────
R$ 47,00
```

### **No Modal de Detalhes:**
```
Itens do Pedido
─────────────────
2x Pizza Margherita    R$ 35,00    ← DEVE APARECER
1x Coca-Cola           R$ 12,00    ← DEVE APARECER
```

## 🛠️ Solução Alternativa (Se os scripts não funcionarem)

Se após executar os scripts os itens ainda não aparecerem, o problema pode ser que **os pedidos não têm itens cadastrados**. Neste caso:

### **Opção 1: Verificar se os pedidos têm itens**

Execute no SQL Editor:

```sql
SELECT 
    p.numero_pedido,
    p.nome_cliente,
    COUNT(ip.id) as total_itens
FROM pedidos_padronizados p
LEFT JOIN itens_pedido ip ON ip.id_pedido = p.id
WHERE p.status IN ('disponivel', 'aceito')
GROUP BY p.id, p.numero_pedido, p.nome_cliente
ORDER BY p.criado_em DESC
LIMIT 10;
```

Se `total_itens = 0`, significa que os pedidos foram criados sem itens.

### **Opção 2: Adicionar itens manualmente para teste**

```sql
-- Pegar o ID de um pedido existente
SELECT id, numero_pedido FROM pedidos_padronizados 
WHERE status = 'disponivel' LIMIT 1;

-- Pegar o ID de um item do cardápio
SELECT id, nome, preco FROM itens_cardapio LIMIT 1;

-- Adicionar item ao pedido (substitua os UUIDs)
INSERT INTO itens_pedido (
    id_pedido, 
    id_item_cardapio, 
    quantidade, 
    preco_unitario,
    id_restaurante
) VALUES (
    'UUID_DO_PEDIDO',      -- ID do pedido
    'UUID_DO_ITEM',        -- ID do item do cardápio
    2,                     -- Quantidade
    35.00,                 -- Preço unitário
    'UUID_DO_RESTAURANTE'  -- ID do restaurante
);
```

## 📊 Estrutura Esperada

### **Tabela: itens_pedido**
```
id                  UUID (PK)
id_pedido           UUID (FK → pedidos_padronizados.id)
id_item_cardapio    UUID (FK → itens_cardapio.id)  ← IMPORTANTE
quantidade          INTEGER
preco_unitario      DECIMAL
preco_total         DECIMAL
id_restaurante      UUID (FK → restaurantes_app.id)
criado_em           TIMESTAMP
```

### **Foreign Keys Necessárias:**
1. `itens_pedido_id_pedido_fkey` → `pedidos_padronizados(id)`
2. `fk_itens_pedido_itens_cardapio` → `itens_cardapio(id)` ← **CRÍTICA**
3. `itens_pedido_id_restaurante_fkey` → `restaurantes_app(id)`

## 🎯 Resultado Esperado

Após a correção:

✅ Itens aparecem nos cards dos pedidos  
✅ Itens aparecem no modal de detalhes  
✅ Nome, quantidade e preço são exibidos corretamente  
✅ Tempo de preparo é calculado baseado nos itens  

## 📞 Ainda não funcionou?

Se após seguir todos os passos os itens ainda não aparecerem:

1. Abra o Console do navegador (F12)
2. Vá na aba "Network"
3. Recarregue a página
4. Procure pela requisição para `/rest/v1/pedidos_padronizados`
5. Verifique a resposta JSON
6. Veja se `itens_pedido` está vazio ou se tem dados

**Me envie o JSON da resposta para eu analisar!**

---

**Criado em**: 08/11/2025  
**Status**: 🔧 Aguardando execução dos scripts
