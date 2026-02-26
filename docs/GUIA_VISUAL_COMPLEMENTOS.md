# 🍔 Guia Visual - Sistema de Complementos FomeNinja

## 📖 O que é o Sistema de Complementos?

É um módulo que permite o restaurante oferecer **adicionais** nos produtos, como:
- 🧀 Queijos extras
- 🥓 Bacon
- 🥫 Molhos
- 🍕 Bordas recheadas
- 🥤 Bebidas do combo

---

## 🏗️ Como Funciona? (Arquitetura Simples)

```
┌─────────────────────────────────────────────────────────────┐
│                    PASSO 1: CRIAR COMPLEMENTOS              │
│                                                             │
│  🧀 Cheddar Extra - R$ 3,00                                │
│  🥓 Bacon - R$ 4,50                                        │
│  🥫 Molho Barbecue - R$ 2,00                               │
│  🥫 Molho Ranch - R$ 2,00                                  │
│  🥤 Coca-Cola 350ml - R$ 5,00                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PASSO 2: CRIAR GRUPOS                    │
│                                                             │
│  📦 Grupo "Adicionais"                                      │
│     → Tipo: Múltiplo (cliente escolhe vários)              │
│     → Obrigatório: Não                                      │
│                                                             │
│  📦 Grupo "Molhos"                                          │
│     → Tipo: Único (cliente escolhe 1)                       │
│     → Obrigatório: Não                                      │
│                                                             │
│  📦 Grupo "Bebidas do Combo"                                │
│     → Tipo: Único (cliente escolhe 1)                       │
│     → Obrigatório: Sim                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PASSO 3: ASSOCIAR COMPLEMENTOS AOS GRUPOS      │
│                                                             │
│  📦 Grupo "Adicionais"                                      │
│     ✅ Cheddar Extra                                        │
│     ✅ Bacon                                                │
│                                                             │
│  📦 Grupo "Molhos"                                          │
│     ✅ Molho Barbecue                                       │
│     ✅ Molho Ranch                                          │
│                                                             │
│  📦 Grupo "Bebidas do Combo"                                │
│     ✅ Coca-Cola 350ml                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           PASSO 4: ASSOCIAR GRUPOS AOS ITENS DO CARDÁPIO    │
│                                                             │
│  🍔 Hambúrguer Artesanal                                    │
│     ✅ Grupo "Adicionais"                                   │
│     ✅ Grupo "Molhos"                                       │
│                                                             │
│  🍕 Pizza Grande                                            │
│     ✅ Grupo "Adicionais"                                   │
│                                                             │
│  🍱 Combo Executivo                                         │
│     ✅ Grupo "Bebidas do Combo"                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados

### 1️⃣ Tabela: `complementos`

**O que armazena:** Todos os complementos individuais

```
┌──────────────────────────────────────────────────────┐
│ ID  │ Nome              │ Preço  │ Disponível │ Img  │
├──────────────────────────────────────────────────────┤
│ 1   │ Cheddar Extra     │ 3.00   │ ✅ Sim     │ 🧀   │
│ 2   │ Bacon             │ 4.50   │ ✅ Sim     │ 🥓   │
│ 3   │ Molho Barbecue    │ 2.00   │ ✅ Sim     │ 🥫   │
│ 4   │ Molho Ranch       │ 2.00   │ ❌ Não     │ 🥫   │
│ 5   │ Coca-Cola 350ml   │ 5.00   │ ✅ Sim     │ 🥤   │
└──────────────────────────────────────────────────────┘
```

**Campos:**
- `id` - Identificador único
- `restaurante_id` - Qual restaurante criou
- `nome` - Nome do complemento
- `preco` - Preço adicional
- `descricao` - Descrição (opcional)
- `imagem` - URL da foto
- `disponivel` - Se está disponível para venda

---

### 2️⃣ Tabela: `grupos_complementos`

**O que armazena:** Grupos que organizam os complementos

```
┌────────────────────────────────────────────────────────────────┐
│ ID │ Nome              │ Tipo      │ Obrigatório │ Descrição    │
├────────────────────────────────────────────────────────────────┤
│ 1  │ Adicionais        │ Múltiplo  │ ❌ Não      │ Extras       │
│ 2  │ Molhos            │ Único     │ ❌ Não      │ Escolha 1    │
│ 3  │ Bebidas do Combo  │ Único     │ ✅ Sim      │ Obrigatório  │
└────────────────────────────────────────────────────────────────┘
```

**Campos:**
- `id` - Identificador único
- `restaurante_id` - Qual restaurante criou
- `nome` - Nome do grupo
- `descricao` - Descrição do grupo
- `tipo_selecao` - `'single'` (único) ou `'multiple'` (múltiplo)
- `obrigatorio` - Se cliente é obrigado a escolher

**Tipos de Seleção:**

```
📌 ÚNICO (single)
   Cliente escolhe APENAS 1 complemento
   Exemplo: Molhos → Barbecue OU Ranch OU Picante
   
