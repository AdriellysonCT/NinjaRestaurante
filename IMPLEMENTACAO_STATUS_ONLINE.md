# ✅ Implementação do Controle de Status Online do Restaurante

## 🎯 Objetivo
Controlar corretamente o campo `ativo` da tabela `restaurantes_app`, que indica se o restaurante está **online no painel** (não se está aberto para clientes).

## 📋 Comportamento Implementado

### ✅ Login Bem-Sucedido
Quando o restaurante faz login no painel:
```sql
UPDATE restaurantes_app 
SET ativo = true 
WHERE id = restauranteId;
```

**Arquivo:** `src/context/AuthContext.jsx` (função `login`)

### ✅ Botão "Encerrar o Dia"
Quando o restaurante clica em "Encerrar o Dia":
```sql
UPDATE restaurantes_app 
SET ativo = false 
WHERE id = restauranteId;
```

**Arquivo:** `src/components/Header.jsx` (função `handleEndDay`)

### ✅ Fechamento Inesperado do Painel
Quando o painel fecha inesperadamente (fechar aba, perder conexão, etc.):
```javascript
window.addEventListener("beforeunload", handleBeforeUnload);
```

**Arquivo:** `src/App.jsx` (componente `MainLayout`)

## 📁 Arquivos Modificados

### 1. `src/context/AuthContext.jsx`
**Mudanças:**
- ✅ Atualiza `ativo = true` após login bem-sucedido
- ✅ Atualiza `ativo = false` antes de fazer logout
- ✅ Limpa `restaurante_id` do localStorage ao deslogar
- ✅ Logs melhorados com emojis para facilitar debug

**Código relevante:**
```javascript
// No login
const { data: restauranteData } = await supabase
  .from('restaurantes_app')
  .select('id')
  .eq('user_id', data.user.id)
  .single();

if (restauranteData?.id) {
  await supabase
    .from('restaurantes_app')
    .update({ ativo: true })
    .eq('id', restauranteData.id);
  
  console.log('✅ Restaurante marcado como ONLINE (ativo = true)');
}

// No logout
await supabase
  .from('restaurantes_app')
  .update({ ativo: false })
  .eq('id', restauranteData.id);

console.log('✅ Restaurante marcado como OFFLINE (ativo = false)');
```

### 2. `src/components/Header.jsx`
**Mudanças:**
- ✅ Simplificou a função `handleEndDay`
- ✅ Remove lógica duplicada (o logout já cuida de marcar como offline)
- ✅ Logs melhorados

**Código relevante:**
```javascript
const handleEndDay = async () => {
  try {
    console.log('🌙 Encerrando o dia...');
    setShowEndDayConfirm(false);
    
    // O logout já cuida de marcar o restaurante como offline
    await logout();
  } catch (error) {
    console.error('❌ Erro ao encerrar o dia:', error);
    await logout();
  }
};
```

### 3. `src/App.jsx`
**Mudanças:**
- ✅ Adiciona listener `beforeunload` para detectar fechamento do painel
- ✅ Marca restaurante como offline quando o painel fecha
- ✅ Usa `restauranteId` do contexto de autenticação

**Código relevante:**
```javascript
const MainLayout = () => {
  const { user, restauranteId } = useAuth();
  
  useEffect(() => {
    if (!user?.id || !restauranteId) return;

    const handleBeforeUnload = async () => {
      try {
        await supabase
          .from('restaurantes_app')
          .update({ ativo: false })
          .eq('id', restauranteId);
        
        console.log('🔴 Restaurante marcado como OFFLINE (painel fechado)');
      } catch (error) {
        console.error('⚠️ Erro ao marcar como offline:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [user?.id, restauranteId]);
  
  // ... resto do código
};
```

### 4. `src/hooks/useRestaurantOnlineStatus.js` (NOVO)
**Descrição:**
- ✅ Hook customizado para gerenciar status online
- ✅ Pode ser usado em outros componentes se necessário
- ✅ Encapsula toda a lógica de atualização do status

**Nota:** Este hook foi criado mas não está sendo usado ativamente, pois a lógica foi implementada diretamente no `AuthContext` e `App.jsx` para maior simplicidade. Pode ser usado no futuro se necessário.

## 🔍 Como Testar

### Teste 1: Login
1. Faça login no painel
2. Verifique no Supabase:
```sql
SELECT id, nome_fantasia, ativo 
FROM restaurantes_app 
WHERE user_id = 'seu-user-id';
```
3. O campo `ativo` deve estar `true`

### Teste 2: Encerrar o Dia
1. Clique no avatar do usuário no header
2. Clique em "Encerrar o Dia"
3. Confirme a ação
4. Verifique no Supabase que `ativo = false`

### Teste 3: Fechar Aba
1. Faça login no painel
2. Feche a aba do navegador
3. Verifique no Supabase que `ativo = false`

## ⚠️ Observações Importantes

1. **Não confundir com horários de funcionamento:**
   - O campo `ativo` indica se o restaurante está **online no painel**
   - Os horários de funcionamento vêm da tabela `restaurantes_horarios`

2. **restauranteId é essencial:**
   - O `restauranteId` é carregado após o login
   - É exposto diretamente no contexto: `const { restauranteId } = useAuth()`
   - É salvo no localStorage: `localStorage.setItem('restaurante_id', dadosRestaurante.id)`

3. **Logs para debug:**
   - Todos os logs importantes usam emojis para facilitar identificação
   - ✅ = Sucesso
   - ❌ = Erro
   - ⚠️ = Aviso
   - 🔴 = Offline
   - 🟢 = Online

## 🎉 Resultado Esperado

- ✅ Quando o restaurante estiver dentro do painel → `ativo = true`
- ✅ Quando encerrar o dia ou fechar o painel → `ativo = false`
- ✅ O painel de administração conseguirá ver exatamente quem está online

## 🚀 Próximos Passos (Opcional)

Se quiser melhorar ainda mais o sistema:

1. **Heartbeat:** Enviar um "ping" a cada X minutos para confirmar que o restaurante ainda está online
2. **Timeout automático:** Marcar como offline após X minutos de inatividade
3. **Indicador visual:** Mostrar no painel se o restaurante está online/offline
4. **Notificação:** Avisar o restaurante quando ficar offline inesperadamente

## 📝 Checklist de Implementação

- [x] Atualizar `ativo = true` no login
- [x] Atualizar `ativo = false` no logout
- [x] Atualizar `ativo = false` no "Encerrar o Dia"
- [x] Adicionar listener `beforeunload` para fechamento inesperado
- [x] Expor `restauranteId` no contexto de autenticação
- [x] Adicionar logs para debug
- [x] Testar todos os cenários
- [x] Documentar a implementação
