# 🎨 Guia Visual de Execução

## 🚀 Passo a Passo com Prints

### Passo 1: Abrir Supabase SQL Editor

```
1. Acesse seu projeto no Supabase
2. No menu lateral, clique em "SQL Editor"
3. Clique em "New query"
```

---

### Passo 2: Executar Script de Correção

```
1. Abra o arquivo: EXECUTAR_AGORA_CORRECAO.sql
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor (Ctrl+V)
4. Clique no botão "RUN" (ou F5)
5. Aguarde a execução (pode levar 5-10 segundos)
```

**Resultado esperado:**
```
✅ CORREÇÃO CONCLUÍDA!

Cristal Pizzaria em profiles:
id                                   | email              | tipo_cliente | nome_fantasia
-------------------------------------|--------------------|--------------|--------------
xxx-xxx-xxx                          | cristal@email.com  | restaurante  | Cristal Pizzaria

Cristal Pizzaria em restaurantes_app:
id                                   | email              | nome_fantasia
-------------------------------------|--------------------|--------------
xxx-xxx-xxx                          | cristal@email.com  | Cristal Pizzaria

Triggers criados:
trigger_name                    | event_object_table
--------------------------------|-------------------
on_auth_user_created           | users
on_profile_created_restaurante | profiles

✅ Agora faça logout e login novamente com o Cristal Pizzaria!
```

---

### Passo 3: Validar Correção

```
1. No SQL Editor, clique em "New query" novamente
2. Abra o arquivo: testar_novo_fluxo_cadastro.sql
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "RUN"
```

**Resultado esperado:**
```
=== RESUMO DO STATUS ===

item                          | quantidade | status
------------------------------|------------|----------
Triggers Criadas              | 2          | ✅ OK
Funções Criadas               | 2          | ✅ OK
Restaurantes em Profiles      | X          | 📊 INFO
Restaurantes em App           | X          | 📊 INFO
Inconsistências               | 0          | ✅ OK

=== PRÓXIMOS PASSOS ===

instrucao
---------------------------------------------------------
✅ Triggers OK - Pode testar cadastro no front-end
✅ Sem inconsistências - Sistema pronto
```

---

### Passo 4: Testar no Front-end

#### 4.1 Logout do Cristal Pizzaria

```
1. No seu app, clique no menu do usuário
2. Clique em "Sair" ou "Logout"
3. Aguarde redirecionamento para tela de login
```

#### 4.2 Login Novamente

```
1. Digite o email do Cristal Pizzaria
2. Digite a senha
3. Clique em "Entrar"
4. Aguarde carregamento
```

**Resultado esperado:**
```
✅ Dashboard carrega normalmente
✅ Não aparece mais em loop infinito
✅ Mostra dados do restaurante corretos
✅ Não mostra cardápio de outros restaurantes
```

---

### Passo 5: Criar Restaurante de Teste

#### 5.1 Acessar Cadastro

```
1. Faça logout
2. Na tela de login, clique em "Cadastrar"
3. Preencha o formulário:
```

**Dados de teste:**
```
Nome do Restaurante: Teste Automatico
Tipo de Restaurante: Pizzaria
CNPJ: 12.345.678/0001-90
Telefone: (11) 98765-4321
Email: teste@automatico.com
Nome do Responsável: João Teste
Senha: 123456
Confirmar Senha: 123456
```

#### 5.2 Cadastrar

```
1. Clique em "Cadastrar Restaurante"
2. Aguarde mensagem de sucesso
3. Se pedir confirmação de email, ignore (modo dev)
4. Faça login com o email de teste
```

#### 5.3 Validar no Banco

```sql
-- Execute no SQL Editor:

-- Verificar em profiles
SELECT id, email, tipo_cliente, nome_fantasia 
FROM profiles 
WHERE email = 'teste@automatico.com';

-- Verificar em restaurantes_app
SELECT id, email, nome_fantasia 
FROM restaurantes_app 
WHERE email = 'teste@automatico.com';
```

**Resultado esperado:**
```
Ambas as queries devem retornar 1 linha
Com o MESMO ID
tipo_cliente = 'restaurante'
```

#### 5.4 Limpar Teste

```sql
-- Execute no SQL Editor:
DELETE FROM auth.users WHERE email = 'teste@automatico.com';
-- As triggers CASCADE vão deletar automaticamente de profiles e restaurantes_app
```

---

## 🎯 Checklist Visual

### ✅ Banco de Dados

```
┌─────────────────────────────────────────┐
│ ✅ Triggers Criadas (2)                 │
│ ✅ Funções Criadas (2)                  │
│ ✅ Cristal Pizzaria Corrigido           │
│ ✅ RLS Configurado                      │
│ ✅ Sem Inconsistências                  │
└─────────────────────────────────────────┘
```

### ✅ Front-end

```
┌─────────────────────────────────────────┐
│ ✅ Login do Cristal Funciona            │
│ ✅ Dashboard Carrega                    │
│ ✅ Dados Corretos                       │
│ ✅ Cardápio Isolado                     │
│ ✅ Novo Cadastro Funciona               │
└─────────────────────────────────────────┘
```

---

## 🔍 Verificações Visuais

### Dashboard Antes (❌)

```
┌─────────────────────────────────────────┐
│  🔄 Carregando...                       │
│  🔄 Carregando...                       │
│  🔄 Carregando...                       │
│  🔄 Carregando...                       │
│  (Loop infinito)                        │
└─────────────────────────────────────────┘
```

