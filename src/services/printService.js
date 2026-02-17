// Serviço para impressão de comandas e outros documentos
import { supabase } from '../lib/supabase';
import { logger } from "../utils/logger";
import { getTemplatesForSection } from "../utils/printTemplateConfig";

const PRINT_HISTORY_KEY = 'fome-ninja-print-history';
const PRINT_SETTINGS_KEY = 'fome-ninja-print-settings';
const AUTO_PRINT_KEY = 'fome-ninja-auto-print-enabled';

// Configurações padrão de impressão
const defaultPrintSettings = {
  printerName: 'Impressora Padrão',
  paperWidth: 80, // mm - padrão para térmicas
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
  autoPrintOnAccept: true, // Impressão automática ao aceitar pedido
  companyInfo: {
    name: '',
    address: '',
    phone: '',
    cnpj: ''
  }
};

// Cache de impressoras detectadas
let cachedPrinters = [];
let printersLastFetch = 0;
const PRINTERS_CACHE_TTL = 30000; // 30 segundos

// Histórico de impressões
let printHistory = [];

// Carregar histórico de impressões do localStorage
try {
  const savedHistory = localStorage.getItem(PRINT_HISTORY_KEY);
  if (savedHistory) {
    printHistory = JSON.parse(savedHistory);
  }
} catch (error) {
  logger.error('Erro ao carregar histórico de impressões:', error);
}

