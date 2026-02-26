# 🔌 Exemplos de Uso da API - Complementos

## 📚 Guia Prático com Código

Este documento mostra como usar o `complementsService.js` na prática.

---

## 🚀 Importação

```javascript
import complementsService from '../services/complementsService';
```

---

## 1️⃣ COMPLEMENTOS

### ✅ Listar Todos os Complementos

```javascript
const listarComplementos = async () => {
  const restauranteId = 'uuid-do-restaurante';
  
  const result = await complementsService.getComplements(restauranteId);
  
  if (result.success) {
    console.log('Complementos:', result.data);
    // [
    //   { id: 1, nome: 'Cheddar Extra', preco: 3.00, disponivel: true },
    //   { id: 2, nome: 'Bacon', preco: 4.50, disponivel: true }
    // ]
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### ➕ Criar Novo Complemento

```javascript
const criarComplemento = async () => {
  const restauranteId = 'uuid-do-restaurante';
  
  const novoComplemento = {
    name: 'Cheddar Extra',
    price: 3.00,
    image: 'https://exemplo.com/cheddar.jpg',
    available: true
  };
  
  const result = await complementsService.createComplement(
    restauranteId, 
    novoComplemento
  );
  
  if (result.success) {
    console.log('Complemento criado:', result.data);
    // { id: 'uuid-gerado', nome: 'Cheddar Extra', preco: 3.00, ... }
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### ✏️ Atualizar Complemento

```javascript
const atualizarComplemento = async () => {
  const complementoId = 'uuid-do-complemento';
  
  const dadosAtualizados = {
    name: 'Cheddar Extra Premium',
    price: 4.00,
    image: 'https://exemplo.com/cheddar-premium.jpg',
    available: true
  };
  
  const result = await complementsService.updateComplement(
    complementoId,
    dadosAtualizados
  );
  
  if (result.success) {
    console.log('Complemento atualizado:', result.data);
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 🔄 Ativar/Desativar Complemento

```javascript
const toggleDisponibilidade = async () => {
  const complementoId = 'uuid-do-complemento';
  
  const result = await complementsService.toggleComplementAvailability(
    complementoId
  );
  
  if (result.success) {
    console.log('Status alterado:', result.data.disponivel);
    // true → false ou false → true
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 🗑️ Deletar Complemento

```javascript
const deletarComplemento = async () => {
  const complementoId = 'uuid-do-complemento';
  
  const result = await complementsService.deleteComplement(complementoId);
  
  if (result.success) {
    console.log('Complemento deletado com sucesso!');
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

## 2️⃣ GRUPOS

### ✅ Listar Todos os Grupos

```javascript
const listarGrupos = async () => {
  const restauranteId = 'uuid-do-restaurante';
  
  const result = await complementsService.getGroups(restauranteId);
  
  if (result.success) {
    console.log('Grupos:', result.data);
    // [
    //   { 
    //     id: 1, 
    //     nome: 'Adicionais', 
    //     tipo_selecao: 'multiple',
    //     obrigatorio: false 
    //   }
    // ]
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### ➕ Criar Novo Grupo

```javascript
const criarGrupo = async () => {
  const restauranteId = 'uuid-do-restaurante';
  
  const novoGrupo = {
    name: 'Adicionais',
    description: 'Ingredientes extras para seu lanche',
    selectionType: 'multiple',  // 'single' ou 'multiple'
    required: false
  };
  
  const result = await complementsService.createGroup(
    restauranteId,
    novoGrupo
  );
  
  if (result.success) {
    console.log('Grupo criado:', result.data);
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### ✏️ Atualizar Grupo

```javascript
const atualizarGrupo = async () => {
  const grupoId = 'uuid-do-grupo';
  
  const dadosAtualizados = {
    name: 'Adicionais Premium',
    description: 'Ingredientes especiais',
    selectionType: 'multiple',
    required: true
  };
  
  const result = await complementsService.updateGroup(
    grupoId,
    dadosAtualizados
  );
  
  if (result.success) {
    console.log('Grupo atualizado:', result.data);
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 🗑️ Deletar Grupo

```javascript
const deletarGrupo = async () => {
  const grupoId = 'uuid-do-grupo';
  
  const result = await complementsService.deleteGroup(grupoId);
  
  if (result.success) {
    console.log('Grupo deletado com sucesso!');
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

## 3️⃣ ASSOCIAÇÕES

### 🔗 Associar Complementos a um Grupo

```javascript
const associarComplementosAoGrupo = async () => {
  const grupoId = 'uuid-do-grupo';
  const complementIds = [
    'uuid-complemento-1',  // Cheddar
    'uuid-complemento-2',  // Bacon
    'uuid-complemento-3'   // Ovo
  ];
  
  const result = await complementsService.associateComplementsToGroup(
    grupoId,
    complementIds
  );
  
  if (result.success) {
    console.log('Complementos associados ao grupo!');
  } else {
    console.error('Erro:', result.error);
  }
};
```

**Importante:** Esta função SUBSTITUI todas as associações antigas.

---

### 📋 Buscar Complementos de um Grupo

```javascript
const buscarComplementosDoGrupo = async () => {
  const grupoId = 'uuid-do-grupo';
  
  const result = await complementsService.getGroupComplements(grupoId);
  
  if (result.success) {
    console.log('Complementos do grupo:', result.data);
    // [
    //   { id: 1, nome: 'Cheddar Extra', preco: 3.00 },
    //   { id: 2, nome: 'Bacon', preco: 4.50 }
    // ]
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 🔗 Associar Grupos a um Item do Cardápio

```javascript
const associarGruposAoItem = async () => {
  const menuItemId = 'uuid-do-item';
  const groupIds = [
    'uuid-grupo-1',  // Adicionais
    'uuid-grupo-2'   // Molhos
  ];
  
  const result = await complementsService.associateGroupsToMenuItem(
    menuItemId,
    groupIds
  );
  
  if (result.success) {
    console.log('Grupos associados ao item!');
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 🔗 Associar Complementos Específicos a um Item

```javascript
const associarComplementosEspecificos = async () => {
  const menuItemId = 'uuid-do-item';
  const grupoId = 'uuid-do-grupo';
  const complementIds = [
    'uuid-complemento-1',
    'uuid-complemento-2'
  ];
  
  const result = await complementsService.associateComplementsToMenuItem(
    menuItemId,
    grupoId,
    complementIds
  );
  
  if (result.success) {
    console.log('Complementos específicos associados!');
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 📋 Buscar Complementos de um Item do Cardápio

```javascript
const buscarComplementosDoItem = async () => {
  const menuItemId = 'uuid-do-item';
  
  const result = await complementsService.getMenuItemComplements(menuItemId);
  
  if (result.success) {
    console.log('Grupos e complementos do item:', result.data);
    // [
    //   {
    //     grupo_id: 'uuid-1',
    //     grupos_complementos: { nome: 'Adicionais', ... },
    //     itens_cardapio_complementos: [
    //       { complemento_id: 'uuid-a', complementos: { nome: 'Cheddar' } }
    //     ]
    //   }
    // ]
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

## 4️⃣ PEDIDOS

### ➕ Adicionar Complementos a um Item do Pedido

```javascript
const adicionarComplementosAoPedido = async () => {
  const itemPedidoId = 'uuid-do-item-pedido';
  
  const complementos = [
    { id: 'uuid-1', price: 3.00, quantity: 1 },  // Cheddar
    { id: 'uuid-2', price: 4.50, quantity: 1 },  // Bacon
    { id: 'uuid-3', price: 2.00, quantity: 1 }   // Molho
  ];
  
  const result = await complementsService.addComplementsToOrderItem(
    itemPedidoId,
    complementos
  );
  
  if (result.success) {
    console.log('Complementos adicionados ao pedido:', result.data);
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

### 📋 Buscar Complementos de um Item do Pedido

```javascript
const buscarComplementosDoPedido = async () => {
  const itemPedidoId = 'uuid-do-item-pedido';
  
  const result = await complementsService.getOrderItemComplements(
    itemPedidoId
  );
  
  if (result.success) {
    console.log('Complementos do pedido:', result.data);
    // [
    //   {
    //     id: 'uuid',
    //     quantidade: 1,
    //     preco_unitario: 3.00,
    //     complementos: { nome: 'Cheddar Extra', ... }
    //   }
    // ]
  } else {
    console.error('Erro:', result.error);
  }
};
```

---

## 🎯 Exemplo Completo: Fluxo de Criação

### Cenário: Criar sistema de complementos para Hambúrguer

```javascript
const setupComplementosHamburguer = async () => {
  const restauranteId = 'uuid-do-restaurante';
  
  // 1. Criar complementos
  const cheddar = await complementsService.createComplement(restauranteId, {
    name: 'Cheddar Extra',
    price: 3.00,
    available: true
  });
  
  const bacon = await complementsService.createComplement(restauranteId, {
    name: 'Bacon',
    price: 4.50,
    available: true
  });
  
  const barbecue = await complementsService.createComplement(restauranteId, {
    name: 'Molho Barbecue',
    price: 2.00,
    available: true
  });
  
  // 2. Criar grupos
  const grupoAdicionais = await complementsService.createGroup(restauranteId, {
    name: 'Adicionais',
    description: 'Ingredientes extras',
    selectionType: 'multiple',
    required: false
  });
  
  const grupoMolhos = await complementsService.createGroup(restauranteId, {
    name: 'Molhos',
    description: 'Escolha seu molho',
    selectionType: 'single',
    required: false
  });
  
  // 3. Associar complementos aos grupos
  await complementsService.associateComplementsToGroup(
    grupoAdicionais.data.id,
    [cheddar.data.id, bacon.data.id]
  );
  
  await complementsService.associateComplementsToGroup(
    grupoMolhos.data.id,
    [barbecue.data.id]
  );
  
  // 4. Associar grupos ao item do cardápio
  const hamburguerItemId = 'uuid-do-hamburguer';
  await complementsService.associateGroupsToMenuItem(
    hamburguerItemId,
    [grupoAdicionais.data.id, grupoMolhos.data.id]
  );
  
  console.log('✅ Sistema de complementos configurado!');
};
```

---

## 🎨 Exemplo de Componente React

### Componente: Seletor de Complementos

```javascript
import React, { useState, useEffect } from 'react';
import complementsService from '../services/complementsService';

const ComplementSelector = ({ menuItemId, onComplementsChange }) => {
  const [groups, setGroups] = useState([]);
  const [selectedComplements, setSelectedComplements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadComplements();
  }, [menuItemId]);
  
  const loadComplements = async () => {
    setLoading(true);
    
    const result = await complementsService.getMenuItemComplements(menuItemId);
    
    if (result.success) {
      setGroups(result.data);
    }
    
    setLoading(false);
  };
  
  const handleToggleComplement = (complementId, group) => {
    let newSelection = [...selectedComplements];
    
    if (group.tipo_selecao === 'single') {
      // Remove outros do mesmo grupo
      newSelection = newSelection.filter(
        c => !group.complementos.find(gc => gc.id === c.id)
      );
      newSelection.push({ id: complementId, groupId: group.id });
    } else {
      // Toggle múltiplo
      const index = newSelection.findIndex(c => c.id === complementId);
      if (index > -1) {
        newSelection.splice(index, 1);
      } else {
        newSelection.push({ id: complementId, groupId: group.id });
      }
    }
    
    setSelectedComplements(newSelection);
    onComplementsChange(newSelection);
  };
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div className="complement-selector">
      {groups.map(group => (
        <div key={group.id} className="group">
          <h3>{group.nome}</h3>
          <p>{group.descricao}</p>
          
          {group.complementos.map(complement => (
            <label key={complement.id}>
              <input
                type={group.tipo_selecao === 'single' ? 'radio' : 'checkbox'}
                name={group.tipo_selecao === 'single' ? `group-${group.id}` : undefined}
                checked={selectedComplements.some(c => c.id === complement.id)}
                onChange={() => handleToggleComplement(complement.id, group)}
              />
              {complement.nome} (+R$ {complement.preco.toFixed(2)})
            </label>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ComplementSelector;
```

---

## 💰 Exemplo: Calcular Total com Complementos

```javascript
const calcularTotalPedido = (item, complementos) => {
  const precoItem = item.preco;
  
  const precoComplementos = complementos.reduce((total, comp) => {
    return total + (comp.preco * (comp.quantidade || 1));
  }, 0);
  
  const total = precoItem + precoComplementos;
  
  return {
    precoItem,
    precoComplementos,
    total
  };
};

// Uso:
const item = { nome: 'Hambúrguer', preco: 25.00 };
const complementos = [
  { nome: 'Cheddar', preco: 3.00, quantidade: 1 },
  { nome: 'Bacon', preco: 4.50, quantidade: 1 },
  { nome: 'Molho', preco: 2.00, quantidade: 1 }
];

const resultado = calcularTotalPedido(item, complementos);
console.log(resultado);
// {
//   precoItem: 25.00,
//   precoComplementos: 9.50,
//   total: 34.50
// }
```

---

## 🧪 Exemplo: Validação de Grupos Obrigatórios

```javascript
const validarComplementosObrigatorios = (groups, selectedComplements) => {
  const gruposObrigatorios = groups.filter(g => g.obrigatorio);
  
  for (const grupo of gruposObrigatorios) {
    const temSelecao = selectedComplements.some(
      c => c.groupId === grupo.id
    );
    
    if (!temSelecao) {
      return {
        valid: false,
        message: `Você deve selecionar um item do grupo "${grupo.nome}"`
      };
    }
  }
  
  return { valid: true };
};

// Uso:
const validation = validarComplementosObrigatorios(groups, selectedComplements);

if (!validation.valid) {
  alert(validation.message);
  return;
}

// Prosseguir com o pedido...
```

---

## 📱 Exemplo: Exibir Complementos na Comanda

```javascript
const formatarComandaComComplementos = (pedidoItem, complementos) => {
  let texto = `${pedidoItem.quantidade}x ${pedidoItem.nome}\n`;
  texto += `   R$ ${pedidoItem.preco.toFixed(2)}\n`;
  
  if (complementos.length > 0) {
    texto += `   Complementos:\n`;
    complementos.forEach(comp => {
      texto += `   + ${comp.nome} (R$ ${comp.preco.toFixed(2)})\n`;
    });
  }
  
  const total = pedidoItem.preco + complementos.reduce(
    (sum, c) => sum + c.preco, 0
  );
  
  texto += `   TOTAL: R$ ${total.toFixed(2)}\n`;
  
  return texto;
};

// Resultado:
// 1x Hambúrguer Artesanal
//    R$ 25.00
//    Complementos:
//    + Cheddar Extra (R$ 3.00)
//    + Bacon (R$ 4.50)
//    + Molho Barbecue (R$ 2.00)
//    TOTAL: R$ 34.50
```

---

## 🔍 Exemplo: Buscar Complementos Disponíveis

```javascript
const buscarComplementosDisponiveis = async (restauranteId) => {
  const result = await complementsService.getComplements(restauranteId);
  
  if (result.success) {
    // Filtrar apenas disponíveis
    const disponiveis = result.data.filter(c => c.disponivel);
    
    // Agrupar por preço
    const porPreco = disponiveis.reduce((acc, comp) => {
      const preco = comp.preco.toFixed(2);
      if (!acc[preco]) acc[preco] = [];
      acc[preco].push(comp);
      return acc;
    }, {});
    
    console.log('Complementos por preço:', porPreco);
    // {
    //   '2.00': [{ nome: 'Molho Barbecue' }, { nome: 'Molho Ranch' }],
    //   '3.00': [{ nome: 'Cheddar Extra' }],
    //   '4.50': [{ nome: 'Bacon' }]
    // }
  }
};
```

---

## 🎯 Dicas de Uso

### ✅ Boas Práticas

1. **Sempre verificar `result.success`** antes de usar `result.data`
2. **Tratar erros** com mensagens amigáveis ao usuário
3. **Validar grupos obrigatórios** antes de finalizar pedido
4. **Calcular total** em tempo real conforme cliente seleciona
5. **Mostrar apenas complementos disponíveis** no app do cliente

### ❌ Evitar

1. Não assumir que a requisição sempre funciona
2. Não esquecer de passar `restauranteId` nas funções
3. Não permitir pedido sem complementos obrigatórios
4. Não mostrar complementos indisponíveis ao cliente

---

## 🆘 Tratamento de Erros

```javascript
const handleComplementOperation = async (operation) => {
  try {
    const result = await operation();
    
    if (result.success) {
      // Sucesso
      showSuccessMessage('Operação realizada com sucesso!');
      return result.data;
    } else {
      // Erro do servidor
      showErrorMessage(result.error || 'Erro ao processar operação');
      return null;
    }
  } catch (error) {
    // Erro de rede ou outro
    console.error('Erro inesperado:', error);
    showErrorMessage('Erro de conexão. Tente novamente.');
    return null;
  }
};

// Uso:
const complementos = await handleComplementOperation(() =>
  complementsService.getComplements(restauranteId)
);
```

---

## 📚 Referência Rápida

```javascript
// COMPLEMENTOS
getComplements(restauranteId)
createComplement(restauranteId, data)
updateComplement(complementId, data)
deleteComplement(complementId)
toggleComplementAvailability(complementId)

// GRUPOS
getGroups(restauranteId)
createGroup(restauranteId, data)
updateGroup(groupId, data)
deleteGroup(groupId)

// ASSOCIAÇÕES
associateComplementsToGroup(groupId, complementIds)
getGroupComplements(groupId)
associateGroupsToMenuItem(menuItemId, groupIds)
associateComplementsToMenuItem(menuItemId, groupId, complementIds)
getMenuItemComplements(menuItemId)

// PEDIDOS
addComplementsToOrderItem(itemPedidoId, complements)
getOrderItemComplements(itemPedidoId)
```

---

**Pronto para usar! 🚀**
