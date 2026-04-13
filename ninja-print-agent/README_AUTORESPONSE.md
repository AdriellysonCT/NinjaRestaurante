# 🥷 Fome Ninja Agent - Auto-Resposta WhatsApp

## 📋 Visão Geral

O **Fome Ninja Agent** agora possui **auto-resposta inteligente**! Quando um cliente inicia uma conversa no WhatsApp, o agent detecta automaticamente e envia uma mensagem de boas-vindas com o link do cardápio **ESPECÍFICO DO RESTAURANTE**.

---

## ✨ Nova Funcionalidade: Auto-Resposta Multi-Restaurante

### Como Funciona

1. **Registro Automático**: Quando um restaurante faz login no painel, ele se registra automaticamente no Agent com seu **ID** e **link do cardápio**
2. **Detecção Automática**: O agent monitora o WhatsApp Web a cada 30 segundos
3. **Identificação de Novas Conversas**: Detecta quando um cliente enviou mensagem pela primeira vez
4. **Resposta Inteligente**: Envia automaticamente uma mensagem personalizada com:
   - Saudação de boas-vindas (aleatória da matriz)
   - **Link do cardápio do restaurante específico** (ex: Fenix Carne → cardápio do Fenix)
   - Frase de incentivo para fazer o pedido

5. **Anti-Spam**: Cada contato recebe auto-resposta **apenas uma vez por restaurante** (cache por telefone + restaurante)

---

## 🎯 Exemplo Prático

### Cenário Multi-Restaurante:

```
📱 Cliente manda "Oi" para o WhatsApp do "Fênix Carne"
    ↓
🤖 Agent detecta nova conversa
    ↓
🔍 Verifica restaurante_id = "fenix-carne"
    ↓
📨 Envia mensagem com link: https://ninja-restaurante.vercel.app/cardapio/fenix-carne

---

📱 Outro cliente manda "Oi" para o WhatsApp do "Sabor caseiro"
    ↓
🤖 Agent detecta nova conversa
    ↓
🔍 Verifica restaurante_id = "sabor-caseiro"
    ↓
📨 Envia mensagem com link: https://ninja-restaurante.vercel.app/cardapio/sabor-caseiro
```

**Cada restaurante envia o SEU próprio cardápio!** 🎉

---

## 🚀 Configuração

### 1. Registro Automático do Restaurante

**NÃO PRECISA CONFIGURAR MANUALMENTE!**

Quando um restaurante faz login no painel web, automaticamente:

- ✅ O restaurante se registra no Agent com seu ID único
- ✅ O link do cardápio é gerado automaticamente: `https://ninja-restaurante.vercel.app/cardapio/{slug-do-restaurante}`

**Exemplo de registro automático:**

```javascript
// No AuthContext.jsx (executado no login)
autoReplyService.registerRestauranteNoAgent({
  id: "fenix-carne",
  nome_fantasia: "Fenix Carne",
  slug: "fenix-carne"
});

// Agent recebe:
POST http://localhost:5001/register-restaurant
{
  "restaurante_id": "fenix-carne",
  "nome": "Fenix Carne",
  "cardapio_link": "https://ninja-restaurante.vercel.app/cardapio/fenix-carne"
}
```

### 2. Link do Cardápio Personalizado (Opcional)

Se quiser sobrescrever o link automático, crie um arquivo `.env`:

```env
CARDAPIO_LINK=https://ninja-restaurante.vercel.app/cardapio
```

### 3. Mensagens Personalizadas

Edite o arquivo `mensagens_reserva.json` na seção `auto_resposta`:

```json
{
  "auto_resposta": {
    "saudacoes": [
      "Olá! 👋 Bem-vindo ao *Fome Ninja*! 🥷",
      "Opa! Saudações do *Fome Ninja*! 🥷✨"
    ],
    "corpo": "Nosso cardápio completo está disponível aqui:\n👉 *{cardapio_link}*\n\nEscolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕",
    "fechamentos": [
      "Qualquer dúvida é só chamar! Estamos aqui pra ajudar! 💪",
      "Bom apetite! Se precisar, estamos a um zap de distância! 😍"
    ]
  }
}
```

---

## 🎮 Gerenciamento

### Via Menu do System Tray

Clique no ícone do agent perto do relógio e escolha:

- **Ver Restaurantes** → Lista restaurantes registrados no console
- **Resetar Auto-Resposta** → Limpa cache completo (todos contatos poderão receber novamente)
- **Ver Contatos Auto-Resposta** → Abre lista no navegador

### Via API HTTP

**Registrar restaurante manualmente:**

