# ✅ ESTRUTURA FINAL E DEFINITIVA - Complementos

## 📊 Tabelas e Relacionamentos

### 1️⃣ `complementos`
**Função:** Armazena os dados dos complementos individuais

**Colunas:**
- `id` (UUID, PK)
- `id_restaurante` (UUID, FK)
- `nome` (TEXT)
- `descricao` (TEXT, nullable)
- `preco` (NUMERIC, default 0)
- `imagem_url` (TEXT, nullable)
- `status` (TEXT, default 'disponivel') - valores: 'disponivel' ou 'indisponivel'
- `created_at` (TIMESTAMP)

**Exemplo:**
```json
{
  "id": "uuid-1",
  "id_restaurante": "uuid-rest",
  "nome": "Caesar",
  "descricao": "Salada Caesar tradicional",
  "preco": 5.00,
  "imagem_url": "https://...",
  "status": "disponivel"
}
```

---

### 2️⃣ `grupos_complementos`
**Função:** Grupos organizadores (ex: "Saladas", "Bordas", "Precisa de talher?")

**Colunas:**
- `id` (UUID, PK)
- `id_restaurante` (UUID, FK)
- `nome` (TEXT)
- `tipo_selecao` (TEXT) - 'single' ou 'multiple'
- `obrigatorio` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)

**Exemplo:**
```json
{
  "id": "uuid-2",
  "id_restaurante": "uuid-rest",
  "nome": "Saladas",
  "tipo_selecao": "single",
  "obrigatorio": false
}
```

---

### 3️⃣ `grupos_complementos_itens`
**Função:** Tabela pivot N:N que liga complementos aos grupos

**Colunas:**
- `id` (UUID, PK)
- `id_grupo` (UUID, FK → grupos_complementos)
- `id_complemento` (UUID, FK → complementos)

**Exemplo:**
```json
{
  "id": "uuid-3",
  "id_grupo": "uuid-grupo-saladas",
  "id_complemento": "uuid-complemento-caesar"
}
```

**Significado:** "O complemento Caesar faz parte do grupo Saladas"

---

### 4️⃣ `item_complemento_grupo`
**Função:** Liga item do cardápio ao grupo de complementos

**Colunas:**
- `id` (UUID, PK)
- `item_id` (UUID, FK → itens do cardápio)
- `grupo_id` (UUID, FK → grupos_complementos)
- `ativo` (BOOLEAN, default true)
- `created_at` (TIMESTAMP)

**Exemplo:**
```json
{
  "id": "uuid-4",
  "item_id": "uuid-parmegiana",
  "grupo_id": "uuid-grupo-saladas",
  "ativo": true
}
```

**Significado:** "O item Parmegiana aceita o grupo Saladas"

---

## 🔗 Relacionamentos

```
complementos (1) ←──→ (N) grupos_complementos_itens (N) ←──→ (1) grupos_complementos
                                                                        ↓
                                                                        ↓
                                                          item_complemento_grupo
                                                                        ↓
                                                                        ↓
                                                                  itens_cardapio
```

### Em palavras:

1. **Complemento** pode estar em **vários grupos** (via `grupos_complementos_itens`)
2. **Grupo** pode ter **vários complementos** (via `grupos_complementos_itens`)
3. **Item do cardápio** pode ter **vários grupos** (via `item_complemento_grupo`)
4. **Grupo** pode estar em **vários itens** (via `item_complemento_grupo`)

---

## 🎯 Fluxo Completo

### Criar Sistema de Complementos:

```
1. Criar complementos na tabela `complementos`
   ↓
2. Criar grupos na tabela `grupos_complementos`
   ↓
3. Associar complementos aos grupos via `grupos_complementos_itens`
   ↓
4. Associar grupos aos itens via `item_complemento_grupo`
   ↓
5. Cliente vê grupos e complementos ao selecionar item
```

### Exemplo Prático:

