# 🎯 Qual Script Executar?

## ⚠️ Importante

A tabela `profiles` é a **árvore central** que guarda dados de:
- 🏪 Restaurantes
- 👤 Clientes  
- 🚴 Entregadores

**Não podemos** marcar todos como "restaurante"!

## 📊 Scripts Disponíveis

### 1️⃣ CORRECAO_SEGURA.sql ⭐ RECOMENDADO

**Use este se:** Você tem clientes, entregadores e restaurantes no sistema

**O que faz:**
- ✅ Identifica quem é restaurante (tem nome_fantasia, cnpj, tipo_restaurante)
- ✅ Identifica quem é cliente (tem CPF)
- ✅ Só atualiza os que são claramente restaurantes
- ✅ Não mexe em clientes e entregadores
- ✅ Mostra relatório detalhado

**Critérios de identificação:**
```sql
É RESTAURANTE se:
- Tem nome_fantasia OU
- Tem CNPJ OU
- Tem tipo_restaurante
E NÃO tem CPF

É CLIENTE se:
- Tem CPF
```

### 2️⃣ SOLUCAO_FINAL.sql

**Use este se:** Você tem APENAS restaurantes no sistema (sem clientes/entregadores)

**O que faz:**
- Atualiza todos os profiles para tipo_usuario = 'restaurante'
- Mais rápido, mas menos seguro

## 🚀 Recomendação

### Execute: CORRECAO_SEGURA.sql

```sql
-- No Supabase SQL Editor:
-- Copie e cole o conteúdo de: CORRECAO_SEGURA.sql
```

**Por quê?**
- ✅ Mais seguro
- ✅ Identifica corretamente cada tipo
- ✅ Não bagunça clientes e entregadores
- ✅ Mostra relatório detalhado
- ✅ Pode ser executado múltiplas vezes sem problemas

## 📋 O Que o Script Faz

### Passo 1: Identificação

```
📊 DISTRIBUIÇÃO ATUAL:
tipo_usuario | quantidade
-------------|----------
cliente      | 5
restaurante  | 2
NULL         | 3

🏪 POSSÍVEIS RESTAURANTES:
- ID xxx | email@restaurante.com | tem nome_fantasia ✅ cnpj ✅
- ID yyy | outro@restaurante.com | tem tipo_restaurante ✅

👤 POSSÍVEIS CLIENTES:
- ID zzz | cliente@email.com | CPF: 123.456.789-00
```

### Passo 2: Correção Seletiva

```sql
-- Só atualiza os que são claramente restaurantes
UPDATE profiles
SET tipo_usuario = 'restaurante'
WHERE (tem nome_fantasia OR cnpj OR tipo_restaurante)
  AND NÃO tem CPF;
```

### Passo 3: Criar em restaurantes_app

```sql
-- Só cria para quem tem tipo_usuario = 'restaurante'
INSERT INTO restaurantes_app (...)
SELECT ... FROM profiles
WHERE tipo_usuario = 'restaurante';
```

## ✅ Verificação Após Execução

O script mostra automaticamente:

```
📊 DISTRIBUIÇÃO POR TIPO:
tipo_usuario | quantidade
-------------|----------
restaurante  | 5
cliente      | 3
entregador   | 2

🏪 RESTAURANTES:
total_restaurantes: 5
com_restaurante_app: 5 ✅
sem_restaurante_app: 0 ✅

👤 CLIENTES:
total_clientes: 3

📋 LISTA DE RESTAURANTES:
ID | Email | Status
---|-------|-------
xxx | email@rest.com | ✅ OK
yyy | outro@rest.com | ✅ OK
```

## 🔍 Se Tiver Dúvida

Execute primeiro apenas a parte de identificação:

```sql
-- Ver distribuição atual
SELECT tipo_usuario, COUNT(*) 
FROM profiles 
GROUP BY tipo_usuario;

-- Ver possíveis restaurantes
SELECT id, email, nome_fantasia, cnpj, tipo_restaurante
FROM profiles
WHERE (nome_fantasia IS NOT NULL OR cnpj IS NOT NULL)
  AND (cpf IS NULL OR cpf = '');

-- Ver possíveis clientes
SELECT id, email, cpf
FROM profiles
WHERE cpf IS NOT NULL AND cpf != '';
```

## 🎯 Resumo

| Script | Quando Usar | Segurança |
|--------|-------------|-----------|
| **CORRECAO_SEGURA.sql** | Sistema com múltiplos tipos | ⭐⭐⭐⭐⭐ |
| SOLUCAO_FINAL.sql | Apenas restaurantes | ⭐⭐⭐ |

## 🚀 Próximos Passos

1. **Execute:** `CORRECAO_SEGURA.sql`
2. **Verifique:** Relatório gerado pelo script
3. **Teste:** Novo cadastro de restaurante
4. **Confirme:** Logs no console (F12)

---

**Recomendação:** `CORRECAO_SEGURA.sql` 🚀