```bash
POST http://localhost:5001/register-restaurant
Content-Type: application/json

{
  "restaurante_id": "fenix-carne",
  "nome": "Fenix Carne",
  "cardapio_link": "https://ninja-restaurante.vercel.app/cardapio/fenix-carne"
}
```

**Disparar auto-resposta manualmente (pelo painel web):**

```bash
POST http://localhost:5001/auto-reply/send
Content-Type: application/json

{
  "phone": "83981691823",
  "customer_name": "João",
  "restaurante_id": "fenix-carne"
}
```

**Listar contatos que já receberam auto-resposta:**

```bash
GET http://localhost:5001/auto-reply/contacts
```

**Resetar cache completo:**

```bash
POST http://localhost:5001/auto-reply/reset
```

**Resetar apenas um contato específico:**

```bash
POST http://localhost:5001/auto-reply/reset
Content-Type: application/json

{
  "phone": "83981691823"
}
```

---

## 📊 Fluxo Completo

### Fluxo Automático (Registro do Restaurante):

```
🔐 Restaurante faz login no painel web
    ↓
📝 AuthContext.jsx chama autoReplyService.registerRestauranteNoAgent()
    ↓
📡 POST para http://localhost:5001/register-restaurant
    ↓
🏪 Agent registra: {id, nome, cardapio_link}
    ↓
✅ Pronto para auto-resposta com link específico!
```

### Fluxo de Auto-Resposta:

```
📱 Cliente envia "Oi" no WhatsApp
    ↓
👂 Agent detectou nova conversa (a cada 30s)
    ↓
🔍 Verifica se já respondeu para ESTE contato neste restaurante
    ↓ (não respondeu)
🤖 Gera mensagem automática com link do restaurante específico
    ↓
📨 Envia saudação + cardápio DO RESTAURANTE + fechamento
    ↓
✅ Marca telefone como "respondido" PARA ESTE RESTAURANTE
```

---

## 🛡️ Proteção Anti-Spam

- **Cache por telefone**: Cada número recebe auto-resposta apenas **1 vez**
- **Verificação de conversa existente**: Se já houver mensagens trocadas, não responde
- **Reset manual**: Você pode limpar o cache quando quiser via tray ou API

---

## 🔧 API Completa

| Endpoint               | Método | Função                           |
| ---------------------- | ------ | -------------------------------- |
| `/status`              | GET    | Status do agent                  |
| `/printers`            | GET    | Lista impressoras                |
| `/print`               | POST   | Imprime conteúdo                 |
| `/notify`              | POST   | Dispara notificação de pedido    |
| `/auto-reply/contacts` | GET    | Lista contatos com auto-resposta |
| `/auto-reply/reset`    | POST   | Reseta cache de auto-resposta    |

---

## 💡 Dicas

1. **Primeira execução**: Escaneie o QR Code do WhatsApp Web quando solicitado
2. **Testando**: Envie uma mensagem de um número novo para testar a auto-resposta
3. **Personalize**: Edite as mensagens no JSON para combinar com a voz da sua marca
4. **Monitoramento**: Veja os logs no terminal para acompanhar as detecções

---

## 🐛 Troubleshooting

**Auto-resposta não funciona?**

- Verifique se o WhatsApp Web está logado (QR Code escaneado)
- Veja os logs do agent para mensagens de erro
- Resete o cache de auto-resposta

**QR Code aparece toda vez?**

- Verifique se a pasta `C:\ninja_wp_data` existe e tem permissões
- Não delete essa pasta (ela guarda a sessão do WhatsApp)

**Mensagens não enviam?**

- Aguarde 30 segundos após iniciar o agent (tempo de aquecimento)
- Verifique se o campo de texto do WhatsApp está carregando

---

## 📝 Exemplo de Mensagem de Auto-Resposta

### Para o restaurante "Fenix Carne":

```
Olá! 👋 Bem-vindo ao *Fome Ninja*! 🥷

Nosso cardápio completo está disponível aqui:
👉 *https://ninja-restaurante.vercel.app/cardapio/fenix-carne*

Escolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕

Qualquer dúvida é só chamar! Estamos aqui pra ajudar! 💪
```

### Para o restaurante "Sabor Caseiro":

```
Opa! Saudações do *Fome Ninja*! 🥷✨

Nosso cardápio completo está disponível aqui:
👉 *https://ninja-restaurante.vercel.app/cardapio/sabor-caseiro*

Escolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕

Ficou com fome? Corre no cardápio e pede agora! 🚀
```

**Cada restaurante envia seu PRÓPRIO link!** 🎯

---

Feito com 🥷 por **Fome Ninja** - 2026
