import React, { useState } from 'react';
import PrintConfigModal from './PrintConfigModal';

const PrintDemo = () => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [contentToPrint, setContentToPrint] = useState(null);

  // Exemplo de conteúdo para imprimir
  const orderContent = (
    <div className="p-4 bg-white text-black">
      <div className="text-center font-bold text-lg mb-4">Mr. Burger</div>
      <div className="text-center mb-2">Pedido #120</div>
      <div className="text-center text-sm text-gray-600 mb-4">10/10/2023 - 13:47</div>
      
      <div className="border-t border-gray-300 pt-2 mb-4">
        <div className="font-semibold mb-1">1x Prato especial do mo R$25.90</div>
        <div className="text-sm text-gray-700 mb-1">- Adicional de mofo (R$1.00)</div>
        <div className="text-sm text-gray-700 italic mb-3">Obs: Nilo color cebola</div>
        
        <div className="font-semibold mb-1">1x Suco natural R$9.90</div>
        <div className="text-sm text-gray-700 italic mb-3">Obs: Nilo precisa incular talheres. Por gentileza buzinar quando chegar.</div>
      </div>
      
      <div className="border-t border-gray-300 pt-2 text-right font-bold text-lg">
        Total: R$36.22
      </div>
      
      <div className="border-t border-gray-300 pt-2 mt-4">
        <div className="font-semibold">Cliente: Maria Silva</div>
        <div className="text-sm">(99) 9999 9999</div>
        <div className="text-sm">Avenida Brasil, 100 - Centro, São Paulo - SP</div>
      </div>
    </div>
  );

  const handlePrintOrder = () => {
    setContentToPrint(orderContent);
    setShowPrintModal(true);
  };

  const handlePrintSimple = () => {
    setContentToPrint(null); // Usar window.print()
    setShowPrintModal(true);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Demonstração de Impressão</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card de exemplo de pedido */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Comanda do Pedido</h2>
            
            <div className="border border-gray-200 rounded p-4 mb-4">
              {orderContent}
            </div>
            
            <button
              onClick={handlePrintOrder}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Comanda
            </button>
          </div>

          {/* Card de impressão simples */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Impressão Simples</h2>
            
            <p className="text-gray-600 mb-4">
              Use esta opção para imprimir o conteúdo atual da página usando a configuração padrão do navegador.
            </p>
            
            <button
              onClick={handlePrintSimple}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Configurar Impressão
            </button>
          </div>
        </div>

        {/* Informações de uso */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Como usar o componente</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Importar o componente:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import PrintConfigModal from './components/PrintConfigModal';`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Adicionar o modal:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<PrintConfigModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  contentToPrint={conteudoParaImprimir}
  title="Imprimir Pedido"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Propriedades disponíveis:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>isOpen:</strong> Controla a visibilidade do modal</li>
                <li><strong>onClose:</strong> Função chamada ao fechar o modal</li>
                <li><strong>contentToPrint:</strong> Conteúdo React para imprimir (opcional)</li>
                <li><strong>title:</strong> Título do modal (opcional)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configuração de impressão */}
      <PrintConfigModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        contentToPrint={contentToPrint}
        title={contentToPrint ? "Imprimir Comanda" : "Configurar Impressão"}
      />
    </div>
  );
};

export default PrintDemo;