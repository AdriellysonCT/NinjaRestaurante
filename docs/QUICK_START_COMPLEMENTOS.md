# 🚀 Quick Start - Módulo de Complementos

## ⚡ Instalação Rápida (5 minutos)

### 1️⃣ Criar Tabelas no Banco (1 min)

Abra o **Supabase SQL Editor** e execute:

```sql
-- Copie e cole todo o conteúdo de:
meu-fome-ninja/criar_tabelas_complementos.sql
```

✅ Isso criará 6 tabelas + índices + RLS policies

---

### 2️⃣ Adicionar Rota no App (1 min)

**Arquivo:** `src/App.jsx`

```jsx
import Complements from './pages/Complements';

// Dentro das rotas:
<Route path="/complementos" element={<Complements />} />
```

---

### 3️⃣ Adicionar Link no Menu (1 min)

**Arquivo:** `src/components/Sidebar.jsx`

```jsx
<Link 
  to="/complementos" 
  className="sidebar-link"
>
  🍔 Complementos
</Link>
```

---

### 4️⃣ Testar (2 min)

1. Acesse `/complementos` no navegador
2. Clique em "Criar Complemento"
3. Preencha: Nome, Preço
4. Salve
5. Vá para aba "Grupos"
6. Crie um grupo
7. Clique em "Gerenciar Complementos"
8. Associe complementos ao grupo

✅ **Pronto!** Sistema funcionando.

---

## 📋 Estrutura Criada

```
✅ Tela 1: Lista de Complementos
   - Cards compactos
   - Estatísticas
   - Busca e filtros
   - Criar/Editar/Ativar

✅ Tela 2: Grupos de Complementos
   - Cards horizontais
   - Criar/Editar grupos
   - Gerenciar complementos do grupo
   - Tipos: Único/Múltiplo
   - Obrigatório: Sim/Não

✅ Tela 3: Associação a Itens
   - Toggle para ativar grupos
   - Selecionar complementos específicos
   - Preview do item
   - Salvar alterações

✅ Service Layer
   - complementsService.js
   - Todas as operações CRUD
   - Integração com Supabase

✅ Banco de Dados
   - 6 tabelas relacionadas
   - RLS habilitado
   - Índices otimizados
```

---

## 🎨 Design System

### Cores Principais

```css
Fundo: #0d0d0d
Cards: #1a1a1a
Laranja: #ff6f00
Verde: hsl(142, 76%, 36%)
Vermelho: hsl(0, 84%, 60%)
```

### Componentes Prontos

- ✅ Cards responsivos
- ✅ Modais estilizados
- ✅ Toggle switches
- ✅ Badges de status
- ✅ Botões primários/secundários
- ✅ Inputs dark mode

---

## 🔗 Integração com Cardápio

Para adicionar complementos a um item do cardápio:

**Arquivo:** `src/pages/Menu.jsx`

```jsx
import MenuItemComplements from '../components/MenuItemComplements';

// No modal de edição do item, adicione:
<MenuItemComplements 
  menuItem={currentItem}
  groups={groups}
  complements={complements}
  onSave={(updatedItem) => {
    updateMenuItem(updatedItem.id, updatedItem);
    setIsModalOpen(false);
  }}
/>
```

---

## 📱 Como o Cliente Verá

### Exemplo: Hambúrguer

```
🍔 Hambúrguer Artesanal - R$ 25,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧀 Adicionais (Opcional - Escolha vários)
☑ Cheddar Extra      +R$ 3,00
☑ Bacon              +R$ 4,50
☐ Ovo                +R$ 2,50

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥫 Molhos (Opcional - Escolha 1)
○ Barbecue           +R$ 2,00
● Ranch              +R$ 2,00
○ Picante            +R$ 2,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥤 Bebida (Obrigatório - Escolha 1)
● Coca-Cola 350ml    +R$ 5,00
○ Guaraná 350ml      +R$ 5,00
○ Suco Natural       +R$ 7,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: R$ 42,00
```

---

## 🧪 Teste Rápido

### Criar Dados de Exemplo

```sql
-- Execute no Supabase para criar dados de teste

-- Complementos
INSERT INTO complementos (restaurante_id, nome, preco, disponivel) VALUES
((SELECT id FROM restaurantes LIMIT 1), 'Cheddar Extra', 3.00, true),
((SELECT id FROM restaurantes LIMIT 1), 'Bacon', 4.50, true),
((SELECT id FROM restaurantes LIMIT 1), 'Molho Barbecue', 2.00, true),
((SELECT id FROM restaurantes LIMIT 1), 'Molho Ranch', 2.00, true),
((SELECT id FROM restaurantes LIMIT 1), 'Coca-Cola 350ml', 5.00, true);

-- Grupos
INSERT INTO grupos_complementos (restaurante_id, nome, descricao, tipo_selecao, obrigatorio) VALUES
((SELECT id FROM restaurantes LIMIT 1), 'Adicionais', 'Ingredientes extras', 'multiple', false),
((SELECT id FROM restaurantes LIMIT 1), 'Molhos', 'Escolha seu molho', 'single', false),
((SELECT id FROM restaurantes LIMIT 1), 'Bebidas', 'Bebida do combo', 'single', true);
```

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- `DOCUMENTACAO_MODULO_COMPLEMENTOS.md` - Documentação técnica completa
- `src/services/complementsService.js` - API reference
- `criar_tabelas_complementos.sql` - Schema do banco

---

## 🆘 Problemas?

### Erro: "Tabela não existe"
→ Execute o SQL no Supabase

### Erro: "Permission denied"
→ Verifique RLS policies no Supabase

### Complementos não aparecem
→ Verifique se `disponivel = true`

### Não salva no banco
→ Verifique `restaurante_id` correto

---

## ✨ Pronto para Usar!

Agora você tem um sistema completo de complementos:
- ✅ Interface moderna e intuitiva
- ✅ Banco de dados estruturado
- ✅ Segurança com RLS
- ✅ Totalmente responsivo
- ✅ Fácil de integrar

**Bom trabalho! 🚀**
