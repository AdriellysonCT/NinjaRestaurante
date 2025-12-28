# ⚡ EXECUTAR NESTA ORDEM - GUIA DEFINITIVO

## 🎯 Problema Identificado

Suas tabelas `itens_cardapio` e `restaurantes_horarios` estavam com foreign keys apontando para `restaurantes_app.id` ao invés de `auth.users.id`, causando:

1. ❌ Restaurantes vendo itens de outros
2. ❌ Erro "restauranteId não disponível" ao salvar horários
3. ❌ RLS não funcionando

## ✅ Solução em 6 Passos

### 📍 PASSO 1: Corrigir Foreign Keys no Banco
**Arquivo:** `CORRIGIR_FOREIGN_KEYS_URGENTE.sql`

1. Abra o Supabase (https://supabase.com)
2. Vá em SQL Editor
3. Copie TODO o conteúdo de `CORRIGIR_FOREIGN_KEYS_URGENTE.sql`
4. Cole no editor
5. Clique em "Run"
6. Aguarde até ver: "✅ CORREÇÃO DE FOREIGN KEYS CONCLUÍDA!"

**O que faz:**
- Remove foreign keys antigas
- Atualiza `id_restaurante` de INTEGER para UUID
- Corrige dados existentes

**Tempo:** ~30 segundos

---

### 📍 PASSO 2: Limpar Políticas RLS Duplicadas
**Arquivo:** `LIMPAR_RLS_ITENS_CARDAPIO.sql`

1. Ainda no SQL Editor do Supabase
2. Copie TODO o conteúdo de `LIMPAR_RLS_ITENS_CARDAPIO.sql`
3. Cole no editor
4. Clique em "Run"
5. Aguarde até ver: "✅ 4 novas políticas criadas"

**O que faz:**
- Remove 10 políticas duplicadas
- Cria apenas 4 políticas corretas
- Garante isolamento entre restaurantes

**Tempo:** ~10 segundos

---

### 📍 PASSO 2.5: Corrigir Política INSERT (Se Necessário)
**Arquivo:** `CORRIGIR_POLITICA_INSERT.sql`

**⚠️ Execute APENAS se a política INSERT não usar `auth.uid()`**

1. Ainda no SQL Editor do Supabase
2. Copie TODO o conteúdo de `CORRIGIR_POLITICA_INSERT.sql`
3. Cole no editor
4. Clique em "Run"
5. Aguarde até ver: "✅ POLÍTICA INSERT CORRIGIDA!"

**O que faz:**
- Recria a política INSERT com filtro correto
- Garante que apenas o próprio restaurante pode inserir itens

**Tempo:** ~5 segundos

---

### 📍 PASSO 3: Commit e Push do Código

```bash
cd meu-fome-ninja

git status
git add .
git commit -m "fix: corrigir restauranteId para usar user.id e foreign keys"
git push origin main
```

**O que faz:**
- Envia o código corrigido para o GitHub
- Dispara deploy automático na Vercel

**Tempo:** ~1 minuto

---

### 📍 PASSO 4: Aguardar Deploy (Se em Produção)

1. Acesse: https://vercel.com/seu-projeto
2. Vá em "Deployments"
3. Aguarde o deploy ficar "Ready"

**Tempo:** ~2-3 minutos

---

### 📍 PASSO 5: Limpar Cache do Navegador

**No Chrome/Edge:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione:
   - ✅ Cookies e outros dados de sites
   - ✅ Imagens e arquivos em cache
3. Período: "Todo o período"
4. Clique em "Limpar dados"

**Tempo:** ~10 segundos

---

### 📍 PASSO 6: Testar

#### Teste 1: Fazer Novo Login
1. Acesse o app
2. Se estiver logado, faça logout
3. Faça login novamente
4. Abra o console (F12)
5. Verifique se não há erros em vermelho

#### Teste 2: Verificar Horários
1. Vá em Configurações → Horários
2. Altere o horário de abertura de segunda-feira
3. Deve salvar SEM erro
4. Não deve aparecer "restauranteId não disponível"

#### Teste 3: Verificar Cardápio (CRÍTICO)
1. **Restaurante A:**
   - Faça login
   - Vá em Cardápio
   - Anote quantos itens aparecem (ex: 30 itens)
   - Anote os nomes dos itens

2. **Restaurante B:**
   - Faça logout
   - Faça login com outro restaurante
   - Vá em Cardápio
   - Deve aparecer ITENS DIFERENTES
   - Quantidade deve ser diferente (ex: 20 itens)

**Resultado esperado:**
- ✅ Cada restaurante vê apenas seus itens
- ✅ Horários salvam sem erro
- ✅ Nenhum erro no console

**Tempo:** ~5 minutos

---

## 🔍 Verificação Final no Banco

Execute este SQL no Supabase para confirmar:

```sql
-- 1. Verificar se IDs são UUIDs agora
SELECT 
    'Tipo de id_restaurante' as info,
    id_restaurante,
    pg_typeof(id_restaurante) as tipo
FROM itens_cardapio
LIMIT 3;

-- Deve retornar: tipo = "uuid"

-- 2. Verificar isolamento
SELECT 
    'Itens por restaurante' as info,
    ic.id_restaurante,
    r.nome_fantasia,
    COUNT(*) as total_itens
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
GROUP BY ic.id_restaurante, r.nome_fantasia;

-- Cada restaurante deve ter apenas seus itens

-- 3. Verificar políticas
SELECT 
    'Políticas RLS' as info,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY cmd;

-- Deve retornar apenas 4 políticas:
-- rls_itens_delete, rls_itens_insert, rls_itens_select, rls_itens_update
```

---

## ⚠️ Se Algo Der Errado

### Erro: "permission denied for table itens_cardapio"
**Solução:** Execute `LIMPAR_RLS_ITENS_CARDAPIO.sql` novamente

### Erro: "foreign key violation"
**Solução:** Execute `CORRIGIR_FOREIGN_KEYS_URGENTE.sql` novamente

### Cardápio ainda mostra itens de outros
**Solução:**
1. Limpe cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login
3. Verifique se executou os 2 scripts SQL

### Horários ainda não salvam
**Solução:**
1. Verifique se o código foi atualizado (git pull)
2. Limpe cache e faça novo login
3. Abra o console (F12) e veja o erro exato

---

## 📊 Checklist Final

- [ ] Executei `CORRIGIR_FOREIGN_KEYS_URGENTE.sql`
- [ ] Executei `LIMPAR_RLS_ITENS_CARDAPIO.sql`
- [ ] Fiz commit e push do código
- [ ] Aguardei o deploy na Vercel
- [ ] Limpei cache do navegador
- [ ] Fiz logout e login novamente
- [ ] Testei horários (salvam sem erro)
- [ ] Testei cardápio (cada restaurante vê apenas seus itens)
- [ ] Verifiquei console (sem erros)

---

## 🎉 Resultado Final

```
✅ Restaurante A vê apenas seus 30 itens
✅ Restaurante B vê apenas seus 20 itens
✅ Horários salvam corretamente
✅ Nenhum erro no console
✅ RLS funcionando perfeitamente
```

**Tempo total:** ~10-15 minutos

---

**Última atualização:** 28/12/2024  
**Status:** Pronto para execução  
**Prioridade:** 🔴 CRÍTICA
