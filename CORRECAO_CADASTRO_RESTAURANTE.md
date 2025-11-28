# Correção do Sistema de Cadastro de Restaurantes

## Problemas Identificados

1. **Trigger não criou registro em `restaurantes_app`**
   - O restaurante "Cristal Pizzaria" foi criado apenas em `profiles`
   - Faltou a inserção automática em `restaurantes_app`

2. **Campo `tipo_cliente` incorreto**
   - Está sendo salvo como "cliente" ao invés de "restaurante"
   - Isso acontece porque o valor não está sendo passado corretamente dos metadados

3. **Cardápio do Fenix Carnes aparecendo para outro restaurante**
   - Problema de isolamento nas políticas RLS
   - As políticas não estão filtrando corretamente por `restaurante_id`

## Solução Implementada

### 1. Triggers Corrigidos

#### Trigger `on_auth_user_created`
- Executa quando um novo usuário é criado no `auth.users`
- Extrai o `user_type` dos metadados (`raw_user_meta_data`)
- Insere em `profiles` com o tipo correto ("restaurante" ou "cliente")
- Copia todos os dados do cadastro (nome_fantasia, cnpj, telefone, etc.)

#### Trigger `on_profile_created_restaurante`
- Executa quando um novo profile é criado/atualizado
- Verifica se `tipo_cliente = 'restaurante'`
- Se sim, insere/atualiza automaticamente em `restaurantes_app`
- Garante que todo restaurante tenha registro nas duas tabelas

### 2. Correção do Cristal Pizzaria

O script faz:
1. Atualiza `tipo_cliente` para "restaurante" em `profiles`
2. Insere o registro em `restaurantes_app` com os dados do profile
3. Garante que o restaurante fique funcional

### 3. Políticas RLS Corrigidas

Todas as tabelas principais agora têm políticas que:
- Filtram por `restaurante_id = auth.uid()`
- Garantem isolamento total entre restaurantes
- Impedem que um restaurante veja dados de outro

Tabelas corrigidas:
- `itens_cardapio`
- `grupos_complementos`
- `complementos`
- `pedidos_padronizados`

## Como Executar

### Passo 1: Diagnóstico
```sql
-- Execute primeiro para ver o estado atual
\i diagnostico_e_correcao_cadastro.sql
```

### Passo 2: Correção
```sql
-- Execute para corrigir todos os problemas
\i corrigir_cadastro_completo.sql
```

### Passo 3: Verificação
O próprio script de correção já faz verificações no final, mas você pode executar novamente:
```sql
-- Verificar se o Cristal Pizzaria está correto
SELECT * FROM profiles WHERE nome_fantasia ILIKE '%cristal%';
SELECT * FROM restaurantes_app WHERE nome_fantasia ILIKE '%cristal%';

-- Verificar se os triggers foram criados
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created_restaurante');
```

## O Que Foi Corrigido

### ✅ Dashboard em Loop
- **Causa**: Restaurante não existia em `restaurantes_app`
- **Solução**: Script insere o registro faltante + trigger garante que não aconteça novamente

### ✅ Tipo Cliente Errado
- **Causa**: Metadados não eram lidos corretamente no trigger
- **Solução**: Trigger agora lê `raw_user_meta_data->>'user_type'` corretamente

### ✅ Cardápio de Outro Restaurante
- **Causa**: Políticas RLS não filtravam por `restaurante_id`
- **Solução**: Todas as políticas agora usam `restaurante_id = auth.uid()`

## Próximos Cadastros

Com os triggers corrigidos, os próximos cadastros de restaurantes irão:
1. Criar usuário em `auth.users` com metadados corretos
2. Trigger cria automaticamente em `profiles` com `tipo_cliente = 'restaurante'`
3. Trigger cria automaticamente em `restaurantes_app`
4. RLS garante isolamento total dos dados

## Testando Novo Cadastro

Após executar o script, teste criando um novo restaurante:
1. Vá para a página de cadastro
2. Preencha os dados
3. Após cadastrar, verifique:
   ```sql
   -- Deve aparecer em profiles com tipo_cliente = 'restaurante'
   SELECT * FROM profiles WHERE email = 'email_do_teste@teste.com';
   
   -- Deve aparecer em restaurantes_app
   SELECT * FROM restaurantes_app WHERE email = 'email_do_teste@teste.com';
   ```

## Observações Importantes

- O script usa `ON CONFLICT DO UPDATE` para evitar erros se o registro já existir
- As políticas RLS foram recriadas do zero para garantir consistência
- O isolamento agora é garantido em todas as tabelas principais
- Cada restaurante só vê seus próprios dados
