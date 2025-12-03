# ✅ Checklist de Deploy - Sistema de Horários

## 📋 Antes de Fazer Deploy

### 1. Banco de Dados

- [ ] Tabela `restaurantes_horarios` criada
- [ ] RPC `restaurante_esta_aberto` criada
- [ ] Permissões RLS configuradas (SELECT, INSERT, UPDATE)
- [ ] Índices criados (se necessário)

**Comando para verificar:**
```sql
-- Executar no Supabase SQL Editor
\i verificar_rpc_restaurante_aberto.sql
```

---

### 2. Código Front-End

- [ ] Arquivo `src/services/horariosService.js` criado
- [ ] Arquivo `src/pages/Settings.jsx` atualizado
- [ ] Imports corretos no Settings.jsx
- [ ] Sem erros de diagnóstico

**Comando para verificar:**
```bash
npm run build
```

---

### 3. Testes Locais

- [ ] Horários carregam corretamente
- [ ] Salvamento automático funciona
- [ ] Status (aberto/fechado) é exibido
- [ ] Toast de sucesso aparece
- [ ] Logs no console estão corretos
- [ ] Dados persistem após reload

**Seguir:** `GUIA_TESTE_HORARIOS.md`

---

## 🚀 Durante o Deploy

### 1. Build da Aplicação
```bash
npm run build
```

**Verificar:**
- [ ] Build sem erros
- [ ] Build sem warnings críticos
- [ ] Tamanho do bundle aceitável

---

### 2. Deploy no Vercel/Netlify

```bash
# Vercel
vercel --prod

# Ou Netlify
netlify deploy --prod
```

**Verificar:**
- [ ] Deploy bem-sucedido
- [ ] URL de produção acessível
- [ ] Sem erros 404

---

### 3. Variáveis de Ambiente

**Verificar se estão configuradas:**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

---

## ✅ Após o Deploy

### 1. Testes em Produção

- [ ] Login funciona
- [ ] Página de configurações carrega
- [ ] Aba "Horários" acessível
- [ ] Horários carregam do banco
- [ ] Salvamento funciona
- [ ] Status é exibido corretamente

---

### 2. Verificar Logs

**No console do navegador (F12):**
- [ ] Sem erros críticos
- [ ] Logs de sucesso aparecem
- [ ] Requisições ao Supabase funcionam

**Logs esperados:**
```
✅ Horários carregados
✅ Horário de [dia] salvo com sucesso
✅ Status verificado
```

---

### 3. Verificar Banco de Dados

```sql
-- Ver horários salvos
SELECT * FROM restaurantes_horarios 
WHERE restaurante_id = 'seu-id';

-- Testar RPC
SELECT * FROM restaurante_esta_aberto('seu-id');
```

**Verificar:**
- [ ] Horários estão salvos corretamente
- [ ] RPC retorna resultado esperado
- [ ] Timestamps estão corretos

---

## 🐛 Troubleshooting Pós-Deploy

### Problema: Horários não carregam em produção

**Verificar:**
1. Variáveis de ambiente configuradas
2. Permissões RLS no Supabase
3. Console do navegador para erros
4. Network tab para requisições falhadas

**Solução:**
```sql
-- Verificar permissões RLS
SELECT * FROM pg_policies 
WHERE tablename = 'restaurantes_horarios';
```

---

### Problema: Salvamento não funciona

**Verificar:**
1. Permissões RLS (INSERT e UPDATE)
2. Erros no console
3. Payload da requisição

**Solução:**
```sql
-- Testar INSERT manualmente
INSERT INTO restaurantes_horarios 
(restaurante_id, dia_semana, abre_as, fecha_as, is_open)
VALUES ('seu-id', 1, '11:00', '22:00', true);
```

---

### Problema: RPC não funciona

**Verificar:**
1. RPC existe no Supabase
2. Permissões de execução
3. Sintaxe da RPC

**Solução:**
```sql
-- Recriar RPC
\i verificar_rpc_restaurante_aberto.sql
```

---

## 📊 Métricas de Sucesso

### Performance
- [ ] Carregamento de horários < 1s
- [ ] Salvamento < 500ms
- [ ] Verificação de status < 500ms

### Usabilidade
- [ ] Interface responsiva
- [ ] Feedback visual claro
- [ ] Sem travamentos

### Confiabilidade
- [ ] Dados persistem corretamente
- [ ] Sem perda de dados
- [ ] Sincronização correta com banco

---

## 🔐 Segurança

### Verificar:
- [ ] RLS habilitado na tabela
- [ ] Apenas usuário autenticado acessa seus horários
- [ ] Não é possível editar horários de outros restaurantes
- [ ] Tokens de autenticação válidos

**Teste de segurança:**
```sql
-- Tentar acessar horários de outro restaurante
-- Deve retornar vazio ou erro
SELECT * FROM restaurantes_horarios 
WHERE restaurante_id = 'outro-restaurante-id';
```

---

## 📝 Documentação

### Verificar se está disponível:
- [ ] `IMPLEMENTACAO_HORARIOS_FUNCIONAMENTO.md`
- [ ] `GUIA_TESTE_HORARIOS.md`
- [ ] `RESUMO_HORARIOS_FUNCIONAMENTO.md`
- [ ] `verificar_rpc_restaurante_aberto.sql`

---

## 🎉 Deploy Concluído!

Após completar todos os itens:
- ✅ Sistema de horários funcionando em produção
- ✅ Dados persistindo corretamente
- ✅ Status em tempo real
- ✅ Interface responsiva
- ✅ Logs claros
- ✅ Documentação completa

---

## 📞 Suporte Pós-Deploy

Se encontrar problemas:
1. Verificar logs no console (F12)
2. Verificar Network tab para requisições
3. Testar RPC manualmente no Supabase
4. Consultar documentação completa
5. Verificar permissões RLS

---

## 🚀 Próximas Melhorias

Após deploy estável:
- [ ] Implementar múltiplos horários por dia
- [ ] Sistema de feriados
- [ ] Horários especiais
- [ ] Notificações de abertura/fechamento
- [ ] Histórico de mudanças
- [ ] Analytics de horários mais movimentados

---

## 📊 Monitoramento

### Métricas para acompanhar:
- Tempo de carregamento de horários
- Taxa de sucesso de salvamento
- Frequência de mudanças nos horários
- Uso da funcionalidade pelos restaurantes

### Ferramentas:
- Vercel Analytics
- Supabase Dashboard
- Google Analytics (se configurado)
- Sentry (se configurado)
