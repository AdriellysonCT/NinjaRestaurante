# ✅ Checklist de Implementação - Módulo de Complementos

## 📋 Guia Passo a Passo

Use este checklist para implementar o módulo de complementos no FomeNinja.

---

## 🗄️ FASE 1: Banco de Dados

### Criar Tabelas

- [ ] Abrir Supabase SQL Editor
- [ ] Copiar conteúdo de `criar_tabelas_complementos.sql`
- [ ] Executar o script
- [ ] Verificar se 6 tabelas foram criadas:
  - [ ] `complementos`
  - [ ] `grupos_complementos`
  - [ ] `grupos_complementos_itens`
  - [ ] `itens_complementos`
  - [ ] `pedidos_complementos`
- [ ] Verificar se índices foram criados
- [ ] Verificar se RLS está habilitado

### Testar Conexão

```sql
-- Execute para testar
SELECT * FROM complementos LIMIT 1;
SELECT * FROM grupos_complementos LIMIT 1;
```

- [ ] Queries executam sem erro
- [ ] RLS está funcionando (só vê dados do seu restaurante)

---

## 📦 FASE 2: Service Layer

### Instalar Service

- [ ] Arquivo `complementsService.js` está em `src/services/`
- [ ] Importação do Supabase está correta
- [ ] Todas as funções estão exportadas

### Testar Service

```javascript
// No console do navegador
import complementsService from './services/complementsService';

// Testar listagem
const result = await complementsService.getComplements('seu-restaurante-id');
console.log(result);
```

- [ ] Service importa sem erros
- [ ] Funções retornam `{ success: true/false, data/error }`

---

## 🎨 FASE 3: Interface - Tela 1 (Lista de Complementos)

### Criar Página

- [ ] Arquivo `Complements.jsx` está em `src/pages/`
- [ ] Importações estão corretas (React, framer-motion, Modal, etc)
- [ ] Componente exporta corretamente

### Adicionar Rota

```javascript
// Em App.jsx ou router
import Complements from './pages/Complements';

<Route path="/complementos" element={<Complements />} />
```

- [ ] Rota adicionada
- [ ] Página abre em `/complementos`

### Adicionar Link no Menu

```javascript
// Em Sidebar.jsx
<Link to="/complementos" className="sidebar-link">
  🍔 Complementos
</Link>
```

- [ ] Link aparece no menu lateral
- [ ] Clique no link abre a página

### Testar Funcionalidades

- [ ] Estatísticas aparecem corretamente
- [ ] Botão "Criar Complemento" funciona
- [ ] Modal de criação abre
- [ ] Campos do formulário funcionam
- [ ] Salvar cria complemento no banco
- [ ] Card do complemento aparece na lista
- [ ] Botão "Editar" abre modal com dados
- [ ] Botão "Ativar/Desativar" alterna status
- [ ] Busca filtra complementos
- [ ] Filtro "Apenas disponíveis" funciona

---

## 📦 FASE 4: Interface - Tela 2 (Grupos)

### Testar Aba Grupos

- [ ] Aba "Grupos" aparece
- [ ] Clique alterna entre abas
- [ ] Botão "Criar Grupo" funciona
- [ ] Modal de criação abre

### Testar Criação de Grupo

- [ ] Campo "Nome" funciona
- [ ] Campo "Descrição" funciona
- [ ] Radio buttons "Único/Múltiplo" funcionam
- [ ] Checkbox "Obrigatório" funciona
- [ ] Salvar cria grupo no banco
- [ ] Card do grupo aparece na lista

### Testar Gerenciamento de Complementos

- [ ] Botão "Gerenciar Complementos" abre modal
- [ ] Lista de complementos aparece
- [ ] Checkboxes funcionam
- [ ] Salvar associa complementos ao grupo
- [ ] Contador de complementos atualiza

### Testar Edição de Grupo

- [ ] Botão "Editar Grupo" abre modal
- [ ] Dados do grupo carregam
- [ ] Alterações salvam corretamente

---

## 🔗 FASE 5: Interface - Tela 3 (Associação a Itens)

### Criar Componente

- [ ] Arquivo `MenuItemComplements.jsx` está em `src/components/`
- [ ] Importações estão corretas
- [ ] Componente exporta corretamente

### Integrar com Menu

```javascript
// Em Menu.jsx, no modal de edição
import MenuItemComplements from '../components/MenuItemComplements';

// Adicionar dentro do modal
<MenuItemComplements 
  menuItem={currentItem}
  groups={groups}
  complements={complements}
  onSave={handleSaveComplements}
/>
```

- [ ] Componente aparece no modal de edição
- [ ] Card do item aparece no topo
- [ ] Lista de grupos carrega

### Testar Funcionalidades

