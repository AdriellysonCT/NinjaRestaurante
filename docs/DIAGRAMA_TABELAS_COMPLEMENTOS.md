# 🗄️ Diagrama de Relacionamento - Tabelas de Complementos

## 📐 Diagrama Completo (ERD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESTAURANTES                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ id (PK)                                                          │  │
│  │ nome                                                             │  │
│  │ user_id                                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
         ↓                                    ↓
┌──────────────────────────┐        ┌──────────────────────────┐
│    COMPLEMENTOS          │        │  GRUPOS_COMPLEMENTOS     │
│  ┌────────────────────┐  │        │  ┌────────────────────┐  │
│  │ id (PK)            │  │        │  │ id (PK)            │  │
│  │ restaurante_id (FK)│──┼────────┼──│ restaurante_id (FK)│  │
│  │ nome               │  │        │  │ nome               │  │
│  │ preco              │  │        │  │ descricao          │  │
│  │ descricao          │  │        │  │ tipo_selecao       │  │
│  │ imagem             │  │        │  │ obrigatorio        │  │
│  │ disponivel         │  │        │  │ criado_em          │  │
│  │ criado_em          │  │        │  │ atualizado_em      │  │
│  │ atualizado_em      │  │        │  └────────────────────┘  │
│  └────────────────────┘  │        └──────────────────────────┘
└──────────────────────────┘                    │
         │                                      │
         │                                      │
         │         ┌────────────────────────────┘
         │         │
         ↓         ↓
┌─────────────────────────────────────┐
│  GRUPOS_COMPLEMENTOS_ITENS          │
│  ┌───────────────────────────────┐  │
│  │ id (PK)                       │  │
│  │ grupo_id (FK) ────────────────┼──┼─→ grupos_complementos.id
│  │ complemento_id (FK) ──────────┼──┼─→ complementos.id
│  │ criado_em                     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                    │
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ITENS_CARDAPIO                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ id (PK)                                                   │  │
│  │ restaurante_id (FK)                                       │  │
│  │ nome                                                      │  │
│  │ preco                                                     │  │
│  │ categoria                                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────────┐
│  ITENS_COMPLEMENTOS                 │
│  ┌───────────────────────────────┐  │
│  │ id (PK)                       │  │
│  │ item_cardapio_id (FK) ────────┼──┼─→ itens_cardapio.id
│  │ grupo_id (FK) ────────────────┼──┼─→ grupos_complementos.id
│  │ criado_em                     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                         PEDIDOS                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ id (PK)                                                   │  │
│  │ restaurante_id (FK)                                       │  │
│  │ cliente_id                                                │  │
│  │ total                                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PEDIDOS_ITENS                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ id (PK)                                                   │  │
│  │ pedido_id (FK)                                            │  │
│  │ item_cardapio_id (FK)                                     │  │
│  │ quantidade                                                │  │
│  │ preco_unitario                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────────┐
│  PEDIDOS_COMPLEMENTOS               │
│  ┌───────────────────────────────┐  │
│  │ id (PK)                       │  │
│  │ pedido_item_id (FK) ──────────┼──┼─→ pedidos_itens.id
│  │ complemento_id (FK) ──────────┼──┼─→ complementos.id
│  │ quantidade                    │  │
│  │ preco_unitario                │  │
│  │ criado_em                     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🔗 Relacionamentos Explicados

### 1️⃣ Restaurante → Complementos (1:N)

```
Um restaurante TEM MUITOS complementos
Um complemento PERTENCE A um restaurante

RESTAURANTE (1) ──────→ (N) COMPLEMENTOS
```

**Exemplo:**
- Restaurante "FomeNinja" tem:
  - Cheddar Extra
  - Bacon
  - Molho Barbecue
  - Molho Ranch

---

### 2️⃣ Restaurante → Grupos (1:N)

```
Um restaurante TEM MUITOS grupos
Um grupo PERTENCE A um restaurante

RESTAURANTE (1) ──────→ (N) GRUPOS_COMPLEMENTOS
```

**Exemplo:**
- Restaurante "FomeNinja" tem:
  - Grupo "Adicionais"
  - Grupo "Molhos"
  - Grupo "Bebidas"

---

### 3️⃣ Grupos ↔ Complementos (N:N)

```
Um grupo TEM MUITOS complementos
Um complemento PODE ESTAR EM MUITOS grupos

GRUPOS (N) ←──→ GRUPOS_COMPLEMENTOS_ITENS ←──→ (N) COMPLEMENTOS
```

**Exemplo:**
- Grupo "Adicionais" tem: Cheddar, Bacon, Ovo
- Grupo "Molhos" tem: Barbecue, Ranch
- Complemento "Cheddar" pode estar em: "Adicionais" E "Queijos"

