# 🚀 Guia Rápido - Auto-Resposta WhatsApp

## 📦 Instalação

1. **Instale as dependências** (se ainda não fez):
```bash
cd ninja-print-agent
pip install flask flask-cors pywin32 pystray pyautogui playwright python-dotenv pillow
playwright install chromium
```

2. **Configure o link do cardápio**:
   - Crie um arquivo `.env` na pasta `ninja-print-agent`:
```env
CARDAPIO_LINK=https://ninja-restaurante.vercel.app/cardapio
```

3. **Personalize as mensagens** (opcional):
   - Edite `mensagens_reserva.json` → seção `auto_resposta`

---

## ▶️ Como Usar

### 1. Iniciar o Agent

**Via script (recomendado):**
```bash
# Se tiver o batch script:
INICIAR_PAINEL_NINJA.bat

# Ou diretamente:
python agent.py
```

### 2. Primeira Execução

- Uma janela do WhatsApp Web abrirá
- **Escaneie o QR Code** com seu celular
- O agent salvará a sessão automaticamente

### 3. Funcionamento

Após iniciado, o agent irá:

✅ **Monitorar** novas mensagens a cada **30 segundos**  
✅ **Detectar** quando um cliente inicia conversa  
✅ **Responder automaticamente** com saudação + cardápio  
✅ **Registrar** o telefone para não spammar  

---

## 💬 Exemplo Prático

### O que acontece:

```
📱 Cliente (83) 98169-1823 envia: "Oi"
     ↓ (aguarda até 30 segundos)
🤖 Agent detecta nova conversa
     ↓
📨 Agent responde automaticamente:

"Olá! 👋 Bem-vindo ao *Fome Ninja*! 🥷

Nosso cardápio completo está disponível aqui:
👉 *https://ninja-restaurante.vercel.app/cardapio*

Escolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕

Qualquer dúvida é só chamar! Estamos aqui pra ajudar! 💪"
```

---

## 🎮 Gerenciamento

### Pelo Menu do System Tray

Clique no ícone 🍊 perto do relógio:

- **Resetar Auto-Resposta** → Permite responder todos os contatos novamente
- **Ver Contatos Auto-Resposta** → Abre lista no navegador

### Pela API HTTP

**Ver contatos que já receberam auto-resposta:**
```bash
curl http://localhost:5001/auto-reply/contacts
```

**Resetar cache completo:**
```bash
curl -X POST http://localhost:5001/auto-reply/reset
```

**Resetar apenas um contato:**
```bash
curl -X POST http://localhost:5001/auto-reply/reset \
  -H "Content-Type: application/json" \
  -d '{"phone": "83981691823"}'
```

---

## 🔧 Personalização de Mensagens

Edite `mensagens_reserva.json`:

```json
{
  "auto_resposta": {
    "saudacoes": [
      "Olá! 👋 Bem-vindo ao *Fome Ninja*! 🥷",
      "Opa! Saudações do *Fome Ninja*! 🥷✨",
      // Adicione mais variações...
    ],
    "corpo": "Nosso cardápio completo está disponível aqui:\n👉 *{cardapio_link}*\n\nEscolha seus pratos favoritos e faça seu pedido agora! 🍔🍟🍕",
    "fechamentos": [
      "Qualquer dúvida é só chamar! Estamos aqui pra ajudar! 💪",
      // Adicione mais variações...
    ]
  }
}
```

**Dica**: Use `*texto*` para **negrito** no WhatsApp!

---

## 🐛 Problemas Comuns

### Auto-resposta não funciona?

1. **Verifique se o agent está rodando**:
   ```bash
   curl http://localhost:5001/status
   ```

2. **Verifique se o WhatsApp Web está logado**:
   - Abra o WhatsApp Web no navegador
   - Se pedir QR Code, escaneie novamente

3. **Veja os logs** no terminal do agent para erros

4. **Resete o cache**:
   - Menu tray → "Resetar Auto-Resposta"
   - Ou: `curl -X POST http://localhost:5001/auto-reply/reset`

### QR Code aparece toda vez?

- **Não delete** a pasta `C:\ninja_wp_data`
- Verifique permissões da pasta

### Mensagem não envia?

- Aguarde **30 segundos** após iniciar (aquecimento)
- Verifique se o campo de texto do WhatsApp carrega

---

## 📊 Monitoramento

Os logs do agent mostrarão:

```
👂 Monitor de conversas ativado! Respondendo automaticamente...
🔍 Verificando novas conversas...
  📱 Conversa: João Silva
  ✨ Nova conversa detectada! Respondendo João Silva...
  ✅ Enviado via selector: span[data-icon='send']
  ✅ Auto-resposta enviada para João Silva!
```

---

## 🎯 Dicas Pro

1. **Teste você mesmo**: Envie "Oi" de outro número para seu WhatsApp
2. **Monitore os logs**: Veja o terminal do agent para acompanhar em tempo real
3. **Use o Postman/Insomnia**: Para testar os endpoints da API
4. **Personalize por horário**: Edite as mensagens no JSON para diferentes períodos

---

## 📞 Suporte

- Veja a documentação completa em `README_AUTORESPONSE.md`
- Teste a API com `test_auto_reply.py`
- Verifique os logs do agent para debugging

---

**Feito com 🥷 por Fome Ninja**
