# 🚀 Comandos Git - Atualização Status Online e Horários

## 📋 Arquivos Modificados

### Código Front-End:
- `src/context/AuthContext.jsx` - Sistema de status online
- `src/pages/Login.jsx` - Integração com AuthContext
- `src/pages/Settings.jsx` - Interface de horários
- `src/services/horariosService.js` - Serviço de horários
- `src/App.jsx` - Listener de fechamento de aba

### Arquivos Criados:
- `src/hooks/useRestaurantOnlineStatus.js` - Hook de status online

### Scripts SQL:
- `verificar_coluna_ativo.sql`
- `debug_status_ativo.sql`
- `corrigir_tabela_horarios.sql`
- `rpc_restaurante_esta_aberto_v2.sql`
- `debug_salvamento_horarios.sql`

### Documentação:
- Vários arquivos .md de documentação

## 🔧 Comandos Git

### 1. Ver o que foi modificado
```bash
cd meu-fome-ninja
git status
```

### 2. Adicionar todos os arquivos
```bash
git add .
```

### 3. Fazer o commit
```bash
git commit -m "feat: Sistema de status online e horários de funcionamento

✨ Funcionalidades:
- Status online do restaurante (ativo = true/false)
- Login marca como online automaticamente
- Logout/Encerrar dia marca como offline
- Fechamento de aba marca como offline
- Horários de funcionamento com salvamento automático
- Interface simplificada e amigável
- RPC restaurante_esta_aberto v2 com suporte a madrugada
- Sincronização com tabela restaurantes_horarios

🔧 Melhorias:
- Logs detalhados para debug
- Feedback visual (toasts, loading)
- Atualização automática de status a cada 2 minutos
- Tratamento de erros RLS
- Interface responsiva

📝 Arquivos principais:
- AuthContext.jsx: Controle de status online
- Settings.jsx: Interface de horários
- horariosService.js: Lógica de horários
- Login.jsx: Integração com contexto

🗄️ Banco de Dados:
- Tabela restaurantes_horarios sincronizada
- RPC restaurante_esta_aberto atualizada
- Políticas RLS configuradas"
```

### 4. Enviar para o repositório
```bash
git push origin main
```

Ou se sua branch for diferente:
```bash
git push origin nome-da-sua-branch
```

## 📊 Alternativa: Commit Simples

Se preferir um commit mais curto:

```bash
git add .
git commit -m "feat: Sistema de status online e horários de funcionamento"
git push origin main
```

## 🔍 Verificar antes de fazer push

```bash
# Ver os arquivos que serão commitados
git status

# Ver as mudanças em detalhes
git diff

# Ver o último commit
git log -1
```

## ⚠️ Se houver conflitos

```bash
# Atualizar do repositório remoto primeiro
git pull origin main

# Resolver conflitos se houver
# Depois fazer o commit e push
git add .
git commit -m "sua mensagem"
git push origin main
```

## 📝 Criar uma branch separada (Opcional)

Se quiser criar uma branch específica para essa feature:

```bash
# Criar e mudar para nova branch
git checkout -b feature/status-online-horarios

# Adicionar e commitar
git add .
git commit -m "feat: Sistema de status online e horários"

# Enviar a branch
git push origin feature/status-online-horarios
```

## ✅ Checklist

- [ ] Testei todas as funcionalidades
- [ ] Verifiquei que está salvando no banco
- [ ] Logs estão funcionando
- [ ] Interface está responsiva
- [ ] Executei `git status` para ver os arquivos
- [ ] Fiz o commit com mensagem descritiva
- [ ] Fiz o push para o repositório

## 🎯 Pronto!

Após executar esses comandos, suas alterações estarão no repositório Git! 🚀
