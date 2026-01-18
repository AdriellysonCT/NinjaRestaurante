import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const PrintConfigModal = ({ isOpen, onClose, contentToPrint, title = "Imprimir Documento" }) => {
  const [printer, setPrinter] = useState('EPSON L3250 Series');
  const [pages, setPages] = useState('Todas');
  const [customPages, setCustomPages] = useState('');
  const [copies, setCopies] = useState(1);
  const [layout, setLayout] = useState('Retrato');
  const [colorMode, setColorMode] = useState('Colorido');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [margins, setMargins] = useState('Normal');
  const [paperSize, setPaperSize] = useState('A4');
  const [quality, setQuality] = useState('Normal');
  
  const componentRef = useRef();
  const printFrameRef = useRef();

  // Lista de impressoras simuladas (em produção, detectar as reais)
  const printers = [
    'EPSON L3250 Series',
    'HP LaserJet Pro M404dn',
    'Canon PIXMA TS3320',
    'Brother HL-L2350DW',
    'Samsung M2070 Series'
  ];

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: title,
    pageStyle: `
      @page {
        size: ${layout === 'Paisagem' ? 'landscape' : 'portrait'};
        margin: ${margins === 'Nenhuma' ? '0' : margins === 'Mínima' ? '0.5cm' : '1cm'};
      }
      @media print {
        body {
          print-color-adjust: ${colorMode === 'Colorido' ? 'exact' : 'economy'};
          -webkit-print-color-adjust: ${colorMode === 'Colorido' ? 'exact' : 'economy'};
        }
      }
    `,
    onAfterPrint: () => {
      console.log('Impressão concluída');
      onClose();
    },
    onPrintError: (error) => {
      console.error('Erro na impressão:', error);
      alert('Erro ao imprimir. Verifique a impressora selecionada.');
    }
  });

  const handlePrintClick = () => {
    if (contentToPrint) {
      // Se houver conteúdo específico, imprimir ele
      handlePrint();
    } else {
      // Fallback para window.print()
      window.print();
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-card text-card-foreground p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h2 className="text-foreground font-bold text-xl">{title}</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Destino - Impressora */}
          <div>
            <label className="block text-muted-foreground mb-2 font-medium">Destino</label>
            <select 
              value={printer} 
              onChange={(e) => setPrinter(e.target.value)}
              className="w-full bg-input text-foreground rounded-lg p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              {printers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Páginas */}
          <div>
            <label className="block text-muted-foreground mb-2 font-medium">Páginas</label>
            <select 
              value={pages} 
              onChange={(e) => setPages(e.target.value)}
              className="w-full bg-input text-foreground rounded-lg p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="Todas">Todas</option>
              <option value="Personalizado">Personalizado</option>
            </select>
            {pages === 'Personalizado' && (
              <input
                type="text"
                placeholder="Ex: 1-3, 5, 7-9"
                value={customPages}
                onChange={(e) => setCustomPages(e.target.value)}
                className="w-full mt-2 bg-input text-foreground rounded-lg p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            )}
          </div>

          {/* Cópias */}
          <div>
            <label className="block text-muted-foreground mb-2 font-medium">Cópias</label>
            <input 
              type="number" 
              min="1" 
              max="99"
              value={copies} 
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-input text-foreground rounded-lg p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Layout */}
          <div>
            <label className="block text-muted-foreground mb-2 font-medium">Layout</label>
            <select 
              value={layout} 
              onChange={(e) => setLayout(e.target.value)}
              className="w-full bg-input text-foreground rounded-lg p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="Retrato">Retrato</option>
              <option value="Paisagem">Paisagem</option>
            </select>
          </div>

          {/* Colorido */}
          <div>
            <label className="block text-muted-foreground mb-2 font-medium">Colorido</label>
            <select 
              value={colorMode} 
              onChange={(e) => setColorMode(e.target.value)}
              className="w-full bg-input text-foreground rounded-lg p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="Colorido">Colorido</option>
              <option value="Preto e Branco">Preto e Branco</option>
            </select>
          </div>

          {/* Mais definições - Avançado */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-primary hover:text-primary/80 font-medium flex items-center transition-colors"
            >
              <svg 
                className={`w-4 h-4 mr-2 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Mais definições
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
                {/* Margens */}
                <div>
                  <label className="block text-muted-foreground mb-2 text-sm">Margens</label>
                  <select 
                    value={margins} 
                    onChange={(e) => setMargins(e.target.value)}
                    className="w-full bg-input text-foreground rounded p-2 border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Mínima">Mínima</option>
                    <option value="Nenhuma">Nenhuma</option>
                  </select>
                </div>

                {/* Tamanho do papel */}
                <div>
                  <label className="block text-muted-foreground mb-2 text-sm">Tamanho do papel</label>
                  <select 
                    value={paperSize} 
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full bg-input text-foreground rounded p-2 border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                  >
                    <option value="A4">A4</option>
                    <option value="Carta">Carta</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                  </select>
                </div>

                {/* Qualidade */}
                <div>
                  <label className="block text-muted-foreground mb-2 text-sm">Qualidade</label>
                  <select 
                    value={quality} 
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full bg-input text-foreground rounded p-2 border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-8 flex justify-end space-x-3 border-t border-border pt-4">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-secondary text-foreground border border-input rounded-lg hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary transition-all font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrintClick}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold flex items-center shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* Container oculto para impressão */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          {contentToPrint}
        </div>
      </div>
    </div>
  );
};

export default PrintConfigModal;