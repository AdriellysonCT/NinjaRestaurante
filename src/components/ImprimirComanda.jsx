import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTemplate } from '../utils/printTemplates';
import { getTemplatesForSection } from '../utils/printTemplateConfig';

export default function ImprimirComanda({ pedido, restaurante, auto = true, reimpressao = false, onAfterPrint }) {
  const [printConfig, setPrintConfig] = useState({ paperWidth: 80 });
  const [templateHtml, setTemplateHtml] = useState('');

  useEffect(() => {
    // Carregar configurações de impressora
    try {
      const savedSettings = localStorage.getItem('fome-ninja-print-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setPrintConfig({
          paperWidth: Number(settings.paperWidth || 80)
        });
      }

      // Carregar template configurado para o Dashboard
      // TODO: Se necessário, passar uma prop "section" para saber se é PDV ou Mesas
      const templates = getTemplatesForSection('dashboard');
      const templateId = templates && templates.length > 0 ? templates[0] : 'complete';
      
      const generator = getTemplate(templateId);
      const htmlContent = generator(pedido, restaurante);
      
      setTemplateHtml(htmlContent);

    } catch (e) {
      console.error('Erro ao preparar impressão:', e);
      // Fallback para template completo em caso de erro
      const generator = getTemplate('complete');
      setTemplateHtml(generator(pedido, restaurante));
    }
  }, [pedido, restaurante]);

  useEffect(() => {
    if (!auto || !templateHtml) return;
    
    const t = setTimeout(() => {
      window.print();
      if (onAfterPrint) setTimeout(() => onAfterPrint(), 100);
    }, 500); // Tempo seguro para renderização do HTML
    
    return () => clearTimeout(t);
  }, [auto, templateHtml, onAfterPrint]);

  // Use Portal to render directly into body
  return createPortal(
    <>
      <style>{`
        @media screen { .print-only { display: none; } }
        @media print {
          /* Ocultar tudo exceto nosso container */
          body > * { display: none !important; }
          
          body > .imprimir-comanda-container {
             display: block !important;
             position: absolute !important;
             top: 0 !important;
             left: 0 !important;
             margin: 0 !important;
             background: white !important;
             z-index: 99999 !important;
          }
           
          @page {
            size: ${printConfig.paperWidth}mm auto;
            margin: 0;
            padding: 0;
          }
          
          html, body {
            width: ${printConfig.paperWidth}mm !important;
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          .print-only { 
            display: block !important; 
          }

          /* Reset básico para o conteúdo do template */
          .imprimir-comanda-container {
            width: ${printConfig.paperWidth}mm !important;
            max-width: ${printConfig.paperWidth}mm !important;
            padding: 2mm !important; 
            font-family: 'Courier New', monospace;
          }
          
          .imprimir-comanda-container * {
             visibility: visible !important;
          }
        }
      `}</style>
      <div 
        className="imprimir-comanda-container print-only"
        dangerouslySetInnerHTML={{ __html: templateHtml }}
      />
    </>,
    document.body
  );
}



