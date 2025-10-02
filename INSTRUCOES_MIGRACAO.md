# Instruções para Migração - Tabela itens_cardapio

## Passos para executar a migração:

### 1. Execute o script SQL no Supabase
1. Acesse o painel do Supabase
2. Vá para a seção "SQL Editor"
3. Execute o conteúdo do arquivo `migration_itens_cardapio.sql`

### 2. Verificar se a migração foi bem-sucedida
Após executar o script, verifique se:
- A tabela `itens_cardapio` foi criada
- Os índices foram criados
- As políticas RLS foram aplicadas
- O trigger de atualização automática está funcionando

### 3. Migrar dados existentes (opcional)
Se você já tem dados na tabela `menu_items`, descomente e execute a seção de migração no script SQL:

```sql
INSERT INTO itens_cardapio (
    nome, 
    descricao, 
    preco, 
    categoria, 
    imagem_url, 
    disponivel, 
    destaque, 
    tempo_preparo, 
    ingredientes,
    id_restaurante
)
SELECT 
    name as nome,
    description as descricao,
    price as preco,
    category as categoria,
    image_url as imagem_url,
    available as disponivel,
    featured as destaque,
    prep_time as tempo_preparo,
    ingredients as ingredientes,
    (SELECT id FROM auth.users LIMIT 1) as id_restaurante
FROM menu_items;
```

### 4. Remover tabela antiga (após confirmar que tudo funciona)
```sql
DROP TABLE IF EXISTS menu_items;
```

## Mudanças implementadas no código:

### ✅ Arquivos atualizados:
- `src/services/menuService.js` - Atualizado para usar `itens_cardapio`
- `src/context/AppContext.jsx` - Mapeamento de campos atualizado
- `src/lib/setupSupabase.js` - Documentação da nova estrutura
- `migration_itens_cardapio.sql` - Script de migração completo

### 🔄 Mapeamento de campos:
| Campo Antigo (menu_items) | Campo Novo (itens_cardapio) |
|---------------------------|----------------------------|
| name                      | nome                       |
| description               | descricao                  |
| price                     | preco                      |
| category                  | categoria                  |
| image_url                 | imagem_url                 |
| available                 | disponivel                 |
| featured                  | destaque                   |
| prep_time                 | tempo_preparo              |
| ingredients               | ingredientes               |
| -                         | id_restaurante (NOVO)      |
| -                         | criado_em (NOVO)           |
| -                         | atualizado_em (NOVO)       |

### 🔐 Segurança implementada:
- **RLS (Row Level Security)**: Usuários só podem ver/editar seus próprios itens
- **Políticas de acesso**: SELECT, INSERT, UPDATE, DELETE restritos por `id_restaurante`
- **Validação de usuário**: Todas as operações verificam autenticação

### 📊 Melhorias de performance:
- Índices criados para `id_restaurante`, `categoria` e `disponivel`
- Trigger automático para atualizar `atualizado_em`

## Testando a migração:

1. Faça login no sistema
2. Vá para a página de Menu
3. Tente adicionar um novo item
4. Verifique se o item aparece corretamente
5. Teste editar e alterar disponibilidade
6. Confirme que apenas seus itens aparecem (multi-tenant)

## Em caso de problemas:

1. Verifique os logs do console do navegador
2. Confirme se o usuário está autenticado
3. Verifique se as políticas RLS estão ativas
4. Confirme se a tabela foi criada corretamente no Supabase