// Carregar configurações de impressão do localStorage
let printSettings = { ...defaultPrintSettings };
try {
  const savedSettings = localStorage.getItem(PRINT_SETTINGS_KEY);
  if (savedSettings) {
    printSettings = { ...defaultPrintSettings, ...JSON.parse(savedSettings) };
  }
} catch (error) {
  logger.error('Erro ao carregar configurações de impressão:', error);
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
      .eq('user_id', user.id)
      .single();

    if (error) {
      logger.error('Erro ao buscar dados do restaurante:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Erro ao buscar dados do restaurante:', error);
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
      logger.log('Configurações do restaurante atualizadas:', printSettings.companyInfo);
      
      // Retornar também o bairro/cidade para uso no rodapé
      return bairroCidade;
    }
  } catch (error) {
    logger.error('Erro ao atualizar configurações do restaurante:', error);
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
    logger.error('Erro ao salvar histórico de impressões:', error);
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

// Função para enviar para impressora - otimizada para térmicas 80mm
const sendToPrinter = async (content, settings = {}) => {
  const paperWidth = settings.paperWidth || printSettings.paperWidth || 80;
  const printerName = settings.printerName || printSettings.printerName;
  
  logger.log('Enviando para impressora:', printerName);
  logger.log('Largura do papel:', paperWidth + 'mm');
  
  // Criar iframe oculto para impressão (melhor compatibilidade que window.open)
  const printFrame = document.createElement('iframe');
  printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  printFrame.name = 'printFrame_' + Date.now();
  document.body.appendChild(printFrame);
  
  const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
  const doc = frameDoc.document || frameDoc;
  
  // HTML otimizado para impressoras térmicas 80mm
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comanda</title>
      <style>
        /* Reset e configurações base */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* Configurações para impressão térmica */
        @page {
          size: ${paperWidth}mm auto;
          margin: 0;
          padding: 0;
        }
        
        @media print {
          html, body {
            width: ${paperWidth}mm !important;
            max-width: ${paperWidth}mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            font-family: 'Courier New', 'Lucida Console', Monaco, monospace !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Forçar preto e branco para térmicas */
          * {
            color: #000 !important;
            background: transparent !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          pre {
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            font-family: inherit !important;
            font-size: inherit !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        /* Estilos para visualização na tela */
        body {
          width: ${paperWidth}mm;
          max-width: ${paperWidth}mm;
          margin: 0 auto;
          padding: 2mm;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.3;
          background: #fff;
          color: #000;
        }
        
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          padding: 0;
          font-family: inherit;
          font-size: inherit;
        }
      </style>
    </head>
    <body>
      <pre>${escapeHtml(content)}</pre>
    </body>
    </html>
  `;
  
  doc.open();
  doc.write(printHTML);
  doc.close();
  
  // Aguardar carregamento e imprimir
  return new Promise((resolve) => {
    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          
          // Remover iframe após impressão
          setTimeout(() => {
            if (printFrame.parentNode) {
              document.body.removeChild(printFrame);
            }
          }, 2000);
          
          resolve({
            success: true,
            message: `Impresso em ${printerName}`
          });
        } catch (error) {
          logger.error('Erro ao imprimir:', error);
          // Fallback: usar window.print diretamente
          window.print();
          resolve({
            success: true,
            message: 'Impresso via navegador (fallback)'
          });
        }
      }, 300);
    };
  });
};

// Função auxiliar para escapar HTML
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const printService = {
  // Função para imprimir comanda de pedido
  printOrderTicket: async (order, options = {}) => {
    try {
      logger.log('Imprimindo comanda para o pedido #' + order.id);
      
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
      logger.error('Erro ao imprimir comanda:', error);
      
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
      logger.log('Reimprimindo comanda para o pedido #' + order.id);
      
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
      logger.error('Erro ao reimprimir comanda:', error);
      
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
      logger.log(`Imprimindo relatório ${reportType} de pedidos`);
      
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
      logger.error('Erro ao imprimir relatório:', error);
      
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
      logger.log(`Imprimindo ${orders.length} comandas em lote`);
      
      const results = [];
      let successCount = 0;
      
      // Imprimir cada comanda
      for (const order of orders) {
        try {
          const result = await printService.printOrderTicket(order, options);
          results.push(result);
          if (result.success) successCount++;
        } catch (error) {
          logger.error(`Erro ao imprimir comanda para pedido #${order.id}:`, error);
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
      logger.error('Erro ao imprimir comandas em lote:', error);
      
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
      logger.error('Erro ao atualizar configurações de impressão:', error);
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
      logger.error('Erro ao restaurar configurações de impressão:', error);
      return {
        success: false,
        message: 'Erro ao restaurar configurações de impressão: ' + error.message
      };
    }
  },
  
  // Função para imprimir relatório de caixa
  printCashReport: async (relatorio, options = {}) => {
    try {
      logger.log('Imprimindo relatório de caixa');
      
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
      logger.error('Erro ao imprimir relatório de caixa:', error);
      
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

  // Lista de impressoras disponíveis - detecta automaticamente via navegador
  getAvailablePrinters: async () => {
    // Verificar cache
    const now = Date.now();
    if (cachedPrinters.length > 0 && (now - printersLastFetch) < PRINTERS_CACHE_TTL) {
      return cachedPrinters;
    }
    
    const printers = [];
    
    // Impressora padrão do sistema sempre disponível
    printers.push({
      id: 'default',
      name: 'Impressora Padrão do Sistema',
      status: 'online',
      isDefault: true
    });
    
    // Tentar detectar impressoras via Web Print API (se disponível)
    // Nota: A maioria dos navegadores não expõe lista de impressoras por segurança
    // mas o diálogo de impressão do sistema mostrará todas as impressoras disponíveis
    
    // Adicionar impressoras comuns para térmicas (sugestões)
    const commonThermalPrinters = [
      { id: 'thermal_80mm', name: 'Impressora Térmica 80mm', status: 'available', isThermal: true },
      { id: 'thermal_58mm', name: 'Impressora Térmica 58mm', status: 'available', isThermal: true },
    ];
    
    // Verificar se há impressoras salvas no localStorage
    try {
      const savedPrinters = localStorage.getItem('fome-ninja-saved-printers');
      if (savedPrinters) {
        const parsed = JSON.parse(savedPrinters);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (!printers.find(existing => existing.id === p.id)) {
              printers.push({ ...p, status: 'saved' });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar impressoras salvas:', e);
    }
    
    // Adicionar sugestões de térmicas
    commonThermalPrinters.forEach(p => {
      if (!printers.find(existing => existing.id === p.id)) {
        printers.push(p);
      }
    });
    
    // Atualizar cache
    cachedPrinters = printers;
    printersLastFetch = now;
    
    return printers;
  },
  
  // Salvar impressora personalizada
  savePrinter: (printer) => {
    try {
      const savedPrinters = localStorage.getItem('fome-ninja-saved-printers');
      const printers = savedPrinters ? JSON.parse(savedPrinters) : [];
      
      // Evitar duplicatas
      const existingIndex = printers.findIndex(p => p.id === printer.id || p.name === printer.name);
      if (existingIndex >= 0) {
        printers[existingIndex] = printer;
      } else {
        printers.push(printer);
      }
      
      localStorage.setItem('fome-ninja-saved-printers', JSON.stringify(printers));
      
      // Limpar cache para forçar atualização
      cachedPrinters = [];
      printersLastFetch = 0;
      
      return { success: true, message: 'Impressora salva com sucesso' };
    } catch (error) {
      return { success: false, message: 'Erro ao salvar impressora: ' + error.message };
    }
  },
  
  // Verificar se impressão automática está habilitada
  isAutoPrintEnabled: () => {
    try {
      const saved = localStorage.getItem(AUTO_PRINT_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
      // Padrão: habilitado
      return printSettings.autoPrintOnAccept !== false;
    } catch (e) {
      return true;
    }
  },
  
  // Habilitar/desabilitar impressão automática
  setAutoPrintEnabled: (enabled) => {
    try {
      localStorage.setItem(AUTO_PRINT_KEY, enabled ? 'true' : 'false');
      printSettings.autoPrintOnAccept = enabled;
      return { success: true, enabled };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  // Impressão automática ao aceitar pedido ou finalizar no POS
  autoPrintOnAccept: async (order, restauranteInput = null, section = 'dashboard') => {
    if (!printService.isAutoPrintEnabled()) {
      logger.log('Impressão automática desabilitada');
      return { success: false, message: 'Impressão automática desabilitada' };
    }
    
    logger.log('🖨️ Iniciando impressão automática para pedido #' + (order.numero_pedido || order.id));
    
    try {
      // 1. Buscar dados do restaurante se não fornecidos
      let restaurante = restauranteInput;
      if (!restaurante) {
        restaurante = await buscarDadosRestaurantePrint();
      }

      // 2. Obter modelos configurados para a seção especificada
      const templates = getTemplatesForSection(section);
      logger.log(`📋 Modelos configurados para ${section}: ${templates.join(', ')}`);

      if (templates.length === 0) {
        logger.log('⚠️ Nenhum modelo de comanda selecionado para Dashboard');
        return { success: false, message: 'Nenhum modelo selecionado nas configurações' };
      }

      // 3. Formatar pedido para o padrão do serviço
      const pedidoFormatado = {
        id: order.id,
        numero_pedido: order.numero_pedido || order.id,
        customerName: order.customerName || order.nome_cliente || 'Cliente',
        customerPhone: order.customerPhone || order.telefone_cliente || '',
        type: order.type || order.tipo_pedido || 'balcao',
        total: parseFloat(order.valor_total || order.total || 0),
        taxa_entrega: parseFloat(order.taxa_entrega || 0),
        desconto: parseFloat(order.desconto || 0),
        paymentMethod: order.metodo_pagamento || order.paymentMethod || 'Não informado',
        prepTime: order.prep_time || order.prepTime || 0,
        troco: parseFloat(order.troco || 0),
        comments: order.comments || order.observacoes || '',
        items: (order.items || order.itens_pedido || []).map(item => ({
          name: item.name || item.itens_cardapio?.nome || 'Item',
          qty: item.qty || item.quantidade || 1,
          price: parseFloat(item.price || item.preco_unitario || 0),
          notes: item.note || item.observacao_item || ''
        })),
        // Adicionar campos de entrega se for delivery
        deliveryAddress: order.deliveryAddress || (order.tipo_pedido === 'delivery' ? {
          street: order.endereco_rua || '',
          number: order.endereco_numero || '',
          complement: order.endereco_complemento || '',
          neighborhood: order.endereco_bairro || '',
          city: order.endereco_cidade || '',
          reference: order.endereco_referencia || ''
        } : null)
      };

      // 4. Imprimir cada via configurada
      const results = [];
      for (const templateId of templates) {
        logger.log(`🖨️ Imprimindo via: ${templateId}`);
        const result = await printService.printOrderTicket(pedidoFormatado, {
          selectedTemplate: templateId
        });
        results.push(result);
      }
      
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        logger.log(`✅ ${successCount}/${templates.length} vias impressas com sucesso`);
      } else {
        console.warn('⚠️ Todas as impressões falharam');
      }
      
      return { 
        success: successCount > 0, 
        message: `${successCount}/${templates.length} vias impressas`,
        results 
      };
    } catch (error) {
      logger.error('❌ Erro na impressão automática:', error);
      return { success: false, message: error.message };
    }
  },
  
  // Forçar atualização da lista de impressoras
  refreshPrinters: async () => {
    cachedPrinters = [];
    printersLastFetch = 0;
    return await printService.getAvailablePrinters();
  }
};

// Função auxiliar para gerar o conteúdo da comanda (baseado no layout da imagem)
// Função auxiliar para gerar o conteúdo da comanda (baseado no layout da imagem)
function generateTicketContent(order, isReprint = false, settings = printSettings, bairroCidade = '') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  // Identificar template
  const templateId = settings.selectedTemplate || 'complete';
  const isKitchen = templateId === 'kitchen';
  const isDelivery = templateId === 'delivery';
  
  // Cabeçalho da comanda
  let content = '';
  
  // Nome do site - centralizado
  content += centerText('Fome Ninja Restaurante') + '\n'; 
   
  // 1. CABEÇALHO DO RESTAURANTE (Ocultar na via da cozinha para economizar papel)
  if (!isKitchen) {
    if (settings.companyInfo.name) {
      content += centerText(settings.companyInfo.name) + '\n'; 
    }
    
    // Montar endereço completo
    let enderecoCompleto = settings.companyInfo.address || '';
    if (enderecoCompleto) {
      content += centerText(enderecoCompleto) + '\n'; 
    }
    
    // Se tiver bairro/cidade, adicionar
    if (bairroCidade) {
      content += centerText(bairroCidade) + '\n';
    }
    
    if (settings.companyInfo.phone) {
      content += centerText(`Tel: ${settings.companyInfo.phone}`) + '\n'; 
    }
    
    content += repeatChar('-', 32) + '\n'; 
  }
  
  // 2. INFORMAÇÕES DO PEDIDO
  content += centerText(`PEDIDO #${order.numero_pedido || order.id.substring(0, 8)}`) + '\n';
  content += lrText('Data/Hora:', `${dateStr} ${timeStr}`) + '\n';
  
  if (order.customerName) {
    content += lrText('Cliente:', order.customerName) + '\n';
  }
  
  // Telefone (se disponível e não for via cozinha)
  if (order.customerPhone && !isKitchen) {
    content += lrText('Telefone:', order.customerPhone) + '\n';
  }
  
  // Tipo de pedido
  const tipoPedido = order.type === 'comanda' || order.type === 'local' ? '🍽️ Mesa/Local' : 
                    order.type === 'delivery' ? '🚚 Entrega' : 
                    order.type === 'retirada' ? '🏪 Retirada' :
                    '💰 Balcão';
  content += lrText('Tipo:', tipoPedido) + '\n';
  
  content += repeatChar('-', 32) + '\n';
  
  // Endereço para entrega (se aplicável e se for para cliente ou entregador)
  if ((order.type === 'delivery') && order.deliveryAddress && !isKitchen) {
    content += centerText('--- ENDEREÇO DE ENTREGA ---') + '\n';
    content += `${order.deliveryAddress.street}, ${order.deliveryAddress.number}\n`;
    if (order.deliveryAddress.complement) {
      content += `Compl: ${order.deliveryAddress.complement}\n`;
    }
    content += `${order.deliveryAddress.neighborhood} - ${order.deliveryAddress.city}\n`;
    if (order.deliveryAddress.reference) {
      content += `Ref: ${order.deliveryAddress.reference}\n`;
    }
    content += repeatChar('-', 32) + '\n';
  }
  
  // 3. ITENS DO PEDIDO
  content += centerText(isKitchen ? 'VIA DA COZINHA' : 'ITENS DO PEDIDO') + '\n';
  content += repeatChar('-', 32) + '\n';
  
  // Cabeçalho da tabela de itens
  content += isKitchen ? 'Qtd Nome\n' : lrText('Qtd Nome', 'Valor Unit.') + '\n';
  content += repeatChar('-', 32) + '\n';
  
  // Itens do pedido
  let subtotal = 0;
  order.items.forEach(item => {
    const itemTotal = (item.price || 0) * item.qty;
    subtotal += itemTotal;
    
    // Linha principal do item
    if (isKitchen) {
        content += `${item.qty} ${item.name}\n`;
    } else {
        content += lrText(`${item.qty} ${item.name}`, `R$ ${(item.price || 0).toFixed(2)}`) + '\n';
    }
    
    // Observações do item (se houver) - Crucial na cozinha!
    if (item.notes) {
      content += `  > OBS: ${item.notes}\n`;
    }
    
    content += repeatChar('-', 32) + '\n';
  });
  
  // 4. TOTALIZAÇÃO (Ocultar na via da cozinha)
  if (!isKitchen) {
    content += lrText('Subtotal', `R$ ${subtotal.toFixed(2)}`) + '\n';
    
    // Descontos/Taxas
    if (order.desconto > 0) {
      content += lrText('Desconto', `-R$ ${order.desconto.toFixed(2)}`) + '\n';
    }
    if (order.taxa_entrega > 0) {
      content += lrText('Taxa Entrega', `R$ ${order.taxa_entrega.toFixed(2)}`) + '\n';
    }

    content += repeatChar('=', 32) + '\n';
    content += lrText('TOTAL DO PEDIDO', `R$ ${(order.total || subtotal).toFixed(2)}`) + '\n';
    content += repeatChar('=', 32) + '\n';
    
    // 5. PAGAMENTO
    content += centerText('PAGAMENTO') + '\n';
    const metodo = order.paymentMethod?.toLowerCase() || '';
    const nomeMetodo = metodo === 'cash' || metodo === 'dinheiro' ? 'Dinheiro' :
                      metodo === 'card' || metodo === 'cartao' ? 'Cartão' :
                      metodo === 'pix' ? 'PIX' : 
                      order.paymentMethod || 'Não informado';
    
    content += lrText(nomeMetodo, `R$ ${(order.total || subtotal).toFixed(2)}`) + '\n';
    
    if ((metodo === 'cash' || metodo === 'dinheiro') && order.troco > 0) {
      content += lrText('Troco para:', `R$ ${order.troco.toFixed(2)}`) + '\n';
    }
    content += repeatChar('-', 32) + '\n';
  }
  
  // 6. OBSERVAÇÕES GERAIS
  if (order.comments || order.observacoes) {
    content += 'OBS GERAIS:\n';
    content += `${order.comments || order.observacoes}\n`;
    content += repeatChar('-', 32) + '\n';
  }

  // 7. TEMPO ESTIMADO
  if (order.prepTime) {
    content += centerText(`Tempo Prep: ${order.prepTime} min`) + '\n';
    content += repeatChar('-', 32) + '\n';
  }
  
  // 8. REIMPRESSÃO
  if (isReprint) {
    content += centerText('*** REIMPRESSÃO ***') + '\n';
    content += repeatChar('-', 32) + '\n';
  }
  
  // 9. RODAPÉ (Ocultar na via da cozinha)
  if (!isKitchen) {
    content += centerText('Obrigado pela preferência!') + '\n';
    content += centerText(`${dateStr} - ${timeStr}`) + '\n';
    content += centerText('www.fomeninja.com.br') + '\n';
  }

  return content;
}

// Funções auxiliares para formatação de texto (colunas e alinhamento)
function repeatChar(ch, n) {
    return new Array(n + 1).join(ch);
}

function centerText(text, width = 32) {
    const t = String(text || '');
    if (t.length >= width) return t.substring(0, width);
    const left = Math.floor((width - t.length) / 2);
    const right = width - t.length - left;
    return repeatChar(' ', left) + t + repeatChar(' ', right);
}

function lrText(left, right, width = 32) {
    const l = String(left || '');
    const r = String(right || '');
    const spaces = width - (l.length + r.length);
    if (spaces <= 0) {
        // Se for muito longo, corta o lado esquerdo
        return l.substring(0, width - r.length - 1) + ' ' + r;
    }
    return l + repeatChar(' ', spaces) + r;
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