- [ ] Toggle ativa/desativa grupo
- [ ] Botão "Gerenciar" aparece quando ativo
- [ ] Modal de seleção abre
- [ ] Lista de complementos do grupo aparece
- [ ] Checkboxes funcionam
- [ ] Contador atualiza
- [ ] Salvar persiste no banco
- [ ] Botão "Salvar Alterações" funciona

---

## 🧪 FASE 6: Testes Funcionais

### Fluxo Completo 1: Criar Complemento

- [ ] Abrir `/complementos`
- [ ] Clicar "Criar Complemento"
- [ ] Preencher: Nome = "Cheddar Extra", Preço = 3.00
- [ ] Salvar
- [ ] Complemento aparece na lista
- [ ] Verificar no banco: `SELECT * FROM complementos`

### Fluxo Completo 2: Criar Grupo

- [ ] Ir para aba "Grupos"
- [ ] Clicar "Criar Grupo"
- [ ] Preencher: Nome = "Adicionais", Tipo = Múltiplo
- [ ] Salvar
- [ ] Grupo aparece na lista
- [ ] Verificar no banco: `SELECT * FROM grupos_complementos`

### Fluxo Completo 3: Associar Complementos ao Grupo

- [ ] Clicar "Gerenciar Complementos" no grupo
- [ ] Selecionar "Cheddar Extra"
- [ ] Salvar
- [ ] Contador mostra "1 complemento"
- [ ] Verificar no banco: `SELECT * FROM grupos_complementos_itens`

### Fluxo Completo 4: Associar Grupo ao Item

- [ ] Ir para página de Menu
- [ ] Editar um item (ex: Hambúrguer)
- [ ] Ativar grupo "Adicionais"
- [ ] Clicar "Gerenciar"
- [ ] Selecionar "Cheddar Extra"
- [ ] Salvar
- [ ] Verificar no banco: `SELECT * FROM itens_complementos`

### Fluxo Completo 5: Pedido com Complementos

- [ ] Cliente abre item no app
- [ ] Grupos aparecem
- [ ] Complementos aparecem
- [ ] Selecionar complementos
- [ ] Preço total calcula corretamente
- [ ] Adicionar ao carrinho
- [ ] Finalizar pedido
- [ ] Verificar no banco: `SELECT * FROM pedidos_complementos`

---

## 🎨 FASE 7: Validações e Regras

### Validações de Formulário

- [ ] Nome do complemento é obrigatório
- [ ] Preço não pode ser negativo
- [ ] Nome do grupo é obrigatório
- [ ] Tipo de seleção é obrigatório

### Regras de Negócio

- [ ] Complemento indisponível não aparece no app
- [ ] Grupo obrigatório exige seleção
- [ ] Tipo "único" permite apenas 1 seleção
- [ ] Tipo "múltiplo" permite várias seleções
- [ ] Preço total calcula corretamente
- [ ] Não pode deletar complemento usado em pedido

### Mensagens de Erro

- [ ] Erro de conexão mostra mensagem amigável
- [ ] Erro de validação mostra campo específico
- [ ] Sucesso mostra confirmação
- [ ] Loading aparece durante operações

---

## 📱 FASE 8: Responsividade

### Desktop (1920px+)

- [ ] Grid de complementos: 5 colunas
- [ ] Cards bem espaçados
- [ ] Modais centralizados
- [ ] Texto legível

### Tablet (768px - 1919px)

- [ ] Grid de complementos: 3-4 colunas
- [ ] Layout se adapta
- [ ] Botões acessíveis

### Mobile (< 768px)

- [ ] Grid de complementos: 1-2 colunas
- [ ] Cards empilhados
- [ ] Botões grandes (touch-friendly)
- [ ] Modais ocupam tela toda

---

## 🔐 FASE 9: Segurança

### Row Level Security (RLS)

- [ ] Restaurante A não vê dados do Restaurante B
- [ ] Políticas de SELECT funcionam
- [ ] Políticas de INSERT funcionam
- [ ] Políticas de UPDATE funcionam
- [ ] Políticas de DELETE funcionam

### Validações Backend

- [ ] Supabase valida `restaurante_id`
- [ ] Foreign keys impedem dados órfãos
- [ ] Triggers atualizam timestamps

---

## 🚀 FASE 10: Performance

### Otimizações

- [ ] Índices criados nas tabelas
- [ ] Queries usam índices
- [ ] Lazy loading de imagens
- [ ] Debounce na busca
- [ ] Cache de dados quando possível

### Testes de Carga

- [ ] 100+ complementos carregam rápido
- [ ] 50+ grupos carregam rápido
- [ ] Busca é instantânea
- [ ] Modais abrem sem delay

---

## 📚 FASE 11: Documentação

### Documentos Criados

