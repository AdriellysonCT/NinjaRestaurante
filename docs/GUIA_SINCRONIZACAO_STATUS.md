# Guia de Sincronização de Status - Entregas ↔️ Pedidos

## 📋 Problema Resolvido

Quando um entregador aceita uma entrega no app Flutter:
- ❌ **ANTES**: Apenas `entregas_padronizadas.status` mudava para `aceito`
- ❌ **ANTES**: `pedidos_padronizados.status` permanecia como `pronto_para_entrega`
- ❌ **ANTES**: Painel do restaurante não refletia a mudança

- ✅ **AGORA**: Ambas as tabelas são sincronizadas automaticamente
- ✅ **AGORA**: Painel do restaurante atualiza em tempo real
- ✅ **AGORA**: Arquitetura limpa e consistente

## 🏗️ Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE SINCRONIZAÇÃO                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣ RESTAURANTE MARCA COMO PRONTO
   pedidos_padronizados.status = 'pronto_para_entrega'
                    ↓
   [TRIGGER 1: sync_pedido_para_entrega]
                    ↓
   INSERT em entregas_padronizadas (status = 'disponivel')


2️⃣ ENTREGADOR ACEITA NO APP FLUTTER
   entregas_padronizadas.status = 'aceito'
   entregas_padronizadas.id_entregador = 'xyz'
                    ↓
   [TRIGGER 2: sync_entrega_para_pedido] ⭐ NOVA
                    ↓
   UPDATE pedidos_padronizadas.status = 'aceito'
   UPDATE pedidos_padronizadas.id_entregador = 'xyz'
                    ↓
   [SUPABASE REALTIME]
                    ↓
   Dashboard atualiza em tempo real ⚡


3️⃣ ENTREGADOR COLETA O PEDIDO
   entregas_padronizadas.status = 'coletado'
                    ↓
   [TRIGGER 2: sync_entrega_para_pedido]
                    ↓
   UPDATE pedidos_padronizadas.status = 'coletado'
                    ↓
   Dashboard atualiza em tempo real ⚡


4️⃣ ENTREGADOR CONCLUI A ENTREGA
   entregas_padronizadas.status = 'concluido'
                    ↓
   [TRIGGER 2: sync_entrega_para_pedido]
                    ↓
   UPDATE pedidos_padronizadas.status = 'concluido'
                    ↓
   Dashboard atualiza em tempo real ⚡
```

## 🚀 Instalação

### Passo 1: Criar a Trigger de Sincronização

Execute no Supabase SQL Editor:

```bash
# Arquivo: criar_trigger_sync_entregas_para_pedidos.sql
```

Este script cria:
- ✅ Função `sync_entrega_para_pedido()`
- ✅ Trigger `trg_sync_entrega_para_pedido`
- ✅ Prevenção de loops infinitos
- ✅ Logs de debug

### Passo 2: Verificar a Instalação

Execute no Supabase SQL Editor:

```bash
# Arquivo: verificar_triggers_sincronizacao.sql
```

Resultado esperado:
- ✅ 2 triggers encontradas
- ✅ 2 funções encontradas
- ✅ Sem conflitos
- ✅ Sem loops infinitos

### Passo 3: Corrigir Pedidos Existentes (Opcional)

Se você já tem pedidos com status inconsistente:

```bash
# Arquivo: corrigir_sincronizacao_status.sql
```

Este script:
- ✅ Identifica pedidos inconsistentes
- ✅ Sincroniza status de entregas para pedidos
- ✅ Atualiza informações do entregador
- ✅ Gera relatório de correções

## 🔒 Prevenção de Loops Infinitos

### Como Funciona

**TRIGGER 1** (`pedidos_padronizados` → `entregas_padronizadas`):
- Evento: UPDATE de status
- Ação: **INSERT** em entregas (nunca UPDATE)
- Resultado: Não dispara TRIGGER 2

**TRIGGER 2** (`entregas_padronizadas` → `pedidos_padronizados`):
- Evento: UPDATE de status
- Ação: UPDATE em pedidos **APENAS SE STATUS DIFERENTE**
- Resultado: Não dispara TRIGGER 1 novamente

### Verificação de Segurança

```sql
-- A trigger verifica antes de atualizar:
IF v_pedido_status != 'aceito' THEN
  UPDATE pedidos_padronizados SET status = 'aceito' ...
END IF;
```

## 📊 Mapeamento de Status

| Status na Entrega | Status no Pedido | Ação                          |
|-------------------|------------------|-------------------------------|
| `disponivel`      | `pronto_para_entrega` | Nenhuma (criado pela TRIGGER 1) |
| `aceito`          | `aceito`         | ✅ Sincroniza + id_entregador |
| `coletado`        | `coletado`       | ✅ Sincroniza                 |
| `concluido`       | `concluido`      | ✅ Sincroniza                 |
| `cancelado`       | `cancelado`      | ✅ Sincroniza                 |

## 🧪 Testes

### Teste 1: Aceitação de Entrega

```sql
-- 1. Criar pedido de teste
INSERT INTO pedidos_padronizados (
  id_restaurante, numero_pedido, status, tipo_pedido, valor_total
) VALUES (
  'seu-restaurante-id', 9999, 'pronto_para_entrega', 'delivery', 50.00
);