**Tabela Intermediária:** `grupos_complementos_itens`

---

### 4️⃣ Itens do Cardápio ↔ Grupos (N:N)

```
Um item TEM MUITOS grupos
Um grupo PODE ESTAR EM MUITOS itens

ITENS_CARDAPIO (N) ←──→ ITENS_COMPLEMENTOS ←──→ (N) GRUPOS
```

**Exemplo:**
- Hambúrguer tem: Grupo "Adicionais" + Grupo "Molhos"
- Pizza tem: Grupo "Adicionais" + Grupo "Bordas"
- Grupo "Adicionais" está em: Hambúrguer, Pizza, Batata Frita

**Tabela Intermediária:** `itens_complementos`

---

### 5️⃣ Pedidos → Complementos (1:N)

```
Um item do pedido TEM MUITOS complementos
Um complemento PERTENCE A um item do pedido

PEDIDOS_ITENS (1) ──────→ (N) PEDIDOS_COMPLEMENTOS
```

**Exemplo:**
- Item do pedido: "Hambúrguer #1" tem:
  - Cheddar Extra (R$ 3,00)
  - Bacon (R$ 4,50)
  - Molho Barbecue (R$ 2,00)

---

## 📊 Cardinalidade Resumida

```
┌────────────────────────────────────────────────────────────┐
│ Relacionamento                    │ Tipo  │ Tabela Pivot   │
├────────────────────────────────────────────────────────────┤
│ Restaurante → Complementos        │ 1:N   │ -              │
│ Restaurante → Grupos              │ 1:N   │ -              │
│ Grupos ↔ Complementos             │ N:N   │ grupos_comp... │
│ Itens Cardápio ↔ Grupos           │ N:N   │ itens_comp...  │
│ Pedidos Itens → Complementos      │ 1:N   │ -              │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Exemplo Prático com Dados

### Cenário: Cliente pede Hambúrguer com extras

#### 1. Dados nas Tabelas

**complementos:**
```
| id | nome              | preco | disponivel |
|----|-------------------|-------|------------|
| 1  | Cheddar Extra     | 3.00  | true       |
| 2  | Bacon             | 4.50  | true       |
| 3  | Molho Barbecue    | 2.00  | true       |
```

**grupos_complementos:**
```
| id | nome       | tipo_selecao | obrigatorio |
|----|------------|--------------|-------------|
| 1  | Adicionais | multiple     | false       |
| 2  | Molhos     | single       | false       |
```

**grupos_complementos_itens:**
```
| grupo_id | complemento_id |
|----------|----------------|
| 1        | 1              | ← Grupo Adicionais tem Cheddar
| 1        | 2              | ← Grupo Adicionais tem Bacon
| 2        | 3              | ← Grupo Molhos tem Barbecue
```

**itens_cardapio:**
```
| id  | nome                  | preco |
|-----|-----------------------|-------|
| 100 | Hambúrguer Artesanal  | 25.00 |
```

**itens_complementos:**
```
| item_cardapio_id | grupo_id |
|------------------|----------|
| 100              | 1        | ← Hambúrguer tem Grupo Adicionais
| 100              | 2        | ← Hambúrguer tem Grupo Molhos
```

#### 2. Cliente Faz o Pedido

**pedidos:**
```
| id   | cliente_id | total  |
|------|------------|--------|
| 5000 | 999        | 34.50  |
```

**pedidos_itens:**
```
| id    | pedido_id | item_cardapio_id | quantidade | preco_unitario |
|-------|-----------|------------------|------------|----------------|
| 10001 | 5000      | 100              | 1          | 25.00          |
```

**pedidos_complementos:**
```
| pedido_item_id | complemento_id | quantidade | preco_unitario |
|----------------|----------------|------------|----------------|
| 10001          | 1              | 1          | 3.00           |
| 10001          | 2              | 1          | 4.50           |
| 10001          | 3              | 1          | 2.00           |
```

#### 3. Cálculo do Total

```
Hambúrguer:        R$ 25,00
+ Cheddar Extra:   R$  3,00
+ Bacon:           R$  4,50
+ Molho Barbecue:  R$  2,00
─────────────────────────────
TOTAL:             R$ 34,50
```

---

## 🔍 Queries Úteis

### Buscar todos os complementos de um grupo

```sql
SELECT c.*
FROM complementos c
INNER JOIN grupos_complementos_itens gci ON c.id = gci.complemento_id
WHERE gci.grupo_id = 1  -- Grupo "Adicionais"
  AND c.disponivel = true;
