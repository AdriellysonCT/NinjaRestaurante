# 📚 Exemplos de Uso - API Fechamento de Caixa

## 🔧 Serviço: fechamentoCaixaService.js

### 1. Buscar último fechamento
```javascript
import * as fechamentoCaixaService from '../services/fechamentoCaixaService';

const restauranteId = 'uuid-do-restaurante';
const ultimoFechamento = await fechamentoCaixaService.fetchUltimoFechamento(restauranteId);

console.log(ultimoFechamento);
// {
//   id: 'uuid',
//   data_fechamento: '2026-01-09T22:00:00Z',
//   total_liquido: 1230.00,
//   status: 'aprovado'
// }
```

---

### 2. Buscar movimentações do período
```javascript
const carteiraId = 'uuid-da-carteira';
const dataInicio = new Date('2026-01-09T00:00:00Z').toISOString();

const movimentacoes = await fechamentoCaixaService.fetchMovimentacoesPeriodo(
  carteiraId,
  dataInicio
);

console.log(movimentacoes);
// [
//   { id: 'uuid', valor: 50.00, origem: 'pedido', status: 'confirmado' },
//   { id: 'uuid', valor: 75.00, origem: 'pedido', status: 'confirmado' },
//   ...
// ]
```

---

### 3. Calcular valores do fechamento
```javascript
const movimentacoes = [
  { valor: 50.00, taxa_entrega: 5.00 },
  { valor: 75.00, taxa_entrega: 7.00 },
  { valor: 100.00, taxa_entrega: 10.00 }
];

const taxaPlataforma = 10; // 10%

const valores = fechamentoCaixaService.calcularValoresFechamento(
  movimentacoes,
  taxaPlataforma
);

console.log(valores);
// {
//   totalBruto: 225.00,
//   taxaPlataforma: 22.50,
//   taxaEntrega: 22.00,
//   totalDescontos: 44.50,
//   totalLiquido: 180.50,
//   qtdTransacoes: 3
// }
```

---

### 4. Criar fechamento
```javascript
const payload = {
  id_usuario: 'uuid-restaurante',
  tipo_usuario: 'restaurante',
  data_abertura: '2026-01-09T08:00:00Z',
  data_fechamento: '2026-01-09T22:00:00Z',
  total_bruto: 225.00,
  total_descontos: 44.50,
  total_liquido: 180.50,
  qtd_transacoes: 3,
  status: 'pendente'
};

const fechamento = await fechamentoCaixaService.criarFechamento(payload);

console.log(fechamento);
// { id: 'uuid', status: 'pendente', ... }
```

---

### 5. Buscar todos os fechamentos
```javascript
const restauranteId = 'uuid-do-restaurante';

// Sem filtros
const todos = await fechamentoCaixaService.fetchFechamentos(restauranteId);

// Com filtros
const pendentes = await fechamentoCaixaService.fetchFechamentos(restauranteId, {
  status: 'pendente'
});

const periodo = await fechamentoCaixaService.fetchFechamentos(restauranteId, {
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});

console.log(pendentes);
// [{ id: 'uuid', status: 'pendente', ... }]
```

---

### 6. Verificar pedidos em andamento
```javascript
const restauranteId = 'uuid-do-restaurante';

const temPedidos = await fechamentoCaixaService.verificarPedidosEmAndamento(restauranteId);

if (temPedidos) {
  alert('Há pedidos em andamento. Finalize-os antes de fechar o caixa.');
} else {
  // Pode fechar o caixa
}
```

---

## 🎨 Componente: FecharCaixaButton

### Uso básico
```jsx
import FecharCaixaButton from '../components/FecharCaixaButton';

function MeuComponente() {
  const restauranteId = 'uuid-do-restaurante';

  return (
    <FecharCaixaButton 
      restauranteId={restauranteId}
      onFechamentoCreated={() => {
        console.log('Fechamento criado!');
        // Recarregar dados, mostrar mensagem, etc.
      }}
    />
  );
}
```

---

### Personalizar taxa da plataforma
```jsx
// Em FecharCaixaButton.jsx, linha ~115
const taxaPlataformaPercent = 15; // Alterar de 10 para 15%
```

---

## 📋 Componente: HistoricoFechamentos

### Uso básico
```jsx
import HistoricoFechamentos from '../components/HistoricoFechamentos';

function MeuComponente() {
  const restauranteId = 'uuid-do-restaurante';

  return (
    <div>
      <h2>Meus Fechamentos</h2>
      <HistoricoFechamentos restauranteId={restauranteId} />
    </div>
  );
}
```

---

## 👨‍💼 Componente: AdminFechamentos

### Uso no painel admin
```jsx
import AdminFechamentos from '../components/AdminFechamentos';

function AdminDashboard() {
  return (
    <div>
      <h1>Gerenciar Fechamentos</h1>
      <AdminFechamentos />
    </div>
  );
}
```

---

## 🔔 Notificações em Tempo Real

