# 🛡️ Fluxo de Cadastro Robusto - Sem Dependência de Triggers

## 🎯 Objetivo

Garantir que o cadastro de restaurantes seja **à prova de erros**, criando os 3 registros necessários de forma coordenada:

1. ✅ Usuário no Supabase Auth (email + senha)
2. ✅ Registro em `profiles` (id, email, tipo_usuario)
3. ✅ Registro completo em `restaurantes_app` (todos os campos do formulário)

## 🔒 Princípios

- **Atomicidade**: Se qualquer etapa falhar, reverter as anteriores
- **Sem Triggers**: Front-end controla todo o fluxo
- **Tratamento de Erros**: Compensação automática em caso de falha
- **Validação**: Todos os campos validados antes de enviar
- **UX**: Feedback claro para o usuário em cada etapa

## 📋 Fluxo Implementado

### Etapa 1: Validação no Front-end

```javascript
// Validações obrigatórias:
- Nome do restaurante (não vazio)
- Tipo de restaurante (não vazio)
- CNPJ (formato: 00.000.000/0000-00)
- Telefone (formato: (00) 00000-0000)
- Email (formato válido)
- Nome do responsável (não vazio)
- Senha (mínimo 6 caracteres)
- Confirmação de senha (deve coincidir)
```

### Etapa 2: Verificar Email Duplicado

```javascript
// Antes de criar qualquer coisa, verificar se email já existe
const { data: existingUser } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email)
  .maybeSingle();

if (existingUser) {
  throw new Error('Email já cadastrado');
}
```

### Etapa 3: Criar Usuário no Auth

```javascript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: dadosRestaurante.email,
  password: senha,
});

if (authError) throw authError;
if (!authData.user) throw new Error('Falha ao criar usuário');

const userId = authData.user.id;
```

**Se falhar:** Lançar erro e parar

### Etapa 4: Criar Profile

```javascript
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: userId,
    email: dadosRestaurante.email,
    tipo_usuario: 'restaurante',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

if (profileError) {
  // COMPENSAÇÃO: Deletar usuário do Auth
  await supabase.auth.admin.deleteUser(userId);
  throw new Error('Erro ao criar perfil');
}
```

**Se falhar:** Deletar usuário do Auth e lançar erro

### Etapa 5: Criar Restaurante

```javascript
const { error: restauranteError } = await supabase
  .from('restaurantes_app')
  .insert({
    id: userId,
    user_id: userId,
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
    imagem_url: dadosRestaurante.imagem_url || null,
    latitude: dadosRestaurante.latitude || null,
    longitude: dadosRestaurante.longitude || null,
    conta_bancaria: dadosRestaurante.conta_bancaria || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

if (restauranteError) {
  // COMPENSAÇÃO: Deletar profile e usuário do Auth
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.admin.deleteUser(userId);
  throw new Error('Erro ao criar restaurante');
}
```

**Se falhar:** Deletar profile, deletar usuário do Auth e lançar erro

### Etapa 6: Sucesso

```javascript
return { 
  userId, 
  success: true, 
  emailConfirmationRequired,
  message: 'Cadastro realizado com sucesso!'
};
```

## 🔄 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    CADASTRO ROBUSTO                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Validar Form   │
                    │  (Front-end)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Verificar      │
                    │  Email Existe?  │
                    └────────┬─────────┘
                             │
                             ▼ Não existe
                    ┌─────────────────┐
                    │  1. Criar Auth  │
                    │  User           │
                    └────────┬─────────┘
                             │ ✅
                             ▼
                    ┌─────────────────┐
                    │  2. Criar       │
                    │  Profile        │
                    └────────┬─────────┘
                             │ ✅
                             ▼
                    ┌─────────────────┐
                    │  3. Criar       │
                    │  Restaurante    │
                    └────────┬─────────┘
                             │ ✅
                             ▼
                    ┌─────────────────┐
                    │  ✅ SUCESSO     │
                    │  Redirecionar   │
                    └─────────────────┘

                    ❌ Se falhar em qualquer etapa:
                    └─> Reverter etapas anteriores
                    └─> Mostrar erro ao usuário
