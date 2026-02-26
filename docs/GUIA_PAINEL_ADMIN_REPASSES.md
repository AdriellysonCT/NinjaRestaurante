# 📋 Guia do Painel Admin - Gerenciamento de Repasses

## 🎯 Visão Geral

O sistema de repasses permite que restaurantes solicitem o pagamento dos valores acumulados em suas vendas. O painel administrativo é responsável por aprovar, processar e confirmar esses repasses.

---

## 📊 Estrutura de Dados

### Tabelas Principais

#### 1. **repasses_restaurantes**
Controla o saldo consolidado de cada restaurante.

```sql
- id_restaurante (UUID) - FK para restaurantes_app
- total_vendas_confirmadas (NUMERIC) - Total de vendas confirmadas
- total_repassado (NUMERIC) - Total já pago ao restaurante
- saldo_pendente (NUMERIC) - Saldo disponível para saque
- taxa_plataforma (NUMERIC) - Taxa cobrada (ex: 0.05 = 5%)
- ultima_atualizacao (TIMESTAMP)
```

#### 2. **historico_repasses**
Registra cada solicitação de repasse.

```sql
- id (UUID) - Chave primária
- id_restaurante (UUID) - FK para restaurantes_app
- id_admin (UUID) - Admin que aprovou (opcional)
- valor (NUMERIC) - Valor solicitado
- data_repasse (TIMESTAMP) - Data do pagamento
- metodo (TEXT) - Método de pagamento (pix_manual, transferencia, etc)
- comprovante_url (TEXT) - Link do comprovante
- observacao (TEXT) - Observações
- status (TEXT) - pendente, processando, aprovado, pago, cancelado
- criado_em (TIMESTAMP)
```

#### 3. **restaurantes_app**
Dados do restaurante, incluindo chave PIX.

```sql
- id (UUID)
- chave_pix (TEXT) - Chave PIX cadastrada
- nome_fantasia (TEXT)
- cnpj (TEXT)
- email (TEXT)
- telefone (TEXT)
```

---

## 🔄 Fluxo de Repasse

### 1️⃣ Restaurante Solicita Repasse

**Painel do Restaurante:**
- Acessa: `Financeiro > Repasses`
- Visualiza saldo disponível
- Seleciona valor e prazo (1, 7 ou 15 dias)
- Confirma chave PIX cadastrada
- Envia solicitação

**Banco de Dados:**
```sql
-- Cria registro no histórico
INSERT INTO historico_repasses (
  id_restaurante,
  valor,
  metodo,
  observacao,
  status
) VALUES (
  'uuid-restaurante',
  150.00,
  'pix_manual',
  'Solicitação via painel',
  'pendente'
);

-- Atualiza saldo pendente
UPDATE repasses_restaurantes
SET saldo_pendente = saldo_pendente - 150.00,
    ultima_atualizacao = NOW()
WHERE id_restaurante = 'uuid-restaurante';
```

### 2️⃣ Admin Visualiza Solicitações

**Query para listar solicitações pendentes:**

```sql
SELECT 
  hr.id,
  hr.valor,
  hr.criado_em,
  hr.observacao,
  hr.status,
  r.nome_fantasia,
  r.chave_pix,
  r.telefone,
  r.email,
  rr.saldo_pendente,
  rr.total_vendas_confirmadas
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
INNER JOIN repasses_restaurantes rr ON rr.id_restaurante = hr.id_restaurante
WHERE hr.status = 'pendente'
ORDER BY hr.criado_em ASC;
```

### 3️⃣ Admin Processa Pagamento

**Passos:**
1. Verificar chave PIX do restaurante
2. Realizar transferência via sistema bancário
3. Obter comprovante
4. Atualizar status no banco

**Query de aprovação:**

```sql
-- Atualizar status para processando
UPDATE historico_repasses
SET 
  status = 'processando',
  id_admin = 'uuid-admin'
WHERE id = 'uuid-solicitacao';
```

### 4️⃣ Admin Confirma Pagamento

**Query de confirmação:**

```sql
-- Marcar como pago
UPDATE historico_repasses
SET 
  status = 'pago',
  data_repasse = NOW(),
  comprovante_url = 'https://storage.supabase.co/comprovante.pdf'
WHERE id = 'uuid-solicitacao';

-- Atualizar total repassado
UPDATE repasses_restaurantes
SET 
  total_repassado = total_repassado + 150.00,
  ultima_atualizacao = NOW()
WHERE id_restaurante = 'uuid-restaurante';
```

---

## 🛠️ Queries Úteis para o Admin

### Listar Todos os Repasses Pendentes

```sql
SELECT 
  hr.id,
  r.nome_fantasia AS restaurante,
  r.chave_pix,
  hr.valor,
  hr.criado_em,
  EXTRACT(DAY FROM (NOW() - hr.criado_em)) AS dias_aguardando,
  hr.observacao
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
WHERE hr.status = 'pendente'
ORDER BY hr.criado_em ASC;
```

### Verificar Saldo de um Restaurante

```sql
SELECT 
  r.nome_fantasia,
  rr.total_vendas_confirmadas,
  rr.total_repassado,
  rr.saldo_pendente,
  rr.taxa_plataforma,
  (rr.total_vendas_confirmadas * rr.taxa_plataforma) AS taxa_total_cobrada
FROM repasses_restaurantes rr
INNER JOIN restaurantes_app r ON r.id = rr.id_restaurante
WHERE rr.id_restaurante = 'uuid-restaurante';
```

### Histórico Completo de um Restaurante

