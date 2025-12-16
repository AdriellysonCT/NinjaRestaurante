# Correção de Sincronização de Status - Painel do Restaurante

## 🎯 Resumo Executivo

**Problema:** Quando um entregador aceita uma entrega no app Flutter, apenas `entregas_padronizadas.status` era atualizado. O painel do restaurante não refletia a mudança porque lê apenas `pedidos_padronizados`.

**Solução:** Criada trigger bidirecional que sincroniza automaticamente os status entre as duas tabelas.

**Resultado:** Painel do restaurante atualiza em tempo real quando entregador aceita, coleta ou conclui uma entrega.

---

## 📦 Instalação Rápida

Execute no Supabase SQL Editor:

```sql
-- Arquivo: INSTALAR_SINCRONIZACAO_COMPLETA.sql
```

Este script instala TUDO automaticamente:
- ✅ Trigger pedidos → entregas
- ✅ Trigger entregas → pedidos (NOVA)
- ✅ Correção de inconsistências
- ✅ Verificação final

**Tempo de instalação:** ~5 segundos

---

## Problema Identificado

Quando um pedido era aceito pelo entregador no app, o status no banco de dados era atualizado corretamente para `aceito` em `entregas_padronizadas`, mas o painel do restaurante continuava mostrando o pedido na coluna "Em Preparo" porque `pedidos_padronizados.status` não era atualizado.

## Causa Raiz

A função `getVisualStage()` no arquivo `Dashboard.jsx` estava mapeando TODOS os pedidos com status `aceito` para a etapa visual `em_preparo`, sem diferenciar entre:

1. **Aceito pelo restaurante**: Pedido foi aceito e está sendo preparado
2. **Aceito pelo entregador**: Pedido já está pronto e foi aceito por um entregador

## Solução Implementada

### Arquivo Modificado
- `meu-fome-ninja/src/pages/Dashboard.jsx`

### Mudança na Lógica

**ANTES:**
```javascript
case 'aceito':
  // No backend, 'aceito' significa em preparo
  console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: em_preparo`);
  return 'em_preparo';
```

**DEPOIS:**
```javascript
case 'aceito':
  // CORREÇÃO: Diferenciar entre "aceito pelo restaurante" e "aceito pelo entregador"
  // Se tem entregador associado, significa que foi aceito pelo entregador
  if (order.nome_entregador || order.id_entregador) {
    console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: aceito (aceito pelo entregador)`);
    return 'aceito';
  } else {
    // Se não tem entregador, significa que foi aceito pelo restaurante (em preparo)
    console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: em_preparo (aceito pelo restaurante)`);
    return 'em_preparo';
  }
