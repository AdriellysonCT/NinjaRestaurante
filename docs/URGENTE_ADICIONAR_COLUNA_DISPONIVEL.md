# 🚨 URGENTE - Adicionar Coluna "disponivel"

## ❌ Problema
A coluna `disponivel` não existe na tabela `complementos`.

**Erro:**
```
column complementos.disponivel does not exist
```

## ✅ Solução (1 minuto)

### Passo 1: Abrir Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**

### Passo 2: Executar o Script
Copie e cole este comando:

```sql
-- Adicionar coluna 'disponivel'
ALTER TABLE complementos 
ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT true;

-- Atualizar registros existentes
UPDATE complementos 
SET disponivel = true 
WHERE disponivel IS NULL;
```

### Passo 3: Clicar em Run
Aguarde a mensagem de sucesso.

### Passo 4: Verificar
Execute para confirmar:

```sql
SELECT 
    id,
    nome,
    preco,
    disponivel
FROM complementos;
```

Deve mostrar a coluna `disponivel` com valor `true` para todos.

### Passo 5: Recarregar o Sistema
1. Volte para o sistema
2. Pressione F5
3. Vá em "Complementos"
4. Clique em "Ativar" em um complemento
5. Deve funcionar agora! ✅

---

## 🔍 Por Que Aconteceu?

A tabela `complementos` foi criada sem a coluna `disponivel`. O código estava tentando usar essa coluna, mas ela não existia no banco.

---

## 📊 Estrutura Esperada

**Antes:**
```
complementos
├── id
├── id_restaurante
├── nome
├── preco
└── imagem
```

**Depois:**
```
complementos
├── id
├── id_restaurante
├── nome
├── preco
├── imagem
└── disponivel ← NOVA COLUNA
```

---

## ⏱️ Tempo Estimado
**1 minuto** para executar e testar

---

## 🆘 Se Der Erro

### Erro: "permission denied"
Execute:
```sql
GRANT ALL ON TABLE complementos TO authenticated;
```

### Erro: "column already exists"
A coluna já existe! Apenas recarregue o sistema (F5).

---

**Status:** ⏳ Aguardando execução do script
