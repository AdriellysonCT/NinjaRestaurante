// Serviço para impressão de comandas e outros documentos
import { supabase } from '../lib/supabase';

const PRINT_HISTORY_KEY = 'fome-ninja-print-history';
const PRINT_SETTINGS_KEY = 'fome-ninja-print-settings';

// Configurações padrão de impressão
const defaultPrintSettings = {
  printerName: 'Impressora Padrão',
  paperWidth: 80, // mm
  fontSize: 12,
  showLogo: true,
  showQRCode: false,
  copies: 1,
  autocut: true,
  header: 'FOME NINJA - COMANDA DE PEDIDO',
  footer: 'Obrigado pela preferência!',
  logoUrl: 'https://placehold.co/200x100/1a1a1a/ffa500?text=FomeNinja',
  showItemPrice: true,
  showTimestamp: true,
  companyInfo: {
    name: '',
    address: '',
    phone: '',
    cnpj: ''
  }
};

// Histórico de impressões
let printHistory = [];

// Carregar histórico de impressões do localStorage
try {
  const savedHistory = localStorage.getItem(PRINT_HISTORY_KEY);
  if (savedHistory) {
    printHistory = JSON.parse(savedHistory);
  }
} catch (error) {
  console.error('Erro ao carregar histórico de impressões:', error);
}

// Carregar configurações de impressão do localStorage
let printSettings = { ...defaultPrintSettings };
try {
  const savedSettings = localStorage.getItem(PRINT_SETTINGS_KEY);
  if (savedSettings) {
    printSettings = { ...defaultPrintSettings, ...JSON.parse(savedSettings) };
  }
} catch (error) {
  console.error('Erro ao carregar configurações de impressão:', error);
}

// Função para buscar dados do restaurante logado
async function buscarDadosRestaurantePrint() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar dados do restaurante
    const { data, error } = await supabase
      .from('restaurantes_app')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar dados do restaurante:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do restaurante:', error);
    return null;
  }
}

// Função para atualizar configurações com dados do restaurante
async function atualizarConfiguracoesRestaurante() {
  try {
    const dadosRestaurante = await buscarDadosRestaurantePrint();
    if (dadosRestaurante) {
      // Montar endereço completo
      let enderecoCompleto = '';
      if (dadosRestaurante.rua) {
        enderecoCompleto = dadosRestaurante.rua;
        if (dadosRestaurante.numero) {
          enderecoCompleto += `, ${dadosRestaurante.numero}`;
        }
      }
      
      // Montar bairro/cidade
      let bairroCidade = '';
      if (dadosRestaurante.bairro) {
        bairroCidade = dadosRestaurante.bairro;
        if (dadosRestaurante.cidade) {
          bairroCidade += `, ${dadosRestaurante.cidade}`;
        }
      } else if (dadosRestaurante.cidade) {
        bairroCidade = dadosRestaurante.cidade;
      }
      
      // Atualizar configurações com dados reais do restaurante
      printSettings.companyInfo = {
        name: dadosRestaurante.nome_fantasia || '',
        address: enderecoCompleto,
        phone: dadosRestaurante.telefone || '',
        cnpj: dadosRestaurante.cnpj || ''
      };
      
      // Salvar no localStorage
      localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(printSettings));
      console.log('Configurações do restaurante atualizadas:', printSettings.companyInfo);
      
      // Retornar também o bairro/cidade para uso no rodapé
      return bairroCidade;
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações do restaurante:', error);
  }
}

// Salvar histórico de impressões no localStorage
const savePrintHistory = () => {
  try {
    // Limitar o histórico a 100 entradas para não sobrecarregar o localStorage
    if (printHistory.length > 100) {
      printHistory = printHistory.slice(-100);
    }
    localStorage.setItem(PRINT_HISTORY_KEY, JSON.stringify(printHistory));
  } catch (error) {
    console.error('Erro ao salvar histórico de impressões:', error);
  }
};

// Adicionar entrada ao histórico de impressões
const addToPrintHistory = (type, data, success, message) => {
  const historyEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type,
    data,
    success,
    message
  };
  
  printHistory.push(historyEntry);
  savePrintHistory();
  
  return historyEntry;
};

