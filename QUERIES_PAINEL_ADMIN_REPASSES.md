# 📊 Queries SQL para Painel Admin - Gerenciamento de Repasses

## 🎯 Visão Geral

Este documento contém todas as queries SQL necessárias para o painel administrativo gerenciar repasses de restaurantes.

---

## 1️⃣ LISTAR SOLICITAÇÕES PENDENTES

### Query Principal (Para Dashboard Admin)

```sql
-- Ver todas as solicitações pendentes aguardando aprovação
SELECT 
  hr.id,
  hr.valor,
  hr.criado_em,
  hr.observacao,
  r.nome_fantasia AS restaurante,
  r.chave_pix,
  r.telefone,
  r.email,
  rr.saldo_pendente AS saldo_atual,
  rr.total_vendas_confirmadas,
  EXTRACT(HOUR FROM (NOW() - hr.criado_em)) AS horas_aguardando
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
LEFT JOIN repasses_restaurantes rr ON rr.id_restaurante = hr.id_restaurante
WHERE hr.status = 'pendente'
ORDER BY hr.criado_em ASC;
```

**Resultado esperado:**
- Lista de todas as solicitações pendentes
- Dados do restaurante (nome, PIX, contato)
- Tempo de espera em horas
- Saldo atual do restaurante

---

## 2️⃣ APROVAR E PROCESSAR REPASSE

### Passo 1: Marcar como Processando

```sql
-- Quando admin começar a processar
UPDATE historico_repasses
SET 
  status = 'processando',
  id_admin = 'UUID_DO_ADMIN_AQUI' -- Opcional
WHERE id = 'UUID_DA_SOLICITACAO';
```

### Passo 2: Realizar Transferência PIX

**Ação Manual:** Fazer a transferência PIX usando a chave cadastrada.

### Passo 3: Confirmar Pagamento

```sql
-- Após confirmar o pagamento
BEGIN;

-- Atualizar status para pago
UPDATE historico_repasses
SET 
  status = 'pago',
  data_repasso = NOW(),
  comprovante_url = 'https://exemplo.com/comprovante.pdf' -- Opcional
WHERE id = 'UUID_DA_SOLICITACAO';

-- Atualizar total repassado do restaurante
UPDATE repasses_restaurantes
SET 
  total_repassado = total_repassado + (
    SELECT valor FROM historico_repasses WHERE id = 'UUID_DA_SOLICITACAO'
  ),
  ultima_atualizacao = NOW()
WHERE id_restaurante = (
  SELECT id_restaurante FROM historico_repasses WHERE id = 'UUID_DA_SOLICITACAO'
);

COMMIT;
```

---

## 3️⃣ CANCELAR SOLICITAÇÃO

```sql
-- Cancelar e devolver saldo ao restaurante
BEGIN;

-- Marcar como cancelado
UPDATE historico_repasses
SET 
  status = 'cancelado',
  observacao = CONCAT(
    COALESCE(observacao, ''), 
    ' | Cancelado pelo admin em ', 
    NOW()::TEXT
  )
WHERE id = 'UUID_DA_SOLICITACAO';

-- Devolver valor ao saldo pendente
UPDATE repasses_restaurantes
SET 
  saldo_pendente = saldo_pendente + (
    SELECT valor FROM historico_repasses WHERE id = 'UUID_DA_SOLICITACAO'
  ),
  ultima_atualizacao = NOW()
WHERE id_restaurante = (
  SELECT id_restaurante FROM historico_repasses WHERE id = 'UUID_DA_SOLICITACAO'
);

COMMIT;
```

---

## 4️⃣ CONSULTAS DE MONITORAMENTO

### Ver Detalhes de um Restaurante

```sql
SELECT 
  r.nome_fantasia,
  r.chave_pix,
  r.telefone,
  r.email,
  rr.total_vendas_confirmadas,
  rr.total_repassado,
  rr.saldo_pendente,
  rr.taxa_plataforma,
  (rr.total_vendas_confirmadas * rr.taxa_plataforma) AS taxa_total_cobrada,
  COUNT(hr.id) AS total_solicitacoes,
  SUM(CASE WHEN hr.status = 'pendente' THEN hr.valor ELSE 0 END) AS valor_pendente_aprovacao,
  SUM(CASE WHEN hr.status = 'pago' THEN hr.valor ELSE 0 END) AS valor_ja_pago
FROM restaurantes_app r
LEFT JOIN repasses_restaurantes rr ON rr.id_restaurante = r.id
LEFT JOIN historico_repasses hr ON hr.id_restaurante = r.id
WHERE r.id = 'UUID_DO_RESTAURANTE'
GROUP BY r.id, r.nome_fantasia, r.chave_pix, r.telefone, r.email,
         rr.total_vendas_confirmadas, rr.total_repassado, rr.saldo_pendente, rr.taxa_plataforma;
```

