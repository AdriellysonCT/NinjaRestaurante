# ✅ CHECKLIST - Deploy Vercel (Correção 404)

## 🎯 SIGA ESTA ORDEM

### ☑️ PASSO 1: Commit e Push
```bash
git add vercel.json
git commit -m "fix: adicionar configuração SPA para Vercel"
git push origin main
```

### ☑️ PASSO 2: Configurar Variáveis no Vercel
1. Acesse: https://vercel.com
2. Selecione seu projeto
3. Vá em: **Settings** → **Environment Variables**
4. Adicione:

**Nome:** `VITE_SUPABASE_URL`  
**Valor:** `https://eaeggaondfefgwhseswn.supabase.co`  
**Ambiente:** Production, Preview, Development

**Nome:** `VITE_SUPABASE_ANON_KEY`  
**Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZWdnYW9uZGZlZmd3aHNlc3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNzkyNjUsImV4cCI6MjA2MTk1NTI2NX0.DFMOYzqO1m3KYALmoEbvOFIwmzuxsQxtKaKl8q81NSo`  
**Ambiente:** Production, Preview, Development

5. Clique em **Save**

### ☑️ PASSO 3: Redeploy
1. Vá em: **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**
4. Aguarde o deploy finalizar

### ☑️ PASSO 4: Configurar Supabase
1. Acesse: https://supabase.com/dashboard/project/eaeggaondfefgwhseswn/auth/url-configuration

2. **Site URL:** (substitua `SEU-DOMINIO` pelo nome real)
   ```
   https://SEU-DOMINIO.vercel.app
   ```

3. **Redirect URLs:** (adicione todas estas linhas)
   ```
   https://SEU-DOMINIO.vercel.app/**
   https://SEU-DOMINIO.vercel.app/login
   https://SEU-DOMINIO.vercel.app/dashboard
   http://localhost:5173/**
   ```

4. Clique em **Save**

### ☑️ PASSO 5: Testar
1. Abra: `https://SEU-DOMINIO.vercel.app/login`
2. Faça login com suas credenciais
3. ✅ Deve redirecionar para `/dashboard` sem 404
4. Faça logout
5. ✅ Deve redirecionar para `/login` sem 404
6. Teste navegação direta: `https://SEU-DOMINIO.vercel.app/pedidos`
7. ✅ Deve carregar a página sem 404

---

## 🎉 PRONTO!

Se todos os passos funcionaram, o problema está resolvido!

## ⚠️ Se ainda der erro:

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra em aba anônima
3. Verifique o console do navegador (F12)
4. Verifique os logs do Vercel
