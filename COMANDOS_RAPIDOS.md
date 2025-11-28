# ⚡ Comandos Rápidos

## 🔧 1. Corrigir Tudo Agora

Copie e cole no **Supabase SQL Editor**:

```sql
-- Abra: EXECUTAR_AGORA_CORRECAO.sql
-- Copie todo o conteúdo
-- Cole no SQL Editor
-- Clique em RUN
```

## ✅ 2. Verificar se Funcionou

```sql
-- Abra: testar_novo_fluxo_cadastro.sql
-- Copie todo o conteúdo
-- Cole no SQL Editor
-- Clique em RUN
```

## 🔍 3. Verificação Rápida (Copie e Cole)

```sql
-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');

-- Verificar Cristal Pizzaria
SELECT 'profiles' as tabela, id, email, tipo_cliente, nome_fantasia 
FROM profiles WHERE nome_fantasia ILIKE '%cristal%'
UNION ALL
SELECT 'restaurantes_app', id, email, 'N/A', nome_fantasia 
FROM restaurantes_app WHERE nome_fantasia ILIKE '%cristal%';

-- Verificar inconsistências
SELECT COUNT(*) as inconsistencias
FROM profiles p
WHERE p.tipo_cliente = 'restaurante'
  AND NOT EXISTS (SELECT 1 FROM restaurantes_app r WHERE r.id = p.id);
```

## 🧪 4. Testar Novo Cadastro

1. Vá para `/cadastro`
2. Preencha:
   - Nome: "Teste Automatico"
   - Tipo: "Pizzaria"
   - CNPJ: "12.345.678/0001-90"
   - Telefone: "(11) 98765-4321"
   - Email: "teste@automatico.com"
   - Responsável: "João Teste"
   - Senha: "123456"

3. Após cadastrar, execute:
```sql
SELECT * FROM profiles WHERE email = 'teste@automatico.com';
SELECT * FROM restaurantes_app WHERE email = 'teste@automatico.com';
```

4. Ambos devem retornar 1 linha com o mesmo ID

## 🗑️ 5. Limpar Teste

```sql
-- Deletar usuário de teste
DELETE FROM auth.users WHERE email = 'teste@automatico.com';
-- As triggers CASCADE vão deletar de profiles e restaurantes_app automaticamente
```

## 🚨 6. Resolver Problemas Comuns

### Dashboard em Loop
```sql
-- Verificar se restaurante existe
SELECT * FROM restaurantes_app WHERE id = 'SEU_USER_ID';

-- Se não existir, corrigir:
INSERT INTO restaurantes_app (id, email, nome_fantasia, tipo_restaurante, cnpj, telefone, nome_responsavel)
SELECT id, email, nome_fantasia, tipo_restaurante, cnpj, telefone, nome_responsavel
FROM profiles WHERE id = 'SEU_USER_ID';
```

### Cardápio de Outro Restaurante Aparecendo
```sql
-- Verificar RLS
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'itens_cardapio';

-- Se não tiver políticas corretas, execute EXECUTAR_AGORA_CORRECAO.sql
```

### Tipo Cliente Errado
```sql
-- Corrigir tipo_cliente
UPDATE profiles 
SET tipo_cliente = 'restaurante' 
WHERE nome_fantasia ILIKE '%nome_do_restaurante%';
```

## 📊 7. Monitoramento

```sql
-- Ver últimos cadastros
SELECT 
    p.email,
    p.tipo_cliente,
    p.nome_fantasia,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ FALTANDO'
    END as status_restaurante_app,
    p.created_at
FROM profiles p
LEFT JOIN restaurantes_app r ON r.id = p.id
WHERE p.tipo_cliente = 'restaurante'
ORDER BY p.created_at DESC
LIMIT 10;
```

## 🎯 8. Checklist Pós-Correção

Execute cada comando e marque:

- [ ] Triggers criadas (deve retornar 2)
```sql
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');
```

- [ ] Cristal Pizzaria corrigido (deve retornar 2 linhas)
```sql
SELECT COUNT(*) FROM (
  SELECT id FROM profiles WHERE nome_fantasia ILIKE '%cristal%'
  UNION ALL
  SELECT id FROM restaurantes_app WHERE nome_fantasia ILIKE '%cristal%'
) as total;
```

- [ ] Sem inconsistências (deve retornar 0)
```sql
SELECT COUNT(*) FROM profiles p
WHERE p.tipo_cliente = 'restaurante'
  AND NOT EXISTS (SELECT 1 FROM restaurantes_app r WHERE r.id = p.id);
```

- [ ] RLS configurado (deve retornar 4 políticas)
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'itens_cardapio';
```

## 🔄 9. Resetar Tudo (Emergência)

**⚠️ CUIDADO: Isso vai deletar TODOS os restaurantes!**

```sql
-- Apenas se realmente precisar resetar tudo
BEGIN;

-- Deletar todos os restaurantes de teste
DELETE FROM auth.users WHERE email LIKE '%teste%';

-- Recriar triggers
\i EXECUTAR_AGORA_CORRECAO.sql

COMMIT;
```

## 📞 10. Suporte

Se algo não funcionar:

1. Execute `testar_novo_fluxo_cadastro.sql`
2. Copie o resultado
3. Verifique qual item está com ❌
4. Execute `EXECUTAR_AGORA_CORRECAO.sql` novamente
5. Se persistir, verifique os logs do Supabase

## 🎓 Referências Rápidas

- **Documentação Completa:** `NOVO_FLUXO_CADASTRO.md`
- **Resumo:** `RESUMO_ATUALIZACAO_CADASTRO.md`
- **Correção:** `EXECUTAR_AGORA_CORRECAO.sql`
- **Teste:** `testar_novo_fluxo_cadastro.sql`
