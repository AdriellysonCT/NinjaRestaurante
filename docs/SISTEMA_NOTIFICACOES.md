# Sistema de Notificações - Fome Ninja

## ✨ Resumo Executivo

**Nova funcionalidade:** Sistema completo de notificações no sino da barra superior do painel.

**Principais Recursos:**
- 🔔 Dropdown com lista de notificações ao clicar no sino
- 🎯 Badge com contador de notificações não lidas
- ✨ Animação de bounce no sino quando há notificações
- 🎨 Categorização visual por tipo de notificação
- ⏱️ Timestamps com formato "tempo atrás"
- 🔄 Atualização automática a cada 30 segundos

---

## 📋 Tipos de Notificações

### 1. **Novo Pedido** 🆕
- **Ícone:** Sino laranja 🔔
- **Quando aparece:** Pedidos com status `disponivel` criados nos últimos 5 minutos
- **Mensagem:** `"Pedido #123 - Nome do Cliente"`
- **Título:** "Novo Pedido!"

### 2. **Pedido Aceito** ✅
- **Ícone:** Check verde ✓
- **Quando aparece:** Pedidos aceitos (com `started_at`) nos últimos 5 minutos
- **Mensagem:** `"Pedido #123 em preparo"`
- **Título:** "Pedido Aceito"

### 3. **Pedido Pronto** 🚚
- **Ícone:** Caminhão azul 🚚
- **Quando aparece:** Pedidos com status `pronto_para_entrega`
- **Mensagem:** `"Pedido #123 aguardando entregador"`
- **Título:** "Pedido Pronto!"

---

## 🎨 Interface do Usuário

### Sino (Ícone de Notificação)

#### Estado Normal (Sem notificações)
```
🔔 Sino cinza, estático
```

#### Estado com Notificações
```
🔔 Sino com animação de bounce
📍 Badge vermelho com número (exemplo: "3")
⭕ Ponto vermelho indicador
```

### Dropdown de Notificações

```
┌─────────────────────────────────────┐
│ Notificações (3)  [Marcar lidas] [X]│
├─────────────────────────────────────┤
│ 🔔 Novo Pedido!            •        │
│    Pedido #123 - João Silva         │
│    2m atrás                          │
├─────────────────────────────────────┤
│ ✅ Pedido Aceito                    │
│    Pedido #122 em preparo           │
│    5m atrás                          │
├─────────────────────────────────────┤
│ 🚚 Pedido Pronto!                   │
│    Pedido #121 aguardando entregador│
│    10m atrás                         │
├─────────────────────────────────────┤
│       Ver Todos os Pedidos          │
└─────────────────────────────────────┘
```

---

## 🔧 Funcionalidades Detalhadas

### 1. Contador de Não Lidas
- **Badge numérico** no canto superior direito do sino
- Mostra número de notificações não lidas
- Limite de exibição: "9+" para 10 ou mais
- **Cor:** Vermelho (destructive)

### 2. Animação do Sino
```css
/* Quando há notificações não lidas */
animate-bounce
```
- O sino "pula" continuamente
- Chama atenção visual
- Para quando todas são marcadas como lidas

### 3. Indicadores Visuais
- **Ponto vermelho:** Indicador de notificações ativas
- **Ponto azul pequeno:** Notificação individual não lida
- **Fundo azul claro:** Destaque de notificações não lidas na lista

### 4. Interações do Usuário

#### Clicar no Sino
- Abre/fecha o dropdown
- Não marca notificações como lidas automaticamente

#### Clicar em uma Notificação
- Marca aquela notificação como lida
- Remove o ponto azul
- Decrementa o contador

#### Botão "Marcar lidas"
- Marca todas as notificações como lidas
- Remove animação do sino
- Zera o contador

#### Botão "Limpar (X)"
- Remove todas as notificações da lista
- Zera o contador
- Fecha o dropdown

#### Botão "Ver Todos os Pedidos"
- Fecha o dropdown
- Navega para `/dashboard`

