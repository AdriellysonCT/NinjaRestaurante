# Plano de Implementação: Comunicação Híbrida (Chat + WhatsApp)

Este documento descreve o plano técnico para implementar o sistema de comunicação entre Restaurante e Entregador, utilizando uma abordagem híbrida de Chat Interno (via Supabase) e redirecionamento para WhatsApp.

## 1. Visão Geral

O objetivo é fornecer um canal de comunicação oficial e registrado dentro do sistema, mantendo a praticidade do WhatsApp para emergências.

## 2. Estrutura de Dados (Supabase)

### Tabela: `mensagens_entrega`

Precisaremos criar uma tabela para armazenar as mensagens do chat interno.

```sql
create table mensagens_entrega (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references pedidos_padronizados(id),
  remetente_id uuid references auth.users(id),
  tipo_remetente text check (tipo_remetente in ('restaurante', 'entregador')),
  conteudo text not null,
  lida boolean default false,
  criado_em timestamp with time zone default now()
);

-- Políticas RLS (Segurança)
-- Restaurante vê msgs dos seus pedidos.
-- Entregador vê msgs das suas entregas.
```

## 3. Componentes Frontend

### A. Botão de Ação no Modal de Detalhes (`OrderDetailModal.jsx`)

Adicionar uma nova seção "Comunicação":

1.  **Botão "Chat Interno":** Abre um drawer/modal lateral com o histórico de mensagens.
2.  **Botão "WhatsApp":** Link direto usando a API do WhatsApp (`wa.me`) com uma mensagem pré-definida (ex: "Olá, sobre o pedido #123...").

### B. Componente de Chat (`DeliveryChat.jsx`)

- **Lista de Mensagens:** Exibe balões de conversa (verde para restaurante, cinza para entregador).
- **Input de Texto:** Campo simples para digitar e enviar.
- **Realtime:** Usar `supabase.channel` para escutar novas mensagens na tabela `mensagens_entrega` e atualizar a tela instantaneamente sem reload.
- **Notificação Visual:** Um ponto vermelho no ícone de chat do pedido se houver mensagens não lidas (`lida = false`).

## 4. Lógica de Negócio

### Fluxo de Envio

1.  Restaurante digita e envia.
2.  Salva em `mensagens_entrega`.
3.  Dispara notificação push para o App do Entregador (OneSignal ou similar).

### Fluxo de Recebimento

1.  O sistema escuta o canal Realtime.
2.  Ao chegar mensagem nova, toca um som discreto no painel do restaurante e mostra badge no pedido.

## 5. Integração WhatsApp (Plano B)

- Verificar se `entregas_padronizadas.id_entregador` possui telefone cadastrado no `profiles`.
- Se sim, habilitar o botão.
- Link: `https://wa.me/55[TELEFONE]?text=O%20pedido%20[ID]%20teve%20um%20problema...`

## 6. Passos para Execução

1.  Criar Tabela no Supabase (SQL).
2.  Criar Componente `DeliveryChat.jsx`.
3.  Integrar componente no `OrderDetailModal`.
4.  Implementar lógica de Realtime.
5.  Adicionar botão de WhatsApp.
