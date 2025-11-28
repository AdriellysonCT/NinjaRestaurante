# Novo Fluxo de Cadastro de Restaurantes

## 📋 Visão Geral

O cadastro de restaurantes agora é 100% baseado em triggers do banco de dados. O front-end apenas cria o usuário no Supabase Auth com os metadados corretos, e o banco cuida do resto automaticamente.

## 🔄 Fluxo Completo

```
1. Usuário preenche formulário de cadastro
   ↓
2. Front-end chama supabase.auth.signUp() com metadados
   ↓
3. Supabase Auth cria usuário em auth.users
   ↓
4. Trigger on_auth_user_created executa automaticamente
   ↓
5. Trigger insere em profiles com tipo_cliente = 'restaurante'
   ↓
6. Trigger on_profile_created_restaurante executa automaticamente
   ↓
7. Trigger insere em restaurantes_app com todos os dados
   ↓
8. Usuário faz login
   ↓
9. Dashboard carrega dados de restaurantes_app
```

## ✅ O Que Foi Alterado

### 1. authService.js - Função cadastrarRestaurante()

**ANTES:**
```javascript
// Criava usuário e tentava inserir manualmente em restaurantes_app
const { data: authData } = await supabase.auth.signUp({
  email: dadosRestaurante.email,
  password: senha,
  options: {
    data: {
      user_type: 'restaurante', // Campo errado
      // ... outros dados
    }
  }
});

// Tentava inserir manualmente (REMOVIDO)
await supabase.from('restaurantes_app').insert([...]);
```

**DEPOIS:**
```javascript
// Apenas cria usuário com metadados corretos
const { data: authData } = await supabase.auth.signUp({
  email: dadosRestaurante.email,
  password: senha,
  options: {
    data: {
      tipo_usuario: 'restaurante', // ✅ Campo correto
      nome_fantasia: dadosRestaurante.nomeFantasia,
      tipo_restaurante: dadosRestaurante.tipoRestaurante,
      cnpj: dadosRestaurante.cnpj,
      telefone: dadosRestaurante.telefone,
      nome_responsavel: dadosRestaurante.nomeResponsavel
    }
  }
});

// A trigger cuida do resto automaticamente
```

### 2. authService.js - Função buscarDadosRestaurante()

**ANTES:**
```javascript
// Tentava criar registro manualmente se não existisse
if (error.code === 'PGRST116') {
  const { data: newData } = await supabase
    .from('restaurantes_app')
    .insert([{ id: user.id, ... }]);
  return newData[0];
}
```

**DEPOIS:**
```javascript
// Apenas busca os dados, não tenta criar
// Se não existir, retorna null e deixa a trigger fazer o trabalho
if (error.code === 'PGRST116') {
  console.warn('⚠️ Restaurante não encontrado');
  console.warn('⚠️ A trigger pode não ter executado');
  return null;
}
```

### 3. Triggers SQL Atualizadas

**Trigger 1: on_auth_user_created**
- Executa quando usuário é criado em `auth.users`
- Lê `tipo_usuario` dos metadados (com fallback para `user_type`)
- Insere automaticamente em `profiles` com `tipo_cliente` correto

**Trigger 2: on_profile_created_restaurante**
- Executa quando profile é criado/atualizado
- Verifica se `tipo_cliente = 'restaurante'`
- Insere automaticamente em `restaurantes_app` com todos os dados

## 🎯 Responsabilidades

### Front-end (React)
- ✅ Validar formulário
- ✅ Chamar `supabase.auth.signUp()` com metadados corretos
- ✅ Usar campo `tipo_usuario: 'restaurante'`
- ✅ Incluir todos os dados do restaurante nos metadados
- ❌ NÃO tentar inserir em `restaurantes_app` manualmente
- ❌ NÃO chamar funções RPC antigas

### Back-end (Triggers SQL)
- ✅ Criar registro em `profiles` automaticamente
- ✅ Criar registro em `restaurantes_app` automaticamente
- ✅ Garantir consistência dos dados
- ✅ Aplicar políticas RLS corretas

