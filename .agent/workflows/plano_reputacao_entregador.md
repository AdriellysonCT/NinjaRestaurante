# Plano de Implementação: Sistema de Reputação Automática (Entregadores)

Este documento descreve o plano técnico para implementar o sistema de reputação "passiva" para entregadores, onde a pontuação é mantida alta por padrão e reduzida apenas mediante críticas (denúncias) dos restaurantes.

## 1. Conceito Central

- **Modelo "Inocente até que se prove o contrário":** Todos começam ou tendem a 100% (5 estrelas).
- **Avaliação Passiva:** Entregas bem-sucedidas sem reclamação mantêm ou recuperam levemente a pontuação.
- **Punição por Crítica:** O restaurante só avalia quando algo dá errado. Isso gera perda de pontos significativa.
- **Consequência:** Entregadores com score baixo recebem menos ofertas de entrega ou são bloqueados de pedidos "VIP".

## 2. Estrutura de Dados (Supabase)

### Alteração na Tabela `profiles` (ou tabela específica de entregadores)

Adicionar colunas para controle de reputação:

```sql
alter table profiles
add column if not exists reputacao_score integer default 100, -- De 0 a 100
add column if not exists entregas_totais integer default 0,
add column if not exists denuncias_totais integer default 0;
```

### Nova Tabela: `avaliacoes_entregador`

Para registrar o histórico de ocorrências.

```sql
create table avaliacoes_entregador (
  id uuid default uuid_generate_v4() primary key,
  entregador_id uuid references auth.users(id),
  restaurante_id uuid references auth.users(id),
  pedido_id uuid references pedidos_padronizados(id),
  motivo text not null, -- Ex: 'atraso', 'grosseria', 'item_danificado'
  peso_punicao integer not null, -- Ex: -5, -10, -2
  comentario text,
  criado_em timestamp with time zone default now()
);
```

## 3. Lógica de Pontuação (Backend / Edge Functions)

### Tipos de Falta e Pesos (Sugestão)

1.  **Atraso injustificado:** -3 pontos.
2.  **Falta de educação/higiene:** -5 pontos.
3.  **Entrega errada/danificada:** -10 pontos.
4.  **Extravio (não entregou):** -50 pontos (bloqueio para análise).

### Mecanismo de Recuperação

A cada entrega concluída com sucesso (status `concluido` e sem registro em `avaliacoes_entregador` após X horas):

- Incrementar **+0.5 ponto** (até o teto de 100).
- Isso força o entregador "ruim" a fazer muitas entregas boas para recuperar a confiança do sistema.

## 4. Componentes Frontend (Painel Restaurante)

### A. Botão de "Reportar Problema"

No `OrderDetailModal`, adicionar um botão (vermelho/alerta) visível apenas após a coleta ou conclusão.

- "Reportar Entregador"

### B. Modal de Denúncia

- Select com motivos pré-definidos (Atraso, Postura, Dano, etc).
- Campo de texto opcional.
- Botão "Enviar Report".

## 5. Distribuição de Entregas (Algoritmo)

Ao distribuir pedidos (no backend/função de dispatch):

1.  Filtrar entregadores online e próximos.
2.  Ordenar por `reputacao_score` (do maior para o menor).
3.  Entregadores com score < 50 só recebem sobras ou ficam bloqueados temporariamente.

## 6. Passos para Execução

1.  Atualizar Schema do Banco (`profiles` e `avaliacoes_entregador`).
2.  Criar Modal de Denúncia no Frontend.
3.  Criar Trigger ou Edge Function para calcular a nova pontuação a cada denúncia.
4.  Criar Trigger ou rotina agendada para "curar" a pontuação (recuperação) após entregas bem sucedidas.
