# 🔧 Correção: Fluxo de Pedidos Retirada/Local vs Delivery

## 🐛 Problema Identificado

```
Erro ao atualizar pedido: null value in column "user_id" of relation 
"user_moedas" violates not-null constraint
```

### **O que está acontecendo:**

O sistema está tentando acessar a tabela `user_moedas` (sistema de recompensas dos entregadores) quando atualiza pedidos de **retirada/local**, mas isso só deveria acontecer para pedidos de **delivery**.

---

## 📊 Fluxos Corretos

### **🚚 Pedidos de Delivery (Entrega):**

```
Nova Missão (disponivel)
    ↓
Em Preparo (aceito)
    ↓
Pronto para Entregar (pronto_para_entrega)
    ↓
Aceitos pelo Entregador (aceito pelo app do entregador)
    ↓
Coletados (coletado)
    ↓
Concluídos (concluido) ← AQUI: Creditar moedas ao entregador
    ↓
ou Cancelados (cancelado)
```

**Características:**
- ✅ Tem entregador (`id_entregador`)
- ✅ Ganha moedas ao concluir
- ✅ Passa por todas as etapas

---

### **🏪 Pedidos de Retirada/Local:**

```
Nova Missão (disponivel)
    ↓
Em Preparo (aceito)
    ↓
Concluído (concluido) ← PULA etapas intermediárias
    ↓
ou Cancelado (cancelado)
```

**Características:**
- ❌ NÃO tem entregador (`id_entregador = NULL`)
- ❌ NÃO ganha moedas
- ❌ NÃO passa por "pronto_para_entrega", "coletado"

---

## 🔍 Causa Raiz

Existe um **trigger no banco de dados** que está executando para TODOS os pedidos, sem verificar o `tipo_pedido`.

### **Trigger Problemático (Exemplo):**

```sql
CREATE TRIGGER trigger_moedas_entregador
AFTER UPDATE ON pedidos_padronizados
FOR EACH ROW
EXECUTE FUNCTION atualizar_moedas_entregador();

-- Função problemática:
CREATE FUNCTION atualizar_moedas_entregador()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' THEN
    -- ❌ ERRO: Tenta inserir sem verificar se é delivery
    INSERT INTO user_moedas (user_id, moedas, ...)
    VALUES (NEW.id_entregador, 10, ...);  -- id_entregador é NULL!
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Solução

### **Passo 1: Identificar o Trigger**

Execute o script:
```bash
meu-fome-ninja/corrigir_trigger_moedas.sql
```

Este script vai:
1. Listar todos os triggers de `pedidos_padronizados`
2. Encontrar funções que usam `user_moedas`
3. Mostrar o código das funções

---

### **Passo 2: Corrigir o Trigger**

O trigger deve verificar 3 coisas antes de acessar `user_moedas`:

```sql
CREATE OR REPLACE FUNCTION atualizar_moedas_entregador_corrigido()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ VERIFICAÇÃO 1: Só processar pedidos de delivery
  IF NEW.tipo_pedido != 'delivery' THEN
    RETURN NEW;
  END IF;

  -- ✅ VERIFICAÇÃO 2: Só processar se tiver entregador
  IF NEW.id_entregador IS NULL THEN
    RETURN NEW;
  END IF;

  -- ✅ VERIFICAÇÃO 3: Só processar quando concluir
  IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Agora sim, creditar moedas
    INSERT INTO user_moedas (user_id, moedas, tipo, descricao, criado_em)
    VALUES (
      NEW.id_entregador, 
      10, 
      'entrega', 
      'Entrega concluída - Pedido #' || NEW.numero_pedido,
      NOW()
    );
    
    RAISE NOTICE 'Moedas creditadas para entregador do pedido %', NEW.numero_pedido;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### **Passo 3: Recriar o Trigger**

```sql
-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_moedas_entregador ON pedidos_padronizados;

-- Criar trigger corrigido
CREATE TRIGGER trigger_moedas_entregador
  AFTER UPDATE ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_moedas_entregador_corrigido();
```

---

### **Passo 4: Testar**

```sql
-- Testar com pedido de retirada
UPDATE pedidos_padronizados
SET status = 'aceito'
WHERE tipo_pedido = 'retirada'
AND status = 'disponivel'
LIMIT 1;

-- ✅ Deve funcionar sem erro!

-- Testar com pedido de delivery
UPDATE pedidos_padronizados
SET status = 'concluido'
WHERE tipo_pedido = 'delivery'
AND id_entregador IS NOT NULL
AND status = 'coletado'
LIMIT 1;

-- ✅ Deve creditar moedas ao entregador!
```

---

## 📋 Checklist de Correção

### **No Banco de Dados:**
- [ ] Executar `corrigir_trigger_moedas.sql`
- [ ] Identificar trigger problemático
- [ ] Adicionar verificação de `tipo_pedido`
- [ ] Adicionar verificação de `id_entregador`
- [ ] Recriar trigger corrigido
- [ ] Testar com pedido de retirada
- [ ] Testar com pedido de delivery

### **No Código Frontend:**
- [x] Dashboard já implementa fluxo diferenciado
- [x] OrderCard já trata botões por tipo
- [x] StatusManager já separa fluxos
- [x] Nenhuma mudança necessária no frontend

---

## 🎯 Resultado Esperado

### **Antes (Com Erro):**

```
Pedido Retirada #38
Status: disponivel → aceito
❌ ERRO: null value in column "user_id"
```

### **Depois (Corrigido):**

```
Pedido Retirada #38
Status: disponivel → aceito
✅ SUCESSO: Atualizado sem tentar acessar user_moedas

Pedido Delivery #39
Status: coletado → concluido
✅ SUCESSO: Moedas creditadas ao entregador
```

---

## 💡 Prevenção Futura

### **Sempre verificar tipo_pedido em triggers:**

```sql
-- Template para qualquer trigger de pedidos
CREATE FUNCTION minha_funcao()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar tipo de pedido primeiro
  CASE NEW.tipo_pedido
    WHEN 'delivery' THEN
      -- Lógica específica para delivery
      NULL;
    WHEN 'retirada' THEN
      -- Lógica específica para retirada
      NULL;
    WHEN 'local' THEN
      -- Lógica específica para local
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔗 Arquivos Relacionados

1. **`corrigir_trigger_moedas.sql`** - Script de investigação e correção
2. **`FLUXO_DIFERENCIADO_IMPLEMENTADO.md`** - Documentação dos fluxos
3. **`Dashboard.jsx`** - Implementação frontend dos fluxos

---

## 📞 Próximos Passos

1. **Execute:** `corrigir_trigger_moedas.sql` (Passo 1 e 2)
2. **Identifique:** Qual trigger está causando o erro
3. **Corrija:** Adicione as verificações necessárias
4. **Teste:** Atualize um pedido de retirada
5. **Confirme:** Erro não aparece mais

---

**Criado em**: 08/11/2025  
**Status**: 🔧 Aguardando correção do trigger no banco