### 5. Click Outside
- Clicar fora do dropdown fecha automaticamente
- Mantém estado das notificações

---

## ⚙️ Implementação Técnica

### Estados do Componente

```javascript
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
```

### Estrutura de uma Notificação

```javascript
{
  id: 'new-abc123',           // Identificador único
  type: 'new_order',          // Tipo: new_order, order_accepted, order_ready
  title: 'Novo Pedido!',      // Título da notificação
  message: 'Pedido #123...',  // Mensagem detalhada
  timestamp: '2025-01-20...',  // ISO timestamp
  icon: 'bell',               // Tipo de ícone
  read: false                 // Status de leitura
}
```

### Geração de Notificações

**Fonte de Dados:** `useAppContext()` → `orders[]`

**Lógica:**
```javascript
useEffect(() => {
  const generateNotifications = () => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Buscar pedidos recentes
    // Filtrar por tempo e status
    // Gerar objetos de notificação
    // Ordenar por mais recente
    // Limitar a 20 notificações
  };
  
  generateNotifications();
  const interval = setInterval(generateNotifications, 30000);
  return () => clearInterval(interval);
}, [orders]);
```

**Atualização:** A cada 30 segundos automaticamente

---

## 📊 Regras de Negócio

### Janela de Tempo
- **Novos Pedidos:** Últimos 5 minutos (status = disponivel)
- **Pedidos Aceitos:** Últimos 5 minutos (status = aceito)
- **Pedidos Prontos:** Qualquer hora (status = pronto_para_entrega)

### Limite de Notificações
- **Máximo:** 20 notificações na lista
- **Ordenação:** Mais recentes primeiro
- **Badge:** Mostra "9+" para 10 ou mais não lidas

### Formato de Tempo

| Diferença | Exibição |
|-----------|----------|
| < 1 minuto | "Agora" |
| < 60 minutos | "Xm atrás" |
| < 24 horas | "Xh atrás" |
| ≥ 24 horas | Data (dd/mm/aaaa) |

---

## 🎯 Fluxo do Usuário

### Cenário 1: Novo Pedido Chega
```
1. Pedido criado no sistema
2. ⏱️ 0-30s: Notificação aparece no dropdown
3. 🔔 Sino começa a animar (bounce)
4. 📍 Badge mostra "1"
5. ⭕ Ponto vermelho aparece
6. 👤 Usuário clica no sino
7. 📋 Vê "Novo Pedido! - Pedido #123 - João Silva"
8. 🖱️ Clica na notificação
9. ✅ Marca como lida
10. 🔕 Animação para (se não houver mais)
```

### Cenário 2: Múltiplas Notificações
```
1. 3 pedidos novos chegam
2. Badge mostra "3"
3. Sino anima
4. Usuário clica "Marcar lidas"
5. Todas ficam lidas
6. Contador zera
7. Animação para
8. Notificações permanecem na lista (mas sem destaque)
```

### Cenário 3: Limpar Tudo
```
1. Usuário tem 5 notificações
2. Clica no X (Limpar todas)
3. Lista fica vazia
4. Mostra "Nenhuma notificação"
5. Badge desaparece
```

---

## 🎨 Estilos e Classes CSS

### Animação do Sino
```jsx
className={`... ${unreadCount > 0 ? 'animate-bounce' : ''}`}
```

### Notificação Não Lida
```jsx
className={`... ${!notification.read ? 'bg-blue-500/5' : ''}`}
```

### Badge de Contador
```jsx
<span className="absolute -top-2 -right-2 min-w-[14px] h-[14px] 
  flex items-center justify-center rounded-full bg-destructive 
  text-[8px] font-bold text-white px-1">
  {unreadCount > 9 ? '9+' : unreadCount}
</span>
```

---

## 🚀 Melhorias Futuras (Sugestões)

### Curto Prazo
- [ ] Adicionar notificações para pedidos cancelados
- [ ] Som de notificação (opcional)
- [ ] Filtro por tipo de notificação
- [ ] Persistência de notificações no localStorage

