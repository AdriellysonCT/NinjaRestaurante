# Funcionalidade: Aceitação Automática de Pedidos

## ✨ Resumo Executivo

**Nova funcionalidade adicionada:** Botão de toggle para aceitar pedidos automaticamente.

**3 Estados do Botão:**
- ⚪ **OFF** (Cinza): Aceitação manual
- 🟠 **Processando**: Aceitando pedidos existentes 
- 🟢 **ON** (Verde): Aceitação automática ativa

**O que faz:**
1. ✅ Aceita automaticamente novos pedidos que chegam
2. ✅ Aceita todos os pedidos pendentes quando ativado
3. ✅ Mantém a preferência salva entre sessões

**Como usar:**
1. Clique no botão "Aceitar Auto: OFF"
2. Se houver pedidos pendentes, verá "Processando..." (laranja)
3. Botão fica verde "Aceitar Auto: ON"
4. Pronto! Pedidos serão aceitos automaticamente

---

## Resumo das Alterações

### 1. **Remoção de Botões Duplicados**
Removidos os seguintes botões da barra de filtros do Dashboard, pois essas funcionalidades já estão disponíveis em Configurações:
- ❌ Imprimir Lote
- ❌ Histórico
- ❌ Config. Impressão
- ❌ Exportar CSV

### 2. **Novo Botão: Aceitação Automática de Pedidos**

#### Descrição
Adicionado um botão de toggle na barra de filtros do Dashboard que permite ativar/desativar a aceitação automática de pedidos.

#### Funcionalidade
- **ON (Verde)**: Pedidos são aceitos automaticamente assim que chegam
  - Status: `disponivel` → `aceito`
  - Timestamp `started_at` é definido automaticamente
  - Não é necessário clicar manualmente em "Aceitar Missão"
  
- **OFF (Cinza)**: Modo manual - requer clique em "Aceitar Missão" para cada pedido

#### Visual do Botão
- **Desligado** ⚪:
  - Fundo cinza (`bg-gray-700`)
  - Borda cinza
  - Texto: "Aceitar Auto: OFF"
  - Ícone: ⭕ CheckCircleIcon padrão
  - Estado: Clicável

- **Processando** 🟠:
  - Fundo laranja (`bg-orange-600`)
  - Texto: "Processando..."
  - Ícone: 🔄 Spinner animado
  - Estado: Desabilitado (não clicável)
  - **Aparece apenas ao ativar quando há pedidos pendentes**

- **Ligado** 🟢: 
  - Fundo verde (`bg-green-600`)
  - Borda verde com anel de destaque (`ring-2 ring-green-400`)
  - Texto: "Aceitar Auto: ON"
  - Ícone: ✅ CheckCircleIcon em verde claro
  - Estado: Clicável (para desativar)

### 3. **Implementação Técnica**

#### Estado e Persistência
```javascript
const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(() => {
  try {
    return localStorage.getItem('fome-ninja-auto-accept') === 'true';
  } catch (_) {
    return false;
  }
});
```
- A preferência é salva no `localStorage` com a chave `fome-ninja-auto-accept`
- Persiste entre sessões do navegador

#### Toggle Function (Atualizado para processar pedidos existentes)
```javascript
const toggleAutoAccept = async () => {
  const newValue = !autoAcceptEnabled;
  setAutoAcceptEnabled(newValue);
  try {
    localStorage.setItem('fome-ninja-auto-accept', newValue ? 'true' : 'false');
  } catch (_) {}
  console.log('Aceitação automática:', newValue ? 'ATIVADA' : 'DESATIVADA');

  // Se ativou, aceitar pedidos pendentes automaticamente
  if (newValue) {
    console.log('🔄 Verificando pedidos pendentes para aceitar automaticamente...');
    const pedidosPendentes = orders.filter(order => order.status === 'disponivel' && !order.started_at);
    
    if (pedidosPendentes.length > 0) {
      setProcessingAutoAccept(true); // Mostra estado de processamento
      console.log(`📋 Encontrados ${pedidosPendentes.length} pedidos pendentes para aceitar`);
      
      // Processar pedidos em lote com delay de 300ms entre cada
      for (let i = 0; i < pedidosPendentes.length; i++) {
        const pedido = pedidosPendentes[i];
        try {
          console.log(`⏳ Aceitando pedido ${i + 1}/${pedidosPendentes.length}: #${pedido.numero_pedido}...`);
          await handleStatusChange(pedido.id, 'aceito');
          console.log(`✅ Pedido #${pedido.numero_pedido} aceito com sucesso`);
          
          // Delay para não sobrecarregar o servidor
          if (i < pedidosPendentes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`❌ Erro ao aceitar pedido #${pedido.numero_pedido}:`, error);
        }
      }
      
      setProcessingAutoAccept(false); // Remove estado de processamento
      console.log('✅ Todos os pedidos pendentes foram processados!');
    } else {
      console.log('ℹ️ Não há pedidos pendentes para aceitar');
    }
  }
};
```

**Detalhes Importantes:**
- **Delay de 300ms**: Previne sobrecarga no servidor e no banco de dados
- **Processamento sequencial**: Aceita um pedido por vez para garantir consistência
- **Estado visual**: Botão laranja "Processando..." durante a operação
- **Logs detalhados**: Mostra progresso no console (1/3, 2/3, 3/3...)
- **Tratamento de erros**: Se um pedido falhar, continua processando os próximos

#### Integração com Realtime
```javascript
// No useEffect do realtime de pedidos
if (payload?.eventType === 'INSERT' && autoAcceptEnabled) {
  const newOrder = payload.new;
  if (newOrder.status === 'disponivel') {
    console.log('🤖 Aceitação automática ativada - aceitando pedido:', newOrder.numero_pedido);
    
    const { error: updateError } = await supabase
      .from("pedidos_padronizados")
      .update({ 
        status: 'aceito',
        started_at: new Date().toISOString()
      })
      .eq("id", newOrder.id);
  }
}
```

### 4. **Ícone Adicionado**

Adicionado o ícone `CoinIcon` que estava faltando:
```jsx
export const CoinIcon = (props) => (
  <svg {...props} ...>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);
