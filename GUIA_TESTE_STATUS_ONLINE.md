# 🧪 Guia de Teste - Status Online do Restaurante

## 📋 Pré-requisitos

1. Certifique-se de que a coluna `ativo` existe na tabela `restaurantes_app`
2. Execute o script SQL: `verificar_coluna_ativo.sql`

## 🔍 Testes a Realizar

### ✅ Teste 1: Login marca como ONLINE

**Passos:**
1. Abra o console do navegador (F12)
2. Faça login no painel
3. Procure no console por: `✅ Restaurante marcado como ONLINE (ativo = true)`

**Verificação no Supabase:**
```sql
SELECT id, nome_fantasia, ativo, user_id
FROM restaurantes_app
WHERE user_id = 'seu-user-id';
```

**Resultado esperado:** `ativo = true`

---

### ✅ Teste 2: Botão "Encerrar o Dia" marca como OFFLINE

**Passos:**
1. Com o painel aberto e logado
2. Clique no avatar do usuário (canto superior direito)
3. Clique em "Encerrar o Dia"
4. Confirme a ação
5. Procure no console por: `✅ Restaurante marcado como OFFLINE (ativo = false)`

**Verificação no Supabase:**
```sql
SELECT id, nome_fantasia, ativo, user_id
FROM restaurantes_app
WHERE user_id = 'seu-user-id';
```

**Resultado esperado:** `ativo = false` e redirecionamento para tela de login

---

### ✅ Teste 3: Fechar aba marca como OFFLINE

**Passos:**
1. Faça login no painel
2. Verifique que está online (ativo = true)
3. Feche a aba do navegador completamente
4. Abra uma nova aba e verifique no Supabase

**Verificação no Supabase:**
```sql
SELECT id, nome_fantasia, ativo, user_id
FROM restaurantes_app
WHERE user_id = 'seu-user-id';
```

**Resultado esperado:** `ativo = false`

**Nota:** O evento `beforeunload` pode não funcionar 100% das vezes em todos os navegadores, especialmente se o navegador for fechado abruptamente. Isso é uma limitação do navegador, não do código.

---

### ✅ Teste 4: Logout marca como OFFLINE

**Passos:**
1. Faça login no painel
2. Clique no avatar do usuário
3. Clique em "Encerrar o Dia" (que faz logout)
4. Procure no console por: `✅ Restaurante marcado como OFFLINE (ativo = false)`

**Verificação no Supabase:**
```sql
SELECT id, nome_fantasia, ativo, user_id
FROM restaurantes_app
WHERE user_id = 'seu-user-id';
```

**Resultado esperado:** `ativo = false`

---

## 🔧 Comandos SQL Úteis para Testes

### Ver status de todos os restaurantes
```sql
SELECT 
  id,
  nome_fantasia,
  ativo,
  user_id,
  created_at
FROM restaurantes_app
ORDER BY created_at DESC;
```

### Ver apenas restaurantes ONLINE
```sql
SELECT 
  id,
  nome_fantasia,
  ativo,
  user_id
FROM restaurantes_app
WHERE ativo = true;
```

### Ver apenas restaurantes OFFLINE
```sql
SELECT 
  id,
  nome_fantasia,
  ativo,
  user_id
FROM restaurantes_app
WHERE ativo = false;
```

### Contar restaurantes por status
```sql
SELECT 
  ativo,
  COUNT(*) as total
FROM restaurantes_app
GROUP BY ativo;
```

### Resetar todos para OFFLINE (útil para testes)
```sql
UPDATE restaurantes_app 
SET ativo = false;
```

### Marcar um restaurante específico como ONLINE (para testes)
```sql
UPDATE restaurantes_app 
SET ativo = true 
WHERE id = 'seu-restaurante-id';
```

---

## 🐛 Troubleshooting

### Problema: Coluna `ativo` não existe
**Solução:** Execute o script `verificar_coluna_ativo.sql`

### Problema: Status não atualiza no login
**Verificações:**
1. Abra o console do navegador (F12)
2. Procure por erros relacionados a `restaurantes_app`
3. Verifique se o `restauranteId` está sendo carregado corretamente
4. Execute no console: `localStorage.getItem('restaurante_id')`

### Problema: Status não atualiza ao fechar aba
**Nota:** O evento `beforeunload` tem limitações:
- Pode não funcionar se o navegador for fechado abruptamente
- Pode não funcionar em alguns navegadores mobile
- Pode não funcionar se o computador desligar inesperadamente

**Solução alternativa:** Implementar um sistema de heartbeat (ping a cada X minutos) para detectar quando o restaurante fica offline.

### Problema: Logs não aparecem no console
**Verificações:**
1. Certifique-se de que o console está aberto (F12)
2. Verifique se os filtros do console não estão ocultando os logs
3. Procure por logs com emojis: ✅, ❌, ⚠️, 🔴, 🟢

---

## 📊 Logs Esperados

### No Login:
```
Iniciando processo de login...
✅ Login bem-sucedido: [user-id]
Carregando dados do restaurante para o usuário: [user-id]
✅ Restaurante ID salvo: [restaurante-id]
✅ Restaurante marcado como ONLINE (ativo = true)
✅ Login concluído com sucesso
```

### No Logout/Encerrar o Dia:
```
🌙 Encerrando o dia...
Iniciando processo de logout...
✅ Restaurante marcado como OFFLINE (ativo = false)
✅ Logout concluído com sucesso
```

### Ao Fechar Aba:
```
🔴 Restaurante marcado como OFFLINE (painel fechado)
```

---

## ✅ Checklist de Testes

- [ ] Teste 1: Login marca como ONLINE
- [ ] Teste 2: Botão "Encerrar o Dia" marca como OFFLINE
- [ ] Teste 3: Fechar aba marca como OFFLINE
- [ ] Teste 4: Logout marca como OFFLINE
- [ ] Verificar logs no console
- [ ] Verificar dados no Supabase
- [ ] Testar em diferentes navegadores (Chrome, Firefox, Edge)
- [ ] Testar em diferentes dispositivos (Desktop, Mobile)

---

## 🎯 Resultado Final Esperado

Após todos os testes:
- ✅ Login → `ativo = true`
- ✅ Logout → `ativo = false`
- ✅ Encerrar o Dia → `ativo = false`
- ✅ Fechar aba → `ativo = false` (na maioria dos casos)
- ✅ Logs claros e informativos no console
- ✅ Dados corretos no Supabase
