# 🚀 FLUXO CORRETO DE CADASTRO DE RESTAURANTE

## 🌳 Estrutura do Banco

```
auth.users (Supabase Auth)
    ↓
profiles (árvore/raiz) - Criado automaticamente por TRIGGER
    ├─ id (uuid) - PK
    ├─ email (text)
    ├─ tipo_usuario (text) - "restaurante" ou "cliente"
    └─ created_at, updated_at
    
restaurantes_app (galho) - Criado MANUALMENTE pelo front-end
    ├─ id (uuid) - PK, MESMO ID do profiles
    ├─ user_id (uuid) - Cópia do ID
    └─ Todos os dados do restaurante (nome, cnpj, telefone, etc)
```

## ✅ Fluxo Correto (3 Etapas)

### 1️⃣ Front-end: signUp COM metadata

```javascript
const { data: authData, error } = await supabase.auth.signUp({
  email: dadosRestaurante.email,
  password: senha,
  options: {
    data: {
      tipo_usuario: 'restaurante' // ✅ OBRIGATÓRIO
    }
  }
});

const userId = authData.user.id;
```

**O que acontece:**
- ✅ Cria usuário em `auth.users`
- ✅ Trigger automático cria em `profiles` com `tipo_usuario = 'restaurante'`

### 2️⃣ Aguardar trigger executar

```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

**Por quê:** Dar tempo para o trigger criar o profile

### 3️⃣ Front-end: Criar em restaurantes_app

```javascript
const { data, error } = await supabase
  .from('restaurantes_app')
  .insert({
    id: userId, // Mesmo ID do profiles
    user_id: userId, // Cópia do ID
    nome_fantasia: dadosRestaurante.nomeFantasia,
    tipo_restaurante: dadosRestaurante.tipoRestaurante,
    cnpj: dadosRestaurante.cnpj,
    telefone: dadosRestaurante.telefone,
    email: dadosRestaurante.email,
    nome_responsavel: dadosRestaurante.nomeResponsavel,
    rua: dadosRestaurante.rua || '',
    numero: dadosRestaurante.numero || '',
    bairro: dadosRestaurante.bairro || '',
    cidade: dadosRestaurante.cidade || '',
    complemento: dadosRestaurante.complemento || '',
    ativo: true,
    imagem_url: null,
    latitude: null,
    longitude: null,
    conta_bancaria: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

**O que acontece:**
- ✅ Cria registro completo em `restaurantes_app`
- ✅ Usa o MESMO ID do profiles
- ✅ Preenche todos os campos específicos do restaurante

## ❌ Erros Comuns

### Erro 1: "duplicate key value violates unique constraint 'profiles_pkey'"

**Causa:** Tentando criar profile manualmente quando o trigger já criou

**Solução:** NÃO criar profile manualmente, deixar o trigger fazer

### Erro 2: 403 Forbidden ao inserir em restaurantes_app

**Causa:** Políticas RLS bloqueando INSERT

**Solução:** Execute `CORRIGIR_RLS_FINAL.sql`

### Erro 3: tipo_usuario vazio ou incorreto

**Causa:** Não enviou metadata no signUp

**Solução:** Sempre enviar `tipo_usuario: 'restaurante'` no signUp

### Erro 4: Login quebra com erro 404/406

**Causa:** Profile existe mas restaurantes_app não

**Solução:** Garantir que o INSERT em restaurantes_app foi bem-sucedido

## 🔧 Políticas RLS Necessárias

```sql
-- Permitir INSERT para qualquer usuário autenticado
CREATE POLICY "restaurantes_insert_policy"
    ON restaurantes_app
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Permitir SELECT apenas dos próprios dados
CREATE POLICY "restaurantes_select_policy"
    ON restaurantes_app
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id);
```

## 🧪 Como Testar

### 1. Execute o script SQL

```sql
-- No Supabase SQL Editor:
\i CORRIGIR_RLS_FINAL.sql
```

### 2. Teste cadastro no front-end

1. Abra o console (F12)
2. Faça um novo cadastro
3. Observe os logs:

```
🚀 Iniciando processo de cadastro de RESTAURANTE...
👤 Criando usuário no Supabase Auth com tipo_usuario = "restaurante"...
✅ Usuário criado no Auth. ID: xxx
✅ Trigger do banco criou automaticamente o profile
🏪 Criando registro em restaurantes_app...
✅ Restaurante criado com sucesso em restaurantes_app
🎉 Cadastro concluído com sucesso!
```

### 3. Verificar no banco

```sql
-- Deve retornar 3 linhas com MESMO ID
SELECT 'auth' as origem, id FROM auth.users WHERE email = 'teste@email.com'
UNION ALL
SELECT 'profiles', id FROM profiles WHERE email = 'teste@email.com'
UNION ALL
SELECT 'restaurantes', id FROM restaurantes_app WHERE email = 'teste@email.com';
```

## 📊 Resultado Esperado

```
✅ auth.users: 1 registro
✅ profiles: 1 registro (tipo_usuario = 'restaurante')
✅ restaurantes_app: 1 registro (dados completos)
✅ Todos com o MESMO ID
✅ Login funciona
✅ Dashboard carrega
```

## 🎯 Resumo

1. **signUp** com `tipo_usuario: 'restaurante'` → Trigger cria profile
2. **Aguardar** 500ms
3. **INSERT** em restaurantes_app com todos os dados
4. **Pronto!** Cadastro completo

---

**Arquivos importantes:**
- `src/services/authService.js` - Código já corrigido
- `CORRIGIR_RLS_FINAL.sql` - Execute este script