📌 MÚLTIPLO (multiple)
   Cliente escolhe VÁRIOS complementos
   Exemplo: Adicionais → Cheddar + Bacon + Ovo
```

---

### 3️⃣ Tabela: `grupos_complementos_itens`

**O que armazena:** Liga complementos aos grupos

```
┌─────────────────────────────────────────────────┐
│ Grupo ID │ Complemento ID │ Complemento        │
├─────────────────────────────────────────────────┤
│ 1        │ 1              │ Cheddar Extra      │
│ 1        │ 2              │ Bacon              │
│ 2        │ 3              │ Molho Barbecue     │
│ 2        │ 4              │ Molho Ranch        │
│ 3        │ 5              │ Coca-Cola 350ml    │
└─────────────────────────────────────────────────┘
```

**Traduzindo:**
- Grupo "Adicionais" (ID 1) tem: Cheddar + Bacon
- Grupo "Molhos" (ID 2) tem: Barbecue + Ranch
- Grupo "Bebidas" (ID 3) tem: Coca-Cola

---

### 4️⃣ Tabela: `itens_complementos`

**O que armazena:** Liga grupos aos itens do cardápio

```
┌──────────────────────────────────────────────────────┐
│ Item do Cardápio      │ Grupo ID │ Grupo            │
├──────────────────────────────────────────────────────┤
│ Hambúrguer Artesanal  │ 1        │ Adicionais       │
│ Hambúrguer Artesanal  │ 2        │ Molhos           │
│ Pizza Grande          │ 1        │ Adicionais       │
│ Combo Executivo       │ 3        │ Bebidas do Combo │
└──────────────────────────────────────────────────────┘
```

**Traduzindo:**
- Hambúrguer tem: Grupo Adicionais + Grupo Molhos
- Pizza tem: Grupo Adicionais
- Combo tem: Grupo Bebidas (obrigatório)

---

## 🎯 Exemplo Prático Completo

### Cenário: Criar complementos para um Hambúrguer

#### 1️⃣ Criar os Complementos

```sql
INSERT INTO complementos (nome, preco, disponivel) VALUES
('Cheddar Extra', 3.00, true),
('Bacon', 4.50, true),
('Ovo', 2.50, true),
('Molho Barbecue', 2.00, true),
('Molho Ranch', 2.00, true);
```

#### 2️⃣ Criar os Grupos

```sql
INSERT INTO grupos_complementos (nome, tipo_selecao, obrigatorio) VALUES
('Adicionais', 'multiple', false),
('Molhos', 'single', false);
```

#### 3️⃣ Associar Complementos aos Grupos

```sql
-- Grupo "Adicionais" recebe: Cheddar, Bacon, Ovo
INSERT INTO grupos_complementos_itens (grupo_id, complemento_id) VALUES
(1, 1), -- Cheddar
(1, 2), -- Bacon
(1, 3); -- Ovo