```

## Como Funciona Agora

A lógica diferencia entre dois tipos de fluxo baseado no `tipo_pedido`:

### 🚚 Fluxo para Pedidos de DELIVERY (Entrega)

A lógica verifica se o pedido tem um entregador associado (`nome_entregador` ou `id_entregador`):

1. **Novas Missões** (`disponivel`, `novo`, `pendente`)
   - Pedido recém-criado, aguardando aceitação do restaurante

2. **Em Preparo** (`aceito` SEM entregador)
   - Pedido aceito pelo restaurante e sendo preparado
   - Ainda não tem entregador associado

3. **Pronto para Entregar** (`pronto_para_entrega`)
   - Pedido finalizado pelo restaurante
   - Aguardando entregador aceitar

4. **Aceitos** (`aceito` COM entregador) ✅ **CORREÇÃO APLICADA**
   - Pedido foi aceito por um entregador
   - Entregador está a caminho para coletar

5. **Coletados** (`coletado`)
   - Entregador coletou o pedido
   - Está a caminho do cliente

6. **Concluídos** (`concluido`)
   - Pedido entregue ao cliente

### 🏪 Fluxo para Pedidos de RETIRADA ou LOCAL (Consumo no Local)

**Fluxo Simplificado - SEM etapas de entrega:**

1. **Novas Missões** (`disponivel`, `novo`, `pendente`)
   - Pedido recém-criado, aguardando aceitação

2. **Em Preparo** (`aceito`, `em_preparo`)
   - Pedido aceito e sendo preparado

3. **Concluído** (`concluido`)
   - Pedido finalizado e entregue ao cliente no balcão/mesa

**OU**

3. **Cancelado** (`cancelado`)
   - Pedido cancelado

> ⚠️ **Importante**: Pedidos de retirada/local **NÃO** passam pelas etapas "Pronto para Entregar", "Aceitos" ou "Coletados". Se por algum motivo receberem esses status, serão automaticamente mapeados para "Em Preparo".

## Arquitetura de Dados

### Tabela Principal: `pedidos_padronizados`
- Armazena o status do pedido
- Campos relevantes:
  - `status`: Status atual do pedido
  - `tipo_pedido`: delivery, retirada ou local
  - `nome_entregador`: Nome do entregador (quando aceito)
  - `id_entregador`: ID do entregador (quando aceito)

### Tabela Secundária: `entregas_padronizadas`
- Sincronizada automaticamente via trigger no banco
- NÃO deve ser usada como fonte de verdade para o painel do restaurante
- Usada apenas para rastreamento de entregas

## Atualização em Tempo Real ⚡

O sistema utiliza **Supabase Realtime** para atualizar o painel automaticamente, sem necessidade de recarregar a página:

### Como Funciona

1. **Listener Ativo**: O Dashboard mantém um canal WebSocket aberto com o Supabase
2. **Detecção de Mudanças**: Qualquer INSERT, UPDATE ou DELETE na tabela `pedidos_padronizados` é detectado instantaneamente
3. **Recarregamento Automático**: Quando uma mudança é detectada, `fetchOrders()` é chamado automaticamente
4. **Re-renderização**: O React atualiza a UI com os novos dados

### Exemplos de Atualizações em Tempo Real

```javascript
// Quando um entregador aceita um pedido:
📨 Mudança detectada nos pedidos: UPDATE - Pedido #1234
  📊 Status mudou: "pronto_para_entrega" -> "aceito" (com entregador)
  🔔 Badge de atualização ativado para pedido #1234
  🔄 Recarregando pedidos em tempo real...
  
// O pedido move automaticamente de "Pronto para Entregar" -> "Aceitos"
```

### Eventos Monitorados

- ✅ **INSERT**: Novo pedido criado
- ✅ **UPDATE**: Status alterado, entregador atribuído, etc.
- ✅ **DELETE**: Pedido removido

### Performance

- **Sem Polling**: Não usa verificação periódica (exceto para auto-aceitar)
- **WebSocket**: Conexão persistente de baixa latência
- **Eficiente**: Apenas recarrega quando há mudanças reais

## Benefícios da Correção

✅ **Sincronização em Tempo Real**: O painel atualiza instantaneamente quando o status muda no banco

✅ **Visibilidade Clara**: Restaurante vê imediatamente quando um entregador aceitou o pedido

✅ **Sem Refresh Manual**: Não precisa recarregar a página para ver atualizações

✅ **Sem Modificações no Banco**: Solução implementada apenas no frontend

✅ **Compatível com Triggers**: Não interfere com a sincronização automática entre tabelas

## Testes Recomendados

### Teste 1: Pedido de Delivery (Entrega)
1. Criar um pedido com `tipo_pedido = 'delivery'`
2. Aceitar o pedido no painel do restaurante → Deve aparecer em "Em Preparo"
3. Marcar como "Pronto para Entrega" → Deve aparecer em "Pronto para Entregar"
4. Simular aceitação pelo entregador (atualizar status para `aceito` e adicionar `id_entregador`) → Deve aparecer em "Aceitos" ✅
5. Marcar como coletado → Deve aparecer em "Coletados"
6. Marcar como concluído → Deve aparecer em "Concluídos"

### Teste 2: Pedido de Retirada
1. Criar um pedido com `tipo_pedido = 'retirada'`
2. Aceitar o pedido no painel do restaurante → Deve aparecer em "Em Preparo"
3. Marcar como "Concluir" → Deve aparecer em "Concluídos"
4. ✅ **Verificar que NÃO passou por "Pronto para Entregar", "Aceitos" ou "Coletados"**

### Teste 3: Pedido Local (Consumo no Local)
1. Criar um pedido com `tipo_pedido = 'local'`
2. Aceitar o pedido no painel do restaurante → Deve aparecer em "Em Preparo"
3. Marcar como "Concluir" → Deve aparecer em "Concluídos"
4. ✅ **Verificar que NÃO passou por "Pronto para Entregar", "Aceitos" ou "Coletados"**

## Diagrama Visual dos Fluxos

```
┌─────────────────────────────────────────────────────────────────┐
│                    PEDIDO DE DELIVERY 🚚                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Novas      │ -> │  Em Preparo  │ -> │ Pronto p/        │
│   Missões    │    │              │    │ Entregar         │
└──────────────┘    └──────────────┘    └──────────────────┘
  (disponivel)        (aceito sem           (pronto_para_
                       entregador)            entrega)
                                                   |
                                                   v
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Concluídos  │ <- │  Coletados   │ <- │    Aceitos       │
│              │    │              │    │ (pelo entregador)│
└──────────────┘    └──────────────┘    └──────────────────┘
  (concluido)         (coletado)          (aceito com
                                           entregador) ✅