### Médio Prazo
- [ ] Link direto para o pedido específico
- [ ] Notificações de entregador (status de entrega)
- [ ] Notificações de pagamento (aprovado/recusado)
- [ ] Preview de itens do pedido

### Longo Prazo
- [ ] Sistema de preferências de notificação
- [ ] Notificações push (PWA)
- [ ] Central de notificações (página dedicada)
- [ ] Histórico de notificações antigas

---

## 📁 Arquivos Modificados

### `src/components/Header.jsx`
**Mudanças principais:**
- Importado `useAppContext`
- Adicionado estado de notificações
- Implementado lógica de geração
- Criado dropdown de notificações
- Adicionado animação no sino
- Implementado badge com contador

**Novos ícones adicionados:**
- `XIcon` (fechar)
- `CheckCircleIcon` (check)
- `TruckIcon` (caminhão)
- `AlertCircleIcon` (alerta)

---

## ✅ Testes Recomendados

### Teste 1: Notificação de Novo Pedido
1. ✅ Criar um novo pedido
2. ✅ Verificar sino animando
3. ✅ Verificar badge "1"
4. ✅ Clicar no sino
5. ✅ Ver notificação "Novo Pedido!"
6. ✅ Timestamp correto

### Teste 2: Marcar como Lida
1. ✅ Ter 1+ notificações
2. ✅ Clicar em uma notificação
3. ✅ Ponto azul desaparece
4. ✅ Contador decrementa
5. ✅ Fundo azul remove

### Teste 3: Marcar Todas como Lidas
1. ✅ Ter 3+ notificações não lidas
2. ✅ Clicar "Marcar lidas"
3. ✅ Todas perdem ponto azul
4. ✅ Contador zera
5. ✅ Animação para

### Teste 4: Limpar Todas
1. ✅ Ter várias notificações
2. ✅ Clicar no X
3. ✅ Lista fica vazia
4. ✅ Mostra mensagem vazia
5. ✅ Badge desaparece

### Teste 5: Múltiplos Tipos
1. ✅ Criar pedido (novo)
2. ✅ Aceitar pedido (aceito)
3. ✅ Marcar pronto (pronto)
4. ✅ Ver 3 notificações diferentes
5. ✅ Ícones corretos para cada tipo

### Teste 6: Atualização Automática
1. ✅ Abrir painel
2. ✅ Criar pedido em outra aba
3. ✅ Aguardar até 30s
4. ✅ Ver notificação aparecer automaticamente

### Teste 7: Janela de Tempo
1. ✅ Criar pedido
2. ✅ Ver notificação
3. ✅ Aguardar 6 minutos
4. ✅ Notificação de "novo" desaparece
5. ✅ (Pedido não está mais em "disponivel")

---

## 📝 Notas Importantes

### Performance
- Atualização a cada 30s é eficiente
- Limite de 20 notificações evita sobrecarga
- Filtragem por janela de tempo otimizada

### UX
- Animação chama atenção sem ser intrusiva
- Contador facilita percepção rápida
- Dropdown não interfere com workflow
- Click outside fecha naturalmente

### Manutenibilidade
- Código modular e bem comentado
- Fácil adicionar novos tipos de notificação
- Estrutura de dados clara
- Funções auxiliares reutilizáveis

---

## 🎉 Conclusão

Sistema de notificações completo e funcional implementado com sucesso!

**Principais Benefícios:**
- ✅ Melhor percepção de novos eventos
- ✅ Feedback visual claro
- ✅ Interação intuitiva
- ✅ Atualização automática
- ✅ Performance otimizada

**Como Usar:**
1. Observe o sino na barra superior
2. Quando animar, há notificações novas
3. Clique para ver a lista
4. Clique em cada notificação para marcar como lida
5. Use "Marcar lidas" para limpar todas de uma vez

🚀 **Pronto para uso em produção!**