### Histórico Completo de um Restaurante

```sql
SELECT 
  hr.criado_em,
  hr.valor,
  hr.status,
  hr.metodo,
  hr.data_repasso,
  hr.observacao,
  hr.comprovante_url
FROM historico_repasses hr
WHERE hr.id_restaurante = 'UUID_DO_RESTAURANTE'
ORDER BY hr.criado_em DESC;
```

### Relatório do Mês

```sql
SELECT 
  r.nome_fantasia,
  COUNT(hr.id) AS total_solicitacoes,
  SUM(hr.valor) AS valor_total_solicitado,
  SUM(CASE WHEN hr.status = 'pago' THEN hr.valor ELSE 0 END) AS valor_pago,
  SUM(CASE WHEN hr.status = 'pendente' THEN hr.valor ELSE 0 END) AS valor_pendente,
  SUM(CASE WHEN hr.status = 'cancelado' THEN hr.valor ELSE 0 END) AS valor_cancelado
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
WHERE EXTRACT(MONTH FROM hr.criado_em) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM hr.criado_em) = EXTRACT(YEAR FROM NOW())
GROUP BY r.id, r.nome_fantasia
ORDER BY valor_total_solicitado DESC;
```

### Restaurantes com Maior Saldo Pendente

```sql
SELECT 
  r.nome_fantasia,
  r.telefone,
  r.email,
  r.chave_pix,
  rr.saldo_pendente,
  rr.total_vendas_confirmadas,
  rr.ultima_atualizacao
FROM repasses_restaurantes rr
INNER JOIN restaurantes_app r ON r.id = rr.id_restaurante
WHERE rr.saldo_pendente > 0
ORDER BY rr.saldo_pendente DESC
LIMIT 10;
```

---

## 5️⃣ ESTATÍSTICAS GERAIS

### Dashboard Admin - KPIs

```sql
-- Métricas principais para o dashboard
SELECT 
  COUNT(*) AS total_repasses,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) AS pendentes,
  COUNT(CASE WHEN status = 'processando' THEN 1 END) AS processando,
  COUNT(CASE WHEN status = 'pago' THEN 1 END) AS pagos,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) AS cancelados,
  SUM(valor) AS valor_total,
  SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) AS valor_pago,
  SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS valor_pendente,
  AVG(CASE WHEN status = 'pago' THEN valor END) AS ticket_medio
FROM historico_repasses
WHERE EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW());
```

### Tempo Médio de Processamento

```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (data_repasso - criado_em)) / 3600) AS horas_media_processamento,
  MIN(EXTRACT(EPOCH FROM (data_repasso - criado_em)) / 3600) AS horas_minimo,
  MAX(EXTRACT(EPOCH FROM (data_repasso - criado_em)) / 3600) AS horas_maximo
FROM historico_repasses
WHERE status = 'pago'
  AND data_repasso IS NOT NULL
  AND EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW());
```

### Taxa de Aprovação

```sql
SELECT 
  COUNT(*) AS total_solicitacoes,
  COUNT(CASE WHEN status = 'pago' THEN 1 END) AS aprovadas,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) AS canceladas,
  ROUND(
    COUNT(CASE WHEN status = 'pago' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) AS taxa_aprovacao_percentual
FROM historico_repasses
WHERE EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW());
```

---

## 6️⃣ AÇÕES ADMINISTRATIVAS ESPECIAIS

### Ajustar Saldo Manualmente (Correção)

```sql
-- Adicionar crédito manual ao restaurante
BEGIN;

-- Atualizar saldo
UPDATE repasses_restaurantes
SET 
  saldo_pendente = saldo_pendente + 100.00,
  ultima_atualizacao = NOW()
WHERE id_restaurante = 'UUID_DO_RESTAURANTE';

-- Registrar no histórico
INSERT INTO historico_repasses (
  id_restaurante,
  valor,
  metodo,
  observacao,
  status,
  data_repasso
) VALUES (
  'UUID_DO_RESTAURANTE',
  100.00,
  'ajuste_manual',
  'Ajuste manual realizado pelo admin - [MOTIVO]',
  'pago',
  NOW()
);

COMMIT;
```

### Alterar Taxa da Plataforma

```sql
-- Alterar taxa de um restaurante específico
UPDATE repasses_restaurantes
SET 
  taxa_plataforma = 0.03, -- 3%
  ultima_atualizacao = NOW()
WHERE id_restaurante = 'UUID_DO_RESTAURANTE';
```

### Reprocessar Repasse Falhado

