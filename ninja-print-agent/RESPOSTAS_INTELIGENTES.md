# 🤖 Sistema de Respostas Inteligentes por Palavra-Chave

## 📋 Visão Geral

O Agent agora detecta **intenções** nas mensagens dos clientes e responde automaticamente com informações relevantes, incluindo **status do pedido** em tempo real!

---

## ✨ Funcionalidades Implementadas

### 1. **Consulta de Status do Pedido** 📦

**Cliente envia:**
- "Quero acompanhar meu pedido"
- "Qual o status do meu pedido?"
- "Como está meu pedido?"
- "Meu pedido já saiu?"
- "Previsão de entrega"
- "Pedido número 12345"

**Agent responde:**
```
Olá João! 😊

🔥 Seu pedido #12345 foi ACEITO e já está sendo preparado!

⏱️ Tempo estimado: 25 minutos

Qualquer dúvida estamos aqui! 🥷
```

### 2. **Consulta de Cardápio** 🍕

**Cliente envia:**
- "Quero ver o cardápio"
- "Me mostre o menu"
- "Quero fazer pedido"

**Agent responde:**
```
Olá! 👋 Bem-vindo ao *Fome Ninja*! 🥷

Nosso cardápio completo está disponível aqui:
👉 *https://ninja-restaurante.vercel.app/cardapio/fenix-carne*

Escolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕

Qualquer dúvida é só chamar! Estamos aqui pra ajudar! 💪
```

### 3. **Consulta de Horário** 🕐

**Cliente envia:**
- "Qual o horário de funcionamento?"
- "Vocês estão abertos?"
- "Que horas vocês fecham?"

**Agent responde:**
```
Olá João! 😊

🕐 Nosso horário de funcionamento:
• Segunda a Sexta: 18h às 23h
• Sábados e Domingos: 17h às 00h

Faça seu pedido agora: https://.../cardapio/fenix-carne

Qualquer dúvida estamos aqui! 🥷
```

---

## 🔧 Como Funciona

### Fluxo Completo:

```
📱 Cliente envia: "Quero acompanhar meu pedido"
     ↓
👂 Agent detecta mensagem não lida (a cada 30s)
     ↓
🔍 Extrai texto da mensagem
     ↓
🧠 Detecta intenção por palavras-chave:
   - "acompanhar" + "pedido" = status_pedido
     ↓
📡 Consulta Supabase:
   SELECT * FROM pedidos 
   WHERE telefone = '5583981691823' 
   ORDER BY criado_em DESC 
   LIMIT 1
     ↓
📦 Recebe pedido:
   {
     id: 12345,
     status: "aceito",
     tempo_preparo: 25,
     criado_em: "2024-01-15..."
   }
     ↓
🤖 Gera mensagem personalizada:
   "Seu pedido #12345 foi ACEITO..."
     ↓
📨 Envia via WhatsApp Web
     ↓
✅ Cliente recebe status atualizado!
```

---

## 🎯 Palavras-Chave Detectadas

### Status do Pedido:
```
pedido, status, acompanhar, andamento, situacao,
como está, como esta, previsao, previsão, entrega,
saiu, chegou, pronto, saiu para entrega, qual status,
meu pedido, pedido numero, pedido número
```

### Cardápio:
```
cardápio, cardapio, menu, pratos, pedir,
fazer pedido, ver cardápio, ver cardapio
```

### Horário:
```
horário, horario, funcionamento, aberto, fechado,
que horas, quando abre, quando fecha, expediente
```

---

## 📡 Consulta ao Supabase

### Configuração:

Crie/edit o arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Executada:

```sql
SELECT * FROM pedidos 
WHERE telefone = '5583981691823'
  AND id_restaurante = 'abc-123'  -- opcional
ORDER BY criado_em DESC 
LIMIT 1
```

### Status Suportados:

| Status | Mensagem Gerada |
|--------|----------------|
| `pendente` | 📋 Seu pedido está **pendente** e será confirmado em breve! |
| `aceito` | 🔥 Seu pedido foi **aceito** e já está sendo preparado! |
| `preparando` | 👨‍🍳 Seu pedido está sendo **preparado** com todo carinho! |
| `pronto` | ✅ Seu pedido está **PRONTO** e aguardando retirada/entrega! |
| `saiu_entrega` | 🛵 Seu pedido **SAIU PARA ENTREGA**! Fique atento! |
| `entregue` | 🎉 Seu pedido foi **ENTREGUE**! Bom apetite! |
| `cancelado` | ❌ Seu pedido foi **cancelado**. Entre em contato... |

---

## 💬 Exemplos Práticos

### Exemplo 1: Status do Pedido

```
📱 Cliente: "Oi, quero saber como está meu pedido"

🤖 Agent:
  🔍 Detecta intenção: status_pedido
  📡 Consulta Supabase pelo telefone
  📦 Encontra pedido #12345 com status "preparando"
  
📨 Resposta:
"Olá João! 😊

👨‍🍳 Seu pedido *#12345* está sendo *preparado* com todo carinho!

⏱️ Tempo estimado: *25 minutos*

Qualquer dúvida estamos aqui! 🥷"
```

### Exemplo 2: Pedido já Entregue

```
📱 Cliente: "Meu pedido já chegou?"

🤖 Agent:
  🔍 Detecta intenção: status_pedido
  📡 Consulta Supabase
  📦 Encontra pedido #12340 com status "entregue"
  
📨 Resposta:
"Olá Maria! 😊

🎉 Seu pedido *#12340* foi *ENTREGUE*! Bom apetite!

Qualquer dúvida estamos aqui! 🥷"
```

### Exemplo 3: Pedido Não Encontrado

```
📱 Cliente: "Qual status do meu pedido?"

🤖 Agent:
  🔍 Detecta intenção: status_pedido
  📡 Consulta Supabase
  ❌ Nenhum pedido encontrado para este telefone
  
📨 Resposta:
"Olá José! 😊

Não encontrei pedidos recentes para seu telefone. 
Verifique o número ou faça um novo pedido pelo nosso cardápio: 
👉 https://.../cardapio/fenix-carne

Qualquer dúvida estamos aqui! 🥷"
```

### Exemplo 4: Cardápio

```
📱 Cliente: "Quero ver o cardápio"

🤖 Agent:
  🔍 Detecta intenção: cardapio
  🤖 Gera mensagem com link do restaurante
  
📨 Resposta:
"Olá! 👋 Bem-vindo ao *Fome Ninja*! 🥷

Nosso cardápio completo está disponível aqui:
👉 *https://ninja-restaurante.vercel.app/cardapio/fenix-carne*

Escolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕

Qualquer dúvida é só chamar! Estamos aqui pra ajudar! 💪"
```

---

## 🔄 Sistema de Monitoramento Duplo

### 1️⃣ **Novas Conversas** (check_and_reply_new_messages)
- Detecta quando um cliente **inicia** conversa
- Envia auto-resposta de **boas-vindas** com cardápio
- **Só responde uma vez** por restaurante (anti-spam)

### 2️⃣ **Mensagens Recebidas** (check_and_reply_incoming_messages)
- Verifica **todas** mensagens não lidas
- **Extrai conteúdo** da mensagem do cliente
- **Detecta intenção** por palavras-chave
- **Responde inteligente** com info relevante

---

## 🎮 Fluxo Completo do Agent