### Dashboard Depois (✅)

```
┌─────────────────────────────────────────┐
│  📊 Dashboard - Cristal Pizzaria        │
│  ├─ Pedidos: 5                          │
│  ├─ Faturamento: R$ 250,00              │
│  └─ Itens no Cardápio: 0                │
│                                         │
│  (Carrega normalmente)                  │
└─────────────────────────────────────────┘
```

### Cardápio Antes (❌)

```
┌─────────────────────────────────────────┐
│  🍕 Cardápio - Cristal Pizzaria         │
│  ├─ Pizza Margherita (Fenix) ❌         │
│  ├─ Hambúrguer (Fenix) ❌               │
│  └─ Batata Frita (Fenix) ❌             │
│                                         │
│  (Mostra itens de outros restaurantes)  │
└─────────────────────────────────────────┘
```

### Cardápio Depois (✅)

```
┌─────────────────────────────────────────┐
│  🍕 Cardápio - Cristal Pizzaria         │
│  └─ Nenhum item cadastrado              │
│                                         │
│  (Vazio, mas correto - isolado)         │
└─────────────────────────────────────────┘
```

---

## 🚨 Problemas e Soluções Visuais

### Problema 1: Triggers Não Criadas

**Sintoma:**
```sql
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');

-- Retorna: 0 ou 1 (deveria ser 2)
```

**Solução:**
```
1. Execute EXECUTAR_AGORA_CORRECAO.sql novamente
2. Verifique se há erros no output
3. Se persistir, verifique permissões do usuário
```

---

### Problema 2: Cristal Pizzaria Não Corrigido

**Sintoma:**
```sql
SELECT * FROM restaurantes_app WHERE nome_fantasia ILIKE '%cristal%';

-- Retorna: 0 linhas (deveria retornar 1)
```

**Solução:**
```sql
-- Execute manualmente:
INSERT INTO restaurantes_app (id, email, nome_fantasia, tipo_restaurante, cnpj, telefone, nome_responsavel)
SELECT id, email, nome_fantasia, tipo_restaurante, cnpj, telefone, nome_responsavel
FROM profiles WHERE nome_fantasia ILIKE '%cristal%';
```

---

### Problema 3: Dashboard Ainda em Loop

**Sintoma:**
```
Dashboard fica carregando infinitamente
Console mostra: "Restaurante não encontrado"
```

**Solução:**
```
1. Verifique se o restaurante existe em restaurantes_app
2. Faça logout completo (limpe cache se necessário)
3. Faça login novamente
4. Se persistir, execute EXECUTAR_AGORA_CORRECAO.sql
```

---

### Problema 4: Cardápio Misturado

**Sintoma:**
```
Cristal Pizzaria vê itens do Fenix Carnes
```

**Solução:**
```sql
-- Verificar RLS:
SELECT policyname FROM pg_policies WHERE tablename = 'itens_cardapio';

-- Se não tiver políticas corretas, execute:
\i EXECUTAR_AGORA_CORRECAO.sql
```

---

## 📊 Fluxograma Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE CADASTRO                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Usuário preenche│
                    │    formulário    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Front-end chama│
                    │  signUp() com   │
                    │  tipo_usuario   │
                    └─────��──┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Supabase Auth  │
                    │  cria usuário   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Trigger 1      │
                    │  Insere em      │
                    │  profiles       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Trigger 2      │
                    │  Insere em      │
                    │  restaurantes_app│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Usuário faz    │
                    │  login          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Dashboard      │
                    │  carrega dados  │
                    │  ✅ SUCESSO     │
                    └─────────────────┘
```

---

## 🎓 Dicas Visuais

### ✅ Sinais de Sucesso

```
✅ Triggers aparecem na lista
✅ Funções aparecem na lista
✅ Cristal Pizzaria em ambas as tabelas
✅ Mesmo ID nas duas tabelas
✅ tipo_cliente = 'restaurante'
✅ Dashboard carrega em < 2 segundos
✅ Cardápio vazio (mas não quebrado)
✅ Novo cadastro cria em ambas as tabelas
```

### ❌ Sinais de Problema

```
❌ Triggers não aparecem
❌ Cristal Pizzaria só em profiles
❌ IDs diferentes nas tabelas
❌ tipo_cliente = 'cliente'
❌ Dashboard em loop infinito
❌ Cardápio mostra itens de outros
❌ Novo cadastro só cria em profiles
```

---

## 🎯 Resultado Final Esperado

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA FUNCIONANDO                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Cadastro: Simples e automático                          │
│  ✅ Login: Rápido e sem erros                               │
│  ✅ Dashboard: Carrega normalmente                          │
│  ✅ Dados: Consistentes e isolados                          │
│  ✅ Cardápio: Isolado por restaurante                       │
│  ✅ Triggers: Funcionando automaticamente                   │
│  ✅ RLS: Garantindo segurança                               │
│                                                             │
│  🎉 TUDO PRONTO PARA PRODUÇÃO!                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📞 Precisa de Ajuda?

1. **Execute:** `testar_novo_fluxo_cadastro.sql`
2. **Identifique:** Qual item está com ❌
3. **Consulte:** Seção correspondente neste guia
4. **Execute:** Correção específica
5. **Valide:** Execute teste novamente

**Ainda com problemas?** Consulte [COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)
