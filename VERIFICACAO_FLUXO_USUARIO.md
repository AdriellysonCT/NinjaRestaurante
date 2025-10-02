# Verificação do Fluxo de Usuário e Estrutura de Dados

## 🔍 Problema Identificado:

### Inconsistência nas Referências:
- `itens_cardapio.id_restaurante` = `66db4c99-7f6d-4bca-a5dd-2f4d2461df0b` (profiles/auth.users)
- `restaurantes_app.id` = `fd5373b6-e89c-40d5-b00b-6da483d91b7c` (restaurante específico)

### Estrutura Atual vs Esperada:

#### ❌ Como está agora:
```
auth.users (id: 66db4c99...)
├── profiles (id: 66db4c99...)
├── restaurantes_app (id: fd5373b6..., user_id: 66db4c99...)
└── itens_cardapio (id_restaurante: 66db4c99...) ← PROBLEMA!
```

#### ✅ Como deveria ser:
```
auth.users (id: 66db4c99...)
├── profiles (id: 66db4c99...)
├── restaurantes_app (id: fd5373b6..., user_id: 66db4c99...)
└── itens_cardapio (id_restaurante: fd5373b6...) ← CORRETO!
```

## 🎯 Soluções Possíveis:

### Opção 1: Usar restaurantes_app.id (Recomendado)
- Alterar `itens_cardapio.id_restaurante` para referenciar `restaurantes_app.id`
- Mais semântico e correto

### Opção 2: Usar auth.users.id (Mais simples)
- Manter como está, mas ajustar as consultas
- Funciona, mas menos organizado

## 📋 Problemas Adicionais:
- Tabela `orders` não existe (erro 42P01)
- Consultas falhando após refresh
- RLS pode estar bloqueando consultas