# 🎟️ Guia Completo - Sistema de Cupons de Desconto

## ✅ O que foi implementado

### 1. **Banco de Dados** (`criar_tabela_cupons.sql`)
- Tabela `cupons` com todos os campos necessários
- Tabela `cupons_uso` para histórico
- Funções SQL para validação e registro de uso
- Triggers automáticos
- RLS configurado para segurança
- Índices para performance

### 2. **Serviço** (`cuponsService.js`)
- CRUD completo de cupons
- Validação de cupons
- Registro de uso
- Estatísticas
- Filtros e buscas

### 3. **Componentes**
- `CuponsManager.jsx` - Gerenciamento para restaurante
- `AplicarCupom.jsx` - Aplicação para cliente

### 4. **Integração**
- Nova aba "Cupons" na página Finance
- Pronto para uso no checkout do cliente

---

## 🎯 Tipos de Cupons

### 1. **Percentual**
- Desconto em porcentagem do valor do pedido
- Exemplo: 10% OFF, 20% OFF
- Pode ter limite máximo de desconto em R$

### 2. **Valor Fixo**
- Desconto em valor fixo em reais
- Exemplo: R$ 10,00 OFF, R$ 25,00 OFF
- Não pode ser maior que o valor do pedido

### 3. **Frete Grátis**
- Remove o valor do frete
- Ideal para pedidos delivery

---

## 🔧 Configurações de Cupom

### **Informações Básicas**
- **Código:** Identificador único (ex: BEMVINDO10)
- **Descrição:** Texto explicativo para o cliente
- **Status:** Ativo/Inativo

### **Desconto**
- **Tipo:** Percentual, Valor Fixo ou Frete Grátis
- **Valor:** Porcentagem ou valor em R$
- **Valor Mínimo do Pedido:** Pedido deve ser maior que X
- **Desconto Máximo:** Limite em R$ (para percentuais)

### **Limites de Uso**
- **Limite Total:** Quantas vezes o cupom pode ser usado no total
- **Limite por Cliente:** Quantas vezes cada cliente pode usar
- **Apenas Primeira Compra:** Válido só para novos clientes

### **Validade**
- **Data de Início:** Quando o cupom começa a valer
- **Data de Fim:** Quando o cupom expira (opcional)

---

## 📊 Fluxo de Uso

```
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANTE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Acessa Sistema Financeiro → Cupons                     │
│     ↓                                                       │
│  2. Clica em "Novo Cupom"                                   │
│     ↓                                                       │
│  3. Preenche formulário:                                    │
│     • Código: BEMVINDO10                                    │
│     • Tipo: Percentual                                      │
│     • Valor: 10%                                            │
│     • Pedido mínimo: R$ 30,00                               │
│     • Limite: 100 usos                                      │
│     • Validade: 30 dias                                     │
│     ↓                                                       │
│  4. Salva cupom                                             │
│     ↓                                                       │
│  5. Cupom fica disponível para clientes                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  6. Adiciona itens ao carrinho                              │
│     ↓                                                       │
│  7. No checkout, digita: BEMVINDO10                         │
│     ↓                                                       │
│  8. Sistema valida:                                         │
│     ✅ Cupom existe?                                        │
│     ✅ Está ativo?                                          │
│     ✅ Está no período válido?                              │
│     ✅ Cliente já usou?                                     │
│     ✅ Pedido atinge valor mínimo?                          │
│     ✅ Ainda tem usos disponíveis?                          │
│     ↓                                                       │
│  9. Desconto aplicado!                                      │
│     Valor: R$ 50,00                                         │
│     Desconto: -R$ 5,00 (10%)                                │
│     Total: R$ 45,00                                         │
│     ↓                                                       │
│  10. Finaliza pedido                                        │
│      ↓                                                      │
│  11. Uso registrado no histórico                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANTE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  12. Vê estatísticas do cupom:                              │
│      • Total de usos: 1                                     │
│      • Desconto aplicado: R$ 5,00                           │
│      • Vendas geradas: R$ 45,00                             │
│      • Ticket médio: R$ 45,00                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### **Passo 1: Criar tabela no Supabase**

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o script `criar_tabela_cupons.sql`
4. Verifique se as tabelas foram criadas

```sql
-- Verificar
SELECT * FROM cupons LIMIT 1;
SELECT * FROM cupons_uso LIMIT 1;
```

### **Passo 2: Criar cupom no painel**

1. Acesse **Sistema Financeiro** → **Cupons**
2. Clique em **Novo Cupom**
3. Preencha os dados
4. Salve

### **Passo 3: Integrar no checkout do cliente**

```jsx
import AplicarCupom from '../components/AplicarCupom';