// Função para simular impressão real
const sendToPrinter = async (content, settings = {}) => {
  // Em um ambiente real, aqui seria a integração com a API de impressão
  // Por exemplo, usando a Web Print API, WebUSB ou enviando para um servidor de impressão
  
  // Simulação de impressão
  console.log('Enviando para impressora:', settings.printerName || printSettings.printerName);
  console.log('Conteúdo:');
  console.log(content);
  
  // Criar uma janela de impressão oculta para o conteúdo da comanda
  const printWindow = window.open('', '_blank', 'width=400,height=600,top=0,left=0');
  
  if (printWindow) {
    // Criar o HTML para impressão com estilos otimizados para impressoras térmicas
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda</title>
        <style>
          @media print {
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px;
              margin: 0;
              padding: 0;
              width: 80mm;
            }
            .no-print { display: none !important; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            margin: 10px;
            width: 80mm;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .items { margin: 10px 0; }
          .total { font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          pre { 
            white-space: pre-wrap; 
            word-wrap: break-word;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${settings.companyInfo.name || 'RESTAURANTE'}</h2>
          <p>${settings.companyInfo.address || ''}</p>
          <p>${settings.companyInfo.phone ? 'Tel: ' + settings.companyInfo.phone : ''}</p>
        </div>
        <hr>
        <pre>${content}</pre>
        <hr>
        <div class="footer">
          <p>Obrigado pela preferência!</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Simular um pequeno atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Impresso em ${settings.printerName || printSettings.printerName}`
    };
  } else {
    // Fallback: usar window.print() na janela atual
    console.warn('Não foi possível abrir janela de impressão, usando fallback');
    
    // Criar um elemento temporário
    const printElement = document.createElement('div');
    printElement.style.cssText = `
      font-family: 'Courier New', monospace; 
      font-size: 12px;
      width: 80mm;
      white-space: pre-wrap;
      position: absolute;
      left: -9999px;
    `;
    printElement.textContent = content;
    document.body.appendChild(printElement);
    
    // Usar window.print()
    window.print();
    
    // Remover elemento temporário
    setTimeout(() => {
      document.body.removeChild(printElement);
    }, 1000);
    
    return {
      success: true,
      message: `Impresso via navegador`
    };
  }
};

export const printService = {
  // Função para imprimir comanda de pedido
  printOrderTicket: async (order, options = {}) => {
    try {
      console.log('Imprimindo comanda para o pedido #' + order.id);
      
      // Atualizar configurações com dados do restaurante e obter bairro/cidade
      const bairroCidade = await atualizarConfiguracoesRestaurante();
      
      // Mesclar configurações padrão com opções específicas
      const settings = { ...printSettings, ...options };
      
      // Gerar conteúdo da comanda
      const ticketContent = generateTicketContent(order, false, settings, bairroCidade);
      
      // Enviar para impressora
      const printResult = await sendToPrinter(ticketContent, settings);
      
      // Registrar no histórico
      const historyEntry = addToPrintHistory(
        'ticket', 
        { orderId: order.id, customerName: order.customerName }, 
        printResult.success, 
        printResult.message
      );
      
      return {
        success: printResult.success,
        message: printResult.message,
        ticketContent,
        historyEntry
      };
    } catch (error) {
      console.error('Erro ao imprimir comanda:', error);
      
      // Registrar erro no histórico
      addToPrintHistory(
        'ticket', 
        { orderId: order.id, customerName: order.customerName }, 
        false, 
        'Erro: ' + error.message
      );
      
      return {
        success: false,
        message: 'Erro ao imprimir comanda: ' + error.message
      };
    }
  },
  
  // Função para reimprimir comanda
  reprintOrderTicket: async (order, options = {}) => {
    try {
      console.log('Reimprimindo comanda para o pedido #' + order.id);
      
      // Atualizar configurações com dados do restaurante e obter bairro/cidade
      const bairroCidade = await atualizarConfiguracoesRestaurante();
      
      // Mesclar configurações padrão com opções específicas
      const settings = { ...printSettings, ...options };
      
      // Gerar conteúdo da comanda com flag de reimpressão
      const ticketContent = generateTicketContent(order, true, settings, bairroCidade);
      
      // Enviar para impressora
      const printResult = await sendToPrinter(ticketContent, settings);
      
      // Registrar no histórico
      const historyEntry = addToPrintHistory(
        'reprint', 
        { orderId: order.id, customerName: order.customerName }, 
        printResult.success, 
        printResult.message
      );
      
      return {
        success: printResult.success,
        message: printResult.message,
        ticketContent,
        historyEntry
      };
    } catch (error) {
      console.error('Erro ao reimprimir comanda:', error);
      
      // Registrar erro no histórico
      addToPrintHistory(
        'reprint', 
        { orderId: order.id, customerName: order.customerName }, 
        false, 
        'Erro: ' + error.message
      );
      
      return {
        success: false,
        message: 'Erro ao reimprimir comanda: ' + error.message
      };
    }
  },
  
  // Função para imprimir relatório de pedidos
  printOrdersReport: async (orders, reportType = 'daily', options = {}) => {
    try {
      console.log(`Imprimindo relatório ${reportType} de pedidos`);
      
      // Mesclar configurações padrão com opções específicas
      const settings = { ...printSettings, ...options };
      
      // Gerar conteúdo do relatório
      const reportContent = generateReportContent(orders, reportType, settings);
      
      // Enviar para impressora
      const printResult = await sendToPrinter(reportContent, settings);
      
      // Registrar no histórico
      const historyEntry = addToPrintHistory(
        'report', 
        { reportType, orderCount: orders.length }, 
        printResult.success, 
        printResult.message
      );
      
      return {
        success: printResult.success,
        message: printResult.message,
        reportContent,
        historyEntry
      };
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      
      // Registrar erro no histórico
      addToPrintHistory(
        'report', 
        { reportType, orderCount: orders.length }, 
        false, 
        'Erro: ' + error.message
      );
      
      return {
        success: false,
        message: 'Erro ao imprimir relatório: ' + error.message
      };
    }
  },
  
  // Função para imprimir múltiplas comandas de uma vez
  printMultipleTickets: async (orders, options = {}) => {
    try {
      console.log(`Imprimindo ${orders.length} comandas em lote`);
      
      const results = [];
      let successCount = 0;
      
      // Imprimir cada comanda
      for (const order of orders) {
        try {
          const result = await printService.printOrderTicket(order, options);
          results.push(result);
          if (result.success) successCount++;
        } catch (error) {
          console.error(`Erro ao imprimir comanda para pedido #${order.id}:`, error);
          results.push({
            success: false,
            message: `Erro ao imprimir comanda para pedido #${order.id}: ${error.message}`,
            orderId: order.id
          });
        }
      }
      
      // Registrar no histórico
      addToPrintHistory(
        'batch', 
        { orderCount: orders.length, successCount }, 
        successCount > 0, 
        `Impressão em lote: ${successCount}/${orders.length} comandas impressas com sucesso`
      );
      
      return {
        success: successCount > 0,
        message: `${successCount}/${orders.length} comandas impressas com sucesso`,
        results
      };
    } catch (error) {
      console.error('Erro ao imprimir comandas em lote:', error);
      
      // Registrar erro no histórico
      addToPrintHistory(
        'batch', 
        { orderCount: orders.length }, 
        false, 
        'Erro: ' + error.message
      );
      
      return {
        success: false,
        message: 'Erro ao imprimir comandas em lote: ' + error.message
      };
    }
  },
  
  // Função para obter histórico de impressões
  getPrintHistory: () => {
    return [...printHistory].reverse(); // Retorna cópia do histórico em ordem reversa (mais recentes primeiro)
  },
  
  // Função para limpar histórico de impressões
  clearPrintHistory: () => {
    printHistory = [];
    savePrintHistory();
    return { success: true, message: 'Histórico de impressões limpo com sucesso' };
  },
  
  // Função para obter configurações de impressão
  getPrintSettings: () => {
    return { ...printSettings }; // Retorna cópia das configurações
  },
  
  // Função para atualizar configurações de impressão
  updatePrintSettings: (newSettings) => {
    try {
      // Mesclar configurações existentes com novas configurações
      printSettings = { ...printSettings, ...newSettings };
      
      // Salvar no localStorage
      localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(printSettings));
      
      return { 
        success: true, 
        message: 'Configurações de impressão atualizadas com sucesso',
        settings: { ...printSettings }
      };
    } catch (error) {
      console.error('Erro ao atualizar configurações de impressão:', error);
      return {
        success: false,
        message: 'Erro ao atualizar configurações de impressão: ' + error.message
      };
    }
  },
  
  // Função para restaurar configurações padrão
  resetPrintSettings: () => {
    try {
      printSettings = { ...defaultPrintSettings };
      localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(printSettings));
      
      return { 
        success: true, 
        message: 'Configurações de impressão restauradas para o padrão',
        settings: { ...printSettings }
      };
    } catch (error) {
      console.error('Erro ao restaurar configurações de impressão:', error);
      return {
        success: false,
        message: 'Erro ao restaurar configurações de impressão: ' + error.message
      };
    }
  },
  
  // Função para imprimir relatório de caixa
  printCashReport: async (relatorio, options = {}) => {
    try {
      console.log('Imprimindo relatório de caixa');
      
      // Mesclar configurações padrão com opções específicas
      const settings = { ...printSettings, ...options };
      
      // Gerar conteúdo do relatório de caixa
      const reportContent = generateCashReportContent(relatorio, settings);
      
      // Enviar para impressora
      const printResult = await sendToPrinter(reportContent, settings);
      
      // Registrar no histórico
      const historyEntry = addToPrintHistory(
        'cash_report', 
        { 
          caixaId: relatorio.caixa.id,
          valorAbertura: relatorio.caixa.valor_abertura,
          valorFechamento: relatorio.caixa.valor_fechamento
        }, 
        printResult.success, 
        printResult.message
      );
      
      return {
        success: printResult.success,
        message: printResult.message,
        reportContent,
        historyEntry
      };
    } catch (error) {
      console.error('Erro ao imprimir relatório de caixa:', error);
      
      // Registrar erro no histórico
      addToPrintHistory(
        'cash_report', 
        { caixaId: relatorio.caixa.id }, 
        false, 
        'Erro: ' + error.message
      );
      
      return {
        success: false,
        message: 'Erro ao imprimir relatório de caixa: ' + error.message
      };
    }
  },

  // Lista de impressoras disponíveis (simulação)
  getAvailablePrinters: () => {
    // Em um ambiente real, isso seria obtido do sistema ou de uma API
    return [
      { id: 'printer1', name: 'Impressora Caixa' },
      { id: 'printer2', name: 'Impressora Cozinha' },
      { id: 'printer3', name: 'Impressora Balcão' },
      { id: 'printer4', name: 'Impressora Gerência' }
    ];
  }
};