-- Grupo "Molhos" recebe: Barbecue, Ranch
INSERT INTO grupos_complementos_itens (grupo_id, complemento_id) VALUES
(2, 4), -- Barbecue
(2, 5); -- Ranch
```

#### 4️⃣ Associar Grupos ao Item do Cardápio

```sql
-- Hambúrguer recebe os grupos: Adicionais + Molhos
INSERT INTO itens_complementos (item_cardapio_id, grupo_id) VALUES
(123, 1), -- Grupo Adicionais
(123, 2); -- Grupo Molhos
```

---

## 👤 Como o Cliente Vê?

### Tela do App - Hambúrguer Artesanal

```
╔═══════════════════════════════════════════════════╗
║  🍔 Hambúrguer Artesanal                          ║
║  R$ 25,00                                         ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  🧀 ADICIONAIS (Opcional - Escolha vários)        ║
║  ┌─────────────────────────────────────────────┐ ║
║  │ ☑ Cheddar Extra          +R$ 3,00           │ ║
║  │ ☑ Bacon                  +R$ 4,50           │ ║
║  │ ☐ Ovo                    +R$ 2,50           │ ║
║  └─────────────────────────────────────────────┘ ║
║                                                   ║
║  🥫 MOLHOS (Opcional - Escolha 1)                 ║
║  ┌─────────────────────────────────────────────┐ ║
║  │ ● Molho Barbecue         +R$ 2,00           │ ║
║  │ ○ Molho Ranch            +R$ 2,00           │ ║
║  └─────────────────────────────────────────────┘ ║
║                                                   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  TOTAL: R$ 34,50                                  ║
║  (Hambúrguer + Cheddar + Bacon + Barbecue)        ║
║                                                   ║
║  [ ADICIONAR AO CARRINHO ]                        ║
╚═══════════════════════════════════════════════════╝
```

**Cálculo:**
- Hambúrguer: R$ 25,00
- Cheddar Extra: +R$ 3,00
- Bacon: +R$ 4,50
- Molho Barbecue: +R$ 2,00
- **Total: R$ 34,50**

---

## 🔄 Fluxo Completo (Diagrama)

```
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANTE (Painel Admin)               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  1. Criar Complementos                │
        │     • Cheddar Extra - R$ 3,00         │
        │     • Bacon - R$ 4,50                 │
        │     • Molho Barbecue - R$ 2,00        │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  2. Criar Grupos                      │
        │     • Adicionais (múltiplo)           │
        │     • Molhos (único)                  │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  3. Associar Complementos aos Grupos  │
        │     Adicionais → Cheddar, Bacon       │
        │     Molhos → Barbecue                 │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  4. Associar Grupos aos Itens         │
        │     Hambúrguer → Adicionais + Molhos  │
        └───────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (App)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  5. Cliente Escolhe Item              │
        │     🍔 Hambúrguer Artesanal           │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  6. Sistema Mostra Grupos             │
        │     • Adicionais (múltiplo)           │
        │     • Molhos (único)                  │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  7. Cliente Seleciona                 │
        │     ✅ Cheddar Extra                  │
        │     ✅ Bacon                          │
        │     ● Molho Barbecue                  │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  8. Sistema Calcula Total             │
        │     R$ 25,00 + 3,00 + 4,50 + 2,00     │
        │     = R$ 34,50                        │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  9. Adiciona ao Pedido                │
        │     Salva na tabela pedidos_itens     │
        │     com complementos selecionados     │
        └───────────────────────────────────────┘
