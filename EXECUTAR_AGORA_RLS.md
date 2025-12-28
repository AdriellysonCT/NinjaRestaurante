# 🚨 CORREÇÃO URGENTE: Restaurantes Vendo Itens de Outros

## 🎯 O Problema
Você tem **10 políticas duplicadas** na tabela `itens_cardapio`, e uma delas está causando o vazamento:

```
❌ "Leitura pública de itens" - USING: (disponivel = true)
```

Esta política permite que QUALQUER restaurante veja TODOS os itens disponíveis, ignorando o filtro por `id_restaurante`.

## ✅ Solução em 2 Comandos

### 1️⃣ LIMPAR E CORRIGIR (Execute no Supabase SQL Editor)

```sql
-- Copie e cole TODO o conteúdo do arquivo:
-- LIMPAR_RLS_ITENS_CARDAPIO.sql
```

**O que faz:**
- Remove TODAS as 10 políticas duplicadas
- Cria apenas 4 políticas corretas e simples
- Garante que cada restaurante vê APENAS seus itens

### 2️⃣ VERIFICAR (Execute no Supabase SQL Editor)

```sql
-- Copie e cole TODO o conteúdo do arquivo:
-- VERIFICAR_ISOLAMENTO_RESTAURANTES.sql
```

**O que faz:**
- Mostra quantos itens cada restaurante tem
- Detecta se ainda há vazamento de dados
- Confirma que o isolamento está funcionando

## 📊 Resultado Esperado

### Antes da Correção ❌
```
Restaurante A: 50 itens (30 próprios + 20 de outros)
Restaurante B: 50 itens (20 próprios + 30 de outros)
Status: ❌ VAZAMENTO DETECTADO
```

### Depois da Correção ✅
```
Restaurante A: 30 itens (30 próprios + 0 de outros)
Restaurante B: 20 itens (20 próprios + 0 de outros)
Status: ✅ Isolamento OK
```

## 🧪 Teste no App

1. **Faça logout** de todos os restaurantes
2. **Login no Restaurante A**
   - Vá para Cardápio
   - Anote quantos itens aparecem
3. **Login no Restaurante B**
   - Vá para Cardápio
   - Deve aparecer um número DIFERENTE de itens
4. **Verifique os nomes**
   - Cada restaurante deve ver apenas seus próprios itens

## 🔍 Por Que Aconteceu?

Você executou vários scripts de correção que foram **adicionando** políticas sem remover as antigas. Resultado:

```
Script 1: Criou 4 políticas
Script 2: Criou mais 4 políticas (duplicadas)
Script 3: Criou mais 2 políticas (incluindo a problemática)
Total: 10 políticas (algumas conflitantes)
```

A política **"Leitura pública de itens"** foi criada pensando em um app de cliente (onde clientes veem todos os restaurantes), mas isso não deve existir no painel do restaurante.

## 🛡️ As 4 Políticas Corretas

Após a limpeza, você terá apenas estas:

1. **rls_itens_select** - Restaurante vê apenas seus itens
2. **rls_itens_insert** - Restaurante cria apenas com seu ID
3. **rls_itens_update** - Restaurante edita apenas seus itens
4. **rls_itens_delete** - Restaurante deleta apenas seus itens

Todas filtram por `id_restaurante = auth.uid()` ✅

## ⏱️ Tempo de Execução

- Script 1 (Limpeza): ~2 segundos
- Script 2 (Verificação): ~3 segundos
- Teste no app: ~2 minutos
- **Total: ~5 minutos**

## 🆘 Se Ainda Não Funcionar

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Verifique se o `auth.uid()` está retornando o ID correto:
   ```sql
   SELECT auth.uid();
   ```
4. Execute a verificação novamente para ver se há erros

---

**Execute agora:** `LIMPAR_RLS_ITENS_CARDAPIO.sql` → `VERIFICAR_ISOLAMENTO_RESTAURANTES.sql` → Teste no app