// Função auxiliar para gerar o conteúdo da comanda (baseado no layout da imagem)
function generateTicketContent(order, isReprint = false, settings = printSettings, bairroCidade = '') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  // Cabeçalho da comanda
  let content = '';
  
  // 1. CABEÇALHO DO RESTAURANTE
  content += 'Fome Ninja Restaurante\n'; // Nome do site - centralizado
   
  // Informações do restaurante (se disponíveis no settings)
  if (settings.companyInfo.name) {
    content += `${settings.companyInfo.name}\n`; // Nome do restaurante
  }
  
  // Montar endereço completo
  let enderecoCompleto = '';
  if (settings.companyInfo.address) {
    enderecoCompleto = settings.companyInfo.address;
  }
  
  // Se tiver endereço, adicionar
  if (enderecoCompleto) {
    content += `${enderecoCompleto}\n`; // Endereço
  }
  
  // Se tiver bairro/cidade, adicionar
  if (bairroCidade) {
    content += `${bairroCidade}\n`;
  }
  
  if (settings.companyInfo.phone) {
    content += `Tel: ${settings.companyInfo.phone}\n`; // Telefone
  }
  
  content += '---------------------------\n'; // Linha tracejada
  
  // 2. INFORMAÇÕES DO PEDIDO
  content += `Pedido N° #${order.numero_pedido || order.id}\n`;
  content += `${dateStr} ${timeStr}\n`;
  content += `Cliente: ${order.customerName}\n`;
  
  // Telefone (se disponível)
  if (order.customerPhone) {
    content += `Telefone: ${order.customerPhone}\n`;
  }
  
  // Tipo de pedido
  const tipoPedido = order.type === 'comanda' ? 'Mesa/Comanda' : 
                    order.type === 'delivery' ? 'Entrega' : 
                    'Balcão';
  content += `Tipo: ${tipoPedido}\n`;
  
  content += '---------------------------\n'; // Linha tracejada
  
  // Endereço para entrega (se aplicável)
  if (order.type === 'delivery' && order.deliveryAddress) {
    content += 'ENDEREÇO PARA ENTREGA:\n';
    content += `${order.deliveryAddress.street}, ${order.deliveryAddress.number}\n`;
    if (order.deliveryAddress.complement) {
      content += `${order.deliveryAddress.complement}\n`;
    }
    content += `${order.deliveryAddress.neighborhood} - ${order.deliveryAddress.city}\n`;
    if (order.deliveryAddress.reference) {
      content += `Ref: ${order.deliveryAddress.reference}\n`;
    }
    content += `Previsão: ${order.estimatedDeliveryTime || '30-45 min'}\n`;
    content += '\n';
  }
  
  // Mesa (se for comanda)
  if (order.type === 'comanda' && order.comandaNumero) {
    content += `Mesa: ${order.comandaNumero}\n`;
    content += '\n';
  }
  
  // 3. ITENS DO PEDIDO
  content += '---------------------------\n'; // Linha tracejada
  content += 'ITENS DO PEDIDO\n'; // Título centralizado
  content += '---------------------------\n'; // Linha tracejada
  
  // Cabeçalho da tabela de itens
  content += 'Qtd Nome | Valor Unit.\n'; // Cabeçalho alinhado
  content += '---------------------------\n'; // Linha tracejada
  
  // Itens do pedido
  let subtotal = 0;
  order.items.forEach(item => {
    const itemTotal = (item.price || 0) * item.qty;
    subtotal += itemTotal;
    
    // Linha principal do item
    content += `${item.qty} ${item.name} | R$ ${(item.price || 0).toFixed(2)}\n`;
    
    // Observações do item (se houver)
    if (item.notes) {
      content += `Obs: ${item.notes}\n`;
    }
    
    // Complementos/adicionais (se houver)
    if (item.extras && item.extras.length > 0) {
      item.extras.forEach(extra => {
        content += `+ ${extra.name} | R$ ${extra.price.toFixed(2)}\n`;
      });
    }
    
    content += '---------------------------\n'; // Linha tracejada após cada item
  });
  
  // Subtotal
  content += `Subtotal | R$ ${subtotal.toFixed(2)}\n`;
  content += '---------------------------\n'; // Linha tracejada
  
  // Total
  content += `Total | R$ ${order.total.toFixed(2)}\n`;
  content += '===========================\n'; // Linha dupla tracejada
  
  // 4. FORMAS DE PAGAMENTO
  content += '---------------------------\n'; // Linha tracejada
  content += 'FORMAS DE PAGAMENTO\n'; // Título centralizado
  
  if (order.paymentMethod === 'cash') {
    content += `dinheiro | R$ ${order.total.toFixed(2)}\n`;
    
    if (order.cashReceived && order.change) {
      content += `Recebido | R$ ${order.cashReceived.toFixed(2)}\n`;
      content += `Troco | R$ ${order.change.toFixed(2)}\n`;
    }
  } else if (order.paymentMethod === 'card') {
    content += `cartão | R$ ${order.total.toFixed(2)}\n`;
  } else if (order.paymentMethod === 'pix') {
    content += `pix | R$ ${order.total.toFixed(2)}\n`;
  } else {
    content += `${order.paymentMethod || 'Não informado'} | R$ ${order.total.toFixed(2)}\n`;
  }
  
  content += '---------------------------\n'; // Linha tracejada
  
  // 5. TEMPO ESTIMADO
  if (order.prepTime) {
    content += `Tempo estimado de preparo: ${order.prepTime} min\n`;
    content += '---------------------------\n'; // Linha tracejada
  }
  
  // 6. REIMPRESSÃO
  if (isReprint) {
    content += '*** REIMPRESSÃO ***\n'; // Centralizado
    content += '---------------------------\n'; // Linha tracejada
  }
  
  // 7. RODAPÉ DO RESTAURANTE
  if (settings.companyInfo.name) {
    content += `${settings.companyInfo.name}\n`; // Nome do restaurante
  }
  if (settings.companyInfo.address) {
    content += `${settings.companyInfo.address}\n`; // Endereço
  }
  if (bairroCidade) {
    content += `${bairroCidade}\n`;
  }
  if (settings.companyInfo.phone) {
    content += `Tel: ${settings.companyInfo.phone}\n`; // Telefone
  }
  if (settings.companyInfo.cnpj) {
    content += `CNPJ: ${settings.companyInfo.cnpj}\n`; // CNPJ
  }
  
  content += 'Obrigado pela preferência!\n';
  content += '===========================\n'; // Linha dupla tracejada
  
  // 8. ÚLTIMA LINHA (OPCIONAL)
  content += 'Obrigado pela preferência!\n'; // Centralizado
  content += `${dateStr}, ${timeStr}\n`; // Data e hora centralizados
  content += 'Fome Ninja Restaurante\n'; // Nome do site centralizado, em negrito

  return content;
}

