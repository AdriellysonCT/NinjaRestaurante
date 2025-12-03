# 🐛 Troubleshooting - Status Ativo não Atualiza no Login

## 🔍 Problema
O campo `ativo` é atualizado para `false` no logout, mas não é atualizado para `true` no login.

## ✅ Solução Implementada

Reorganizei a ordem das operações no login para garantir que o status seja atualizado ANTES de carregar os dados do restaurante:

```javascript
// ANTES (ordem errada):
1. Login
2. Carregar dados do restaurante
3. Tentar atualizar status ativo

// DEPOIS (ordem correta):
1. Login
2. Atualizar status ativo ✅
3. Carregar dados do restaurante
```

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Logs no Console

Ao fazer login, você deve ver:
```
🔐 Iniciando processo de login...
✅ Login bem-sucedido: [user-id]
🔍 Buscando restaurante para user_id: [user-id]
🏪 Restaurante encontrado: [restaurante-id]
✅ Restaurante marcado como ONLINE (ativo = true)
✅ Login concluído com sucesso
```

### 2. Verificar no Banco de Dados

Execute no Supabase SQL Editor:
```sql
-- Ver status atual do seu restaurante
SELECT id, nome_fantasia, ativo, updated_at
FROM restaurantes_app
WHERE user_id = 'seu-user-id';
```

**Resultado esperado após login:** `ativo = true`

### 3. Teste Completo

1. **Logout:**
   - Clique em "Encerrar o Dia"
   - Verifique no banco: `ativo = false` ✅

2. **Login:**
   - Faça login novamente
   - Verifique no banco: `ativo = true` ✅

## 🐛 Possíveis Causas do Problema

### Causa 1: Permissões RLS
**Sintoma:** Erro no console ao tentar atualizar

**Verificar:**
```sql
-- Ver políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'restaurantes_app' 
  AND cmd = 'UPDATE';
```

**Solução:**
```sql
-- Criar política se não existir
CREATE POLICY "Usuários podem atualizar próprio restaurante"
ON restaurantes_app
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

### Causa 2: Restaurante Não Encontrado
**Sintoma:** Log mostra "⚠️ Nenhum restaurante encontrado"

**Verificar:**
```sql
-- Buscar restaurante pelo user_id
SELECT * FROM restaurantes_app 
WHERE user_id = 'seu-user-id';
```

**Solução:**
- Certifique-se de que o restaurante foi cadastrado corretamente
- Verifique se o `user_id` está correto

---

### Causa 3: Coluna 'ativo' Não Existe
**Sintoma:** Erro "column 'ativo' does not exist"

**Verificar:**
```sql
-- Ver estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'restaurantes_app';
```

**Solução:**
```sql
-- Adicionar coluna se não existir
ALTER TABLE restaurantes_app 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT false;
```

---

### Causa 4: RLS Não Habilitado
**Sintoma:** UPDATE não funciona mesmo com política correta

**Verificar:**
```sql
-- Ver se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurantes_app';
```

**Solução:**
```sql
-- Habilitar RLS
ALTER TABLE restaurantes_app 
ENABLE ROW LEVEL SECURITY;
```

---

### Causa 5: Erro Silencioso no Try-Catch
**Sintoma:** Nenhum erro aparece, mas status não atualiza

**Verificar:**
- Abra o console do navegador (F12)
- Procure por logs com ⚠️ ou ❌
- Verifique a aba Network para ver se a requisição foi feita

**Solução:**
- Veja os logs detalhados que adicionei
- Se não aparecer "✅ Restaurante marcado como ONLINE", há um problema

---

## 🔧 Script de Debug Completo

Execute o script `debug_status_ativo.sql` para fazer todas as verificações:

```bash
# No Supabase SQL Editor
\i debug_status_ativo.sql
```

Este script vai:
1. ✅ Mostrar todos os restaurantes e status
2. ✅ Verificar se a coluna existe
3. ✅ Verificar permissões RLS
4. ✅ Criar políticas se necessário
5. ✅ Fornecer comandos de teste

---

## 📊 Logs Esperados

### Login Bem-Sucedido:
```
🔐 Iniciando processo de login...
✅ Login bem-sucedido: abc123...
🔍 Buscando restaurante para user_id: abc123...
🏪 Restaurante encontrado: def456...
✅ Restaurante marcado como ONLINE (ativo = true)
Carregando dados do restaurante para o usuário: abc123...
✅ Restaurante ID salvo: def456...
✅ Login concluído com sucesso
```

### Logout Bem-Sucedido:
```
Iniciando processo de logout...
✅ Restaurante marcado como OFFLINE (ativo = false)
✅ Logout concluído com sucesso
```

---

## 🧪 Teste Manual no Banco

### Teste 1: UPDATE Manual
```sql
-- Tentar atualizar manualmente
UPDATE restaurantes_app 
SET ativo = true 
WHERE user_id = 'seu-user-id';

-- Verificar se funcionou
SELECT ativo FROM restaurantes_app 
WHERE user_id = 'seu-user-id';
```

**Se funcionar:** Problema é no código front-end  
**Se não funcionar:** Problema é nas permissões RLS

### Teste 2: Verificar Permissões
```sql
-- Testar como usuário autenticado
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "seu-user-id"}';

UPDATE restaurantes_app 
SET ativo = true 
WHERE user_id = 'seu-user-id';
```

---

## ✅ Checklist de Verificação

- [ ] Coluna `ativo` existe na tabela
- [ ] RLS está habilitado
- [ ] Política de UPDATE existe
- [ ] Restaurante existe para o user_id
- [ ] Logs aparecem no console
- [ ] Requisição aparece na aba Network
- [ ] UPDATE manual funciona
- [ ] Código atualizado com nova ordem

---

## 🎯 Resultado Esperado

Após aplicar a correção:
- ✅ Login → `ativo = true`
- ✅ Logout → `ativo = false`
- ✅ Encerrar o Dia → `ativo = false`
- ✅ Fechar aba → `ativo = false`

---

## 📞 Próximos Passos

Se o problema persistir:

1. Execute `debug_status_ativo.sql`
2. Copie os logs do console
3. Copie o resultado das queries SQL
4. Verifique se há erros na aba Network (F12)
5. Teste UPDATE manual no banco

---

## 🔍 Monitoramento (Opcional)

Para monitorar mudanças no campo `ativo` em tempo real:

```sql
-- Criar função de log
CREATE OR REPLACE FUNCTION log_status_ativo_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ativo IS DISTINCT FROM NEW.ativo THEN
    RAISE NOTICE 'Status mudou: % → %, restaurante: %',
      OLD.ativo, NEW.ativo, NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_log_status_ativo
BEFORE UPDATE ON restaurantes_app
FOR EACH ROW
EXECUTE FUNCTION log_status_ativo_change();
```

Agora você verá logs no Supabase sempre que o status mudar!
