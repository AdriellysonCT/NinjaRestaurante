# 🚨 Solução Rápida - Complementos Indisponíveis

## Problema
Os complementos estão mostrando "Indisponível" mesmo estando ativos.

## Causa
Os complementos foram criados com `disponivel = false` no banco de dados.

## Solução em 2 Passos

### Passo 1: Ativar Todos os Complementos

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute este comando:

```sql
UPDATE complementos 
SET disponivel = true;
```

4. Clique em **Run**

### Passo 2: Criar a Tabela Faltante (Opcional mas Recomendado)

Execute também:

```sql
CREATE TABLE IF NOT EXISTS itens_cardapio_complementos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_cardapio_id UUID NOT NULL,
    grupo_id UUID NOT NULL,
    complemento_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE itens_cardapio_complementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo em itens_cardapio_complementos"
    ON itens_cardapio_complementos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

### Passo 3: Recarregar o Sistema

1. Volte para o sistema
2. Pressione F5 para recarregar
3. Vá em "Complementos"
4. Agora deve mostrar "Disponível" (verde) ✅

---

## Verificar se Funcionou

Execute no SQL Editor:

```sql
SELECT nome, disponivel FROM complementos;
```

Todos devem mostrar `disponivel = true`

---

## Resultado Esperado

**Antes:**
- ❌ Borda de Catupiry: Indisponível (vermelho)
- ❌ Borda de chocolate: Indisponível (vermelho)

**Depois:**
- ✅ Borda de Catupiry: Disponível (verde)
- ✅ Borda de chocolate: Disponível (verde)

---

## Se Ainda Não Funcionar

Limpe o cache do navegador:
1. Pressione Ctrl+Shift+Delete
2. Selecione "Cache" e "Cookies"
3. Clique em "Limpar dados"
4. Recarregue a página (F5)

---

**Tempo estimado:** 1 minuto ⏱️