```sql
SELECT 
  hr.criado_em,
  hr.valor,
  hr.status,
  hr.metodo,
  hr.data_repasse,
  hr.observacao,
  hr.comprovante_url
FROM historico_repasses hr
WHERE hr.id_restaurante = 'uuid-restaurante'
ORDER BY hr.criado_em DESC;
```

### Relatório de Repasses do Mês

```sql
SELECT 
  r.nome_fantasia,
  COUNT(hr.id) AS total_solicitacoes,
  SUM(hr.valor) AS valor_total,
  SUM(CASE WHEN hr.status = 'pago' THEN hr.valor ELSE 0 END) AS valor_pago,
  SUM(CASE WHEN hr.status = 'pendente' THEN hr.valor ELSE 0 END) AS valor_pendente
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
WHERE EXTRACT(MONTH FROM hr.criado_em) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM hr.criado_em) = EXTRACT(YEAR FROM NOW())
GROUP BY r.id, r.nome_fantasia
ORDER BY valor_total DESC;
```

### Restaurantes com Maior Saldo Pendente

```sql
SELECT 
  r.nome_fantasia,
  r.telefone,
  r.email,
  rr.saldo_pendente,
  rr.ultima_atualizacao
FROM repasses_restaurantes rr
INNER JOIN restaurantes_app r ON r.id = rr.id_restaurante
WHERE rr.saldo_pendente > 0
ORDER BY rr.saldo_pendente DESC
LIMIT 10;
```

---

## 🚨 Ações Administrativas

### Cancelar uma Solicitação

```sql
-- Cancelar e devolver saldo
BEGIN;

UPDATE historico_repasses
SET 
  status = 'cancelado',
  observacao = CONCAT(observacao, ' | Cancelado pelo admin em ', NOW())
WHERE id = 'uuid-solicitacao';

-- Devolver valor ao saldo pendente
UPDATE repasses_restaurantes rr
SET saldo_pendente = saldo_pendente + (
  SELECT valor FROM historico_repasses WHERE id = 'uuid-solicitacao'
)
WHERE id_restaurante = (
  SELECT id_restaurante FROM historico_repasses WHERE id = 'uuid-solicitacao'
);

COMMIT;
```

### Ajustar Saldo Manualmente

```sql
-- Adicionar crédito manual (ex: correção)
UPDATE repasses_restaurantes
SET 
  saldo_pendente = saldo_pendente + 100.00,
  ultima_atualizacao = NOW()
WHERE id_restaurante = 'uuid-restaurante';

-- Registrar no histórico
INSERT INTO historico_repasses (
  id_restaurante,
  valor,
  metodo,
  observacao,
  status,
  data_repasse
) VALUES (
  'uuid-restaurante',
  100.00,
  'ajuste_manual',
  'Ajuste manual realizado pelo admin',
  'pago',
  NOW()
);
```

### Alterar Taxa da Plataforma

```sql
-- Alterar taxa de um restaurante específico
UPDATE repasses_restaurantes
SET 
  taxa_plataforma = 0.03, -- 3%
  ultima_atualizacao = NOW()
WHERE id_restaurante = 'uuid-restaurante';
```

---

## 📧 Notificações

### Quando Notificar o Restaurante

1. **Solicitação Recebida** - Confirmar recebimento
2. **Pagamento Processado** - Informar que foi pago
3. **Solicitação Cancelada** - Explicar motivo
4. **Saldo Disponível** - Lembrar de solicitar repasse

### Template de E-mail

```
Assunto: Repasse Processado - R$ 150,00

Olá [Nome do Restaurante],

Seu repasse no valor de R$ 150,00 foi processado com sucesso!

Detalhes:
- Valor: R$ 150,00
- Chave PIX: [chave_pix]
- Data: [data_repasse]
- Comprovante: [link_comprovante]

O valor deve estar disponível em sua conta em até 24 horas.

Atenciosamente,
Equipe Fome Ninja
```

---

## 🔐 Segurança e Auditoria

### Log de Ações do Admin

```sql
-- Criar tabela de auditoria (se não existir)
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

-- Registrar ação
INSERT INTO auditoria_repasses (
  id_admin,
  id_repasse,
  acao,
  observacao
) VALUES (
  'uuid-admin',
  'uuid-repasse',
  'aprovar',
  'Repasse aprovado e pago via PIX'
);
```

---

## 📊 Dashboard Admin - Métricas

### KPIs Importantes

```sql
-- Total de repasses no mês
SELECT 
  COUNT(*) AS total_repasses,
  SUM(valor) AS valor_total,
  AVG(valor) AS ticket_medio
FROM historico_repasses
WHERE EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW())
  AND status = 'pago';

-- Tempo médio de processamento
SELECT 
  AVG(EXTRACT(EPOCH FROM (data_repasse - criado_em)) / 3600) AS horas_media
FROM historico_repasses
WHERE status = 'pago'
  AND data_repasse IS NOT NULL;

-- Taxa de aprovação
SELECT 
  COUNT(CASE WHEN status = 'pago' THEN 1 END) * 100.0 / COUNT(*) AS taxa_aprovacao
FROM historico_repasses
WHERE EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW());
```

---

## 🎯 Checklist de Processamento

- [ ] Verificar identidade do restaurante
- [ ] Confirmar chave PIX cadastrada
- [ ] Validar saldo disponível
- [ ] Realizar transferência bancária
- [ ] Salvar comprovante
- [ ] Atualizar status no banco
- [ ] Enviar notificação ao restaurante
- [ ] Registrar na auditoria

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Verificar logs de erro no Supabase
- Consultar histórico de transações
- Contatar equipe técnica

---

**Última atualização:** Janeiro 2026