```

## Comportamento Esperado

### Cenário 1: Aceitação Automática DESLIGADA (Padrão)
1. Novo pedido chega com status `disponivel`
2. Aparece na coluna "Novas Missões"
3. Som de notificação toca (se habilitado)
4. Usuário precisa clicar em "Aceitar Missão" manualmente
5. Pedido move para "Em Preparo"

### Cenário 2: Aceitação Automática LIGADA (Novos Pedidos)
1. Novo pedido chega com status `disponivel`
2. Sistema detecta no realtime (evento INSERT)
3. **Automaticamente atualiza para `aceito`**
4. Define `started_at` para o horário atual
5. Pedido já aparece em "Em Preparo"
6. Som de notificação toca (se habilitado)
7. Nenhuma ação manual necessária

### Cenário 3: ATIVANDO Aceitação Automática (Pedidos Existentes) 🆕
1. Existem pedidos na coluna "Novas Missões" (status `disponivel`)
2. Usuário clica no botão "Aceitar Auto: OFF"
3. **Botão fica laranja mostrando "Processando..."** 🟠
4. Sistema busca todos os pedidos com status `disponivel`
5. Aceita cada pedido automaticamente (com delay de 300ms entre cada)
6. Console mostra: "⏳ Aceitando pedido 1/3: #123..."
7. Após processar todos: botão fica verde "Aceitar Auto: ON" 🟢
8. Todos os pedidos movem para "Em Preparo"
9. **Novos pedidos que chegarem também serão aceitos automaticamente**

## Importante

⚠️ **A função de aceitar pedidos manualmente NÃO foi removida!**
- O botão "Aceitar Missão" continua disponível
- Pode ser usado mesmo com aceitação automática ligada
- Serve como fallback caso haja algum problema
- Útil para pedidos já existentes quando a função é ativada

## Logs de Console

Para facilitar o debug, foram adicionados logs visuais:
- 🤖 Quando a aceitação automática é acionada
- ✅ Quando o pedido é aceito com sucesso
- ❌ Quando ocorre algum erro na aceitação

## Localização dos Arquivos Modificados

1. **src/pages/Dashboard.jsx**
   - Adicionado estado `autoAcceptEnabled`
   - Adicionada função `toggleAutoAccept`
   - Modificado useEffect do realtime
   - Atualizada barra de filtros (removidos botões e adicionado toggle)

2. **src/components/icons/definitions.jsx**
   - Adicionado `CoinIcon`

## Como Usar

1. Acesse o Dashboard
2. Localize a barra de filtros no topo (abaixo dos cards de resumo)
3. Clique no botão "Aceitar Auto: OFF" para ativar
4. Botão ficará verde: "Aceitar Auto: ON"
5. Novos pedidos serão aceitos automaticamente
6. Para desativar, clique novamente no botão

## Testes Recomendados

### Teste 1: Aceitação Automática de Novos Pedidos
1. ✅ Criar um novo pedido com aceitação automática OFF
2. ✅ Verificar se pedido aparece em "Novas Missões"
3. ✅ Ativar aceitação automática (botão deve ficar verde)
4. ✅ Criar um novo pedido
5. ✅ Verificar se pedido já aparece em "Em Preparo" automaticamente

### Teste 2: Aceitação de Pedidos Existentes 🆕
1. ✅ Criar 3 pedidos de teste (com aceitação automática OFF)
2. ✅ Verificar que todos aparecem em "Novas Missões"
3. ✅ Clicar em "Aceitar Auto: OFF"
4. ✅ **Verificar botão fica laranja "Processando..."**
5. ✅ Abrir console (F12) e ver logs: "⏳ Aceitando pedido 1/3..."
6. ✅ Após ~1 segundo, botão fica verde "Aceitar Auto: ON"
7. ✅ Verificar que os 3 pedidos moveram para "Em Preparo"

### Teste 3: Persistência e Comportamento Geral
1. ✅ Verificar logs no console do navegador
2. ✅ Desativar e recarregar página - verificar se preferência foi salva
3. ✅ Testar aceitação manual mesmo com automática ligada
4. ✅ Criar pedido com automática ON - verificar aceitação instantânea

### Teste 4: Edge Cases
1. ✅ Ativar quando não há pedidos pendentes (deve ativar sem mostrar "Processando")
2. ✅ Desativar durante processamento (deve completar o lote antes de desativar)
3. ✅ Criar vários pedidos rapidamente com automática ON

