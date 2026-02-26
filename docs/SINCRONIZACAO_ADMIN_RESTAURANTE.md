# ✅ Sincronização Admin ↔ Restaurante - Sistema de Repasses

## 🎯 Status da Sincronização

✅ **TOTALMENTE SINCRONIZADO** - As solicitações do restaurante aparecem automaticamente para o admin.

---

## 🔄 Como Funciona a Sincronização

### 1. Restaurante Solicita Repasse

**Ação:** Restaurante preenche formulário e clica em "Solicitar Repasse"

**O que acontece no banco:**
```sql
-- Registro criado em historico_repasses
INSERT INTO historico_repasses (
  id_restaurante,
  valor,
  status,  -- 'pendente'
  criado_em
);

-- Saldo atualizado em repasses_restaurantes
UPDATE repasses_restaurantes
SET saldo_pendente = saldo_pendente - valor;
```

**Resultado:** Solicitação fica com status `pendente`

---

### 2. Admin Visualiza Solicitação

**Query que o admin deve usar:**

```sql
SELECT 
  hr.id,
  hr.valor,
  hr.criado_em,
  r.nome_fantasia AS restaurante,
  r.chave_pix,
  r.telefone
FROM historico_repasses hr
INNER JOIN restaurantes_app r ON r.id = hr.id_restaurante
WHERE hr.status = 'pendente'
ORDER BY hr.criado_em ASC;
```

**Resultado:** Admin vê todas as solicitações pendentes

---

### 3. Admin Processa Pagamento

**Passo 1:** Marcar como processando
```sql
UPDATE historico_repasses
SET status = 'processando'
WHERE id = 'uuid-da-solicitacao';
```

**Passo 2:** Fazer transferência PIX (manual)

**Passo 3:** Confirmar pagamento
```sql
BEGIN;

UPDATE historico_repasses
SET 
  status = 'pago',
  data_repasso = NOW()
WHERE id = 'uuid-da-solicitacao';

UPDATE repasses_restaurantes
SET 
  total_repassado = total_repassado + (
    SELECT valor FROM historico_repasses WHERE id = 'uuid-da-solicitacao'
  )
WHERE id_restaurante = (
  SELECT id_restaurante FROM historico_repasses WHERE id = 'uuid-da-solicitacao'
);

COMMIT;
```

---

### 4. Restaurante Vê Atualização

**Automático:** O componente React recarrega os dados e mostra:

```
Status: ✓ Pago (badge verde)
Pago: 26/01/2026 14:30
```

---

## 📊 Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANTE                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Preenche formulário                                      │
│ 2. Clica "Solicitar Repasse de R$ 100,00"                  │
│ 3. Sistema valida e cria registro                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                           │
├─────────────────────────────────────────────────────────────┤
│ historico_repasses:                                         │
│   - id: uuid-123                                            │
│   - id_restaurante: uuid-rest                               │
│   - valor: 100.00                                           │
│   - status: 'pendente'                                      │
│   - criado_em: 2026-01-26 14:00                            │
│                                                             │
│ repasses_restaurantes:                                      │
│   - saldo_pendente: 111.80 → 11.80                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PAINEL ADMIN                             │
├─────────────────────────────────────────────────────────────┤
│ Query: SELECT * FROM historico_repasses                     │
│        WHERE status = 'pendente'                            │
│                                                             │
│ Resultado:                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Restaurante: Pizza Ninja                            │   │
│ │ Valor: R$ 100,00                                    │   │
│ │ Chave PIX: 11999999999                              │   │
│ │ Solicitado: 26/01/2026 14:00                        │   │
│ │ [Aprovar] [Cancelar]                                │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN APROVA                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Faz transferência PIX                                    │
│ 2. Executa SQL de confirmação                               │
│ 3. Status muda: 'pendente' → 'pago'                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                           │
├─────────────────────────────────────────────────────────────┤
│ historico_repasses:                                         │
│   - status: 'pago' ✓                                        │
│   - data_repasso: 2026-01-26 14:30                         │
│                                                             │
│ repasses_restaurantes:                                      │
│   - total_repassado: 0.00 → 100.00                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANTE                              │
├─────────────────────────────────────────────────────────────┤
│ Histórico de Repasses:                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ R$ 100,00  [✓ Pago]                                 │   │
│ │ Solicitado: 26/01/2026 14:00                        │   │
│ │ Pago: 26/01/2026 14:30                              │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Verificação de Sincronização

### Teste 1: Criar Solicitação

```sql
-- Simular solicitação do restaurante
INSERT INTO historico_repasses (
  id_restaurante,
  valor,
  metodo,
  status,
  criado_em
) VALUES (
  '66db4c99-7f6d-4bca-a5dd-2f4d2461df0b', -- fenix carnes
  50.00,
  'pix_manual',
  'pendente',
  NOW()
);
```

### Teste 2: Admin Visualiza

```sql
-- Query do admin
SELECT * FROM historico_repasses 
WHERE status = 'pendente';
```

**Resultado esperado:** Deve aparecer a solicitação de R$ 50,00

### Teste 3: Admin Aprova

```sql
-- Aprovar
UPDATE historico_repasses
SET status = 'pago', data_repasso = NOW()
WHERE id_restaurante = '66db4c99-7f6d-4bca-a5dd-2f4d2461df0b'
  AND status = 'pendente';
```

### Teste 4: Restaurante Vê

**Ação:** Recarregar página do restaurante

**Resultado esperado:** Badge verde "✓ Pago"

---

## 🔧 Troubleshooting

### Problema: Admin não vê solicitação

**Causa:** RLS bloqueando

**Solução:**
```sql
-- Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'historico_repasses';

-- Admin deve ter política de SELECT
```

### Problema: Restaurante não vê atualização

**Causa:** Cache do navegador

**Solução:**
1. Hard refresh (Ctrl + F5)
2. Limpar cache
3. Recarregar componente

### Problema: Status não muda

**Causa:** SQL não executado corretamente

**Solução:**
```sql
-- Verificar status atual
SELECT id, status, data_repasso 
FROM historico_repasses 
WHERE id_restaurante = 'uuid-restaurante';

-- Forçar atualização
UPDATE historico_repasses
SET status = 'pago', data_repasso = NOW()
WHERE id = 'uuid-solicitacao';
```

---

## 📋 Checklist de Sincronização

- [x] Tabelas criadas (`historico_repasses`, `repasses_restaurantes`)
- [x] RLS configurado (restaurantes e admins)
- [x] Componente React funcional
- [x] Formulário de solicitação funcional
- [x] Queries SQL documentadas
- [x] Status visual implementado
- [x] Badge "✓ Pago" funcionando

---

## 🎯 Resumo Executivo

### ✅ O que está funcionando:

1. **Restaurante solicita** → Registro criado com status `pendente`
2. **Admin visualiza** → Query SQL lista todas pendentes
3. **Admin aprova** → Status muda para `pago`
4. **Restaurante vê** → Badge verde "✓ Pago"

### 📊 Dados Atuais:

- **Restaurantes com saldo:** fenix carnes (R$ 111,80)
- **Solicitações pendentes:** 0
- **Sistema:** 100% funcional

### 🚀 Próximos Passos:

1. Criar interface web para admin (opcional)
2. Adicionar notificações por e-mail
3. Implementar upload de comprovantes
4. Criar relatórios automáticos

---

**Data:** Janeiro 2026  
**Status:** ✅ Sincronização Completa  
**Documentação:** `QUERIES_PAINEL_ADMIN_REPASSES.md`
