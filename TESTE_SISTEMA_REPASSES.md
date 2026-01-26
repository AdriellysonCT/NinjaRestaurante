# 🧪 Guia de Teste - Sistema de Repasses

## ✅ Migrações Aplicadas

As seguintes migrações foram aplicadas com sucesso no banco de dados:

1. ✅ Coluna `status` adicionada em `historico_repasses`
2. ✅ Coluna `criado_em` adicionada em `historico_repasses`
3. ✅ Índices criados para performance
4. ✅ Comentários adicionados nas colunas

---

## 🎯 Como Testar o Sistema

### Passo 1: Verificar Chave PIX

Primeiro, certifique-se de que o restaurante tem uma chave PIX cadastrada:

```sql
-- Verificar chave PIX
SELECT 
  id,
  nome_fantasia,
  chave_pix,
  email,
  telefone
FROM restaurantes_app
WHERE user_id = 'SEU_USER_ID_AQUI';
```

Se não tiver chave PIX, adicione:

```sql
-- Adicionar chave PIX
UPDATE restaurantes_app
SET chave_pix = '11999999999' -- ou email@exemplo.com
WHERE id = 'UUID_DO_RESTAURANTE';
```

---

### Passo 2: Adicionar Saldo de Teste

Para testar, adicione um saldo disponível:

```sql
-- Verificar se existe registro
SELECT * FROM repasses_restaurantes 
WHERE id_restaurante = 'UUID_DO_RESTAURANTE';

-- Se não existir, criar
INSERT INTO repasses_restaurantes (
  id_restaurante,
  total_vendas_confirmadas,
  total_repassado,
  saldo_pendente,
  taxa_plataforma
) VALUES (
  'UUID_DO_RESTAURANTE',
  1000.00,  -- Total de vendas
  0.00,     -- Ainda não repassado
  950.00,   -- Saldo disponível (1000 - 5% taxa)
  0.05      -- 5% de taxa
);

-- Se já existir, atualizar
UPDATE repasses_restaurantes
SET 
  total_vendas_confirmadas = 1000.00,
  saldo_pendente = 950.00,
  taxa_plataforma = 0.05
WHERE id_restaurante = 'UUID_DO_RESTAURANTE';
```

---

### Passo 3: Acessar o Painel

1. Faça login no painel do restaurante
2. Vá em: **Financeiro > Repasses**
3. Você deve ver:
   - ✅ Saldo Disponível: R$ 950,00
   - ✅ Chave PIX cadastrada
   - ✅ Formulário de solicitação

---

### Passo 4: Solicitar Repasse

1. Digite o valor (ex: R$ 500,00)
2. Escolha o prazo (1, 7 ou 15 dias)
3. Adicione uma observação (opcional)
4. Clique em "Solicitar Repasse"

**O que acontece:**
- ✅ Registro criado em `historico_repasses` com status `pendente`
- ✅ Saldo pendente atualizado em `repasses_restaurantes`
- ✅ Notificação de sucesso exibida
- ✅ Histórico atualizado automaticamente

---

### Passo 5: Verificar no Banco (Admin)

```sql
-- Ver solicitações pendentes
SELECT 
  hr.id,
  r.nome_fantasia,
  r.chave_pix,
  hr.valor,
  hr.criado_em,
  hr.status,
  hr.observacao,
  EXTRACT(HOUR FROM (NOW() - hr.criado_em)) AS horas_aguardando
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
WHERE hr.status = 'pendente'
ORDER BY hr.criado_em ASC;
```

---

### Passo 6: Processar Repasse (Admin)

#### 6.1 Marcar como Processando

```sql
UPDATE historico_repasses
SET 
  status = 'processando',
  id_admin = 'UUID_DO_ADMIN'
WHERE id = 'UUID_DA_SOLICITACAO';
```

#### 6.2 Realizar Pagamento

Faça a transferência PIX manualmente usando a chave cadastrada.

#### 6.3 Confirmar Pagamento

```sql
-- Marcar como pago
UPDATE historico_repasses
SET 
  status = 'pago',
  data_repasso = NOW(),
  comprovante_url = 'https://exemplo.com/comprovante.pdf'
WHERE id = 'UUID_DA_SOLICITACAO';

-- Atualizar total repassado
UPDATE repasses_restaurantes
SET 
  total_repassado = total_repassado + 500.00,
  ultima_atualizacao = NOW()
WHERE id_restaurante = (
  SELECT id_restaurante 
  FROM historico_repasses 
  WHERE id = 'UUID_DA_SOLICITACAO'
);
```

---

### Passo 7: Verificar no Painel do Restaurante

O restaurante verá automaticamente:
- ✅ Status atualizado para "Pago"
- ✅ Data do pagamento
- ✅ Link do comprovante (se disponível)
- ✅ Saldo atualizado

