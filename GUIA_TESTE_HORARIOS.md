# 🧪 Guia Rápido de Teste - Horários de Funcionamento

## 📋 Pré-requisitos

1. ✅ Tabela `restaurantes_horarios` criada
2. ✅ RPC `restaurante_esta_aberto` criada
3. ✅ Permissões RLS configuradas
4. ✅ Restaurante cadastrado e logado

## 🚀 Passo a Passo

### 1️⃣ Verificar Estrutura do Banco

Execute no Supabase SQL Editor:
```sql
-- Executar o script completo
\i verificar_rpc_restaurante_aberto.sql
```

Ou execute manualmente:
```sql
-- Verificar se a tabela existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'restaurantes_horarios';

-- Verificar se a RPC existe
SELECT * FROM information_schema.routines 
WHERE routine_name = 'restaurante_esta_aberto';
```

**Resultado esperado:** Ambas devem existir

---

### 2️⃣ Testar Carregamento de Horários

1. Faça login no painel
2. Vá em **Configurações → Horários**
3. Abra o console do navegador (F12)

**Logs esperados:**
```
📅 Carregando horários do banco...
🔍 Buscando horários para restaurante: [uuid]
✅ Horários carregados: [objeto com 7 dias]
```

**Resultado esperado:**
- Todos os 7 dias da semana aparecem
- Horários padrão: 11:00 às 22:00 (ou os cadastrados)
- Checkboxes marcados para dias abertos

---

### 3️⃣ Testar Salvamento de Horário

1. Altere o horário de abertura de Segunda-feira para **10:00**
2. Observe o feedback visual

**Logs esperados:**
```
💾 Salvando horário: { restauranteId, day: "monday", ... }
✅ Horário de monday salvo com sucesso
```

**Resultado esperado:**
- Aparece "Salvando..." ao lado do dia
- Toast verde: "Horário de Segunda-feira atualizado!"
- Horário permanece alterado após recarregar a página

---

### 4️⃣ Testar Status do Restaurante

**Cenário A: Restaurante Aberto**

1. Configure um horário que esteja aberto AGORA
   - Ex: Se são 14:00, configure 10:00 às 20:00
2. Observe o card no topo

**Resultado esperado:**
```
┌─────────────────────────────────────────┐
│ 🟢 Restaurante Aberto                   │
│ Status baseado nos horários configurados│
└─────────────────────────────────────────┘
```

**Cenário B: Restaurante Fechado**

1. Configure um horário que esteja fechado AGORA
   - Ex: Se são 14:00, configure 18:00 às 22:00
2. Observe o card no topo

**Resultado esperado:**
```
┌─────────────────────────────────────────┐
│ 🔴 Restaurante Fechado                  │
│ Status baseado nos horários configurados│
└─────────────────────────────────────────┘
```

---

### 5️⃣ Testar Desativar Dia

1. Desmarque o checkbox de **Domingo**
2. Observe as mudanças

**Resultado esperado:**
- Inputs de horário ficam desabilitados (cinza)
- Aparece "Salvando..." ao lado de Domingo
- Toast: "Horário de Domingo atualizado!"
- Se hoje for domingo, status muda para "🔴 Fechado"

---

### 6️⃣ Verificar no Banco de Dados

Execute no Supabase:
```sql
-- Ver horários do seu restaurante
SELECT 
  dia_semana,
  CASE dia_semana
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END as dia,
  abre_as,
  fecha_as,
  is_open
FROM restaurantes_horarios
WHERE restaurante_id = 'SEU-RESTAURANTE-ID'
ORDER BY dia_semana;
```

**Resultado esperado:**
- 7 registros (um para cada dia)
- Horários correspondem aos configurados no painel
- `is_open` reflete os checkboxes

---

### 7️⃣ Testar RPC Manualmente

Execute no Supabase:
```sql
SELECT * FROM restaurante_esta_aberto('SEU-RESTAURANTE-ID');
```

**Resultado esperado:**
```json
{
  "aberto": true,
  "metodo": "horario_definido"
}
```

Ou se estiver fechado:
```json
{
  "aberto": false,
  "metodo": "fora_do_horario"
}
```

---

## 🔍 Verificações Adicionais

### Verificar restauranteId
No console do navegador:
```javascript
localStorage.getItem('restaurante_id')
```

**Resultado esperado:** UUID do restaurante

### Verificar logs completos
No console do navegador, procure por:
- ✅ = Sucesso
- ❌ = Erro
- 📅 = Horários
- 💾 = Salvamento
- 🔍 = Verificação

---

## 🐛 Problemas Comuns

### ❌ Horários não carregam
**Solução:**
1. Verifique se `restauranteId` existe
2. Verifique permissões RLS
3. Execute: `SELECT * FROM restaurantes_horarios WHERE restaurante_id = 'seu-id'`

### ❌ Salvamento não funciona
**Solução:**
1. Verifique erros no console
2. Verifique permissões RLS (INSERT e UPDATE)
3. Teste manualmente no SQL Editor

### ❌ Status sempre fechado
**Solução:**
1. Verifique se a RPC existe
2. Teste a RPC manualmente
3. Verifique se `is_open = true` para hoje
4. Verifique se a hora atual está no intervalo

### ❌ RPC não existe
**Solução:**
Execute o script completo:
```sql
\i verificar_rpc_restaurante_aberto.sql
```

---

## ✅ Checklist de Testes

- [ ] Tabela `restaurantes_horarios` existe
- [ ] RPC `restaurante_esta_aberto` existe
- [ ] Horários carregam ao abrir a página
- [ ] Salvamento automático funciona
- [ ] Toast de sucesso aparece
- [ ] Status "Aberto/Fechado" é exibido corretamente
- [ ] Desativar dia funciona
- [ ] Inputs ficam desabilitados quando dia está fechado
- [ ] Dados persistem após recarregar página
- [ ] Logs aparecem no console
- [ ] RPC retorna resultado correto
- [ ] Dados no banco correspondem ao painel

---

## 📞 Suporte

Se encontrar problemas:
1. ✅ Verifique os logs no console (F12)
2. ✅ Execute `verificar_rpc_restaurante_aberto.sql`
3. ✅ Leia `IMPLEMENTACAO_HORARIOS_FUNCIONAMENTO.md`
4. ✅ Verifique as permissões RLS

---

## 🎯 Resultado Final Esperado

Após todos os testes:
- ✅ Horários carregam do banco
- ✅ Edição funciona com salvamento automático
- ✅ Status em tempo real (aberto/fechado)
- ✅ Interface responsiva e intuitiva
- ✅ Feedback visual em todas as operações
- ✅ Dados persistem corretamente
