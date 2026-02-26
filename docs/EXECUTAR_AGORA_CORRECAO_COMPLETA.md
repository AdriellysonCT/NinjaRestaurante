# 🚀 CORREÇÃO COMPLETA - Execute Agora!

## ✅ O Que Foi Corrigido

### 1. **Código Atualizado** ✅
- `src/context/AuthContext.jsx` → `restauranteId` agora usa `user.id` diretamente

### 2. **Scripts SQL Criados** ✅
- `LIMPAR_RLS_ITENS_CARDAPIO.sql` → Remove políticas duplicadas

## 📋 Checklist de Execução

### PASSO 1: Corrigir Foreign Keys ⚠️ CRÍTICO - EXECUTE PRIMEIRO!

1. Abra o **Supabase SQL Editor**
2. Copie e cole TODO o conteúdo de: `CORRIGIR_FOREIGN_KEYS_URGENTE.sql`
3. Execute (Run)
4. Verifique se aparece: "✅ CORREÇÃO DE FOREIGN KEYS CONCLUÍDA!"

**Por quê isso é necessário?**
- Suas tabelas estavam apontando para `restaurantes_app.id` ao invés de `auth.users.id`
- Isso causava o vazamento de dados entre restaurantes
- Este script corrige os relacionamentos e atualiza os dados existentes

### PASSO 2: Limpar RLS no Banco de Dados ⚠️ IMPORTANTE

1. Ainda no **Supabase SQL Editor**
2. Copie e cole TODO o conteúdo de: `LIMPAR_RLS_ITENS_CARDAPIO.sql`
3. Execute (Run)
4. Verifique se aparece: "✅ 4 novas políticas criadas"

### PASSO 3: Fazer Commit e Push do Código

```bash
cd meu-fome-ninja

git add .
git commit -m "fix: corrigir restauranteId e RLS de itens_cardapio"
git push origin main
```

### PASSO 4: Rebuild Local (Se Testando Localmente)

```bash
# Parar o servidor (Ctrl+C)

# Limpar cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstalar (opcional, só se houver problemas)
# npm install

# Reiniciar
npm run dev
```

### PASSO 5: Deploy na Vercel (Se Já Está em Produção)

A Vercel vai fazer deploy automático quando você der push, MAS se quiser forçar:

1. Acesse: https://vercel.com/seu-projeto
2. Clique em "Deployments"
3. Clique em "Redeploy" no último deployment

### PASSO 6: Testar

#### Teste 1: Limpar Cache do Navegador
```
1. Pressione Ctrl+Shift+Delete
2. Selecione "Cookies e dados de sites"
3. Selecione "Imagens e arquivos em cache"
4. Clique em "Limpar dados"
```

#### Teste 2: Fazer Novo Login
```
1. Acesse o app
2. Faça logout (se estiver logado)
3. Faça login novamente
4. Abra o console (F12)
5. Verifique se não há erros
```

#### Teste 3: Verificar Horários
```
1. Vá para Configurações → Horários
2. Altere um horário
3. Verifique se salva sem erro
4. Não deve aparecer "restauranteId não disponível"
```

#### Teste 4: Verificar Cardápio
```
1. Faça login no Restaurante A
2. Vá para Cardápio
3. Anote quantos itens aparecem
4. Faça logout
5. Faça login no Restaurante B
6. Vá para Cardápio
7. Deve aparecer ITENS DIFERENTES
```

## 🔍 Verificação Rápida

Execute este SQL no Supabase para confirmar que está tudo OK:

```sql
-- 1. Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'itens_cardapio'
ORDER BY cmd;

-- Deve retornar APENAS 4 políticas:
-- rls_itens_select, rls_itens_insert, rls_itens_update, rls_itens_delete

-- 2. Verificar itens por restaurante
SELECT 
    ic.id_restaurante,
    r.nome_fantasia,
    COUNT(*) as total_itens
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
GROUP BY ic.id_restaurante, r.nome_fantasia;

-- Cada restaurante deve ter apenas seus próprios itens
```

## ⚠️ Problemas Comuns

### Problema: Ainda aparece erro "restauranteId não disponível"
**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Verifique se o código foi atualizado (veja o arquivo AuthContext.jsx linha 570)

### Problema: Cardápio ainda mostra itens de outros
**Solução:**
1. Execute `LIMPAR_RLS_ITENS_CARDAPIO.sql` novamente
2. Verifique se as 4 políticas foram criadas
3. Faça logout e login novamente

### Problema: Erro ao fazer push no Git
**Solução:**
```bash
# Se houver conflitos
git pull origin main
git add .
git commit -m "fix: corrigir restauranteId e RLS"
git push origin main
```

## 📊 Resultado Esperado

### Antes ❌
```
- Erro: "restauranteId não disponível"
- Restaurante A vê 50 itens (30 seus + 20 de outros)
- Restaurante B vê 50 itens (20 seus + 30 de outros)
```

### Depois ✅
```
- Sem erros ao salvar horários
- Restaurante A vê 30 itens (apenas seus)
- Restaurante B vê 20 itens (apenas seus)
```

## 🎯 Resumo Ultra-Rápido

1. ✅ Execute `CORRIGIR_FOREIGN_KEYS_URGENTE.sql` no Supabase (PRIMEIRO!)
2. ✅ Execute `LIMPAR_RLS_ITENS_CARDAPIO.sql` no Supabase
3. ✅ Faça `git add . && git commit -m "fix" && git push`
4. ✅ Limpe cache do navegador
5. ✅ Faça logout e login
6. ✅ Teste horários e cardápio

**Tempo total:** ~10 minutos

---

**Status:** Código já corrigido, só falta executar SQL e fazer deploy! 🚀