```
┌─────────────────────────────────────────────────────────┐
│ 1️⃣ RESTAURANTE FAZ LOGIN                                │
│    → Registra no Agent com ID + link cardápio           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2️⃣ AGENT MONITORANDO WHATSAPP (loop 30s)                │
│                                                          │
│    ┌───────────────────────────────────────────────┐    │
│    │ A) NOVAS CONVERSAS                            │    │
│    │    → Detecta cliente novo                     │    │
│    │    → Envia boas-vindas + cardápio             │    │
│    │    → Marca como "respondido" (anti-spam)      │    │
│    └───────────────────────────────────────────────┘    │
│                                                          │
│    ┌───────────────────────────────────────────────┐    │
│    │ B) MENSAGENS RECEBIDAS                        │    │
│    │    → Lê mensagens não lidas                   │    │
│    │    → Extrai texto da mensagem                 │    │
│    │    → Detecta intenção (palavras-chave)        │    │
│    │    → Consulta Supabase (se status_pedido)     │    │
│    │    → Gera resposta inteligente                │    │
│    │    → Envia resposta                           │    │
│    └───────────────────────────────────────────────┘    │
│                                                          │
│    ┌───────────────────────────────────────────────┐    │
│    │ C) FILA DE ENVIO (painel web)                 │    │
│    │    → Notificações de pedido                   │    │
│    │    → Impressões                               │    │
│    └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Proteções e Validações

### Anti-Spam:
- ✅ **Novas conversas**: 1 resposta por telefone + restaurante
- ✅ **Mensagens recebidas**: Responde apenas se detectar intenção clara
- ✅ **Cache inteligente**: Telefone pode receber para restaurantes diferentes

### Validações de Segurança:
- ✅ **Supabase configurado**: Só consulta se URL/KEY presentes
- ✅ **Telefone válido**: Limpa e valida antes de consultar
- ✅ **Pedido existente**: Verifica se encontrou pedido antes de responder
- ✅ **Mensagem mínima**: Ignora mensagens muito curtas (< 3 chars)

### Tratamento de Erros:
- ✅ Try/catch em todas operações
- ✅ Logs detalhados para debugging
- ✅ Fallbacks elegantes quando algo falha

---

## ⚙️ Configuração

### 1. Configurar Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_service_role_key
```

### 2. Estrutura da Tabela de Pedidos:

```sql
CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone VARCHAR(20),
  id_restaurante UUID,
  status VARCHAR(50),
  numero_pedido INTEGER,
  tempo_preparo INTEGER,
  criado_em TIMESTAMP DEFAULT NOW()
);
```

### 3. Testar:

```bash
# Iniciar agent
python agent.py

# Enviar mensagem no WhatsApp
"Quero acompanhar meu pedido"

# Ver logs do agent
🔍 Verificando mensagens recebidas...
📨 Mensagem não lida de: João Silva
💬 Mensagem recebida: 'Quero acompanhar meu pedido...'
🎯 Intenção detectada: status_pedido
📡 Consultando Supabase...
📦 Pedido encontrado: #12345 (status: aceito)
📨 Enviando resposta...
✅ Resposta enviada para João Silva!
```

---

## 📊 Monitoramento e Logs

### Logs Gerados:

```
🔍 Verificando mensagens recebidas...
  📨 Mensagem não lida de: João Silva
    💬 Mensagem recebida: 'Quero saber status do meu pedido...'
    🎯 Intenção detectada: status_pedido
    📡 Consultando pedido no Supabase...
    📦 Pedido #12345 encontrado: status=aceito
    📨 Enviando resposta...
    ✅ Resposta enviada para João Silva!

🔍 Verificando mensagens recebidas...
  📨 Mensagem não lida de: Maria
    💬 Mensagem recebida: 'Cardápio'
    🎯 Intenção detectada: cardapio
    📨 Enviando resposta...
    ✅ Resposta enviada para Maria!
```

---

## 🎉 Resultado Final

Agora o Agent é **INTELIGENTE** e responde automaticamente:

1. ✅ **Novas conversas** → Boas-vindas + cardápio
2. ✅ **Status do pedido** → Consulta Supabase e responde com status atualizado
3. ✅ **Cardápio** → Envio link específico do restaurante
4. ✅ **Horário** → Informa funcionamento
5. ✅ **Anti-spam** → Não repete para mesmo contato/restaurante

---

**Implementado com sucesso! 🥷🤖**