```

---

## 🎨 Regras Importantes

### ✅ Disponibilidade

```
┌────────────────────────────────────────────────┐
│  Complemento com disponivel = true             │
│  → Cliente VÊ no app                           │
│                                                │
│  Complemento com disponivel = false            │
│  → Cliente NÃO VÊ no app                       │
└────────────────────────────────────────────────┘
```

**Exemplo:**
- Molho Ranch está em falta
- Restaurante marca como "Indisponível"
- Cliente não vê essa opção no app

---

### 🔒 Obrigatoriedade

```
┌────────────────────────────────────────────────┐
│  Grupo com obrigatorio = true                  │
│  → Cliente DEVE escolher                       │
│  → Não pode adicionar ao carrinho sem escolher │
│                                                │
│  Grupo com obrigatorio = false                 │
│  → Cliente PODE escolher (opcional)            │
│  → Pode adicionar sem selecionar nada          │
└────────────────────────────────────────────────┘
```

**Exemplo:**
- Combo Executivo tem grupo "Bebidas" obrigatório
- Cliente não pode finalizar sem escolher uma bebida

---

### 🎯 Tipo de Seleção

```
┌────────────────────────────────────────────────┐
│  ÚNICO (single)                                │
│  → Radio buttons (○)                           │
│  → Cliente escolhe APENAS 1                    │
│  → Exemplo: Molhos, Tamanho, Ponto da Carne   │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  MÚLTIPLO (multiple)                           │
│  → Checkboxes (☐)                              │
│  → Cliente escolhe VÁRIOS                      │
│  → Exemplo: Adicionais, Ingredientes Extras    │
└────────────────────────────────────────────────┘
```

---

## 💡 Casos de Uso Reais

### 🍕 Pizzaria

```
Item: Pizza Grande Calabresa

Grupos:
  📦 Bordas (Único, Opcional)
     • Sem borda - R$ 0,00
     • Borda recheada cheddar - R$ 8,00
     • Borda recheada catupiry - R$ 10,00
  
  📦 Adicionais (Múltiplo, Opcional)
     • Azeitona extra - R$ 3,00
     • Cebola extra - R$ 2,00
     • Orégano - R$ 0,00
```

---

### 🍔 Hamburgueria

```
Item: X-Bacon

Grupos:
  📦 Ponto da Carne (Único, Obrigatório)
     • Mal passado - R$ 0,00
     • Ao ponto - R$ 0,00
     • Bem passado - R$ 0,00
  
  📦 Adicionais (Múltiplo, Opcional)
     • Cheddar extra - R$ 3,00
     • Bacon extra - R$ 4,50
     • Ovo - R$ 2,50
  
  📦 Molhos (Único, Opcional)
     • Barbecue - R$ 2,00
     • Ranch - R$ 2,00
     • Picante - R$ 2,00
```

---

### 🍱 Restaurante Japonês

```
Item: Combo Executivo

Grupos:
  📦 Bebida (Único, Obrigatório)
     • Refrigerante lata - R$ 0,00 (incluso)
     • Suco natural - R$ 3,00
     • Água - R$ 0,00 (incluso)
  
  📦 Sobremesa (Único, Opcional)
     • Sorvete - R$ 5,00
     • Frutas - R$ 4,00
```

---

## 🚀 Vantagens do Sistema

### Para o Restaurante:
- ✅ Aumenta ticket médio (cliente adiciona extras)
- ✅ Flexibilidade total (cria grupos como quiser)
- ✅ Controle de disponibilidade em tempo real
- ✅ Organização clara dos complementos

### Para o Cliente:
- ✅ Personaliza o pedido do jeito que quer
- ✅ Vê o preço total antes de confirmar
- ✅ Interface clara e intuitiva
- ✅ Só vê opções disponíveis

---

## 📊 Resumo Visual

```
COMPLEMENTOS
    ↓
GRUPOS (organizam complementos)
    ↓
ITENS DO CARDÁPIO (recebem grupos)
    ↓
PEDIDO DO CLIENTE (seleciona complementos)
```

**Em outras palavras:**
1. Crie os ingredientes (complementos)
2. Organize em categorias (grupos)
3. Associe aos produtos (itens)
4. Cliente monta como quiser (pedido)

---

## 🎓 Conclusão

O sistema de complementos é como um **LEGO**:

- 🧱 **Complementos** = Peças individuais
- 📦 **Grupos** = Caixas que organizam as peças
- 🏗️ **Itens** = Construções que usam as caixas
- 👤 **Cliente** = Quem monta do jeito que quer

**Simples, flexível e poderoso!** 🚀
