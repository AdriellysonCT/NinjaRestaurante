/**
 * Helper para impressão múltipla de comandas
 */

import { getTemplatesForSection } from './printTemplateConfig';
import { getTemplate } from './printTemplates';

/**
 * Verifica se a impressão automática está ativada
 * @returns {boolean}
 */
export const isAutoPrintEnabled = () => {
  try {
    const saved = localStorage.getItem('fome-ninja-auto-print-enabled');
    return saved === 'true';
  } catch {
    return false;
  }
};

/**
 * Imprime múltiplas comandas baseado na configuração da seção
 * @param {string} section - Seção do sistema ('dashboard', 'mesas', 'pdv')
 * @param {object} orderData - Dados do pedido
 * @param {object} restaurantData - Dados do restaurante
 * @param {boolean} forceprint - Forçar impressão mesmo se auto-print estiver desativado
 * @returns {Promise<Array>} Array com os resultados de cada impressão
 */
export const printMultipleTemplates = async (section, orderData, restaurantData, forcePrint = false) => {
  // Verificar se deve imprimir automaticamente
  if (!forcePrint && !isAutoPrintEnabled()) {
    console.log('⏸️ Impressão automática desativada. Pulando impressão.');
    return [];
  }
  
  const templateIds = getTemplatesForSection(section);
  
  if (!templateIds || templateIds.length === 0) {
    console.warn(`Nenhum template configurado para a seção: ${section}`);
    return [];
  }
  
  console.log(`🖨️ Iniciando impressão automática para seção "${section}" com ${templateIds.length} template(s)`);
  
  const results = [];
  const copies = getCopiesCount();
  
  for (const templateId of templateIds) {
    try {
      const template = getTemplate(templateId);
      const html = template(orderData, restaurantData);
      
      // Imprimir o número de cópias configurado
      for (let i = 0; i < copies; i++) {
        const printResult = await printHTML(html, templateId, i + 1, copies);
        
        results.push({
          templateId,
          copy: i + 1,
          success: true,
          result: printResult
        });
        
        console.log(`✅ Comanda impressa: ${templateId} (cópia ${i + 1}/${copies})`);
        
        // Pequeno delay entre cópias para evitar problemas
        if (i < copies - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao imprimir template ${templateId}:`, error);
      results.push({
        templateId,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Obtém o número de cópias configurado
 * @returns {number}
 */
const getCopiesCount = () => {
  try {
    const saved = localStorage.getItem('fome-ninja-print-copies');
    return saved ? parseInt(saved) : 1;
  } catch {
    return 1;
  }
};

/**
 * Função auxiliar para imprimir HTML
 * @param {string} html - HTML da comanda
 * @param {string} templateId - ID do template
 * @param {number} copyNumber - Número da cópia atual
 * @param {number} totalCopies - Total de cópias
 * @returns {Promise<boolean>}
 */
const printHTML = async (html, templateId, copyNumber, totalCopies) => {
  return new Promise((resolve, reject) => {
    try {
      // Criar iframe oculto para impressão
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Comanda - ${templateId} (${copyNumber}/${totalCopies})</title>
            <style>
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 10px;
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `);
      doc.close();
      
      // Aguardar carregamento e imprimir
      iframe.contentWindow.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.print();
            
            // Remover iframe após impressão
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve(true);
            }, 1000);
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        }, 250);
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Exemplo de uso no Dashboard:
 * 
 * import { printMultipleTemplates, isAutoPrintEnabled } from './utils/printHelper';
 * 
 * // Quando aceitar um pedido
 * const handleAcceptOrder = async (order) => {
 *   // ... lógica de aceitar pedido ...
 *   
 *   // Imprimir automaticamente se configurado
 *   if (isAutoPrintEnabled()) {
 *     await printMultipleTemplates('dashboard', order, restaurantData);
 *   }
 * };
 * 
 * // Ou forçar impressão manual
 * const handleManualPrint = async (order) => {
 *   await printMultipleTemplates('dashboard', order, restaurantData, true);
 * };
 */
