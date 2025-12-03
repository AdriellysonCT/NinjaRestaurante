# ✅ Implementação Completa - Horários de Funcionamento

## 🎯 Objetivo
Integrar o painel do restaurante com a tabela `restaurantes_horarios` e a RPC `restaurante_esta_aberto` para gerenciar horários de funcionamento e verificar se o restaurante está aberto em tempo real.

## 📋 Funcionalidades Implementadas

### ✅ 1. Carregar Horários do Banco de Dados
- Busca os horários cadastrados na tabela `restaurantes_horarios`
- Exibe todos os 7 dias da semana (mesmo sem registro)
- Valores padrão: 11:00 às 22:00 (seg-qui e dom), 11:00 às 23:00 (sex-sáb)

### ✅ 2. Editar Horários
- Checkbox "Abre nesse dia" (is_open)
- Inputs "Abre às" e "Fecha às" (abre_as, fecha_as)
- Salvamento automático ao alterar qualquer campo
- Feedback visual durante o salvamento

### ✅ 3. Verificar Status em Tempo Real
- Consulta a RPC `restaurante_esta_aberto` para saber se está aberto AGORA
- Exibe indicador visual: 🟢 Aberto ou 🔴 Fechado
- Atualiza automaticamente a cada 1 minuto
- Atualiza após salvar qualquer horário

### ✅ 4. Separação de Conceitos
- `ativo` (campo em restaurantes_app) = restaurante online no painel
- `restaurante_esta_aberto` (RPC) = restaurante aberto dentro do horário
- Não há mistura entre os dois conceitos

## 📁 Arquivos Criados/Modificados

### 1. `src/services/horariosService.js` (NOVO)
Serviço completo para gerenciar horários:

**Funções principais:**
- `buscarHorarios(restauranteId)` - Busca horários do banco
- `salvarHorario(restauranteId, day, horario)` - Salva/atualiza um horário
- `salvarTodosHorarios(restauranteId, horarios)` - Salva todos de uma vez
- `verificarRestauranteAberto(restauranteId)` - Consulta a RPC
- `inicializarHorariosPadrao(restauranteId)` - Cria horários padrão
- `obterNomeDia(dayKey)` - Converte chave para nome em português

**Mapeamento de dias:**
```javascript
const DAY_MAP = {
  sunday: 0,    // Domingo
  monday: 1,    // Segunda
  tuesday: 2,   // Terça
  wednesday: 3, // Quarta
  thursday: 4,  // Quinta
  friday: 5,    // Sexta
  saturday: 6   // Sábado
};
```

### 2. `src/pages/Settings.jsx` (MODIFICADO)
Página de configurações com integração completa:

**Novos estados:**
```javascript
const [statusAberto, setStatusAberto] = useState(null);
const [loadingHorarios, setLoadingHorarios] = useState(false);
const [salvandoHorario, setSalvandoHorario] = useState(null);
```

**Novos useEffects:**
- Carregar horários ao montar o componente
- Verificar status do restaurante a cada 1 minuto
- Atualizar status após salvar horários

**Handler atualizado:**
- `handleOpeningHoursChange` agora salva automaticamente no banco

### 3. `verificar_rpc_restaurante_aberto.sql` (NOVO)
Script SQL para verificar e criar a RPC:

**Funcionalidades:**
- Verifica se a RPC existe
- Cria a RPC se não existir
- Testa a RPC
- Comandos úteis para debug

## 🗂 Estrutura da Tabela `restaurantes_horarios`