// Função auxiliar para gerar o conteúdo do relatório
function generateReportContent(orders, reportType, settings = printSettings) {
  const date = new Date().toLocaleString();
  
  // Cabeçalho
  let content = '='.repeat(40) + '\n';
  
  // Logo (simulação)
  if (settings.showLogo) {
    content += '[LOGO]\n';
  }
  
  // Informações da empresa
  content += `${settings.companyInfo.name}\n`;
  content += `${settings.companyInfo.address}\n`;
  content += `Tel: ${settings.companyInfo.phone}\n`;
  
  content += '='.repeat(40) + '\n';
  content += `RELATÓRIO DE PEDIDOS - ${reportType.toUpperCase()}\n`;
  content += `Data: ${date}\n`;
  content += '='.repeat(40) + '\n\n';

  // Estatísticas
  let total = 0;
  let totalItems = 0;
  const paymentMethods = {};
  const categories = {};
  
  // Processar pedidos para estatísticas
  orders.forEach(order => {
    total += order.total;
    
    // Contar itens
    if (order.items) {
      totalItems += order.items.reduce((sum, item) => sum + item.qty, 0);
      
      // Contar por categoria
      order.items.forEach(item => {
        if (item.category) {
          categories[item.category] = (categories[item.category] || 0) + item.qty;
        }
      });
    }
    
    // Contar por método de pagamento
    if (order.paymentMethod) {
      paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
    }
  });
  
  // Resumo
  content += `Total de pedidos: ${orders.length}\n`;
  content += `Total de itens: ${totalItems}\n`;
  content += `Valor total: R$ ${total.toFixed(2)}\n`;
  content += `Ticket médio: R$ ${(total / orders.length).toFixed(2)}\n\n`;
  
  // Métodos de pagamento
  content += 'MÉTODOS DE PAGAMENTO:\n';
  content += '-'.repeat(40) + '\n';
  Object.entries(paymentMethods).forEach(([method, count]) => {
    content += `${method}: ${count} pedidos\n`;
  });
  content += '\n';
  
  // Lista de pedidos
  content += 'PEDIDOS:\n';
  content += '-'.repeat(40) + '\n';
  
  orders.forEach(order => {
    content += `#${order.numero_pedido || order.id} - ${order.customerName} - R$ ${order.total.toFixed(2)} - ${order.status}\n`;
  });

  content += '\n' + '='.repeat(40) + '\n';
  content += 'Fim do relatório\n';
  content += '='.repeat(40) + '\n';

  return content;
}

