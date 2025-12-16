# 📚 Índice - Sincronização de Status

## 🚀 Início Rápido

**Quer instalar tudo de uma vez?**

1. Abra o Supabase SQL Editor
2. Execute: `INSTALAR_SINCRONIZACAO_COMPLETA.sql`
3. Pronto! ✅

---

## 📁 Arquivos Disponíveis

### 🔧 Instalação

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **INSTALAR_SINCRONIZACAO_COMPLETA.sql** | Instala tudo automaticamente | ⭐ Use este primeiro |
| criar_trigger_sync_entregas_para_pedidos.sql | Apenas a trigger nova | Instalação manual |
| criar_trigger_sync_pedidos_entregas.sql | Trigger antiga (já existe) | Referência |

### 🔍 Verificação e Diagnóstico

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| verificar_triggers_sincronizacao.sql | Verifica se está tudo OK | Após instalação |
| corrigir_sincronizacao_status.sql | Corrige inconsistências | Se houver problemas |

### 📖 Documentação

| Arquivo | Descrição | Quando Ler |
|---------|-----------|------------|
| **GUIA_SINCRONIZACAO_STATUS.md** | Guia completo com testes | ⭐ Leia para entender |
| CORRECAO_SINCRONIZACAO_STATUS.md | Documentação técnica | Referência detalhada |
| INDICE_SINCRONIZACAO.md | Este arquivo | Navegação |

---

## 🎯 Fluxo de Trabalho Recomendado

### Para Instalação Nova

```
1. Ler: GUIA_SINCRONIZACAO_STATUS.md (5 min)
   ↓
2. Executar: INSTALAR_SINCRONIZACAO_COMPLETA.sql (5 seg)
   ↓
3. Verificar: verificar_triggers_sincronizacao.sql (10 seg)
   ↓
4. Testar: Seguir testes do guia (2 min)
   ↓
5. ✅ Pronto!
```

### Para Troubleshooting

```
1. Executar: verificar_triggers_sincronizacao.sql
   ↓
2. Se houver inconsistências:
   Executar: corrigir_sincronizacao_status.sql
   ↓
3. Se trigger não existir:
   Executar: INSTALAR_SINCRONIZACAO_COMPLETA.sql
   ↓
4. Consultar: GUIA_SINCRONIZACAO_STATUS.md (seção Troubleshooting)
```

---

## 🏗️ Arquitetura

### Tabelas Envolvidas

```
pedidos_padronizados (Fonte de verdade para o painel)
         ↕️ (sincronização bidirecional)
entregas_padronizadas (Fonte de verdade para o app)
```

### Triggers

```
TRIGGER 1: trg_sync_pedido_para_entrega
- Tabela: pedidos_padronizados
- Evento: UPDATE status → 'pronto_para_entrega'
- Ação: INSERT em entregas_padronizadas

TRIGGER 2: trg_sync_entrega_para_pedido (NOVA)
- Tabela: entregas_padronizadas
- Evento: UPDATE status → 'aceito', 'coletado', 'concluido'
- Ação: UPDATE em pedidos_padronizados
```

### Fluxo Completo

```
1. Restaurante marca como pronto
   pedidos_padronizados.status = 'pronto_para_entrega'
   ↓ [TRIGGER 1]
   entregas_padronizadas.status = 'disponivel'

2. Entregador aceita no app
   entregas_padronizadas.status = 'aceito'
   ↓ [TRIGGER 2] ⭐ NOVA
   pedidos_padronizados.status = 'aceito'
   ↓ [SUPABASE REALTIME]
   Dashboard atualiza em tempo real ⚡

3. Entregador coleta
   entregas_padronizadas.status = 'coletado'
   ↓ [TRIGGER 2]
   pedidos_padronizados.status = 'coletado'
   ↓ [SUPABASE REALTIME]
   Dashboard atualiza em tempo real ⚡

4. Entregador conclui
   entregas_padronizadas.status = 'concluido'
   ↓ [TRIGGER 2]
   pedidos_padronizados.status = 'concluido'
   ↓ [SUPABASE REALTIME]
   Dashboard atualiza em tempo real ⚡
```

---

## ✅ Checklist de Validação

Após instalação, verifique:

- [ ] Trigger `trg_sync_pedido_para_entrega` existe
- [ ] Trigger `trg_sync_entrega_para_pedido` existe
- [ ] Função `sync_pedido_para_entrega()` existe
- [ ] Função `sync_entrega_para_pedido()` existe
- [ ] Teste de aceitação passou
- [ ] Teste de coleta passou
- [ ] Teste de conclusão passou
- [ ] Dashboard atualiza em tempo real
- [ ] Sem loops infinitos
- [ ] Sem pedidos inconsistentes

---

## 🆘 Suporte

### Problemas Comuns

**Trigger não funciona:**
- Execute: `INSTALAR_SINCRONIZACAO_COMPLETA.sql`

**Status não sincroniza:**
- Execute: `corrigir_sincronizacao_status.sql`

**Dashboard não atualiza:**
- Verifique console do navegador (F12)
- Procure por mensagens de Realtime
- Consulte: CORRECAO_SINCRONIZACAO_STATUS.md (seção Troubleshooting)

**Loop infinito:**
- Isso NÃO deve acontecer (há prevenção)
- Se acontecer, reporte o bug

### Logs Úteis

**No PostgreSQL:**
```
NOTICE: Sincronizando entrega -> pedido: 1234 (disponivel -> aceito)
NOTICE: ✅ Pedido 1234 atualizado para ACEITO
```

**No Dashboard (Console):**
```
📨 Mudança detectada nos pedidos: UPDATE - Pedido #1234
  📊 Status mudou: "pronto_para_entrega" -> "aceito" (com entregador)
  🔄 Recarregando pedidos em tempo real...
```

---

## 📊 Estatísticas

Após instalação, você pode verificar:

```sql
-- Pedidos sincronizados
SELECT COUNT(*) FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.status = e.status;

-- Pedidos inconsistentes (deve ser 0)
SELECT COUNT(*) FROM pedidos_padronizados p
JOIN entregas_padronizadas e ON e.id_pedido = p.id
WHERE p.status != e.status
  AND e.status IN ('aceito', 'coletado', 'concluido');
```

---

## 🎓 Aprendizado

### Conceitos Importantes

1. **Sincronização Bidirecional**: Duas triggers que trabalham em harmonia
2. **Prevenção de Loops**: Verificações antes de UPDATE
3. **Realtime**: WebSocket para atualizações instantâneas
4. **Idempotência**: Pode executar múltiplas vezes sem problemas

### Boas Práticas

- ✅ Sempre verificar antes de atualizar (evita loops)
- ✅ Usar SECURITY DEFINER para permissões
- ✅ Adicionar logs para debug
- ✅ Documentar triggers e funções
- ✅ Testar antes de deploy em produção

---

## 📝 Changelog

### v2.0 - Sincronização Bidirecional (Atual)
- ✅ Adicionada trigger entregas → pedidos
- ✅ Painel atualiza em tempo real
- ✅ Prevenção de loops infinitos
- ✅ Correção automática de inconsistências

### v1.0 - Sincronização Unidirecional
- ✅ Trigger pedidos → entregas
- ❌ Painel não refletia mudanças do app

---

## 🔗 Links Relacionados

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [React useEffect](https://react.dev/reference/react/useEffect)

---

**Última atualização:** 2024
**Versão:** 2.0
**Status:** ✅ Produção