```sql
CREATE TABLE restaurantes_horarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID REFERENCES restaurantes_app(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL, -- 0 = domingo, 6 = sábado
  abre_as TIME NOT NULL,
  fecha_as TIME NOT NULL,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 RPC `restaurante_esta_aberto`

### Entrada
```javascript
{
  restaurante_id: 'uuid-do-restaurante'
}
```

### Saída
```javascript
{
  "aberto": true/false,
  "metodo": "horario_definido" | "fechado_hoje" | "fora_do_horario" | "sem_horario_configurado"
}
```

### Lógica
1. Obtém dia da semana atual (0-6)
2. Obtém hora atual
3. Busca horário configurado para hoje
4. Verifica se `is_open = true`
5. Verifica se hora atual está entre `abre_as` e `fecha_as`
6. Retorna resultado

## 🎨 Interface do Usuário

### Status do Restaurante (Card Superior)
```
┌─────────────────────────────────────────┐
│ 🟢 Restaurante Aberto                   │
│ Status baseado nos horários configurados│
└─────────────────────────────────────────┘
```

### Horários de Funcionamento
```
┌─────────────────────────────────────────┐
│ Segunda-feira  [11:00] às [22:00]  [✓]  │
│ Terça-feira    [11:00] às [22:00]  [✓]  │
│ Quarta-feira   [11:00] às [22:00]  [✓]  │
│ Quinta-feira   [11:00] às [22:00]  [✓]  │
│ Sexta-feira    [11:00] às [23:00]  [✓]  │
│ Sábado         [11:00] às [23:00]  [✓]  │
│ Domingo        [11:00] às [22:00]  [✓]  │
└─────────────────────────────────────────┘
```

**Recursos:**
- ✅ Checkbox para ativar/desativar dia
- ✅ Inputs de horário desabilitados quando dia está fechado
- ✅ Salvamento automático ao alterar
- ✅ Feedback "Salvando..." durante operação
- ✅ Toast de sucesso após salvar

## 🔍 Como Testar

### Teste 1: Carregar Horários
1. Faça login no painel
2. Vá em Configurações → Horários
3. Verifique se os horários são carregados do banco
4. Procure no console: `✅ Horários carregados`

### Teste 2: Editar Horário
1. Altere o horário de um dia
2. Verifique o feedback "Salvando..."
3. Veja o toast de sucesso
4. Procure no console: `✅ Horário de [dia] salvo com sucesso`

### Teste 3: Verificar Status
1. Configure um horário que esteja aberto agora
2. Veja o card verde "🟢 Restaurante Aberto"
3. Configure um horário que esteja fechado agora
4. Veja o card vermelho "🔴 Restaurante Fechado"

### Teste 4: Desativar Dia
1. Desmarque o checkbox de um dia
2. Veja os inputs de horário ficarem desabilitados
3. Verifique que o status é atualizado

## 📊 Logs Esperados

### Ao Carregar Horários:
```
📅 Carregando horários do banco...
🔍 Buscando horários para restaurante: [uuid]
✅ Horários encontrados: [array]
✅ Horários carregados: [objeto]
```

### Ao Salvar Horário:
```
💾 Salvando horário: { restauranteId, day, diaSemana, horario }
📝 Atualizando horário existente: [id]
✅ Horário salvo com sucesso: [objeto]
✅ Horário de monday salvo com sucesso
```

### Ao Verificar Status:
```
🔍 Verificando se restaurante está aberto: [uuid]
✅ Status do restaurante: { aberto: true, metodo: "horario_definido" }
✅ Status verificado: { aberto: true, metodo: "horario_definido" }
```

## 🐛 Troubleshooting

### Problema: Horários não carregam
**Verificações:**
1. Verifique se `restauranteId` está disponível
2. Execute no console: `localStorage.getItem('restaurante_id')`
3. Verifique se a tabela `restaurantes_horarios` existe
4. Execute: `verificar_rpc_restaurante_aberto.sql`

### Problema: Status sempre fechado
**Verificações:**
1. Verifique se a RPC existe: `SELECT * FROM restaurante_esta_aberto('seu-id')`
2. Verifique os horários no banco: `SELECT * FROM restaurantes_horarios WHERE restaurante_id = 'seu-id'`
3. Verifique se `is_open = true` para o dia atual
4. Verifique se a hora atual está entre `abre_as` e `fecha_as`

### Problema: Salvamento não funciona
**Verificações:**
1. Abra o console do navegador (F12)
2. Procure por erros relacionados a `horariosService`
3. Verifique as permissões RLS da tabela `restaurantes_horarios`
4. Teste manualmente: `UPDATE restaurantes_horarios SET abre_as = '10:00' WHERE id = 'seu-id'`

## 🔐 Permissões RLS Necessárias

```sql
-- Permitir SELECT para usuários autenticados
CREATE POLICY "Usuários podem ver horários do próprio restaurante"
ON restaurantes_horarios FOR SELECT
TO authenticated
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes_app 
    WHERE user_id = auth.uid()
  )
);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Usuários podem criar horários do próprio restaurante"
ON restaurantes_horarios FOR INSERT
TO authenticated
WITH CHECK (
  restaurante_id IN (
    SELECT id FROM restaurantes_app 
    WHERE user_id = auth.uid()
  )
);

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "Usuários podem atualizar horários do próprio restaurante"
ON restaurantes_horarios FOR UPDATE
TO authenticated
USING (
  restaurante_id IN (
    SELECT id FROM restaurantes_app 
    WHERE user_id = auth.uid()
  )
);
```

## 📝 Comandos SQL Úteis

### Ver horários de um restaurante
```sql
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
WHERE restaurante_id = 'seu-restaurante-id'
ORDER BY dia_semana;
```

### Testar RPC
```sql
SELECT * FROM restaurante_esta_aberto('seu-restaurante-id');
```

### Atualizar horário manualmente
```sql
UPDATE restaurantes_horarios
SET abre_as = '10:00', fecha_as = '23:00', is_open = true
WHERE restaurante_id = 'seu-restaurante-id' AND dia_semana = 1;
```

## ✅ Checklist de Implementação

- [x] Criar serviço `horariosService.js`
- [x] Atualizar `Settings.jsx` com integração
- [x] Criar script SQL para verificar/criar RPC
- [x] Implementar carregamento de horários
- [x] Implementar salvamento automático
- [x] Implementar verificação de status
- [x] Adicionar feedback visual (loading, salvando, toast)
- [x] Adicionar indicador de status (aberto/fechado)
- [x] Documentar implementação
- [x] Criar guia de testes
- [x] Adicionar logs para debug

## 🎉 Resultado Final

- ✅ Horários carregados do banco de dados
- ✅ Edição com salvamento automático
- ✅ Status em tempo real (aberto/fechado)
- ✅ Interface intuitiva e responsiva
- ✅ Feedback visual em todas as operações
- ✅ Logs claros para debug
- ✅ Separação clara entre "online no painel" e "aberto para clientes"

## 🚀 Próximos Passos (Opcional)

1. **Múltiplos horários por dia:** Permitir almoço e jantar separados
2. **Feriados:** Sistema para marcar dias especiais como fechados
3. **Horários especiais:** Configurar horários diferentes para datas específicas
4. **Notificações:** Avisar quando o restaurante abrir/fechar
5. **Histórico:** Registrar mudanças nos horários