- [ ] `DOCUMENTACAO_MODULO_COMPLEMENTOS.md` - Documentação técnica
- [ ] `QUICK_START_COMPLEMENTOS.md` - Guia rápido
- [ ] `GUIA_VISUAL_COMPLEMENTOS.md` - Explicação visual
- [ ] `DIAGRAMA_TABELAS_COMPLEMENTOS.md` - Diagrama ERD
- [ ] `EXEMPLOS_API_COMPLEMENTOS.md` - Exemplos de código
- [ ] `CHECKLIST_IMPLEMENTACAO_COMPLEMENTOS.md` - Este arquivo

### Comentários no Código

- [ ] Funções principais comentadas
- [ ] Componentes documentados
- [ ] Queries SQL explicadas

---

## 🎓 FASE 12: Treinamento

### Para Desenvolvedores

- [ ] Ler documentação técnica
- [ ] Entender estrutura do banco
- [ ] Conhecer API do service
- [ ] Testar exemplos de código

### Para Usuários (Restaurante)

- [ ] Tutorial de criação de complementos
- [ ] Tutorial de criação de grupos
- [ ] Tutorial de associação a itens
- [ ] Vídeo demonstrativo (opcional)

---

## 🐛 FASE 13: Testes de Bugs Comuns

### Bugs Conhecidos para Verificar

- [ ] Complemento não aparece após criar → Verificar refresh
- [ ] Grupo não salva → Verificar campos obrigatórios
- [ ] Associação não funciona → Verificar IDs corretos
- [ ] Preço não calcula → Verificar tipo de dados
- [ ] Modal não fecha → Verificar estado do React
- [ ] Imagem não carrega → Verificar URL válida

### Testes de Edge Cases

- [ ] Criar complemento sem imagem
- [ ] Criar grupo sem descrição
- [ ] Associar 0 complementos a grupo
- [ ] Desativar complemento usado em pedido
- [ ] Deletar grupo com complementos
- [ ] Item sem grupos associados

---

## 📊 FASE 14: Métricas e Analytics

### Dados para Monitorar

- [ ] Quantidade de complementos criados
- [ ] Complementos mais vendidos
- [ ] Grupos mais usados
- [ ] Ticket médio com complementos
- [ ] Taxa de conversão (itens com vs sem complementos)

### Queries de Relatório

```sql
-- Complementos mais vendidos
SELECT c.nome, COUNT(*) as vendas
FROM pedidos_complementos pc
JOIN complementos c ON pc.complemento_id = c.id
GROUP BY c.id, c.nome
ORDER BY vendas DESC
LIMIT 10;

-- Receita por complementos
SELECT SUM(preco_unitario * quantidade) as receita_complementos
FROM pedidos_complementos
WHERE criado_em >= NOW() - INTERVAL '30 days';
```

- [ ] Queries de relatório funcionam
- [ ] Dashboard mostra métricas

---

## ✨ FASE 15: Melhorias Futuras

### Funcionalidades Extras (Opcional)

- [ ] Upload de imagens direto no sistema
- [ ] Drag & drop para ordenar complementos
- [ ] Duplicar grupo
- [ ] Importar complementos via Excel
- [ ] Templates de grupos pré-configurados
- [ ] Limites de quantidade (min/max)
- [ ] Preços dinâmicos por item
- [ ] Combos (complementos inclusos)
- [ ] Promoções em complementos
- [ ] Histórico de alterações

---

## 🎉 CONCLUSÃO

### Checklist Final

- [ ] ✅ Banco de dados criado e funcionando
- [ ] ✅ Service layer implementado
- [ ] ✅ Tela 1 (Lista) funcionando
- [ ] ✅ Tela 2 (Grupos) funcionando
- [ ] ✅ Tela 3 (Associação) funcionando
- [ ] ✅ Testes funcionais passando
- [ ] ✅ Validações implementadas
- [ ] ✅ Responsivo em todos os dispositivos
- [ ] ✅ Segurança (RLS) configurada
- [ ] ✅ Performance otimizada
- [ ] ✅ Documentação completa
- [ ] ✅ Bugs corrigidos

### Status do Projeto

```
┌─────────────────────────────────────────┐
│  MÓDULO DE COMPLEMENTOS                 │
│                                         │
│  Status: [ ] Em Desenvolvimento         │
│          [ ] Em Testes                  │
│          [ ] Pronto para Produção       │
│          [ ] Em Produção                │
│                                         │
│  Progresso: ___% completo               │
└─────────────────────────────────────────┘
```

---

## 📞 Suporte

### Em Caso de Problemas

1. Verificar console do navegador (F12)
2. Verificar logs do Supabase
3. Revisar documentação
4. Testar queries SQL manualmente
5. Verificar permissões RLS

### Recursos Úteis

- 📖 Documentação Supabase: https://supabase.com/docs
- 📖 Documentação React: https://react.dev
- 📖 Documentação Framer Motion: https://www.framer.com/motion/

---

**Boa implementação! 🚀**

*Marque cada item conforme completar. Ao final, você terá um módulo de complementos completo e funcional!*
