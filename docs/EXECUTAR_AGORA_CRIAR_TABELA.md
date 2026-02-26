# 🚨 EXECUTAR AGORA - Criar Tabela Faltante

## Problema
A tabela `itens_cardapio_complementos` não existe no banco de dados. Ela é necessária para salvar quais complementos específicos estão disponíveis para cada item do cardápio.

## Solução

### Passo 1: Acessar o Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)

### Passo 2: Executar o Script
1. Clique em **New Query**
2. Copie e cole o conteúdo do arquivo: `criar_tabela_itens_cardapio_complementos.sql`
3. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar
Você deve ver uma mensagem de sucesso e a estrutura da tabela criada.

## O que essa tabela faz?

```
Item do Cardápio (Pizza Margherita)
    ↓
Grupo (Bordas - Obrigatório)
    ↓
Complementos Específicos:
    - Borda Catupiry (R$ 5,00)  ← Salvo aqui!
    - Borda Cheddar (R$ 6,00)   ← Salvo aqui!
```

## Após executar o script

1. Recarregue a página do sistema
2. Abra um item do cardápio
3. Vá na aba "Complementos"
4. Ative um grupo e selecione os complementos
5. Clique em "Salvar Alterações"
6. Agora os complementos devem aparecer no app do cliente! ✅

## Verificar se funcionou

Execute no SQL Editor:
```sql
SELECT * FROM itens_cardapio_complementos;
```

Deve mostrar os complementos que você selecionou.

---

**Status:** ⏳ Aguardando execução do script