function Checkout() {
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [valorTotal, setValorTotal] = useState(100.00);

  const handleCupomAplicado = (cupom) => {
    setCupomAplicado(cupom);
    
    // Recalcular total
    const desconto = cupom.valor_desconto_calculado || 0;
    setValorTotal(valorTotal - desconto);
  };

  const handleCupomRemovido = () => {
    setCupomAplicado(null);
    // Restaurar valor original
  };

  return (
    <div>
      {/* Seu carrinho */}
      
      <AplicarCupom
        restauranteId={restauranteId}
        clienteId={clienteId}
        valorPedido={valorTotal}
        onCupomAplicado={handleCupomAplicado}
        onCupomRemovido={handleCupomRemovido}
      />
      
      {/* Total com desconto */}
    </div>
  );
}
```

### **Passo 4: Registrar uso ao finalizar pedido**

```javascript
import * as cuponsService from '../services/cuponsService';

// Ao criar o pedido
if (cupomAplicado) {
  await cuponsService.registrarUsoCupom(
    cupomAplicado.id,
    clienteId,
    pedidoId,
    valorPedido,
    cupomAplicado.valor_desconto_calculado
  );
}
```

---

## 🎨 Interface

### **Painel do Restaurante**

```
┌─────────────────────────────────────────────────────────┐
│  Cupons de Desconto                    [+ Novo Cupom]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Buscar...] [Todos] [Percentual ▼]                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ BEMVINDO10                          10% OFF      │  │
│  │ Ganhe 10% de desconto na primeira compra         │  │
│  │                                                  │  │
│  │ Usos: 15 / 100    Por cliente: 1                │  │
│  │ Pedido mínimo: R$ 30,00                          │  │
│  │ Válido até: 09/02/2026 23:59                     │  │
│  │                                                  │  │
│  │ [Desativar] [📊 Stats] [Editar] [Excluir]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ FRETEGRATIS                    FRETE GRÁTIS      │  │
│  │ Frete grátis em pedidos acima de R$ 50           │  │
│  │                                                  │  │
│  │ Usos: 45 / ∞      Por cliente: 3                │  │
│  │ Pedido mínimo: R$ 50,00                          │  │
│  │ Válido até: 09/03/2026 23:59                     │  │
│  │                                                  │  │
│  │ [Desativar] [📊 Stats] [Editar] [Excluir]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Checkout do Cliente**

```
┌─────────────────────────────────────────┐
│  🎟️ Cupom de Desconto                   │
├─────────────────────────────────────────┤
│                                         │
│  [BEMVINDO10        ] [Aplicar]         │
│                                         │
│  Tem um cupom? Digite o código acima.   │
│                                         │
└─────────────────────────────────────────┘

// Após aplicar:

┌─────────────────────────────────────────┐
│  🎟️ Cupom de Desconto                   │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ BEMVINDO10              [Remover] │  │
│  │ 10% OFF                           │  │
│  │                                   │  │
│  │ Desconto:        -R$ 5,00         │  │
│  └───────────────────────────────────┘  │
│  ✅ Cupom aplicado com sucesso!         │
└─────────────────────────────────────────┘
```

---

## 📈 Estatísticas

