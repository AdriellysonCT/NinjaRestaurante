# 📁 Nova Funcionalidade: Seções para Grupos de Complementos

## 🎯 O que foi adicionado?

Agora você pode organizar seus grupos de complementos em **seções/categorias**!

### Exemplo de uso:
- **Seção "Bebidas"**: Grupos como "Refrigerantes", "Sucos", "Cervejas"
- **Seção "Lanches"**: Grupos como "Molhos", "Adicionais", "Bordas"
- **Seção "Sobremesas"**: Grupos como "Coberturas", "Acompanhamentos"

---

## 🆕 Mudanças Implementadas

### 1. Banco de Dados
✅ Adicionada coluna `secao` na tabela `grupos_complementos`
✅ Adicionada coluna `descricao` (que estava faltando)
✅ Criado índice para melhorar performance

### 2. Backend (complementsService.js)
✅ Função `createGroup` agora salva a seção
✅ Função `updateGroup` agora atualiza a seção
✅ Função `getGroups` retorna a seção

### 3. Frontend (Complements.jsx)
✅ Campo "Seção/Categoria" no formulário de criar/editar grupo
✅ Badge visual mostrando a seção no card do grupo
✅ Agrupamento automático por seção na lista de grupos
✅ Contador de grupos por seção

---

## 📋 Como Usar

### 1. Executar o SQL no Supabase
```bash
# Execute este arquivo no SQL Editor do Supabase:
meu-fome-ninja/adicionar_secao_grupos.sql
```

Isso vai:
- Adicionar a coluna `secao` na tabela
- Adicionar a coluna `descricao` (que estava faltando)
- Criar índice para performance
- Atualizar grupos existentes com seção "Geral"

### 2. Criar um Novo Grupo com Seção
1. Vá para a aba "Grupos"
2. Clique em "➕ Criar Grupo"
3. Preencha:
   - **Nome do Grupo**: Ex: "Refrigerantes"
   - **Seção/Categoria**: Ex: "Bebidas" ← NOVO!
   - **Descrição**: Ex: "Escolha seu refrigerante"
   - **Tipo de Seleção**: Único ou Múltiplo
   - **Obrigatório**: Sim/Não
4. Clique em "Salvar"

### 3. Visualizar Grupos Organizados
Os grupos agora aparecem agrupados por seção:

```
📁 Bebidas (2 grupos)
  ├─ Refrigerantes
  └─ Sucos

📁 Lanches (3 grupos)
  ├─ Molhos
  ├─ Adicionais
  └─ Bordas

📁 Sem Seção (1 grupo)
  └─ Grupo Antigo
```

---

## 🎨 Interface Visual

### Formulário de Grupo
```
┌─────────────────────────────────────┐
│ Nome do Grupo                       │
│ [Refrigerantes                   ]  │
│                                     │
│ Seção/Categoria (opcional) ← NOVO! │
│ [Bebidas                         ]  │
│                                     │
│ Descrição (opcional)                │
│ [Escolha seu refrigerante        ]  │
│                                     │
│ Tipo de Seleção                     │
│ ○ Único  ● Múltiplo                │
│                                     │
│ ☑ Obrigatório                       │
│                                     │
│ [Cancelar]  [Salvar]                │
└─────────────────────────────────────┘
```

### Card do Grupo
```
┌─────────────────────────────────────────────────┐
│ Refrigerantes [Bebidas] [Opcional] [Único]      │
│ Escolha seu refrigerante                        │
│ 5 complementos associados                       │
│                                                 │
│           [Editar Grupo] [Gerenciar]            │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Estrutura do Banco

### Tabela: grupos_complementos

```sql
CREATE TABLE grupos_complementos (
    id UUID PRIMARY KEY,
    id_restaurante UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    secao VARCHAR(100),           -- ✅ NOVO!
    descricao TEXT,               -- ✅ NOVO!
    tipo_selecao VARCHAR(20),
    obrigatorio BOOLEAN,
    criado_em TIMESTAMP,
    atualizado_em TIMESTAMP
);
```

### Exemplo de Dados

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "id_restaurante": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Refrigerantes",
  "secao": "Bebidas",           // ✅ NOVO!
  "descricao": "Escolha seu refrigerante favorito",  // ✅ NOVO!
  "tipo_selecao": "single",
  "obrigatorio": false,
  "criado_em": "2025-11-23T10:30:00.000Z",
  "atualizado_em": "2025-11-23T10:30:00.000Z"
}
```

