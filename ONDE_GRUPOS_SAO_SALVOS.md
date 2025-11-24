# 📍 Onde os Grupos de Complementos São Salvos

## Resumo Rápido
Quando você cria um novo grupo no complemento, ele é salvo na tabela **`grupos_complementos`** do banco de dados Supabase.

---

## 🗂️ Estrutura do Banco de Dados

### Tabela Principal: `grupos_complementos`

```sql
CREATE TABLE grupos_complementos (
    id UUID PRIMARY KEY,
    id_restaurante UUID NOT NULL,  -- ✅ Vincula ao seu restaurante
    nome VARCHAR(100) NOT NULL,     -- Nome do grupo (ex: "Molhos", "Adicionais")
    tipo_selecao VARCHAR(20),       -- 'single' ou 'multiple'
    obrigatorio BOOLEAN,            -- Se é obrigatório escolher
    criado_em TIMESTAMP,
    atualizado_em TIMESTAMP
);
```

**Campos salvos:**
- `id` - ID único do grupo (gerado automaticamente)
- `id_restaurante` - ID do seu restaurante (vem do contexto de autenticação)
- `nome` - Nome que você dá ao grupo
- `tipo_selecao` - Se o cliente pode escolher 1 item (`single`) ou vários (`multiple`)
- `obrigatorio` - Se o cliente é obrigado a escolher algo deste grupo
- `criado_em` - Data/hora de criação
- `atualizado_em` - Data/hora da última atualização

---

## 🔄 Fluxo de Salvamento

### 1. Interface (Complements.jsx)
```javascript
// Quando você clica em "Criar Grupo" e preenche o formulário:
const handleSaveGroup = async () => {
    const result = await complementsService.createGroup(restauranteId, {
        name: currentGroup.name,
        description: currentGroup.description,
        selectionType: currentGroup.selectionType,
        required: currentGroup.required
    });
}
```

### 2. Serviço (complementsService.js)
```javascript
export const createGroup = async (restauranteId, groupData) => {
    const { data, error } = await supabase
        .from('grupos_complementos')  // ✅ Tabela onde salva
        .insert([{
            id_restaurante: restauranteId,
            nome: groupData.name,
            tipo_selecao: groupData.selectionType,
            obrigatorio: groupData.required ?? false
        }])
        .select()
        .single();
    
    return { success: true, data };
}
```

### 3. Banco de Dados (Supabase)
```
grupos_complementos
├── id: "550e8400-e29b-41d4-a716-446655440000"
├── id_restaurante: "123e4567-e89b-12d3-a456-426614174000"
├── nome: "Molhos"
├── tipo_selecao: "single"
├── obrigatorio: false
├── criado_em: "2025-11-23 10:30:00"
└── atualizado_em: "2025-11-23 10:30:00"
```

---

## 🔗 Relacionamentos

### Tabelas Relacionadas:

1. **`grupos_complementos_itens`** - Liga complementos aos grupos
   ```sql
   id_grupo → grupos_complementos.id
   id_complemento → complementos.id
   ```

2. **`item_complemento_grupo`** - Liga grupos aos itens do cardápio
   ```sql
   grupo_id → grupos_complementos.id
   item_id → itens_cardapio.id
   ```

---

## 🔍 Como Verificar

Execute o arquivo SQL que criei para você:
```bash
# No Supabase SQL Editor, execute:
meu-fome-ninja/verificar_salvamento_grupos.sql
```

Isso vai mostrar:
- ✅ Todos os grupos criados
- ✅ Estrutura da tabela
- ✅ Último grupo criado
- ✅ Grupos por restaurante
- ✅ Complementos associados
- ✅ Itens do cardápio que usam os grupos

---

## 🐛 Problemas Comuns

### Grupo não aparece após criar?
1. Verifique se `restauranteId` está correto no console
2. Verifique as políticas RLS (Row Level Security) no Supabase
3. Confirme que o usuário está autenticado

### Erro ao salvar?
- Verifique se a coluna `id_restaurante` existe na tabela
- Confirme que o campo `tipo_selecao` é 'single' ou 'multiple'
- Verifique se há erros no console do navegador

---

## 📊 Exemplo de Dados

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "id_restaurante": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Molhos",
  "tipo_selecao": "single",
  "obrigatorio": false,
  "criado_em": "2025-11-23T10:30:00.000Z",
  "atualizado_em": "2025-11-23T10:30:00.000Z"
}
```

---

## 🎯 Resumo

**Onde salva:** Tabela `grupos_complementos` no Supabase  
**Arquivo responsável:** `src/services/complementsService.js`  
**Função:** `createGroup(restauranteId, groupData)`  
**Campos principais:** `id_restaurante`, `nome`, `tipo_selecao`, `obrigatorio`

---

## 📝 Notas Importantes

⚠️ **Atenção:** O campo `descricao` (description) não existe na tabela atual!  
Se você precisa salvar descrições, será necessário adicionar a coluna:

```sql
ALTER TABLE grupos_complementos 
ADD COLUMN descricao TEXT;
```

Atualmente, a descrição é enviada pelo frontend mas **não é salva** no banco.