---

## 🔍 Queries de Diagnóstico

### Ver Todos os Dados de um Restaurante

```sql
SELECT 
  r.nome_fantasia,
  r.chave_pix,
  rr.total_vendas_confirmadas,
  rr.total_repassado,
  rr.saldo_pendente,
  rr.taxa_plataforma,
  COUNT(hr.id) AS total_solicitacoes,
  SUM(CASE WHEN hr.status = 'pendente' THEN hr.valor ELSE 0 END) AS valor_pendente,
  SUM(CASE WHEN hr.status = 'pago' THEN hr.valor ELSE 0 END) AS valor_pago
FROM restaurantes_app r
LEFT JOIN repasses_restaurantes rr ON rr.id_restaurante = r.id
LEFT JOIN historico_repasses hr ON hr.id_restaurante = r.id
WHERE r.id = 'UUID_DO_RESTAURANTE'
GROUP BY r.id, r.nome_fantasia, r.chave_pix, rr.total_vendas_confirmadas, 
         rr.total_repassado, rr.saldo_pendente, rr.taxa_plataforma;
```

### Listar Todos os Repasses

```sql
SELECT 
  hr.criado_em,
  r.nome_fantasia,
  hr.valor,
  hr.status,
  hr.metodo,
  hr.data_repasso,
  hr.observacao
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
ORDER BY hr.criado_em DESC
LIMIT 20;
```

### Estatísticas Gerais

```sql
SELECT 
  COUNT(*) AS total_repasses,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) AS pendentes,
  COUNT(CASE WHEN status = 'processando' THEN 1 END) AS processando,
  COUNT(CASE WHEN status = 'pago' THEN 1 END) AS pagos,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) AS cancelados,
  SUM(valor) AS valor_total,
  SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) AS valor_pago,
  SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS valor_pendente
FROM historico_repasses;
```

---

## 🐛 Troubleshooting

### Erro: "Chave PIX não cadastrada"

**Solução:**
```sql
UPDATE restaurantes_app
SET chave_pix = 'SUA_CHAVE_PIX'
WHERE id = 'UUID_DO_RESTAURANTE';
```

### Erro: "Saldo insuficiente"

**Solução:**
```sql
-- Verificar saldo
SELECT saldo_pendente FROM repasses_restaurantes 
WHERE id_restaurante = 'UUID_DO_RESTAURANTE';

-- Adicionar saldo
UPDATE repasses_restaurantes
SET saldo_pendente = saldo_pendente + 500.00
WHERE id_restaurante = 'UUID_DO_RESTAURANTE';
```

### Componente não carrega

**Verificar:**
1. Console do navegador (F12)
2. Network tab para erros de API
3. Supabase logs

### Realtime não funciona

**Verificar:**
1. Realtime está habilitado no Supabase
2. RLS policies permitem SELECT na tabela
3. Conexão websocket está ativa

---

## 📊 Dados de Teste Atuais

Baseado na consulta ao banco:

| Restaurante | Vendas | Repassado | Saldo Pendente | Taxa |
|-------------|--------|-----------|----------------|------|
| Pizza Ninja | R$ 0,00 | R$ 0,00 | R$ 0,00 | 0% |
| akamaru | R$ 0,00 | R$ 0,00 | R$ 0,00 | 0% |
| block Lanches | R$ 0,00 | R$ 0,00 | R$ 0,00 | 0% |
| fenix carnes | R$ 123,30 | R$ 0,00 | R$ 111,80 | R$ 11,50 |

**Restaurante "fenix carnes" já tem saldo disponível para teste!**

---

## ✅ Checklist de Teste

- [ ] Chave PIX cadastrada
- [ ] Saldo disponível > 0
- [ ] Acesso ao painel Financeiro > Repasses
- [ ] Cards exibindo valores corretos
- [ ] Formulário de solicitação funcional
- [ ] Validação de valor máximo
- [ ] Seleção de prazo (1, 7, 15 dias)
- [ ] Mensagem de sucesso após solicitar
- [ ] Registro criado no banco com status "pendente"
- [ ] Histórico atualizado automaticamente
- [ ] Admin consegue visualizar solicitação
- [ ] Admin consegue processar pagamento
- [ ] Status atualizado para "pago"
- [ ] Restaurante vê atualização em tempo real
- [ ] Comprovante disponível (se anexado)

---

## 🚀 Próximos Passos

1. Testar fluxo completo
2. Criar interface admin para gerenciar repasses
3. Implementar notificações por e-mail
4. Adicionar upload de comprovantes
5. Criar relatórios de repasses

---

**Data:** Janeiro 2026
**Status:** ✅ Pronto para Teste
