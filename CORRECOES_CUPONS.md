# ✅ Correções Aplicadas - Sistema de Cupons

## 🔧 Alterações Realizadas

### **1. Nomes de Colunas Corrigidos**

#### Tabela `cupons`
- ❌ `restaurante_id` → ✅ `id_restaurante`

#### Tabela `cupons_uso`
- ✅ `cliente_id` → Referencia `clientes_app(user_id)`
- ✅ `pedido_id` → Referencia `pedidos_padronizados(id)`

#### Tabela `pedidos_padronizados`
- ❌ `restaurante_id` → ✅ `id_restaurante`
- ❌ `cliente_id` → ✅ `id_cliente`

---

### **2. Foreign Keys Corrigidas**

```sql
-- ANTES (ERRADO)
restaurante_id UUID NOT NULL REFERENCES restaurantes_app(id)
cliente_id UUID NOT NULL REFERENCES usuarios(id)

-- DEPOIS (CORRETO)
id_restaurante UUID NOT NULL REFERENCES restaurantes_app(id)
cliente_id UUID NOT NULL REFERENCES clientes_app(user_id)
```

---

### **3. Políticas RLS Atualizadas**

```sql
-- ANTES (ERRADO)
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
)

-- DEPOIS (CORRETO)
USING (
  id_restaurante IN (
    SELECT id FROM restaurantes_app WHERE user_id = auth.uid()
  )
)
```

---

### **4. Função SQL Corrigida**

```sql
-- ANTES (ERRADO)
WHERE restaurante_id = p_restaurante_id
WHERE cliente_id = p_cliente_id

-- DEPOIS (CORRETO)
WHERE id_restaurante = p_restaurante_id
WHERE id_cliente = p_cliente_id
```

---

### **5. Serviço JavaScript Atualizado**

```javascript
// ANTES (ERRADO)
.eq('restaurante_id', restauranteId)

// DEPOIS (CORRETO)
.eq('id_restaurante', restauranteId)
```

---

### **6. Componente React Atualizado**

```javascript
// ANTES (ERRADO)
const payload = {
  restaurante_id: restauranteId,
  ...
}

// DEPOIS (CORRETO)
const payload = {
  id_restaurante: restauranteId,
  ...
}
```

---

### **7. Referências Removidas**

Removido referência à tabela `usuarios` que não existe:
```sql
-- REMOVIDO
criado_por UUID REFERENCES usuarios(id)

-- SUBSTITUÍDO POR
criado_por UUID -- Sem FK, apenas armazena o ID
```

Comentado política de admin (não há tabela de admins):
```sql
-- Comentado pois não há tabela usuarios com tipo_usuario
-- DROP POLICY IF EXISTS "Admins podem ver todos cupons" ON cupons;
```

---

## 📋 Estrutura Correta das Tabelas

### **restaurantes_app**
- `id` (UUID, PK)
- `user_id` (UUID, FK para auth.users)
- `nome_fantasia`, `cnpj`, `telefone`, `email`
- Outros campos...

### **clientes_app**
- `user_id` (UUID, PK, FK para auth.users)
- `nome`, `telefone`, `cpf`
- Endereço: `rua`, `numero`, `bairro`, `cidade`, `complemento`

### **pedidos_padronizados**
- `id` (UUID, PK)
- `id_restaurante` (UUID, FK)
- `id_cliente` (UUID, FK)
- `id_entregador` (UUID, FK)
- `numero_pedido`, `status`, `valor_total`
- Outros campos...

---

## ✅ Arquivos Corrigidos

1. ✅ `criar_tabela_cupons.sql`
2. ✅ `cuponsService.js`
3. ✅ `CuponsManager.jsx`

---

## 🚀 Como Usar Agora

### 1. Executar SQL Corrigido
```sql
-- No Supabase SQL Editor
-- Executar: criar_tabela_cupons.sql (versão corrigida)
```

### 2. Verificar Criação
```sql
-- Verificar tabelas
SELECT * FROM cupons LIMIT 1;
SELECT * FROM cupons_uso LIMIT 1;

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename IN ('cupons', 'cupons_uso');
```

### 3. Testar no Painel
```
1. Sistema Financeiro → Cupons
2. Criar novo cupom
3. Verificar se salva corretamente
```

---

## 🐛 Se Ainda Houver Erros

### Erro: "relation does not exist"
```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cupons', 'cupons_uso');
```

### Erro: "foreign key constraint"
```sql
-- Verificar FKs
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('cupons', 'cupons_uso');
```

### Erro: "permission denied"
```sql
-- Verificar RLS
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('cupons', 'cupons_uso');
```

---

## 📝 Notas Importantes

1. **Não existe tabela `usuarios` genérica**
   - Clientes: `clientes_app` (PK: `user_id`)
   - Restaurantes: `restaurantes_app` (PK: `id`, tem `user_id`)

2. **Nomenclatura de FKs**
   - Pedidos usam: `id_restaurante`, `id_cliente`, `id_entregador`
   - Cupons devem seguir o mesmo padrão: `id_restaurante`

3. **Auth do Supabase**
   - `auth.uid()` retorna o `user_id` do usuário logado
   - Para restaurantes: buscar `id` via `user_id`
   - Para clientes: `user_id` é a PK direta

---

**Todas as correções aplicadas! ✅**

*Última atualização: 09/01/2026*
