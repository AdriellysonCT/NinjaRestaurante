# Funcionalidade: Encerrar o Dia

## Descrição
Funcionalidade que permite ao estabelecimento encerrar suas operações do dia de forma controlada, atualizando o status no banco de dados e fazendo logout do sistema.

## Implementação

### 1. Opção no Menu de Perfil
- **Localização**: Dentro do menu dropdown do perfil do usuário (clique no avatar)
- **Posição**: Última opção do menu, após as configurações
- **Ícone**: LogOutIcon (ícone de saída)
- **Cor**: Laranja para destacar
- **Texto**: "Encerrar o Dia"

### 2. Modal de Confirmação
Ao clicar em "Encerrar o Dia", o modal se transforma em uma tela de confirmação com:
- **Título**: "Encerrar o Dia?"
- **Mensagem**: "Isso irá marcar o estabelecimento como inativo e você será deslogado do sistema."
- **Botões**:
  - **Cancelar**: Volta para o menu do perfil
  - **Confirmar**: Executa a ação de encerrar o dia

### 3. Fluxo de Execução

Quando o usuário confirma o encerramento:

1. **Busca o restaurante** no banco de dados usando o `user_id`
2. **Atualiza o campo `ativo`** na tabela `restaurantes_app` para `false`
3. **Faz logout** do usuário
4. **Redireciona** para a tela de login

### 4. Atualização Automática do Status

#### No Login:
- O campo `ativo` é atualizado para `true` automaticamente
- Indica que o estabelecimento está operando

#### No Logout:
- O campo `ativo` é atualizado para `false` automaticamente
- Indica que o estabelecimento não está mais operando

#### No Encerrar Dia:
- Atualiza `ativo` para `false` antes do logout
- Permite diferenciar logout normal de encerramento de dia

## Arquivos Modificados

### 1. `src/components/Header.jsx`
- Adicionado estado `showEndDayConfirm`
- Adicionado ref `endDayRef` para controle de clique fora
- Adicionada função `handleEndDay()` para processar o encerramento
- Adicionado botão e modal de confirmação na interface

### 2. `src/context/AuthContext.jsx`
- Atualizado `login()` para marcar `ativo = true` ao fazer login
- Atualizado `logout()` para marcar `ativo = false` ao deslogar
- Ambos buscam o restaurante por `user_id` antes de atualizar

### 3. `src/components/icons/definitions.jsx`
- Adicionado novo ícone `LogOutIcon` para o botão de encerrar dia

### 4. `adicionar_campo_online.sql`
- Script SQL para adicionar/verificar o campo `ativo` na tabela `restaurantes_app`
- Cria índice para melhorar performance
- Inclui comentários e verificações

## Tabela do Banco de Dados

### `restaurantes_app`
```sql
-- Campo adicionado
ativo BOOLEAN DEFAULT true
```

- **Tipo**: Boolean
- **Default**: true (restaurante ativo por padrão)
- **Índice**: `idx_restaurantes_ativo` para melhorar performance

## Como Usar

### Para o Usuário:
1. Clique no avatar do usuário no canto superior direito
2. No menu que abrir, clique em "Encerrar o Dia" (em laranja)
3. Leia a mensagem de confirmação
4. Clique em "Confirmar" para encerrar o dia
5. O sistema atualizará o status para inativo e fará logout automaticamente

### Comportamento:
- **Encerrar o Dia**: Marca o restaurante como `ativo = false` e faz logout (encerra as operações do dia)

### Para Desenvolvedores:
1. Execute o script SQL `adicionar_campo_online.sql` no Supabase
2. O campo `ativo` será criado automaticamente se não existir
3. A funcionalidade já está integrada ao sistema de autenticação

## Benefícios

1. **Controle de Operação**: Permite saber quais restaurantes estão operando
2. **Histórico**: Possibilita rastrear horários de abertura/fechamento
3. **Integração**: Pode ser usado por entregadores e outros sistemas para saber se o restaurante está aceitando pedidos
4. **UX Melhorada**: Processo claro e confirmado para encerrar operações

## Segurança

- Requer autenticação do usuário
- Atualiza apenas o restaurante do usuário logado
- Não impede logout mesmo se falhar ao atualizar o status
- Logs detalhados de todas as operações

## Notas Técnicas

- O modal fecha ao clicar fora dele
- A atualização do banco é não-bloqueante (não impede logout em caso de erro)
- O sistema sempre redireciona para login após confirmar
- Tratamento de erros robusto em todas as etapas

