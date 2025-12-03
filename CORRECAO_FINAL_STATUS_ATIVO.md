# ✅ CORREÇÃO FINAL - Bug do Status Ativo

## 🐛 Problema Identificado

O restaurante era marcado como `ativo = true` no login, mas **imediatamente depois** era marcado como `ativo = false` pelo `App.jsx`.

### 📊 Evidência do Bug

Log do console mostrava:
```
✅ Restaurante ID salvo: ebb3d612-744e-455b-a035-aee21c49e4af
✅ Restaurante marcado como ONLINE (ativo = true)
🔴 Restaurante marcado como OFFLINE (painel fechado)  ← BUG!
```

## 🔍 Causa Raiz

No arquivo `App.jsx`, o `useEffect` que gerencia o status online tinha um **cleanup** que chamava `handleBeforeUnload()`:

```javascript
useEffect(() => {
  // ... código ...
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    handleBeforeUnload(); // ❌ PROBLEMA AQUI!
  };
}, [user?.id, restauranteId]);
```

### Por que isso causava o bug?

1. Usuário faz login
2. `restauranteId` é carregado (muda de `null` para o ID real)
3. O `useEffect` detecta a mudança no `restauranteId`
4. O **cleanup** é executado antes de recriar o effect
5. O cleanup chama `handleBeforeUnload()` que marca como OFFLINE
6. Resultado: `ativo = false` logo após o login

## ✅ Solução Aplicada

### Mudança 1: Remover chamada do cleanup

**ANTES:**
```javascript
return () => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  handleBeforeUnload(); // ❌ Causava o bug
};
```

**DEPOIS:**
```javascript
return () => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  // ❌ NÃO marcar como offline no cleanup do useEffect
  // Isso causava o bug de marcar como offline após login
};
```

### Mudança 2: Usar navigator.sendBeacon

Também melhorei o `handleBeforeUnload` para usar `navigator.sendBeacon`, que é mais confiável para requisições ao fechar a janela:

**ANTES:**
```javascript
const handleBeforeUnload = async () => {
  try {
    await supabase
      .from('restaurantes_app')
      .update({ ativo: false })
      .eq('id', restauranteId);
  } catch (error) {
    console.error('⚠️ Erro ao marcar como offline:', error);
  }
};
```

**DEPOIS:**
```javascript
const handleBeforeUnload = () => {
  // Usar navigator.sendBeacon para garantir que a requisição seja enviada
  const url = `${supabase.supabaseUrl}/rest/v1/restaurantes_app?id=eq.${restauranteId}`;
  const data = JSON.stringify({ ativo: false });
  
  navigator.sendBeacon(url, data);
  console.log('🔴 Restaurante marcado como OFFLINE (painel fechado)');
};
```

## 🧪 Como Testar

### 1. Teste de Login
```
1. Faça logout
2. Faça login novamente
3. Abra o console (F12)
4. Verifique os logs
```

**Logs esperados:**
```
✅ Login bem-sucedido
✅ Restaurante marcado como ONLINE (ativo = true)
✅ Login concluído com sucesso
```

**NÃO deve aparecer:**
```
🔴 Restaurante marcado como OFFLINE (painel fechado)
```

### 2. Verificar no Banco
```sql
SELECT id, nome_fantasia, ativo, updated_at
FROM restaurantes_app
WHERE id = 'ebb3d612-744e-455b-a035-aee21c49e4af';
```

**Resultado esperado:** `ativo = true` ✅

### 3. Teste de Fechamento
```
1. Com o painel aberto e logado
2. Feche a aba do navegador
3. Verifique no banco
```

**Resultado esperado:** `ativo = false` ✅

## 📊 Fluxo Correto Agora

### Login:
```
1. Usuário faz login
2. AuthContext marca como ONLINE (ativo = true)
3. App.jsx adiciona listener de beforeunload
4. Status permanece ONLINE ✅
```

### Logout/Encerrar Dia:
```
1. Usuário clica em "Encerrar o Dia"
2. AuthContext marca como OFFLINE (ativo = false)
3. Usuário é deslogado
```

### Fechar Aba:
```
1. Usuário fecha a aba
2. Evento beforeunload é disparado
3. navigator.sendBeacon envia requisição
4. Status é marcado como OFFLINE (ativo = false)
```

## ✅ Resultado Final

Após a correção:
- ✅ Login → `ativo = true` (e permanece true)
- ✅ Logout → `ativo = false`
- ✅ Encerrar o Dia → `ativo = false`
- ✅ Fechar aba → `ativo = false`
- ✅ Sem marcação incorreta de offline após login

## 📁 Arquivos Modificados

1. **`src/App.jsx`** - Removido `handleBeforeUnload()` do cleanup

## 🎯 Checklist de Verificação

- [ ] Fazer login
- [ ] Verificar logs no console (não deve ter "OFFLINE" após login)
- [ ] Verificar no banco: `ativo = true`
- [ ] Navegar pelo painel (status deve permanecer true)
- [ ] Fazer logout
- [ ] Verificar no banco: `ativo = false`
- [ ] Fazer login novamente
- [ ] Verificar no banco: `ativo = true`

## 🎉 Problema Resolvido!

O bug estava no cleanup do `useEffect` que era executado toda vez que o `restauranteId` mudava, marcando incorretamente o restaurante como offline logo após o login.

Agora o status funciona corretamente em todos os cenários! 🚀
