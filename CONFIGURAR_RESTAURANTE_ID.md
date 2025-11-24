# 🔧 Configurar Restaurante ID

## 📋 Problema

Os grupos de complementos não aparecem no modal porque o sistema precisa saber qual é o ID do restaurante logado para buscar os dados corretos do banco.

---

## ✅ Solução Rápida (Temporária)

### Opção 1: Definir ID Manualmente no LocalStorage

Abra o console do navegador (F12) e execute:

```javascript
// Substitua 'seu-uuid-aqui' pelo ID real do seu restaurante
localStorage.setItem('restaurante_id', 'seu-uuid-aqui');
```

Depois recarregue a página.

---

### Opção 2: Buscar ID do Banco

1. Abra o Supabase SQL Editor
2. Execute:

```sql
SELECT id, nome FROM restaurantes LIMIT 5;
```

3. Copie o `id` do seu restaurante
4. No console do navegador:

```javascript
localStorage.setItem('restaurante_id', 'cole-o-id-aqui');
```

---

## 🔐 Solução Definitiva (Recomendada)

### Integrar com AuthContext

O ID do restaurante deve vir do contexto de autenticação. Vou mostrar como fazer:

#### 1. Verificar AuthContext

**Arquivo:** `src/context/AuthContext.jsx`

Certifique-se de que o contexto retorna o `restauranteId`:

```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restauranteId, setRestauranteId] = useState(null);
  
  useEffect(() => {
    // Ao fazer login, buscar restaurante_id
    const fetchRestauranteId = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('restaurantes')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setRestauranteId(data.id);
          localStorage.setItem('restaurante_id', data.id);
        }
      }
    };
    
    fetchRestauranteId();
  }, [user]);
  
  return (
    <AuthContext.Provider value={{ user, restauranteId, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. Usar no Menu.jsx

```javascript
import { useAuth } from '../context/AuthContext';

const Menu = () => {
  const { restauranteId } = useAuth();
  
  useEffect(() => {
    if (restauranteId) {
      loadComplementsData(restauranteId);
    }
  }, [restauranteId]);
  
  const loadComplementsData = async (restId) => {
    // ... código de carregamento
  };
};
```

---

## 🧪 Testar se Está Funcionando

### 1. Verificar LocalStorage

Console do navegador:

```javascript
console.log('Restaurante ID:', localStorage.getItem('restaurante_id'));
```

### 2. Verificar Grupos Carregados

Console do navegador:

```javascript
// Depois de abrir o modal de edição
console.log('Grupos carregados:', groups);
console.log('Complementos carregados:', complements);
```

### 3. Verificar Requisições

1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Filtre por "Fetch/XHR"
4. Abra o modal de edição
5. Veja se há requisições para buscar grupos e complementos

---

## 🗄️ Verificar Dados no Banco

### Verificar se Existem Grupos

```sql
SELECT * FROM grupos_complementos;
```

Se estiver vazio, você precisa criar grupos primeiro!

### Verificar se Existem Complementos

```sql
SELECT * FROM complementos;
```

### Criar Dados de Teste

```sql
-- Inserir grupo de teste
INSERT INTO grupos_complementos (restaurante_id, nome, descricao, tipo_selecao, obrigatorio)
VALUES 
  ('seu-restaurante-id', 'Adicionais', 'Ingredientes extras', 'multiple', false),
  ('seu-restaurante-id', 'Molhos', 'Escolha seu molho', 'single', false);

-- Inserir complementos de teste
INSERT INTO complementos (restaurante_id, nome, preco, disponivel)
VALUES 
  ('seu-restaurante-id', 'Cheddar Extra', 3.00, true),
  ('seu-restaurante-id', 'Bacon', 4.50, true),
  ('seu-restaurante-id', 'Molho Barbecue', 2.00, true);
```

---

## 🔍 Debug: Ver o que Está Acontecendo

Adicione logs no código para debug:

**Em Menu.jsx:**

```javascript
const loadComplementsData = async () => {
  console.log('🔍 Iniciando carregamento de complementos...');
  
  const restauranteId = localStorage.getItem('restaurante_id');
  console.log('🏪 Restaurante ID:', restauranteId);
  
  if (!restauranteId) {
    console.warn('⚠️ Restaurante ID não encontrado!');
    return;
  }
  
  const groupsResult = await complementsService.getGroups(restauranteId);
  console.log('📦 Grupos carregados:', groupsResult);
  
  const complementsResult = await complementsService.getComplements(restauranteId);
  console.log('🍔 Complementos carregados:', complementsResult);
};
```

---

## 📊 Fluxo Completo

```
1. Usuário faz login
   ↓
2. Sistema busca restaurante_id do user_id
   ↓
3. Salva restaurante_id no localStorage e contexto
   ↓
4. Menu.jsx carrega grupos e complementos usando restaurante_id
   ↓
5. Dados aparecem no modal de edição
```

---

## ❌ Problemas Comuns

### Problema 1: "Restaurante ID não encontrado"

**Causa:** Não há restaurante_id no localStorage

**Solução:** 
```javascript
localStorage.setItem('restaurante_id', 'seu-id-aqui');
```

### Problema 2: "Grupos vazios"

**Causa:** Não há grupos criados no banco

**Solução:** 
1. Ir para `/complementos`
2. Criar grupos manualmente
3. Ou executar SQL de inserção acima

### Problema 3: "Erro ao carregar grupos"

**Causa:** Problema de permissão RLS no Supabase

**Solução:**
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'grupos_complementos';

-- Se necessário, recriar policies
DROP POLICY IF EXISTS "Restaurantes podem ver seus grupos" ON grupos_complementos;

CREATE POLICY "Restaurantes podem ver seus grupos"
ON grupos_complementos FOR SELECT
USING (restaurante_id IN (
  SELECT id FROM restaurantes WHERE user_id = auth.uid()
));
```

### Problema 4: "Dados não aparecem no modal"

**Causa:** Dados não estão sendo normalizados corretamente

**Solução:** Verificar console do navegador para erros

---

## 🚀 Próximos Passos

1. ✅ Definir restaurante_id (temporário ou definitivo)
2. ✅ Criar grupos na página `/complementos`
3. ✅ Criar complementos na página `/complementos`
4. ✅ Associar complementos aos grupos
5. ✅ Testar no modal de edição de item
6. ✅ Verificar se grupos aparecem
7. ✅ Ativar grupos para o item
8. ✅ Selecionar complementos

---

## 📞 Suporte

Se ainda não funcionar:

1. Abra o console (F12)
2. Copie todos os erros que aparecem
3. Verifique se há erros de rede na aba Network
4. Verifique se o SQL foi executado corretamente

---

**Boa sorte! 🎯**
