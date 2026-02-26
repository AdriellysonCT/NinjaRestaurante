## 🐛 Problema: Grupos não aparecem no Cardápio

### ❌ Sintoma
Ao editar um item do cardápio e ir na aba "Complementos", aparece:
```
Nenhum grupo de complementos disponível.
Crie grupos na seção de Complementos primeiro.
```

Mas você JÁ criou grupos na seção de Complementos!

---

## 🔍 Causa do Problema

O problema tem **2 possíveis causas**:

### 1. Complementos não estão associados aos grupos
Você criou:
- ✅ Grupos (ex: "Molhos", "Adicionais")
- ✅ Complementos (ex: "Cheddar Extra", "Bacon")
- ❌ MAS não associou os complementos aos grupos!

### 2. Service não estava buscando as associações
O serviço `getComplements()` não estava buscando os `groupIds` de cada complemento.

---

## ✅ Solução Implementada

### 1. Service Atualizado
Agora o `getComplements()` busca automaticamente os grupos associados:

```javascript
// ANTES
const { data } = await supabase
  .from('complementos')
  .select('*');

// DEPOIS
const complementsWithGroups = await Promise.all(
  complementos.map(async (comp) => {
    const { data: associations } = await supabase
      .from('grupos_complementos_itens')
      .select('id_grupo')
      .eq('id_complemento', comp.id);
    
    return {
      ...comp,
      groupIds: associations.map(a => a.id_grupo)
    };
  })
);
```

### 2. Diagnóstico Criado
Execute o arquivo `diagnostico_grupos_complementos.sql` para ver:
- Grupos criados
- Complementos criados
- Associações entre eles
- Grupos sem complementos
- Complementos sem grupos

---

## 🔧 Como Associar Complementos aos Grupos

### Opção 1: Pela Interface (Recomendado)

1. Vá em **Complementos > Aba "Grupos"**
2. Clique em **"Gerenciar Complementos"** no grupo desejado
3. Marque os complementos que pertencem a esse grupo
4. Clique em **"Salvar Seleção"**

### Opção 2: Pelo SQL (Manual)

```sql
-- Associar "Cheddar Extra" ao grupo "Adicionais"
INSERT INTO grupos_complementos_itens (id_grupo, id_complemento)
VALUES (
    (SELECT id FROM grupos_complementos WHERE nome = 'Adicionais' LIMIT 1),
    (SELECT id FROM complementos WHERE nome = 'Cheddar Extra' LIMIT 1)
);
```

---

## 📊 Fluxo Correto

### 1. Criar Grupos
```
Complementos > Aba "Grupos" > Criar Grupo
├─ Nome: "Molhos"
├─ Seção: "Lanches"
├─ Tipo: Múltipla Seleção
└─ Obrigatório: Não
```

### 2. Criar Complementos
```
Complementos > Aba "Complementos" > Criar Complemento
├─ Nome: "Molho Barbecue"
├─ Preço: R$ 2,00
└─ Disponível: Sim
```

### 3. Associar Complementos aos Grupos
```
Complementos > Aba "Grupos" > Gerenciar Complementos
├─ Grupo: "Molhos"
├─ Marcar: ☑ Molho Barbecue
├─ Marcar: ☑ Molho Mostarda
└─ Salvar Seleção
```

### 4. Associar Grupos aos Itens do Cardápio
```
Cardápio > Editar Item > Aba "Complementos"
├─ Ativar: ☑ Molhos
├─ Gerenciar: Selecionar quais molhos
└─ Salvar Alterações
```

---

## 🎯 Estrutura do Banco

### Tabelas Envolvidas

```
grupos_complementos
├─ id
├─ nome (ex: "Molhos")
├─ tipo_selecao
└─ obrigatorio

complementos
├─ id
├─ nome (ex: "Molho Barbecue")
├─ preco
└─ status

grupos_complementos_itens (ASSOCIAÇÃO)
├─ id_grupo → grupos_complementos.id
└─ id_complemento → complementos.id

item_complemento_grupo (ASSOCIAÇÃO)
├─ item_id → itens_cardapio.id
└─ grupo_id → grupos_complementos.id
```

---

## 🔍 Verificação

### 1. Execute o Diagnóstico
```sql
-- No Supabase SQL Editor
-- Execute: diagnostico_grupos_complementos.sql
```

### 2. Verifique se há Associações
```sql
SELECT 
    g.nome as grupo,
    c.nome as complemento
FROM grupos_complementos_itens gci
JOIN grupos_complementos g ON gci.id_grupo = g.id
JOIN complementos c ON gci.id_complemento = c.id;
```

**Resultado esperado:**
```
grupo       | complemento
------------|------------------
Molhos      | Molho Barbecue
Molhos      | Molho Mostarda
Adicionais  | Cheddar Extra
Adicionais  | Bacon
```

**Se retornar vazio:** Você precisa associar os complementos aos grupos!

---

## 🚀 Teste Agora

### 1. Recarregue a Página
- Ctrl + Shift + R (Windows/Linux)
- Cmd + Shift + R (Mac)

### 2. Vá em Complementos
- Aba "Grupos"
- Clique em "Gerenciar Complementos" em um grupo
- Marque os complementos
- Salve

### 3. Vá em Cardápio
- Edite um item
- Aba "Complementos"
- Agora os grupos devem aparecer!

---

## 📝 Checklist

- [ ] Executar SQL de diagnóstico
- [ ] Verificar se grupos existem
- [ ] Verificar se complementos existem
- [ ] Associar complementos aos grupos
- [ ] Recarregar a página
- [ ] Testar no cardápio

---

## 🎉 Resultado Esperado

### Antes
```
┌─────────────────────────────────────┐
│ Complementos Disponíveis            │
├─────────────────────────────────────┤
│                                     │
│ Nenhum grupo de complementos        │
│ disponível.                         │
│                                     │
└─────────────────────────────────────┘
```

### Depois
```
┌─────────────────────────────────────┐
│ Complementos Disponíveis            │
├─────────────────────────────────────┤
│ ☐ Molhos                            │
│   Escolha seu molho favorito        │
│   [Gerenciar]                       │
│                                     │
│ ☐ Adicionais                        │
│   Ingredientes extras               │
│   [Gerenciar]                       │
└─────────────────────────────────────┘
```

---

## 💡 Dica

Se você tem muitos complementos para associar, use o SQL:

```sql
-- Associar TODOS os complementos ao grupo "Adicionais"
INSERT INTO grupos_complementos_itens (id_grupo, id_complemento)
SELECT 
    (SELECT id FROM grupos_complementos WHERE nome = 'Adicionais' LIMIT 1),
    id
FROM complementos
WHERE nome IN ('Cheddar Extra', 'Bacon', 'Ovo', 'Catupiry');
```

---

## 🐛 Ainda não funciona?

1. Execute o diagnóstico SQL
2. Verifique o console do navegador (F12)
3. Procure por erros relacionados a `getComplements` ou `getGroups`
4. Confirme que `restauranteId` está correto
5. Verifique as políticas RLS no Supabase