### Escutar mudanças em fechamentos
```javascript
import { supabase } from '../lib/supabase';

const restauranteId = 'uuid-do-restaurante';

const channel = supabase
  .channel('meus_fechamentos')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'fechamentos_caixa',
      filter: `id_usuario=eq.${restauranteId}`
    },
    (payload) => {
      console.log('Fechamento atualizado:', payload);
      
      if (payload.new.status === 'aprovado') {
        // Mostrar notificação
        alert('Seu fechamento foi aprovado!');
        
        // Ou usar Notification API
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('Fechamento Aprovado! 🎉', {
            body: `Valor: R$ ${payload.new.total_liquido}`,
            icon: '/icon.png'
          });
        }
      }
    }
  )
  .subscribe();

// Limpar ao desmontar componente
return () => {
  supabase.removeChannel(channel);
};
```

---

## 🗄️ Queries SQL Úteis

### Buscar fechamentos de um restaurante
```sql
SELECT * FROM fechamentos_caixa
WHERE id_usuario = 'uuid-do-restaurante'
ORDER BY data_fechamento DESC;
```

### Buscar fechamentos pendentes
```sql
SELECT 
  f.*,
  r.nome as restaurante_nome,
  r.telefone as restaurante_telefone
FROM fechamentos_caixa f
JOIN restaurantes_app r ON f.id_usuario = r.id
WHERE f.status = 'pendente'
ORDER BY f.data_fechamento DESC;
```

### Total a pagar por período
```sql
SELECT 
  COUNT(*) as quantidade,
  SUM(total_liquido) as total_a_pagar
FROM fechamentos_caixa
WHERE status = 'aprovado'
AND data_fechamento BETWEEN '2026-01-01' AND '2026-01-31';
```

### Aprovar fechamento
```sql
UPDATE fechamentos_caixa
SET 
  status = 'aprovado',
  observacoes = 'Aprovado pelo admin',
  atualizado_em = NOW()
WHERE id = 'uuid-do-fechamento';
```

### Marcar como pago
```sql
UPDATE fechamentos_caixa
SET 
  status = 'pago',
  observacoes = 'Pago via PIX em 09/01/2026',
  atualizado_em = NOW()
WHERE id = 'uuid-do-fechamento';
```

---

## 🧪 Testes

### Criar fechamento de teste
```javascript
// No console do navegador ou em um script de teste
import * as fechamentoCaixaService from './services/fechamentoCaixaService';

const teste = async () => {
  const payload = {
    id_usuario: 'SEU_RESTAURANTE_ID',
    tipo_usuario: 'restaurante',
    data_abertura: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
    data_fechamento: new Date().toISOString(), // Agora
    total_bruto: 1000.00,
    total_descontos: 150.00,
    total_liquido: 850.00,
    qtd_transacoes: 10,
    status: 'pendente'
  };

  const resultado = await fechamentoCaixaService.criarFechamento(payload);
  console.log('Fechamento criado:', resultado);
};

teste();
```

---

## 🎯 Casos de Uso Comuns

### 1. Fechar caixa automaticamente à meia-noite
```javascript
// Usar um cron job ou scheduled function
const fecharCaixaAutomatico = async (restauranteId) => {
  try {
    // Verificar se há vendas
    const carteira = await fechamentoCaixaService.fetchCarteiraRestaurante(restauranteId);
    const movimentacoes = await fechamentoCaixaService.fetchMovimentacoesPeriodo(
      carteira.id,
      new Date().setHours(0, 0, 0, 0)
    );

    if (movimentacoes.length === 0) {
      console.log('Sem vendas hoje');
      return;
    }

    // Calcular e criar fechamento
    const valores = fechamentoCaixaService.calcularValoresFechamento(movimentacoes);
    await fechamentoCaixaService.criarFechamento({
      id_usuario: restauranteId,
      tipo_usuario: 'restaurante',
      data_abertura: new Date().setHours(0, 0, 0, 0),
      data_fechamento: new Date().toISOString(),
      ...valores,
      status: 'pendente'
    });

    console.log('Caixa fechado automaticamente');
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
  }
};
```

### 2. Exportar fechamento em PDF
```javascript
// Usar biblioteca como jsPDF ou html2pdf
import html2pdf from 'html2pdf.js';

const exportarFechamentoPDF = (fechamento) => {
  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h1>Fechamento de Caixa</h1>
      <p>ID: ${fechamento.id}</p>
      <p>Data: ${new Date(fechamento.data_fechamento).toLocaleString()}</p>
      <hr>
      <p>Total Bruto: R$ ${fechamento.total_bruto}</p>
      <p>Descontos: R$ ${fechamento.total_descontos}</p>
      <p><strong>Total Líquido: R$ ${fechamento.total_liquido}</strong></p>
      <p>Transações: ${fechamento.qtd_transacoes}</p>
    </div>
  `;

  html2pdf().from(html).save(`fechamento-${fechamento.id}.pdf`);
};
```

---

## 📱 Integração com WhatsApp

### Enviar resumo por WhatsApp
```javascript
const enviarResumoWhatsApp = (fechamento, telefone) => {
  const mensagem = `
🧾 *Fechamento de Caixa*

📅 Data: ${new Date(fechamento.data_fechamento).toLocaleString()}

💰 *Resumo:*
• Total Bruto: R$ ${fechamento.total_bruto}
• Descontos: R$ ${fechamento.total_descontos}
• *Você vai receber: R$ ${fechamento.total_liquido}*

📊 ${fechamento.qtd_transacoes} transações

Status: ${fechamento.status === 'pendente' ? '🕐 Aguardando aprovação' : '✅ Aprovado'}
  `.trim();

  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
};
```

---

**Pronto para usar! 🚀**
