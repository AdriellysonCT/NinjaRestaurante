# 📋 Documentação do Módulo de Complementos - FomeNinja

## 🎯 Visão Geral

O Módulo de Complementos permite que restaurantes gerenciem adicionais, molhos, bordas e outros complementos que podem ser associados aos itens do cardápio. O sistema é flexível e permite criar grupos de complementos com diferentes regras de seleção.

---

## 🏗️ Arquitetura

### Estrutura de Dados

```
Complementos (ex: Cheddar Extra, Bacon, Molho Barbecue)
    ↓
Grupos (ex: Adicionais, Molhos, Bordas)
    ↓
Itens do Cardápio (ex: Hambúrguer, Pizza)
    ↓
Pedidos (complementos selecionados pelo cliente)
```

### Tabelas do Banco de Dados

1. **complementos** - Armazena os complementos individuais
2. **grupos_complementos** - Grupos que organizam complementos
3. **complementos_grupos** - Relacionamento N:N entre complementos e grupos
4. **itens_cardapio_grupos** - Grupos disponíveis para cada item
5. **itens_cardapio_complementos** - Complementos específicos disponíveis
6. **pedidos_complementos** - Complementos selecionados em pedidos

---

## 🎨 Telas do Sistema

### TELA 1 - Lista de Complementos

**Localização:** `/complementos` (aba "Complementos")

**Funcionalidades:**
- ✅ Visualizar todos os complementos em cards compactos
- ✅ Estatísticas: Total, Disponíveis, Indisponíveis, Grupos
- ✅ Busca por nome
- ✅ Filtro "Apenas disponíveis"
- ✅ Criar novo complemento
- ✅ Editar complemento existente
- ✅ Ativar/Desativar complemento

**Campos do Complemento:**
- Nome (ex: "Cheddar Extra")
- Preço (ex: R$ 3,00)
- Imagem (URL - opcional)
- Status (Disponível/Indisponível)