-- 2. Verificar que a entrega foi criada
SELECT * FROM entregas_padronizadas WHERE numero_pedido = 9999;
-- Esperado: status = 'disponivel'

-- 3. Simular aceitação pelo entregador
UPDATE entregas_padronizadas 
SET 
  status = 'aceito',
  id_entregador = 'test-driver-id',
  nome_entregador = 'João Silva'
WHERE numero_pedido = 9999;

-- 4. Verificar sincronização
SELECT 
  numero_pedido,
  status,
  id_entregador,
  nome_entregador
FROM pedidos_padronizados 
WHERE numero_pedido = 9999;

-- ✅ Esperado: 
-- status = 'aceito'
-- id_entregador = 'test-driver-id'
-- nome_entregador = 'João Silva'
```

### Teste 2: Coleta de Pedido

```sql
-- Simular coleta
UPDATE entregas_padronizadas 
SET status = 'coletado'
WHERE numero_pedido = 9999;

-- Verificar sincronização
SELECT status FROM pedidos_padronizados WHERE numero_pedido = 9999;
-- ✅ Esperado: status = 'coletado'
```

### Teste 3: Conclusão de Entrega

```sql
-- Simular conclusão
UPDATE entregas_padronizadas 
SET status = 'concluido'
WHERE numero_pedido = 9999;

-- Verificar sincronização
SELECT status FROM pedidos_padronizados WHERE numero_pedido = 9999;
-- ✅ Esperado: status = 'concluido'
```

### Teste 4: Tempo Real no Dashboard

1. Abra o painel do restaurante
2. Abra o console do navegador (F12)
3. Execute o teste de aceitação acima
4. Observe os logs:

```
📨 Mudança detectada nos pedidos: UPDATE - Pedido #9999
  📊 Status mudou: "pronto_para_entrega" -> "aceito" (com entregador)
  🔔 Badge de atualização ativado para pedido #9999
  🔄 Recarregando pedidos em tempo real...
Mapeando pedido 9999: status="aceito", tipo_pedido="delivery", entregador="João Silva"
  -> Pedido ENTREGA 9999 mapeado para: aceito (aceito pelo entregador)
```

5. ✅ O pedido deve mover automaticamente para a coluna "Aceitos"

## 🐛 Troubleshooting

### Problema: Trigger não está funcionando

**Verificação:**
```sql
-- Verificar se a trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trg_sync_entrega_para_pedido';
```

**Solução:**
- Execute novamente `criar_trigger_sync_entregas_para_pedidos.sql`

### Problema: Status não sincroniza

**Verificação:**
```sql
-- Verificar logs do PostgreSQL
-- Procure por mensagens como:
-- "Sincronizando entrega -> pedido"
-- "Pedido X atualizado para ACEITO"
```

**Solução:**
- Verifique se o `id_pedido` está correto na tabela `entregas_padronizadas`
- Execute `corrigir_sincronizacao_status.sql` para corrigir inconsistências

### Problema: Loop infinito detectado

**Verificação:**
```sql
-- Verificar se há atualizações em loop
SELECT COUNT(*) FROM pedidos_padronizados 
WHERE atualizado_em > NOW() - INTERVAL '1 minute';
```

**Solução:**
- Isso NÃO deve acontecer devido às verificações de segurança
- Se acontecer, desabilite temporariamente as triggers:
```sql
ALTER TABLE entregas_padronizadas DISABLE TRIGGER trg_sync_entrega_para_pedido;
```

## 📝 Logs e Monitoramento

### Logs da Trigger

A trigger gera logs detalhados:

```
NOTICE: Sincronizando entrega -> pedido: 1234 (disponivel -> aceito)
NOTICE: ✅ Pedido 1234 atualizado para ACEITO (entregador: João Silva)
```

### Monitoramento de Sincronização

```sql
-- Verificar pedidos sincronizados nas últimas 24h
SELECT 
  p.numero_pedido,
  p.status AS status_pedido,
  e.status AS status_entrega,
  p.nome_entregador,
  p.atualizado_em
FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.tipo_pedido = 'delivery'
  AND p.atualizado_em > NOW() - INTERVAL '24 hours'
ORDER BY p.atualizado_em DESC;
```

## ✅ Checklist de Validação

- [ ] Trigger `trg_sync_entrega_para_pedido` criada
- [ ] Função `sync_entrega_para_pedido()` criada
- [ ] Teste de aceitação passou
- [ ] Teste de coleta passou
- [ ] Teste de conclusão passou
- [ ] Dashboard atualiza em tempo real
- [ ] Sem loops infinitos detectados
- [ ] Pedidos existentes corrigidos (se necessário)

## 🎯 Resultado Final

✅ **Sincronização Bidirecional Completa**
- Pedidos → Entregas (TRIGGER 1 - já existia)
- Entregas → Pedidos (TRIGGER 2 - nova)

✅ **Atualização em Tempo Real**
- Supabase Realtime detecta mudanças
- Dashboard atualiza automaticamente
- Sem necessidade de refresh manual

✅ **Arquitetura Limpa**
- Sem duplicação de lógica
- Sem modificação no app Flutter
- Sem novas colunas
- Triggers trabalham em harmonia

✅ **Prevenção de Problemas**
- Loops infinitos prevenidos
- Verificações de segurança
- Logs detalhados para debug
- Fácil manutenção
