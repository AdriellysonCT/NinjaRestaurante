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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-xl">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Destino - Impressora */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Destino</label>
            <select 
              value={printer} 
              onChange={(e) => setPrinter(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            >
              {printers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Páginas */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Páginas</label>
            <select 
              value={pages} 
              onChange={(e) => setPages(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
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
                className="w-full mt-2 bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
              />
            )}
          </div>

          {/* Cópias */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Cópias</label>
            <input 
              type="number" 
              min="1" 
              max="99"
              value={copies} 
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Layout */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Layout</label>
            <select 
              value={layout} 
              onChange={(e) => setLayout(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="Retrato">Retrato</option>
              <option value="Paisagem">Paisagem</option>
            </select>
          </div>

          {/* Colorido */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Colorido</label>
            <select 
              value={colorMode} 
              onChange={(e) => setColorMode(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
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
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center transition-colors"
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
              <div className="mt-4 space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                {/* Margens */}
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Margens</label>
                  <select 
                    value={margins} 
                    onChange={(e) => setMargins(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Mínima">Mínima</option>
                    <option value="Nenhuma">Nenhuma</option>
                  </select>
                </div>

                {/* Tamanho do papel */}
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Tamanho do papel</label>
                  <select 
                    value={paperSize} 
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  >
                    <option value="A4">A4</option>
                    <option value="Carta">Carta</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                  </select>
                </div>

                {/* Qualidade */}
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Qualidade</label>
                  <select 
                    value={quality} 
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
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
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrintClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium flex items-center"
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