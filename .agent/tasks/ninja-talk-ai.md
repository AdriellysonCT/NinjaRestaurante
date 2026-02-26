# Task: Implementação do NinjaTalk AI 🥷💬

## Objetivo

Transformar o agente local (Python) em um assistente inteligente que envia mensagens humanizadas via WhatsApp para os clientes, notificando-os sobre o status do pedido (Aceito, Em Preparo, Saiu para Entrega) usando a API do Gemini.

## Arquitetura

1. **Frontend (React):** `StatusManager.jsx` dispara uma requisição para o agente local.
2. **Agente Local (Python):** Novo endpoint `/notify` recebe os dados.
3. **IA (Gemini):** Gera uma mensagem única e humanizada com base no status e nome do cliente.
4. **WhatsApp (Automação):** O agente abre o link do WhatsApp e simula o envio (estratégia anti-ban).

---

## 📅 Cronograma de Implementação

### Fase 1: Preparação do Agente Python

- [ ] Criar arquivo `.env` para armazenar a `GEMINI_API_KEY`.
- [ ] Instalar dependências: `pip install google-generativeai pyautogui`.
- [ ] Implementar a classe `NinjaTalkIA` no `agent.py`.
- [ ] Criar o endpoint `/notify`.

### Fase 2: Integração com Gemini

- [ ] Criar o prompt "Mestre Ninja" para garantir mensagens curtas e humanas.
- [ ] Implementar a lógica de variação de texto para evitar padrões detectáveis pelo WhatsApp.

### Fase 3: Lógica de Envio (WhatsApp MVP)

- [ ] Usar `webbrowser` para abrir o link `wa.me`.
- [ ] Usar `pyautogui` para pressionar "Enter" após um delay aleatório (simulando humano).
- [ ] Implementar o delay aleatório de 5 a 30 segundos.

### Fase 4: Gatilhos no Frontend

- [ ] Criar `src/services/notificationService.js`.
- [ ] Modificar `src/components/StatusManager.jsx` para disparar notificações nos status:
  - `aceito`
  - `pronto_para_entrega`
  - `coletado`

---

## 🛡️ Estratégia Anti-Ban (Modo Ninja)

- **Variação Textual:** Nenhuma mensagem será igual à outra graças à IA.
- **Delay Humano:** Espera aleatória antes de cada envio.
- **Limite de Status:** Apenas 3 mensagens por pedido.
- **Sem Links/Marketing:** Foco exclusivo no status do pedido.

---

## 🧪 Critérios de Aceite

- [ ] O agente recebe a requisição do painel sem erros.
- [ ] O Gemini gera uma frase coerente e amigável.
- [ ] O WhatsApp Web abre com a mensagem correta.
- [ ] O envio ocorre "automaticamente" (via simulação de teclado).
