# 🗄️ Estrutura Real do Banco de Dados - Complementos

## 📋 Tabelas Existentes

### 1️⃣ `grupos_complementos`

**Função:** Armazena os grupos de complementos (ex: Saladas, Molhos, Precisa de talher?)

**Estrutura:**
```sql
CREATE TABLE grupos_complementos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_restaurante UUID NOT NULL,
    nome TEXT NOT NULL,
    tipo_selecao TEXT NOT NULL,  -- 'single' ou 'multiple'
    obrigatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);
```

**Exemplo de Dados:**
```json
{
  "id": "uuid-1",
  "id_restaurante": "uuid-rest",
  "nome": "Saladas",
  "tipo_selecao": "single",
  "obrigatorio": false,
  "created_at": "2025-01-17T10:00:00"
}
```

---

### 2️⃣ `grupos_complementos_itens`

**Função:** Armazena os complementos individuais dentro de cada grupo

**Estrutura:**
```sql
CREATE TABLE grupos_complementos_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_grupo UUID NOT NULL,  -- FK para grupos_complementos
    id_complemento UUID NOT NULL  -- FK para complementos (?)
);
```

**Exemplo de Dados:**
```json
{
  "id": "uuid-2",
  "id_grupo": "uuid-1",  // Grupo "Saladas"
  "id_complemento": "uuid-comp-1"  // Complemento "Caesar"
}
```

**⚠️ DÚVIDA:** Preciso ver a tabela `complementos` para entender o relacionamento completo.

---

### 3️⃣ `item_complemento_grupo`

**Função:** Liga um ITEM do cardápio a um GRUPO de complementos

**Estrutura:**
```sql
CREATE TABLE item_complemento_grupo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,  -- FK para itens do cardápio
    grupo_id UUID NOT NULL,  -- FK para grupos_complementos
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Exemplo de Dados:**
```json
{
  "id": "uuid-3",
  "item_id": "uuid-item-parmegiana",
  "grupo_id": "uuid-grupo-saladas",
  "ativo": true,
  "created_at": "2025-01-17T10:00:00"
}
```

**Significado:** "O item Parmegiana aceita o grupo Saladas"

---

## 🔗 Relacionamentos

```
ITEM DO CARDÁPIO
    ↓ (item_complemento_grupo)
GRUPO DE COMPLEMENTOS
    ↓ (grupos_complementos_itens)
COMPLEMENTOS INDIVIDUAIS
```

### Exemplo Prático:

```
Item: Parmegiana
    ↓
Grupo: Saladas (tipo: single, obrigatório: false)
    ↓
Complementos:
    - Caesar (R$ 5,00)
    - Salada Simples (R$ 3,00)
```

---

## 🔧 Mapeamento de Nomenclatura

### ❌ O que o código estava usando (ERRADO):

```javascript
restaurante_id  // ❌
grupo_id        // ❌
complemento_id  // ❌
descricao       // ❌ (não existe)
```

### ✅ O que realmente existe no banco:

```javascript
id_restaurante  // ✅
id_grupo        // ✅
id_complemento  // ✅
// descricao não existe na tabela grupos_complementos
```

---

## 📝 Campos que Existem vs Não Existem

### `grupos_complementos`

| Campo | Existe? | Tipo |
|-------|---------|------|
| `id` | ✅ | UUID |
| `id_restaurante` | ✅ | UUID |
| `nome` | ✅ | TEXT |
| `tipo_selecao` | ✅ | TEXT |
| `obrigatorio` | ✅ | BOOLEAN |
| `created_at` | ✅ | TIMESTAMP |
| `descricao` | ❌ | - |
| `atualizado_em` | ❌ | - |

---

## ❓ Perguntas Pendentes

### 1. Tabela `complementos`

**Preciso ver a estrutura completa:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'complementos'
ORDER BY ordinal_position;
```

**Campos esperados:**
- `id`
- `id_restaurante` (?)
- `nome`
- `preco`
- `disponivel`
- `imagem` (?)

### 2. Como funciona o relacionamento?

**Opção A:** `grupos_complementos_itens` aponta para uma tabela `complementos`
```
grupos_complementos_itens.id_complemento → complementos.id
```

**Opção B:** `grupos_complementos_itens` armazena os dados diretamente
```
grupos_complementos_itens tem: nome, preco, etc
```

---

## 🔄 Correções Aplicadas

### ✅ `complementsService.js`

**Antes:**
```javascript
.eq('restaurante_id', restauranteId)  // ❌
```

**Depois:**
```javascript
.eq('id_restaurante', restauranteId)  // ✅
```

**Campos removidos:**
- `descricao` (não existe na tabela)

---

## 📊 Próximos Passos

1. ✅ Ver estrutura da tabela `complementos`
2. ✅ Ajustar `getComplements()` no service
3. ✅ Ajustar `createComplement()` no service
4. ✅ Ajustar normalização de dados nos componentes
5. ✅ Testar criação de grupos
6. ✅ Testar criação de complementos

---

## 💡 Observações

### Sobre `descricao`:

Se você quiser adicionar descrição aos grupos, pode executar:

```sql
ALTER TABLE grupos_complementos 
ADD COLUMN descricao TEXT;
```

Mas **não é obrigatório**. O sistema funciona sem descrição.

---

**Status:** 🔄 Aguardando estrutura da tabela `complementos`