┌─────────────────────────────────────────────────────────────────┐
│              PEDIDO DE RETIRADA/LOCAL 🏪🍽️                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Novas      │ -> │  Em Preparo  │ -> │   Concluídos     │
│   Missões    │    │              │    │                  │
└──────────────┘    └──────────────┘    └──────────────────┘
  (disponivel)        (aceito)            (concluido)

                          |
                          v
                  ┌──────────────┐
                  │  Cancelado   │
                  │              │
                  └──────────────┘
                    (cancelado)
```

## Logs de Debug

A função `getVisualStage()` agora inclui logs detalhados:
- Status do pedido
- Tipo de pedido (delivery, retirada, local)
- Nome do entregador (se houver)
- Mapeamento final para a etapa visual

Verifique o console do navegador para acompanhar o mapeamento em tempo real.

### Exemplos de Logs:

```
✅ Delivery aceito pelo restaurante:
Mapeando pedido 1234: status="aceito", tipo_pedido="delivery", entregador="nenhum"
  -> Pedido ENTREGA 1234 mapeado para: em_preparo (aceito pelo restaurante)

✅ Delivery aceito pelo entregador:
Mapeando pedido 1234: status="aceito", tipo_pedido="delivery", entregador="João Silva"
  -> Pedido ENTREGA 1234 mapeado para: aceito (aceito pelo entregador)

✅ Retirada em preparo:
Mapeando pedido 5678: status="aceito", tipo_pedido="retirada", entregador="nenhum"
  -> Pedido LOCAL/RETIRADA 5678 mapeado para: em_preparo

✅ Atualização em tempo real:
📡 Configurando realtime para restaurante: abc-123-def
📨 Mudança detectada nos pedidos: UPDATE - Pedido #1234
  📊 Status mudou: "pronto_para_entrega" -> "aceito" (com entregador)
  🔔 Badge de atualização ativado para pedido #1234
  🔄 Recarregando pedidos em tempo real...
```

## Troubleshooting

### Problema: Painel não atualiza em tempo real

**Verificações:**

1. **Console do navegador**: Procure por mensagens do tipo:
   ```
   📡 Configurando realtime para restaurante: [ID]
   📡 Status do canal realtime: SUBSCRIBED
   ```

2. **Se aparecer "CLOSED" ou "CHANNEL_ERROR"**:
   - Verifique a conexão com internet
   - Verifique se o Supabase está configurado corretamente
   - Verifique as permissões RLS da tabela `pedidos_padronizados`

3. **Se não aparecer nenhuma mensagem de mudança**:
   - Verifique se o `id_restaurante` está correto
   - Teste fazer uma mudança manual no banco e veja se detecta

4. **Fallback manual**: Se o realtime falhar, você pode recarregar a página manualmente (F5)

### Problema: Pedido não muda de coluna

**Verificações:**

1. Verifique no console se o mapeamento está correto
2. Para pedidos aceitos pelo entregador, confirme que `id_entregador` ou `nome_entregador` está preenchido
3. Verifique se o `tipo_pedido` está correto (delivery, retirada, local)
