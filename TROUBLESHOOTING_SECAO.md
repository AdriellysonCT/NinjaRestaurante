# 🔧 Troubleshooting: Campo Seção não aparece

## ✅ Você viu a mensagem "Complemento criado com sucesso!"

Isso significa que o sistema está funcionando! Mas o campo de seção pode não estar visível por alguns motivos:

---

## 🔍 Diagnóstico Rápido

### 1. Verificar se o SQL foi executado

Execute no Supabase SQL Editor:
```sql
-- Ver se as colunas existem
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
    AND column_name IN ('secao', 'descricao');
```

**Resultado esperado:**
```
column_name | data_type
------------|----------
secao       | character varying
descricao   | text
```

**Se não retornar nada:** Execute o arquivo `adicionar_secao_grupos.sql`

---

### 2. Verificar o Modal

O modal deve ter este campo:

```
┌─────────────────────────────────────┐
│ Nome do Grupo                       │
│ [                                ]  │
│                                     │
│ Seção/Categoria (opcional) ← AQUI! │
│ [                                ]  │
│                                     │
│ Descrição (opcional)                │
│ [                                ]  │
└─────────────────────────────────────┘
```

**Se não aparecer:**
1. Limpe o cache do navegador (Ctrl + Shift + R)
2. Recarregue a página completamente
3. Feche e abra o modal novamente

---

### 3. Verificar o Console do Navegador

Abra o Console (F12) e procure por erros:

**Erros comuns:**
```
❌ column "secao" does not exist
   → Execute o SQL adicionar_secao_grupos.sql

❌ Cannot read property 'section' of undefined
   → Recarregue a página

❌ RLS policy violation
   → Verifique as permissões no Supabase
```

---

## 🚀 Solução Rápida

### Passo 1: Execute o SQL
```sql
-- No Supabase SQL Editor
ALTER TABLE grupos_complementos 
ADD COLUMN IF NOT EXISTS secao VARCHAR(100);

ALTER TABLE grupos_complementos 
ADD COLUMN IF NOT EXISTS descricao TEXT;
```

### Passo 2: Limpe o Cache
- Chrome/Edge: Ctrl + Shift + R
- Firefox: Ctrl + F5
- Safari: Cmd + Shift + R

### Passo 3: Recarregue a Página
- Feche todas as abas do sistema
- Abra novamente
- Vá em Complementos > Grupos
- Clique em "Criar Grupo"

---

## 📸 Como Deve Ficar

### Modal de Criar Grupo
```
╔═══════════════════════════════════════╗
║ Criar Grupo                      [X]  ║
╠═══════════════════════════════════════╣
║                                       ║
║ Nome do Grupo                         ║
║ ┌───────────────────────────────────┐ ║
║ │ Ex: Molhos                        │ ║
║ └───────────────────────────────────┘ ║
║                                       ║
║ Seção/Categoria (opcional)            ║
║ ┌───────────────────────────────────┐ ║
║ │ Ex: Bebidas, Lanches, Sobremesas  │ ║
║ └───────────────────────────────────┘ ║
║                                       ║
║ Descrição (opcional)                  ║
║ ┌───────────────────────────────────┐ ║
║ │ Descreva o grupo de complementos  │ ║
║ │                                   │ ║
║ └───────────────────────────────────┘ ║
║                                       ║
║ Tipo de Seleção                       ║
║ ○ Único (escolher apenas 1)           ║
║ ● Múltiplo (escolher vários)          ║
║                                       ║
║ ☐ Obrigatório                         ║
║                                       ║
║ ┌──────────┐  ┌──────────────────┐   ║
║ │ Cancelar │  │ Salvar           │   ║
║ └──────────┘  └──────────────────┘   ║
╚═══════════════════════════════════════╝
```

---

## 🐛 Problemas Conhecidos

### Problema 1: Campo não aparece
**Causa:** SQL não foi executado
**Solução:** Execute `adicionar_secao_grupos.sql`

### Problema 2: Erro ao salvar
**Causa:** Coluna não existe no banco
**Solução:** Execute o ALTER TABLE manualmente

### Problema 3: Modal antigo
**Causa:** Cache do navegador
**Solução:** Limpe o cache (Ctrl + Shift + R)

### Problema 4: Seção não salva
**Causa:** Service não está enviando o campo
**Solução:** Verifique se o arquivo foi atualizado corretamente

---

## 🔍 Verificação Completa

Execute este checklist:

```sql
-- 1. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grupos_complementos'
ORDER BY ordinal_position;

-- 2. Testar inserção manual
INSERT INTO grupos_complementos (
    id_restaurante,
    nome,
    secao,
    descricao,
    tipo_selecao,
    obrigatorio
) VALUES (
    (SELECT id FROM restaurantes LIMIT 1),
    'Teste Seção',
    'Teste',
    'Descrição teste',
    'multiple',
    false
);

-- 3. Verificar se foi salvo
SELECT * FROM grupos_complementos 
WHERE nome = 'Teste Seção';

-- 4. Deletar teste
DELETE FROM grupos_complementos 
WHERE nome = 'Teste Seção';
```

---

## 📞 Ainda não funciona?

### Verifique:
1. ✅ SQL executado no Supabase?
2. ✅ Cache limpo?
3. ✅ Página recarregada?
4. ✅ Console sem erros?
5. ✅ Arquivo Complements.jsx atualizado?

### Logs para verificar:
```javascript
// Abra o Console (F12) e procure por:
console.log('➕ Criando novo grupo:', currentGroup);
// Deve mostrar: { name: "...", section: "...", ... }
```

---

## ✅ Teste Final

1. Abra o modal de criar grupo
2. Preencha:
   - Nome: "Refrigerantes"
   - Seção: "Bebidas"
   - Descrição: "Escolha seu refrigerante"
   - Tipo: Único
   - Obrigatório: Não
3. Clique em Salvar
4. Verifique no banco:
```sql
SELECT nome, secao, descricao 
FROM grupos_complementos 
WHERE nome = 'Refrigerantes';
```

**Resultado esperado:**
```
nome          | secao   | descricao
--------------|---------|-------------------------
Refrigerantes | Bebidas | Escolha seu refrigerante
```

---

## 🎯 Resumo

**O campo de seção JÁ ESTÁ no código!**

Se não aparece:
1. Execute o SQL
2. Limpe o cache
3. Recarregue a página

Se ainda não funcionar, me avise e vou investigar mais a fundo! 😊
