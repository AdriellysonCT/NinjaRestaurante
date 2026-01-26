# 🖨️ Integração da Impressão Automática

## Como Integrar no Dashboard

### 1. Importar o Helper

No arquivo `Dashboard.jsx`, adicione o import:

```javascript
import { printMultipleTemplates, isAutoPrintEnabled } from '../utils/printHelper';
```

### 2. Buscar Dados do Restaurante

Certifique-se de ter os dados do restaurante disponíveis:

```javascript
const { restaurante } = useAuth();
```

### 3. Adicionar Impressão Automática ao Aceitar Pedido

Encontre a função que aceita o pedido (geralmente algo como `handleAcceptOrder` ou onde o status muda para "em_preparo") e adicione:

```javascript
const handleAcceptOrder = async (order) => {
  try {
    // 1. Atualizar status do pedido no banco
    await supabase
      .from('pedidos_padronizados')
      .update({ status: 'em_preparo', started_at: new Date().toISOString() })
      .eq('id', order.id);
    
    // 2. Imprimir automaticamente se configurado
    if (isAutoPrintEnabled()) {
      console.log('🖨️ Impressão automática ativada, imprimindo comandas...');
      
      const printResults = await printMultipleTemplates(
        'dashboard',  // Seção
        order,        // Dados do pedido
        restaurante   // Dados do restaurante
      );
      
      console.log('✅ Impressão concluída:', printResults);
    }
    
    // 3. Atualizar UI
    // ... resto da lógica ...
    
  } catch (error) {
    console.error('Erro ao aceitar pedido:', error);
  }
};
```

### 4. Exemplo Completo com Toast de Feedback

```javascript
import { printMultipleTemplates, isAutoPrintEnabled } from '../utils/printHelper';
import { useToast } from '../hooks/useToast';

const Dashboard = () => {
  const { restaurante } = useAuth();
  const { success, error: showError } = useToast();
  
  const handleAcceptOrder = async (order) => {
    try {
      // Atualizar status
      await supabase
        .from('pedidos_padronizados')
        .update({ status: 'em_preparo', started_at: new Date().toISOString() })
        .eq('id', order.id);
      
      success('Pedido aceito com sucesso!');
      
      // Impressão automática
      if (isAutoPrintEnabled()) {
        const printResults = await printMultipleTemplates('dashboard', order, restaurante);
        
        const successCount = printResults.filter(r => r.success).length;
        const totalCount = printResults.length;
        
        if (successCount > 0) {
          success(`${successCount} comanda(s) impressa(s) automaticamente!`);
        }
        
        if (successCount < totalCount) {
          showError(`Erro ao imprimir ${totalCount - successCount} comanda(s)`);
        }
      }
      
    } catch (err) {
      showError('Erro ao aceitar pedido');
      console.error(err);
    }
  };
  
  // ... resto do componente
};
```

## Configuração pelo Usuário

O restaurante pode configurar a impressão automática em:

**Configurações → Ferramentas → Impressão Múltipla por Seção**

1. ✅ Ativar "Impressão Automática"
2. ✅ Selecionar quais modelos imprimir (Via Cliente, Via Cozinha, etc.)
3. ✅ Definir número de cópias

## Seções Disponíveis

- `'dashboard'` - Para pedidos aceitos no Dashboard
- `'mesas'` - Para pedidos finalizados em Mesas
- `'pdv'` - Para vendas no PDV Balcão

## Forçar Impressão Manual

Se quiser um botão para imprimir manualmente (mesmo com auto-print desativado):

```javascript
const handleManualPrint = async (order) => {
  await printMultipleTemplates(
    'dashboard',
    order,
    restaurante,
    true  // ← Força impressão
  );
};
```

## Verificar se Auto-Print está Ativo

```javascript
if (isAutoPrintEnabled()) {
  // Mostrar indicador visual
  console.log('✅ Impressão automática ativada');
}
```

## Exemplo de Dados do Pedido

```javascript
const orderData = {
  id: 123,
  numero_pedido: 1,
  nome_cliente: 'João Silva',
  telefone: '(81) 98456-6469',
  total: 48.50,
  metodo_pagamento: 'Dinheiro',
  tipo_pedido: 'delivery',
  created_at: '2026-01-23T03:11:00',
  items: [
    { name: 'Coca-Cola', qty: 2, price: 5.50, observacao: '' },
    { name: 'Pastel de Carne', qty: 1, price: 8.50, observacao: 'SEM CEBOLA' }
  ]
};
```

## Troubleshooting

### Impressão não está funcionando?

1. Verifique se a impressão automática está ativada nas configurações
2. Verifique se há modelos selecionados para a seção
3. Abra o console (F12) e procure por mensagens de erro
4. Teste com `forcePrint = true` para descartar problemas de configuração

### Como desativar temporariamente?

Vá em **Configurações → Ferramentas** e desative o toggle "Impressão Automática"