```sql
-- 1. Criar complemento
INSERT INTO complementos (id_restaurante, nome, preco, status)
VALUES ('uuid-rest', 'Caesar', 5.00, 'disponivel');

-- 2. Criar grupo
INSERT INTO grupos_complementos (id_restaurante, nome, tipo_selecao, obrigatorio)
VALUES ('uuid-rest', 'Saladas', 'single', false);

-- 3. Associar complemento ao grupo
INSERT INTO grupos_complementos_itens (id_grupo, id_complemento)
VALUES ('uuid-grupo', 'uuid-complemento');

-- 4. Associar grupo ao item
INSERT INTO item_complemento_grupo (item_id, grupo_id, ativo)
VALUES ('uuid-item', 'uuid-grupo', true);
```

---

## 🔧 Mapeamento de Campos

### complementos

| Campo no Banco | Tipo no JS | Observação |
|----------------|------------|------------|
| `id` | `id` | UUID |
| `id_restaurante` | `restauranteId` | UUID |
| `nome` | `name` | String |
| `descricao` | `description` | String, nullable |
| `preco` | `price` | Number |
| `imagem_url` | `image` | String, nullable |
| `status` | `available` | 'disponivel' ou 'indisponivel' |

### grupos_complementos

| Campo no Banco | Tipo no JS | Observação |
|----------------|------------|------------|
| `id` | `id` | UUID |
| `id_restaurante` | `restauranteId` | UUID |
| `nome` | `name` | String |
| `tipo_selecao` | `selectionType` | 'single' ou 'multiple' |
| `obrigatorio` | `required` | Boolean |

---

## 📝 Funções do Service

### Complementos

```javascript
// Buscar todos
getComplements(restauranteId)
  → SELECT * FROM complementos WHERE id_restaurante = ?

// Criar
createComplement(restauranteId, data)
  → INSERT INTO complementos (id_restaurante, nome, preco, status, ...)

// Atualizar
updateComplement(complementId, data)
  → UPDATE complementos SET nome, preco, status, ... WHERE id = ?

// Toggle status
toggleComplementAvailability(complementId)
  → UPDATE complementos SET status = (status = 'disponivel' ? 'indisponivel' : 'disponivel')
```

### Grupos

```javascript
// Buscar todos
getGroups(restauranteId)
  → SELECT * FROM grupos_complementos WHERE id_restaurante = ?

// Criar
createGroup(restauranteId, data)
  → INSERT INTO grupos_complementos (id_restaurante, nome, tipo_selecao, ...)

// Atualizar
updateGroup(groupId, data)
  → UPDATE grupos_complementos SET nome, tipo_selecao, ... WHERE id = ?
```

### Associações

```javascript
// Buscar complementos de um grupo
getGroupComplements(groupId)
  → SELECT complementos.* FROM grupos_complementos_itens
    JOIN complementos ON id_complemento = complementos.id
    WHERE id_grupo = ?

// Associar complementos a um grupo
associateComplementsToGroup(groupId, complementIds[])
  → DELETE FROM grupos_complementos_itens WHERE id_grupo = ?
  → INSERT INTO grupos_complementos_itens (id_grupo, id_complemento) VALUES ...

// Associar grupo a item
associateGroupsToMenuItem(menuItemId, groupIds[])
  → DELETE FROM item_complemento_grupo WHERE item_id = ?
  → INSERT INTO item_complemento_grupo (item_id, grupo_id, ativo) VALUES ...

// Buscar grupos e complementos de um item
getMenuItemComplements(menuItemId)
  → SELECT * FROM item_complemento_grupo
    JOIN grupos_complementos ON grupo_id = grupos_complementos.id
    JOIN grupos_complementos_itens ON id_grupo = grupos_complementos.id
    JOIN complementos ON id_complemento = complementos.id
    WHERE item_id = ?
```

---

## ✅ Checklist de Correções Aplicadas

- [x] Usar tabela `complementos` (não `grupos_complementos_itens`)
- [x] Campos corretos: `id_restaurante`, `nome`, `descricao`, `preco`, `imagem_url`, `status`
- [x] Status: 'disponivel' ou 'indisponivel' (não boolean)
- [x] Relacionamento N:N via `grupos_complementos_itens`
- [x] Queries com JOINs corretos
- [x] Funções de associação implementadas

---

## 🎉 Resultado

Service **100% alinhado** com a estrutura real do banco!

**Status:** ✅ Pronto para testar

---

**Versão:** 5.0.0 FINAL  
**Data:** 2025-01-17  
**Status:** ✅ DEFINITIVO E CORRETO