**Design:**
- Cards pequenos em grid responsivo (5 colunas em telas grandes)
- Imagem 200x150px
- Preço em destaque laranja (#ff6f00)
- Botões "Editar" e "Ativar/Desativar"

---

### TELA 2 - Grupos de Complementos

**Localização:** `/complementos` (aba "Grupos")

**Funcionalidades:**
- ✅ Visualizar todos os grupos em cards horizontais
- ✅ Criar novo grupo
- ✅ Editar grupo existente
- ✅ Gerenciar complementos do grupo
- ✅ Ver quantidade de complementos associados

**Campos do Grupo:**
- Nome (ex: "Molhos")
- Descrição (ex: "Escolha seu molho favorito")
- Tipo de Seleção:
  - **Único** - Cliente escolhe apenas 1 complemento
  - **Múltiplo** - Cliente pode escolher vários
- Obrigatório (Sim/Não)

**Modal "Gerenciar Complementos":**
- Lista todos os complementos disponíveis
- Checkboxes para associar/desassociar
- Mostra status de disponibilidade
- Botão "Salvar Seleção"

**Design:**
- Cards horizontais com informações completas
- Badges para tipo e obrigatoriedade
- Botões "Editar Grupo" e "Gerenciar Complementos"

---

### TELA 3 - Associação a Itens do Cardápio

**Localização:** Dentro da edição de item do cardápio

**Funcionalidades:**
- ✅ Visualizar card do item sendo editado
- ✅ Ativar/desativar grupos para o item
- ✅ Selecionar complementos específicos de cada grupo
- ✅ Ver quantidade de complementos selecionados
- ✅ Salvar todas as alterações

**Fluxo de Uso:**
1. Toggle para ativar grupo no item
2. Botão "Gerenciar" aparece quando grupo está ativo
3. Modal abre com lista de complementos do grupo
4. Selecionar quais complementos estarão disponíveis
5. Salvar seleção

**Modal "Selecionar Complementos":**
- Info do grupo (tipo, obrigatoriedade)
- Lista com checkboxes
- Imagem miniatura de cada complemento
- Preço em destaque
- Status de disponibilidade

**Design:**
- Toggle switches modernos
- Cards com borda laranja quando ativos
- Contador de complementos selecionados
- Layout limpo e intuitivo

---

## 🔧 Implementação Técnica

### Arquivos Criados

```
meu-fome-ninja/
├── src/
│   ├── pages/
│   │   └── Complements.jsx          # Telas 1 e 2
│   ├── components/
│   │   └── MenuItemComplements.jsx  # Tela 3
│   └── services/
│       └── complementsService.js    # API Service
└── criar_tabelas_complementos.sql   # Schema do banco
```

### Componentes React

#### Complements.jsx
```jsx
// Gerencia as duas primeiras telas
- ComplementCard: Card individual de complemento
- GroupCard: Card de grupo
- Tabs: Alterna entre "Complementos" e "Grupos"
- Modais: Criar/Editar complementos e grupos
```

#### MenuItemComplements.jsx
```jsx
// Tela de associação a itens
- Toggle switches para ativar grupos
- Modal de seleção de complementos
- Integração com item do cardápio
```

### Service Layer (complementsService.js)

**Complementos:**
- `getComplements(restauranteId)` - Listar todos
- `createComplement(restauranteId, data)` - Criar novo
- `updateComplement(id, data)` - Atualizar
- `deleteComplement(id)` - Deletar
- `toggleComplementAvailability(id)` - Ativar/Desativar

**Grupos:**
- `getGroups(restauranteId)` - Listar todos
- `createGroup(restauranteId, data)` - Criar novo
- `updateGroup(id, data)` - Atualizar
- `deleteGroup(id)` - Deletar

**Associações:**
- `associateComplementsToGroup(groupId, complementIds)` - Vincular complementos ao grupo
- `getGroupComplements(groupId)` - Buscar complementos do grupo
- `associateGroupsToMenuItem(menuItemId, groupIds)` - Vincular grupos ao item
- `associateComplementsToMenuItem(menuItemId, groupId, complementIds)` - Vincular complementos específicos
- `getMenuItemComplements(menuItemId)` - Buscar complementos do item

**Pedidos:**
- `addComplementsToOrderItem(itemPedidoId, complements)` - Adicionar ao pedido
- `getOrderItemComplements(itemPedidoId)` - Buscar complementos do pedido

---

## 🗄️ Banco de Dados

### Instalação

```sql
-- Execute o arquivo SQL no Supabase
psql -h [HOST] -U [USER] -d [DATABASE] -f criar_tabelas_complementos.sql
```

Ou copie e cole o conteúdo no SQL Editor do Supabase.

### Estrutura das Tabelas

#### complementos
```sql
- id (UUID, PK)
- restaurante_id (UUID, FK)
- nome (VARCHAR)
- preco (DECIMAL)
- imagem (TEXT)
- disponivel (BOOLEAN)
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

#### grupos_complementos
```sql
- id (UUID, PK)
- restaurante_id (UUID, FK)
- nome (VARCHAR)
- descricao (TEXT)
- tipo_selecao (VARCHAR: 'single' | 'multiple')
- obrigatorio (BOOLEAN)
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

### Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado:
- ✅ Restaurantes só veem seus próprios dados
- ✅ Políticas de SELECT, INSERT, UPDATE, DELETE
- ✅ Baseado em `auth.uid()` do Supabase

---

## 🎨 Guia de Estilo

### Cores

```css
/* Fundo principal */
background: #0d0d0d

/* Cards */
background: #1a1a1a
border: #2a2a2a

/* Laranja neon (destaque) */
primary: #ff6f00
hover: #ff8c00

/* Status */
success: hsl(142, 76%, 36%)  /* Verde */
error: hsl(0, 84%, 60%)      /* Vermelho */

/* Texto */
white: #ffffff
gray-300: #d1d5db
gray-400: #9ca3af
```

### Componentes

**Botão Primário:**
```jsx
className="bg-[#ff6f00] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#ff8c00] transition-colors shadow-lg"
```

**Card:**
```jsx
className="ninja-card p-4"
// ninja-card já aplica: bg-[#1a1a1a] rounded-lg shadow-lg
```

**Badge de Status:**
```jsx
// Disponível
className="text-xs px-2 py-1 rounded-full bg-[hsla(142,76%,36%,0.2)] text-[hsl(142,76%,36%)]"

// Indisponível
className="text-xs px-2 py-1 rounded-full bg-[hsla(0,84%,60%,0.2)] text-[hsl(0,84%,60%)]"
```

**Toggle Switch:**
```jsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" className="sr-only peer" />
  <div className="w-11 h-6 bg-[#2a2a2a] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff6f00]"></div>
</label>
```

---

## 🚀 Como Usar

### 1. Instalar Banco de Dados

```bash
# No Supabase SQL Editor, execute:
meu-fome-ninja/criar_tabelas_complementos.sql
```

### 2. Adicionar Rota no App

```jsx
// Em App.jsx ou router
import Complements from './pages/Complements';

<Route path="/complementos" element={<Complements />} />
```

### 3. Adicionar Link no Menu

```jsx
// Em Sidebar.jsx
<Link to="/complementos">
  🍔 Complementos
</Link>
```

### 4. Integrar com Item do Cardápio

```jsx
// Em Menu.jsx, no modal de edição
import MenuItemComplements from '../components/MenuItemComplements';

// Adicionar aba ou seção
<MenuItemComplements 
  menuItem={currentItem}
  groups={groups}
  complements={complements}
  onSave={handleSaveComplements}
/>
```

---

## 📱 Fluxo do Cliente (App)

### Ao Selecionar Item do Cardápio

1. Cliente vê item (ex: Hambúrguer)
2. Sistema carrega grupos disponíveis
3. Para cada grupo:
   - Mostra nome e descrição
   - Lista complementos disponíveis
   - Aplica regra (único/múltiplo)
   - Valida obrigatoriedade
4. Cliente seleciona complementos
5. Preço total é calculado automaticamente
6. Complementos são salvos no pedido

### Exemplo de Interface Cliente

```jsx
// Grupo: Molhos (Seleção Única, Opcional)
○ Molho Barbecue (+R$ 2,00)
○ Molho Ranch (+R$ 2,00)
○ Molho Picante (+R$ 2,00)

// Grupo: Adicionais (Múltipla Seleção, Opcional)
☑ Cheddar Extra (+R$ 3,00)
☑ Bacon (+R$ 4,50)
☐ Ovo (+R$ 2,50)

// Grupo: Bebida (Seleção Única, Obrigatório)
● Coca-Cola 350ml (+R$ 5,00)
○ Guaraná 350ml (+R$ 5,00)
○ Suco Natural (+R$ 7,00)
```

---

## 🧪 Testes

### Cenários de Teste

1. **Criar Complemento**
   - ✅ Nome obrigatório
   - ✅ Preço válido
   - ✅ Imagem opcional
   - ✅ Status padrão: disponível

2. **Criar Grupo**
   - ✅ Nome obrigatório
   - ✅ Tipo de seleção válido
   - ✅ Obrigatoriedade opcional

3. **Associar Complementos ao Grupo**
   - ✅ Múltiplos complementos
   - ✅ Remover associações antigas
   - ✅ Salvar novas associações

4. **Associar Grupos ao Item**
   - ✅ Ativar/desativar grupos
   - ✅ Selecionar complementos específicos
   - ✅ Validar obrigatoriedade

5. **Pedido com Complementos**
   - ✅ Calcular preço total
   - ✅ Salvar complementos selecionados
   - ✅ Exibir na comanda

---

## 🔄 Próximas Melhorias

### Funcionalidades Futuras

- [ ] **Limites de Quantidade:** Min/max de complementos por grupo
- [ ] **Preços Dinâmicos:** Preço diferente por item
- [ ] **Combos:** Complementos inclusos sem custo
- [ ] **Categorias de Complementos:** Organizar melhor
- [ ] **Imagens Obrigatórias:** Upload direto no sistema
- [ ] **Ordenação:** Drag & drop para ordem de exibição
- [ ] **Duplicar Grupo:** Copiar configuração
- [ ] **Histórico:** Complementos mais vendidos
- [ ] **Promoções:** Desconto em complementos
- [ ] **Dependências:** Complemento X só com item Y

### Melhorias de UX

- [ ] **Preview:** Ver como cliente verá
- [ ] **Validação em Tempo Real:** Feedback imediato
- [ ] **Atalhos de Teclado:** Agilizar cadastro
- [ ] **Importação em Massa:** Excel/CSV
- [ ] **Templates:** Grupos pré-configurados
- [ ] **Busca Avançada:** Filtros múltiplos
- [ ] **Modo Compacto:** Visualização em lista

---

## 📞 Suporte

### Problemas Comuns

**Complementos não aparecem no app:**
- Verificar se grupo está ativo no item
- Verificar se complementos estão disponíveis
- Verificar RLS no Supabase

**Erro ao salvar:**
- Verificar conexão com Supabase
- Verificar permissões do usuário
- Ver console do navegador

**Preço não calcula:**
- Verificar campo `preco` no banco
- Verificar lógica de cálculo no frontend
- Ver logs do serviço

---

## 📄 Licença

Este módulo faz parte do sistema FomeNinja.
Desenvolvido com ❤️ para facilitar a gestão de restaurantes.

---

**Versão:** 1.0.0  
**Data:** 2025-01-17  
**Autor:** Equipe FomeNinja