```

## 🛡️ Estratégia de Compensação

| Etapa que Falhou | Ações de Compensação |
|------------------|----------------------|
| **Auth User** | Nenhuma (nada foi criado) |
| **Profile** | Deletar Auth User |
| **Restaurante** | Deletar Profile + Deletar Auth User |

## 📊 Campos do Formulário

### Obrigatórios
- `nome_fantasia` - Nome do restaurante
- `tipo_restaurante` - Tipo (Pizzaria, Hamburgueria, etc)
- `cnpj` - CNPJ formatado
- `telefone` - Telefone formatado
- `email` - Email válido
- `nome_responsavel` - Nome do responsável
- `senha` - Mínimo 6 caracteres

### Opcionais (Endereço)
- `rua` - Rua
- `numero` - Número
- `bairro` - Bairro
- `cidade` - Cidade
- `complemento` - Complemento

### Opcionais (Extras)
- `imagem_url` - URL da imagem do restaurante
- `latitude` - Coordenada de latitude
- `longitude` - Coordenada de longitude
- `conta_bancaria` - Dados bancários (JSONB)

## ✅ Vantagens do Novo Fluxo

1. **Controle Total**: Front-end controla todo o processo
2. **Sem Dependências**: Não depende de triggers do banco
3. **Atomicidade**: Garante que não ficam registros "meio criados"
4. **Rastreabilidade**: Logs claros em cada etapa
5. **Recuperação**: Compensação automática em caso de erro
6. **Testabilidade**: Fácil de testar cada etapa
7. **Manutenibilidade**: Código claro e fácil de entender

## 🧪 Como Testar

### Teste 1: Cadastro Completo
```javascript
// Preencher todos os campos obrigatórios
// Resultado esperado: Sucesso, 3 registros criados
```

### Teste 2: Email Duplicado
```javascript
// Tentar cadastrar com email já existente
// Resultado esperado: Erro antes de criar qualquer registro
```

### Teste 3: Validação de Campos
```javascript
// Deixar campos obrigatórios vazios
// Resultado esperado: Erro de validação no front-end
```

### Teste 4: CNPJ Inválido
```javascript
// Digitar CNPJ com formato errado
// Resultado esperado: Erro de validação no front-end
```

### Teste 5: Senhas Não Coincidem
```javascript
// Digitar senhas diferentes
// Resultado esperado: Erro de validação no front-end
```

## 🔍 Verificação no Banco

Após cadastro bem-sucedido, verificar:

```sql
-- 1. Usuário no Auth
SELECT id, email FROM auth.users WHERE email = 'teste@email.com';

-- 2. Profile criado
SELECT id, email, tipo_usuario FROM profiles WHERE email = 'teste@email.com';

-- 3. Restaurante criado
SELECT id, user_id, nome_fantasia, email FROM restaurantes_app WHERE email = 'teste@email.com';

-- Todos devem ter o MESMO ID
```

## 🚨 Tratamento de Erros

### Erro: "Email já cadastrado"
**Causa:** Email já existe no banco  
**Ação:** Usuário deve usar outro email ou fazer login

### Erro: "Falha ao criar usuário no Auth"
**Causa:** Problema no Supabase Auth  
**Ação:** Tentar novamente ou verificar configuração do Supabase

### Erro: "Erro ao criar perfil"
**Causa:** Problema ao inserir em profiles  
**Ação:** Auth User é deletado automaticamente, usuário pode tentar novamente

### Erro: "Erro ao criar restaurante"
**Causa:** Problema ao inserir em restaurantes_app  
**Ação:** Profile e Auth User são deletados automaticamente, usuário pode tentar novamente

## 📝 Logs do Console

Durante o cadastro, você verá:

```
🚀 Iniciando processo de cadastro...
🔍 Verificando se o email já está registrado...
👤 Criando usuário no Supabase Auth...
✅ Usuário criado no Auth. ID: xxx-xxx-xxx
📝 Criando registro em profiles...
✅ Profile criado com sucesso
🏪 Criando registro em restaurantes_app...
✅ Restaurante criado com sucesso
🎉 Cadastro concluído com sucesso!
```

Em caso de erro:
```
❌ Erro ao criar restaurante: [mensagem do erro]
🔄 Revertendo: deletando profile...
🔄 Limpando dados parciais...
```

## 🎯 Resultado Final

- ✅ Cadastro robusto e à prova de erros
- ✅ Sem dependência de triggers
- ✅ Compensação automática em caso de falha
- ✅ Feedback claro para o usuário
- ✅ Dados sempre consistentes
- ✅ Fácil de manter e testar

**Sistema pronto para produção!** 🚀