```

### Buscar todos os grupos de um item do cardápio

```sql
SELECT g.*
FROM grupos_complementos g
INNER JOIN itens_complementos ic ON g.id = ic.grupo_id
WHERE ic.item_cardapio_id = 100;  -- Hambúrguer
```

### Buscar complementos disponíveis para um item

```sql
SELECT c.*, g.nome as grupo_nome, g.tipo_selecao, g.obrigatorio
FROM complementos c
INNER JOIN grupos_complementos_itens gci ON c.id = gci.complemento_id
INNER JOIN grupos_complementos g ON gci.grupo_id = g.id
INNER JOIN itens_complementos ic ON g.id = ic.grupo_id
WHERE ic.item_cardapio_id = 100  -- Hambúrguer
  AND c.disponivel = true
ORDER BY g.nome, c.nome;
```

### Calcular total de um pedido com complementos

```sql
SELECT 
  pi.preco_unitario as preco_item,
  COALESCE(SUM(pc.preco_unitario * pc.quantidade), 0) as preco_complementos,
  pi.preco_unitario + COALESCE(SUM(pc.preco_unitario * pc.quantidade), 0) as total
FROM pedidos_itens pi
LEFT JOIN pedidos_complementos pc ON pi.id = pc.pedido_item_id
WHERE pi.id = 10001
GROUP BY pi.id, pi.preco_unitario;
```

---

## 🛡️ Integridade Referencial

### Chaves Estrangeiras (Foreign Keys)

```
complementos.restaurante_id → restaurantes.id
  ↳ ON DELETE CASCADE (se restaurante for deletado, complementos também)

grupos_complementos.restaurante_id → restaurantes.id
  ↳ ON DELETE CASCADE

grupos_complementos_itens.grupo_id → grupos_complementos.id
  ↳ ON DELETE CASCADE

grupos_complementos_itens.complemento_id → complementos.id
  ↳ ON DELETE CASCADE

itens_complementos.item_cardapio_id → itens_cardapio.id
  ↳ ON DELETE CASCADE

itens_complementos.grupo_id → grupos_complementos.id
  ↳ ON DELETE CASCADE

pedidos_complementos.pedido_item_id → pedidos_itens.id
  ↳ ON DELETE CASCADE

pedidos_complementos.complemento_id → complementos.id
  ↳ ON DELETE RESTRICT (não pode deletar complemento usado em pedido)
```

---

## 🔐 Segurança (RLS)

Todas as tabelas possuem **Row Level Security** habilitado:

```sql
-- Exemplo: Política para complementos
CREATE POLICY "Restaurantes veem seus complementos"
ON complementos FOR SELECT
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes WHERE user_id = auth.uid()
  )
);
```

**Isso garante que:**
- ✅ Restaurante A só vê seus complementos
- ✅ Restaurante B só vê seus complementos
- ✅ Ninguém vê dados de outros restaurantes

---

## 📈 Índices para Performance

```sql
-- Índices criados automaticamente
CREATE INDEX idx_complementos_restaurante ON complementos(restaurante_id);
CREATE INDEX idx_complementos_disponivel ON complementos(disponivel);
CREATE INDEX idx_grupos_restaurante ON grupos_complementos(restaurante_id);
CREATE INDEX idx_gci_grupo ON grupos_complementos_itens(grupo_id);
CREATE INDEX idx_gci_complemento ON grupos_complementos_itens(complemento_id);
CREATE INDEX idx_ic_item ON itens_complementos(item_cardapio_id);
CREATE INDEX idx_ic_grupo ON itens_complementos(grupo_id);
CREATE INDEX idx_pc_item ON pedidos_complementos(pedido_item_id);
```

**Benefícios:**
- ⚡ Queries mais rápidas
- 🚀 Melhor performance em JOINs
- 📊 Escalabilidade

---

## 🎓 Resumo Final

```
┌─────────────────────────────────────────────────────────────┐
│  ESTRUTURA HIERÁRQUICA                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RESTAURANTE                                                │
│      │                                                      │
│      ├─→ COMPLEMENTOS (1:N)                                │
│      │      └─→ Cheddar, Bacon, Molhos...                  │
│      │                                                      │
│      └─→ GRUPOS (1:N)                                      │
│             └─→ Adicionais, Molhos, Bebidas...             │
│                                                             │
│  GRUPOS ←→ COMPLEMENTOS (N:N)                              │
│      └─→ Tabela: grupos_complementos_itens                 │
│                                                             │
│  ITENS DO CARDÁPIO ←→ GRUPOS (N:N)                         │
│      └─→ Tabela: itens_complementos                        │
│                                                             │
│  PEDIDOS → COMPLEMENTOS (1:N)                              │
│      └─→ Tabela: pedidos_complementos                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tudo conectado de forma lógica e eficiente! 🚀**