Cada cupom mostra:
- **Total de Usos:** Quantas vezes foi usado
- **Desconto Total Aplicado:** Quanto foi descontado no total
- **Total em Vendas:** Quanto foi vendido com o cupom
- **Ticket Médio:** Valor médio dos pedidos com cupom

---

## 🔒 Validações Automáticas

O sistema valida automaticamente:

1. ✅ **Cupom existe?**
2. ✅ **Está ativo?**
3. ✅ **Está no período válido?**
4. ✅ **Não expirou?**
5. ✅ **Ainda tem usos disponíveis?**
6. ✅ **Cliente não excedeu limite?**
7. ✅ **Pedido atinge valor mínimo?**
8. ✅ **É primeira compra?** (se aplicável)

---

## 💡 Exemplos de Cupons

### **Cupom de Boas-Vindas**
```
Código: BEMVINDO10
Tipo: Percentual
Valor: 10%
Pedido Mínimo: R$ 30,00
Limite Total: 100
Por Cliente: 1
Primeira Compra: Sim
Validade: 30 dias
```

### **Cupom de Frete Grátis**
```
Código: FRETEGRATIS
Tipo: Frete Grátis
Pedido Mínimo: R$ 50,00
Limite Total: Ilimitado
Por Cliente: 3
Validade: 60 dias
```

### **Cupom de Desconto Fixo**
```
Código: 20OFF
Tipo: Valor Fixo
Valor: R$ 20,00
Pedido Mínimo: R$ 80,00
Limite Total: 50
Por Cliente: 1
Validade: 15 dias
```

### **Cupom de Black Friday**
```
Código: BLACKFRIDAY50
Tipo: Percentual
Valor: 50%
Desconto Máximo: R$ 30,00
Pedido Mínimo: R$ 60,00
Limite Total: 200
Por Cliente: 1
Validade: 1 dia
```

---

## 🎯 Casos de Uso

### **1. Atrair Novos Clientes**
Crie cupons de primeira compra com desconto atrativo.

### **2. Aumentar Ticket Médio**
Ofereça desconto em pedidos acima de um valor mínimo.

### **3. Fidelizar Clientes**
Permita múltiplos usos por cliente.

### **4. Campanhas Sazonais**
Crie cupons com validade limitada para datas especiais.

### **5. Reduzir Carrinho Abandonado**
Envie cupons por email/WhatsApp para clientes que abandonaram o carrinho.

---

## 🔧 Personalização

### **Alterar Validações**
Edite a função SQL `validar_cupom` em `criar_tabela_cupons.sql`

### **Adicionar Campos**
```sql
ALTER TABLE cupons ADD COLUMN novo_campo TEXT;
```

### **Criar Relatórios**
```sql
-- Cupons mais usados
SELECT codigo, uso_atual, descricao
FROM cupons
ORDER BY uso_atual DESC
LIMIT 10;

-- Desconto total por cupom
SELECT 
  c.codigo,
  COUNT(cu.id) as usos,
  SUM(cu.valor_desconto_aplicado) as desconto_total
FROM cupons c
LEFT JOIN cupons_uso cu ON c.id = cu.cupom_id
GROUP BY c.id, c.codigo
ORDER BY desconto_total DESC;
```

---

## 🐛 Troubleshooting

### **Erro: "Cupom não encontrado"**
- Verifique se o código está correto
- Verifique se o cupom pertence ao restaurante correto

### **Erro: "Cupom expirado"**
- Verifique a data de fim do cupom
- Atualize a data se necessário

### **Erro: "Você já usou este cupom"**
- Cliente atingiu o limite de uso
- Aumente o limite ou crie novo cupom

### **Erro: "Valor mínimo do pedido"**
- Pedido não atinge o valor mínimo
- Cliente precisa adicionar mais itens

---

## 📚 Referências

- **Serviço:** `src/services/cuponsService.js`
- **Componente Restaurante:** `src/components/CuponsManager.jsx`
- **Componente Cliente:** `src/components/AplicarCupom.jsx`
- **SQL:** `criar_tabela_cupons.sql`

---

**Sistema completo e pronto para uso! 🚀**