---

## 📊 Benefícios

### Organização
✅ Grupos organizados por categoria
✅ Fácil localização de grupos específicos
✅ Melhor visualização quando há muitos grupos

### Performance
✅ Índice criado para buscas rápidas por seção
✅ Agrupamento eficiente no frontend

### Flexibilidade
✅ Campo opcional - não obrigatório
✅ Grupos sem seção ficam em "Sem Seção"
✅ Pode criar quantas seções quiser

---

## 🔄 Migração de Grupos Existentes

Grupos criados antes desta atualização:
- Terão `secao = "Geral"` (definido automaticamente)
- Aparecerão na seção "Geral"
- Podem ser editados para mudar a seção

Para atualizar manualmente:
1. Clique em "Editar Grupo"
2. Preencha o campo "Seção/Categoria"
3. Salve

---

## 🎯 Exemplos de Seções

### Para Restaurante
- Bebidas
- Entradas
- Pratos Principais
- Sobremesas
- Acompanhamentos

### Para Lanchonete
- Lanches
- Bebidas
- Porções
- Sobremesas

### Para Pizzaria
- Pizzas
- Bordas
- Bebidas
- Sobremesas

---

## 🐛 Troubleshooting

### Seção não aparece após salvar?
1. Verifique se executou o SQL `adicionar_secao_grupos.sql`
2. Confirme que a coluna `secao` existe na tabela
3. Verifique o console do navegador para erros

### Grupos não estão agrupados?
1. Recarregue a página
2. Verifique se os grupos têm seção preenchida
3. Grupos sem seção aparecem em "Sem Seção"

### Erro ao salvar?
1. Verifique se o campo `secao` aceita NULL
2. Confirme que o tipo é VARCHAR(100)
3. Veja os logs no console

---

## 📝 Notas Técnicas

### Normalização de Dados
O sistema normaliza automaticamente os dados do banco:
```javascript
section: result.data.secao || result.data.section
```

### Agrupamento Automático
Os grupos são agrupados automaticamente por seção usando `reduce`:
```javascript
const groupedBySection = groups.reduce((acc, group) => {
  const section = group.section || 'Sem Seção';
  if (!acc[section]) acc[section] = [];
  acc[section].push(group);
  return acc;
}, {});
```

### Ordenação
- Seções são ordenadas alfabeticamente
- Grupos dentro de cada seção mantêm a ordem do banco

---

## ✅ Checklist de Implementação

- [x] Adicionar coluna `secao` no banco
- [x] Adicionar coluna `descricao` no banco
- [x] Criar índice para performance
- [x] Atualizar `createGroup` no service
- [x] Atualizar `updateGroup` no service
- [x] Adicionar campo no formulário
- [x] Adicionar badge visual no card
- [x] Implementar agrupamento por seção
- [x] Normalizar dados do banco
- [x] Testar criação de grupo
- [x] Testar edição de grupo
- [x] Documentar funcionalidade

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Filtro por seção
- [ ] Reordenar seções (drag & drop)
- [ ] Cores personalizadas por seção
- [ ] Ícones personalizados por seção
- [ ] Estatísticas por seção
- [ ] Exportar/importar seções

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Execute o SQL de verificação
3. Confira a documentação do Supabase
4. Revise os arquivos criados:
   - `adicionar_secao_grupos.sql`
   - `ONDE_GRUPOS_SAO_SALVOS.md`
   - `FUNCIONALIDADE_SECAO_GRUPOS.md`
