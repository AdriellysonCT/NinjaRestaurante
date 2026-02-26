# 🚀 Passo a Passo - Criar Tabela Faltante

## ⚠️ Problema
A tabela `itens_cardapio_complementos` não existe no seu banco de dados.

## ✅ Solução Rápida (5 minutos)

### Passo 1: Abrir o Supabase
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto (fome-ninja ou similar)

### Passo 2: Ir para o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor** (ícone de código)
2. Clique no botão **New Query** (canto superior direito)

### Passo 3: Copiar o Script
Abra o arquivo: `criar_tabela_complementos_simples.sql`

Copie TODO o conteúdo (Ctrl+A, Ctrl+C)

### Passo 4: Colar e Executar
1. Cole o script no SQL Editor (Ctrl+V)
2. Clique no botão **Run** (ou pressione Ctrl+Enter)
3. Aguarde alguns segundos

### Passo 5: Verificar Sucesso
Você deve ver no final:
```
✅ Tabela itens_cardapio_complementos criada com sucesso!
```

E também a estrutura da tabela:
```
column_name          | data_type | is_nullable
---------------------|-----------|------------
id                   | uuid      | NO
item_cardapio_id     | uuid      | NO
grupo_id             | uuid      | NO
complemento_id       | uuid      | NO
created_at           | timestamp | YES
```

### Passo 6: Testar no Sistema
1. Volte para o sistema
2. Recarregue a página (F5)
3. Abra um item do cardápio
4. Vá na aba "Complementos"
5. Ative um grupo (ex: Bordas)
6. Clique em "Gerenciar"
7. Selecione os complementos
8. Clique em "Salvar Seleção"
9. Clique em "Salvar Alterações"

### Passo 7: Verificar se Salvou
No SQL Editor do Supabase, execute:
```sql
SELECT * FROM itens_cardapio_complementos;
```

Deve mostrar os complementos que você selecionou! 🎉

---

## 🆘 Se der erro

### Erro: "permission denied"
Execute este comando primeiro:
```sql
GRANT ALL ON TABLE itens_cardapio_complementos TO authenticated;
```

### Erro: "relation already exists"
A tabela já existe! Apenas recarregue o sistema.

### Outro erro
Tire um print e me mostre o erro completo.

---

## 📱 Resultado Final

Depois de criar a tabela e salvar os complementos:

**No painel admin:**
- ✅ Você vê os grupos ativos
- ✅ Você vê os complementos selecionados

**No app do cliente:**
- ✅ Cliente vê os grupos obrigatórios
- ✅ Cliente pode selecionar os complementos
- ✅ Complementos são adicionados ao pedido

---

**Precisa de ajuda? Me chame!** 🚀
