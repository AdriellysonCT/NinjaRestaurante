import React, { useState } from 'react';
import PrintConfigModal from '../components/PrintConfigModal';

export const PrintDemo = () => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [contentToPrint, setContentToPrint] = useState(null);

  // Exemplo de conteúdo para imprimir - Comanda do pedido
  const orderContent = (
    <div className="p-4 bg-white text-black max-w-sm mx-auto">
      <div className="text-center font-bold text-lg mb-4 border-b-2 border-gray-800 pb-2">
        🍔 MR. BURGER
      </div>
      
      <div className="text-center mb-4">
        <div className="font-bold text-lg">PEDIDO #120</div>
        <div className="text-sm text-gray-600">10/10/2023 - 13:47</div>
      </div>
      
      <div className="border-t border-gray-400 pt-2 mb-4">
        <div className="font-semibold mb-1">1x Prato especial do mo</div>
        <div className="text-sm text-gray-700">R$ 25,90</div>
        <div className="text-sm text-gray-600 ml-2">- Adicional de mofo (R$ 1,00)</div>
        <div className="text-sm text-gray-600 italic ml-2 mb-2">Obs: Nilo color cebola</div>
        
        <div className="font-semibold mb-1">1x Suco natural</div>
        <div className="text-sm text-gray-700">R$ 9,90</div>
        <div className="text-sm text-gray-600 italic mb-2">Obs: Nilo precisa incular talheres. Por gentileza buzinar quando chegar.</div>
      </div>
      
      <div className="border-t border-gray-400 pt-2 text-right font-bold text-lg mb-4">
        TOTAL: R$ 36,22
      </div>
      
      <div className="border-t border-gray-400 pt-2 text-sm">
        <div className="font-semibold mb-1">Cliente: Maria Silva</div>
        <div className="mb-1">📱 (99) 9999 9999</div>
        <div className="text-gray-600 mb-1">📍 Avenida Brasil, 100</div>
        <div className="text-gray-600">Centro - São Paulo, SP</div>
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-4 pt-2 border-t border-gray-300">
        Via do cliente - Pedido via Hubt
      </div>
    </div>
  );

  // Exemplo de conteúdo para cozinha
  const kitchenContent = (
    <div className="p-4 bg-white text-black max-w-sm mx-auto">
      <div className="text-center font-bold text-lg mb-2 text-red-600">
        🍳 COZINHA
      </div>
      
      <div className="text-center mb-3 border-b-2 border-red-600 pb-2">
        <div className="font-bold text-xl">PEDIDO #120</div>
        <div className="text-sm text-gray-600">10/10/2023 - 13:47</div>
      </div>
      
      <div className="space-y-3">
        <div className="border-l-4 border-red-500 pl-3">
          <div className="font-bold text-lg">1x Prato especial do mo</div>
          <div className="text-sm text-gray-700">⏱️ 25-30 min</div>
          <div className="text-sm text-red-600 italic mt-1">⚠️ SEM CEbola</div>
          <div className="text-sm text-gray-600">Adicional: mofo</div>
        </div>
        
        <div className="border-l-4 border-green-500 pl-3">
          <div className="font-bold text-lg">1x Suco natural</div>
          <div className="text-sm text-gray-700">⏱️ 5 min</div>
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-300 text-center">
        <div className="text-xs text-gray-500">Via da cozinha</div>
      </div>
    </div>
  );

  const handlePrintOrder = () => {
    setContentToPrint(orderContent);
    setShowPrintModal(true);
  };

  const handlePrintKitchen = () => {
    setContentToPrint(kitchenContent);
    setShowPrintModal(true);
  };

  const handlePrintSimple = () => {
    setContentToPrint(null); // Usar window.print()
    setShowPrintModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração de Impressão</h1>
          <p className="text-gray-600">Demonstração do novo componente de configuração de impressão para o sistema</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card de impressão de comanda do cliente */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-xl">🧾</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comanda Cliente</h3>
                <p className="text-sm text-gray-600">Imprimir para o cliente</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">Pré-visualização:</div>
              <div className="text-sm text-gray-800">
                <div className="font-bold">Pedido #120</div>
                <div>Total: R$ 36,22</div>
                <div className="text-xs text-gray-600">Cliente: Maria Silva</div>
              </div>
            </div>
            
            <button
              onClick={handlePrintOrder}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Comanda
            </button>
          </div>

          {/* Card de impressão para cozinha */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-red-600 text-xl">🍳</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comanda Cozinha</h3>
                <p className="text-sm text-gray-600">Imprimir para cozinha</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">Pré-visualização:</div>
              <div className="text-sm text-gray-800">
                <div className="font-bold text-red-600">COZINHA</div>
                <div>Pedido #120</div>
                <div className="text-xs text-gray-600">2 itens para preparar</div>
              </div>
            </div>
            
            <button
              onClick={handlePrintKitchen}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Cozinha
            </button>
          </div>

          {/* Card de impressão simples */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 text-xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Impressão Simples</h3>
                <p className="text-sm text-gray-600">Configurar e imprimir página atual</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">Funcionalidade:</div>
              <div className="text-sm text-gray-800">
                <div>Abre configurações</div>
                <div>Usa window.print()</div>
                <div className="text-xs text-gray-600">Imprime página atual</div>
              </div>
            </div>
            
            <button
              onClick={handlePrintSimple}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Configurar Impressão
            </button>
          </div>
        </div>

        {/* Seção de instruções */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Como usar o componente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">1. Importar o componente:</h3>
              <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto border">
{`import PrintConfigModal from '../components/PrintConfigModal';`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">2. Adicionar o modal:</h3>
              <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto border">
{`<PrintConfigModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  contentToPrint={conteudoParaImprimir}
  title="Imprimir Pedido"
/>`}
              </pre>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">3. Propriedades disponíveis:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-800">isOpen (obrigatório)</div>
                <div className="text-blue-600">Controla a visibilidade do modal</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="font-medium text-green-800">onClose (obrigatório)</div>
                <div className="text-green-600">Função chamada ao fechar o modal</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="font-medium text-purple-800">contentToPrint (opcional)</div>
                <div className="text-purple-600">Conteúdo React para imprimir</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="font-medium text-orange-800">title (opcional)</div>
                <div className="text-orange-600">Título do modal (padrão: "Imprimir Documento")</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configuração de impressão */}
      <PrintConfigModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        contentToPrint={contentToPrint}
        title={contentToPrint ? "Configurar Impressão" : "Configurar Impressão"}
      />
    </div>
  );
};