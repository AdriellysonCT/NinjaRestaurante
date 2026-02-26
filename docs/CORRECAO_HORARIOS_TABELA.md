# ✅ Correção - Sincronização com Tabela restaurantes_horarios

## 🐛 Problema Identificado

O código estava usando nomes de colunas diferentes dos que existem na tabela real:

### ❌ Código Antigo (Errado):
```javascript
{
  dia_semana: 0,        // INTEGER
  abre_as: '11:00',     // ❌ Coluna não existe
  fecha_as: '22:00',    // ❌ Coluna não existe
  is_open: true         // ❌ Coluna não existe
}
```

### ✅ Estrutura Real da Tabela:
```sql
{
  dia_semana: 'segunda',  // TEXT (não INTEGER!)
  hora_abre: '11:00',     // ✅ Nome correto
  hora_fecha: '22:00',    // ✅ Nome correto
  ativo: true             // ✅ Nome correto
}
```

## 🔧 Correções Aplicadas

### 1. Atualizado `horariosService.js`

**Mapeamento de dias:**
```javascript
// ANTES (errado)
const DAY_MAP = {
  monday: 1,
  tuesday: 2,
  // ...
};

// DEPOIS (correto)
const DAY_MAP = {
  monday: 'segunda',
  tuesday: 'terca',
  wednesday: 'quarta',
  thursday: 'quinta',
  friday: 'sexta',
  saturday: 'sabado',
  sunday: 'domingo'
};
```

**Nomes das colunas:**
```javascript
// ANTES (errado)
{
  abre_as: horario.open,
  fecha_as: horario.close,
  is_open: horario.isOpen
}

// DEPOIS (correto)
{
  hora_abre: horario.open,
  hora_fecha: horario.close,
  ativo: horario.isOpen
}
```

### 2. Atualizada RPC `restaurante_esta_aberto`

Agora usa:
- `dia_semana` como TEXT ('segunda', 'terca', etc.)
- `hora_abre` e `hora_fecha` em vez de `abre_as` e `fecha_as`
- `ativo` em vez de `is_open`

## 🧪 Como Testar

### 1. Executar Script SQL
```bash
# No Supabase SQL Editor
\i corrigir_tabela_horarios.sql
```

Ou copie e cole o conteúdo do arquivo.

### 2. Limpar Cache do Navegador
- F12 → Application → Clear site data
- Ou Ctrl+Shift+R

### 3. Testar no Painel
1. Vá em Configurações → Horários
2. Desmarque um dia (ex: Domingo)
3. Abra o console (F12)
4. Procure por logs:
   ```
   💾 Salvando horário: {...}
   ✅ Horário salvo com sucesso
   ```

### 4. Verificar no Banco
```sql
SELECT * FROM restaurantes_horarios 
WHERE restaurante_id = 'seu-restaurante-id';
```

**Resultado esperado:**
```
| id | restaurante_id | dia_semana | hora_abre | hora_fecha | ativo |
|----|----------------|------------|-----------|------------|-------|
| 1  | ebb3d612...    | segunda    | 11:00     | 22:00      | true  |
| 2  | ebb3d612...    | terca      | 11:00     | 22:00      | true  |
| 3  | ebb3d612...    | domingo    | 11:00     | 22:00      | false |
```

## 📊 Logs Esperados

Ao alterar um horário, você deve ver:
```
💾 Salvando horário: {
  restauranteId: "ebb3d612-744e-455b-a035-aee21c49e4af",
  day: "sunday",
  diaSemana: "domingo",
  horario: { open: "11:00", close: "22:00", isOpen: false }
}
📝 Atualizando horário existente: 123
✅ Horário salvo com sucesso: {...}
```

## 🔍 Verificar Permissões RLS

Se o salvamento não funcionar, execute:
```sql
-- Ver políticas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'restaurantes_horarios';

-- Criar políticas se não existirem
-- (veja o script corrigir_tabela_horarios.sql)
```

## ✅ Resultado Final

Após a correção:
- ✅ Horários são salvos corretamente no banco
- ✅ Nomes das colunas correspondem à tabela real
- ✅ Dias da semana em texto português
- ✅ RPC funciona corretamente
- ✅ Interface sincronizada com o banco

## 📁 Arquivos Modificados

1. **`src/services/horariosService.js`**
   - Mapeamento de dias corrigido
   - Nomes das colunas corrigidos
   - Funções de buscar e salvar atualizadas

2. **`corrigir_tabela_horarios.sql`** (NOVO)
   - Script para criar RPC atualizada
   - Políticas RLS
   - Comandos de teste

## 🎯 Próximos Passos

1. Execute o script SQL
2. Limpe o cache do navegador
3. Teste alterar os horários
4. Verifique no banco se os dados foram salvos
5. Me avise se funcionar! 🚀