## 📝 Metadados Obrigatórios no SignUp

```javascript
{
  tipo_usuario: 'restaurante',      // ✅ OBRIGATÓRIO
  nome_fantasia: string,            // Nome do restaurante
  tipo_restaurante: string,         // Ex: "Pizzaria", "Hamburgueria"
  cnpj: string,                     // Formatado: 00.000.000/0000-00
  telefone: string,                 // Formatado: (00) 00000-0000
  nome_responsavel: string          // Nome do responsável
}
```

## 🔍 Como Verificar se Está Funcionando

### 1. Após Cadastro
```sql
-- Verificar se foi criado em profiles
SELECT id, email, tipo_cliente, nome_fantasia 
FROM profiles 
WHERE email = 'email_do_teste@teste.com';

-- Verificar se foi criado em restaurantes_app
SELECT id, email, nome_fantasia 
FROM restaurantes_app 
WHERE email = 'email_do_teste@teste.com';
```

### 2. Verificar Triggers
```sql
-- Listar triggers ativos
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');
```

### 3. Console do Navegador
```javascript
// Após cadastro, deve aparecer:
// ✅ Usuário criado com sucesso. ID: xxx
// 📋 Trigger do banco irá criar automaticamente em profiles e restaurantes_app
```

## 🚨 Problemas Comuns

### Problema: Restaurante não aparece em restaurantes_app

**Causa:** Trigger não executou ou falhou

**Solução:**
1. Verificar se as triggers existem:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name LIKE '%user%' OR trigger_name LIKE '%profile%';
   ```

2. Executar o script de correção:
   ```sql
   \i EXECUTAR_AGORA_CORRECAO.sql
   ```

3. Verificar logs do Supabase para erros nas triggers

### Problema: tipo_cliente está como "cliente" ao invés de "restaurante"

**Causa:** Metadados não foram passados corretamente

**Solução:**
1. Verificar se está usando `tipo_usuario` (não `user_type`)
2. Verificar se os metadados estão dentro de `options.data`
3. Reexecutar o script de correção para atualizar a trigger

### Problema: Dashboard em loop de carregamento

**Causa:** Restaurante não existe em `restaurantes_app`

**Solução:**
1. Executar script de correção para criar o registro faltante
2. Fazer logout e login novamente
3. Verificar se o RLS está configurado corretamente

## 🔧 Manutenção

### Adicionar Novos Campos ao Cadastro

1. Adicionar campo no formulário (Cadastro.jsx)
2. Adicionar campo nos metadados do signUp (authService.js)
3. Atualizar trigger `handle_new_user()` para ler o novo campo
4. Atualizar trigger `handle_new_profile_restaurante()` se necessário

### Exemplo:
```javascript
// 1. No formulário
<input name="cep" ... />

// 2. Nos metadados
options: {
  data: {
    tipo_usuario: 'restaurante',
    // ... outros campos
    cep: dadosRestaurante.cep  // ✅ Novo campo
  }
}

// 3. Na trigger
COALESCE(NEW.raw_user_meta_data->>'cep', '')
```

## 📚 Arquivos Relacionados

- `src/services/authService.js` - Serviço de autenticação
- `src/pages/Cadastro.jsx` - Formulário de cadastro
- `src/context/AuthContext.jsx` - Contexto de autenticação
- `EXECUTAR_AGORA_CORRECAO.sql` - Script de correção das triggers
- `corrigir_cadastro_completo.sql` - Script completo com documentação

## ✨ Benefícios do Novo Fluxo

1. **Simplicidade**: Front-end não precisa gerenciar inserções manuais
2. **Consistência**: Triggers garantem que os dados sempre sejam criados
3. **Segurança**: Lógica crítica fica no banco, não no cliente
4. **Manutenibilidade**: Mudanças nas regras de negócio ficam centralizadas
5. **Confiabilidade**: Menos pontos de falha no processo de cadastro