// Função auxiliar para gerar o conteúdo do relatório de caixa
function generateCashReportContent(relatorio, settings = printSettings) {
  const date = new Date().toLocaleString();
  
  // Cabeçalho
  let content = '='.repeat(40) + '\n';
  
  // Logo (simulação)
  if (settings.showLogo) {
    content += '[LOGO]\n';
  }
  
  // Informações da empresa
  content += `${settings.companyInfo.name}\n`;
  content += `${settings.companyInfo.address}\n`;
  content += `Tel: ${settings.companyInfo.phone}\n`;
  
  content += '='.repeat(40) + '\n';
  content += 'RELATÓRIO DE FECHAMENTO DE CAIXA\n';
  content += `Data: ${date}\n`;
  content += '='.repeat(40) + '\n\n';

  // Informações do caixa
  content += 'INFORMAÇÕES DO CAIXA:\n';
  content += '-'.repeat(40) + '\n';
  content += `Abertura: ${new Date(relatorio.caixa.data_abertura).toLocaleString()}\n`;
  if (relatorio.caixa.data_fechamento) {
    content += `Fechamento: ${new Date(relatorio.caixa.data_fechamento).toLocaleString()}\n`;
  }
  content += `Valor Inicial: R$ ${relatorio.caixa.valor_abertura.toFixed(2)}\n`;
  if (relatorio.caixa.valor_fechamento) {
    content += `Valor Final: R$ ${relatorio.caixa.valor_fechamento.toFixed(2)}\n`;
  }
  content += '\n';

  // Resumo de vendas
  content += 'RESUMO DE VENDAS:\n';
  content += '-'.repeat(40) + '\n';
  content += `Total de Vendas: ${relatorio.vendas.length}\n`;
  content += `Valor Total: R$ ${relatorio.totalVendas.toFixed(2)}\n`;
  content += '\n';

  // Vendas por método de pagamento
  content += 'VENDAS POR MÉTODO DE PAGAMENTO:\n';
  content += '-'.repeat(40) + '\n';
  Object.entries(relatorio.totaisPorMetodo).forEach(([metodo, valor]) => {
    const nomeMetodo = metodo === 'cash' ? 'Dinheiro' : 
                      metodo === 'card' ? 'Cartão' : 
                      metodo === 'pix' ? 'PIX' : metodo;
    content += `${nomeMetodo}: R$ ${valor.toFixed(2)}\n`;
  });
  content += '\n';

  // Movimentações
  if (relatorio.movimentacoes.length > 0) {
    content += 'MOVIMENTAÇÕES:\n';
    content += '-'.repeat(40) + '\n';
    
    relatorio.movimentacoes.forEach(mov => {
      const tipo = mov.tipo === 'sangria' ? 'SANGRIA' : 'REFORÇO';
      const sinal = mov.tipo === 'sangria' ? '-' : '+';
      content += `${tipo}: ${sinal}R$ ${Math.abs(mov.valor).toFixed(2)} - ${mov.motivo}\n`;
      content += `  Data: ${new Date(mov.data_movimentacao).toLocaleString()}\n`;
      if (mov.observacoes) {
        content += `  Obs: ${mov.observacoes}\n`;
      }
      content += '\n';
    });
  }

  // Totais de movimentações
  content += 'RESUMO DE MOVIMENTAÇÕES:\n';
  content += '-'.repeat(40) + '\n';
  content += `Total Reforços: R$ ${relatorio.totalReforcos.toFixed(2)}\n`;
  content += `Total Sangrias: R$ ${relatorio.totalSangrias.toFixed(2)}\n`;
  content += '\n';

  // Cálculo final
  content += 'CÁLCULO FINAL:\n';
  content += '-'.repeat(40) + '\n';
  content += `Valor Inicial: R$ ${relatorio.caixa.valor_abertura.toFixed(2)}\n`;
  content += `+ Vendas: R$ ${relatorio.totalVendas.toFixed(2)}\n`;
  content += `+ Reforços: R$ ${relatorio.totalReforcos.toFixed(2)}\n`;
  content += `- Sangrias: R$ ${relatorio.totalSangrias.toFixed(2)}\n`;
  content += '-'.repeat(40) + '\n';
  content += `VALOR ESPERADO: R$ ${relatorio.valorEsperado.toFixed(2)}\n`;
  
  if (relatorio.caixa.valor_fechamento) {
    content += `VALOR INFORMADO: R$ ${relatorio.caixa.valor_fechamento.toFixed(2)}\n`;
    content += `DIFERENÇA: R$ ${relatorio.diferenca.toFixed(2)}\n`;
    
    if (relatorio.diferenca > 0) {
      content += '*** SOBRA NO CAIXA ***\n';
    } else if (relatorio.diferenca < 0) {
      content += '*** FALTA NO CAIXA ***\n';
    } else {
      content += '*** CAIXA CONFERIDO ***\n';
    }
  }

  // Observações
  if (relatorio.caixa.observacoes_abertura || relatorio.caixa.observacoes_fechamento) {
    content += '\n' + 'OBSERVAÇÕES:\n';
    content += '-'.repeat(40) + '\n';
    if (relatorio.caixa.observacoes_abertura) {
      content += `Abertura: ${relatorio.caixa.observacoes_abertura}\n`;
    }
    if (relatorio.caixa.observacoes_fechamento) {
      content += `Fechamento: ${relatorio.caixa.observacoes_fechamento}\n`;
    }
  }

  content += '\n' + '='.repeat(40) + '\n';
  content += 'Fim do relatório de caixa\n';
  content += '='.repeat(40) + '\n';

  return content;
}