```sql
-- Voltar status para pendente para reprocessar
UPDATE historico_repasses
SET 
  status = 'pendente',
  observacao = CONCAT(
    COALESCE(observacao, ''), 
    ' | Reprocessado em ', 
    NOW()::TEXT
  )
WHERE id = 'UUID_DA_SOLICITACAO'
  AND status IN ('cancelado', 'processando');
```

---

## 7️⃣ NOTIFICAÇÕES E ALERTAS

### Solicitações Antigas (Mais de 24h)

```sql
-- Alertar sobre solicitações pendentes há mais de 24 horas
SELECT 
  hr.id,
  r.nome_fantasia,
  r.telefone,
  r.email,
  hr.valor,
  hr.criado_em,
  EXTRACT(HOUR FROM (NOW() - hr.criado_em)) AS horas_aguardando
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
WHERE hr.status = 'pendente'
  AND hr.criado_em < NOW() - INTERVAL '24 hours'
ORDER BY hr.criado_em ASC;
```

### Restaurantes sem Chave PIX

```sql
-- Restaurantes que têm saldo mas não cadastraram PIX
SELECT 
  r.nome_fantasia,
  r.telefone,
  r.email,
  rr.saldo_pendente
FROM restaurantes_app r
INNER JOIN repasses_restaurantes rr ON rr.id_restaurante = r.id
WHERE r.chave_pix IS NULL
  AND rr.saldo_pendente > 0
ORDER BY rr.saldo_pendente DESC;
```

---

## 8️⃣ AUDITORIA E LOGS

### Criar Tabela de Auditoria (Se não existir)

```sql
CREATE TABLE IF NOT EXISTS auditoria_repasses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_admin UUID NOT NULL,
  id_repasse UUID NOT NULL,
  acao TEXT NOT NULL, -- 'aprovar', 'cancelar', 'ajustar'
  valor_anterior NUMERIC,
  valor_novo NUMERIC,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_auditoria_repasses_admin 
ON auditoria_repasses(id_admin);

CREATE INDEX IF NOT EXISTS idx_auditoria_repasses_repasse 
ON auditoria_repasses(id_repasse);
```

### Registrar Ação do Admin

```sql
-- Registrar cada ação importante
INSERT INTO auditoria_repasses (
  id_admin,
  id_repasse,
  acao,
  observacao
) VALUES (
  'UUID_DO_ADMIN',
  'UUID_DO_REPASSE',
  'aprovar',
  'Repasse aprovado e pago via PIX'
);
```

---

## 9️⃣ SINCRONIZAÇÃO COM PAINEL DO RESTAURANTE

### Como o Restaurante Vê as Atualizações

O painel do restaurante está configurado para:

1. **Realtime Updates**: Usa Supabase Realtime para atualizar automaticamente
2. **Polling**: Recarrega dados a cada ação do usuário
3. **Status Visual**: Badge colorido mostra o status atual

### Fluxo de Sincronização

```
ADMIN APROVA REPASSE (SQL)
    ↓
Supabase atualiza tabela historico_repasses
    ↓
Realtime notifica painel do restaurante
    ↓
Componente React atualiza automaticamente
    ↓
Restaurante vê "✓ Pago" em verde
```

---

## 🔟 CHECKLIST DE PROCESSAMENTO

Para cada solicitação pendente, o admin deve:

- [ ] Verificar identidade do restaurante
- [ ] Confirmar chave PIX cadastrada
- [ ] Validar saldo disponível
- [ ] Realizar transferência bancária
- [ ] Salvar comprovante (opcional)
- [ ] Executar SQL de confirmação
- [ ] Verificar se restaurante viu atualização

---

## 📞 QUERIES DE SUPORTE

### Verificar Sincronização

```sql
-- Ver se a solicitação foi criada corretamente
SELECT * FROM historico_repasses 
WHERE id_restaurante = 'UUID_DO_RESTAURANTE'
ORDER BY criado_em DESC
LIMIT 5;
```

### Verificar RLS (Permissões)

```sql
-- Ver políticas ativas
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('historico_repasses', 'repasses_restaurantes')
ORDER BY tablename, cmd;
```

---

## 🎯 RESUMO EXECUTIVO

### Para Processar um Repasse:

1. **Listar pendentes**: Query da seção 1
2. **Marcar processando**: Query da seção 2 (Passo 1)
3. **Fazer PIX**: Ação manual
4. **Confirmar pagamento**: Query da seção 2 (Passo 3)
5. **Verificar**: Restaurante deve ver "✓ Pago"

### Queries Mais Usadas:

- **Dashboard**: Seção 5 (KPIs)
- **Processar**: Seção 2 (Passo 3)
- **Cancelar**: Seção 3
- **Monitorar**: Seção 4

---

**Data:** Janeiro 2026  
**Status:** ✅ Pronto para Uso  
**Sincronização:** ✅ Automática via Realtime
