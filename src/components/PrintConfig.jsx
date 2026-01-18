import React, { useState } from 'react';

const PrintConfig = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('client');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState('epson');
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    layout: 'Retrato',
    colorMode: 'Colorido',
    pages: 'Todas'
  });

  const templates = [
    { id: 'client', name: 'Via do Cliente', description: 'Comanda simplificada para o cliente' },
    { id: 'kitchen', name: 'Via da Cozinha', description: 'Detalhada com observações para preparo' },
    { id: 'delivery', name: 'Via do Entregador', description: 'Com endereço e dados da entrega' },
    { id: 'complete', name: 'Comanda Completa', description: 'Todos os detalhes do pedido' }
  ];

  const printers = [
    { id: 'epson', name: 'EPSON L3250 Series', status: 'online' },
    { id: 'hp', name: 'HP LaserJet Pro', status: 'offline' }
  ];

  const handleTestPrint = () => {
    setShowPrintDialog(true);
  };

  const handlePrint = () => {
    console.log('Imprimindo com configurações:', printSettings);
    setShowPrintDialog(false);
  };

  const handleCancelPrint = () => {
    setShowPrintDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Templates de Impressão */}
      <div className="ninja-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Modelos de Comanda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="text-sm font-medium text-foreground">{template.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pré-visualização */}
      <div className="ninja-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Pré-visualização</h4>
        <div className="bg-secondary/50 p-4 rounded-lg">
          <div className="bg-white p-4 rounded shadow max-w-sm mx-auto text-xs text-gray-900 border border-gray-300">
            {selectedTemplate === 'client' && (
              <div className="text-gray-900">
                <div className="text-center font-bold text-lg">Mr. Burger</div>
                <div className="text-center font-semibold">Pedido #120</div>
                <div className="text-center text-xs text-gray-600">10/10/2023 - 13:47</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1">1x Prato especial do mo R$25.90</div>
                <div className="py-1">1x Suco natural R$9.90</div>
                <hr className="my-2 border-gray-400" />
                <div className="text-right font-bold text-lg">Total: R$36.22</div>
                <div className="text-center text-xs mt-3 text-gray-600 font-medium bg-gray-100 py-1 rounded">Via do cliente</div>
              </div>
            )}
            {selectedTemplate === 'kitchen' && (
              <div className="text-gray-900">
                <div className="text-center font-bold text-lg">Mr. Burger</div>
                <div className="text-center font-semibold">Pedido #120 - Cozinha</div>
                <div className="text-center text-xs text-gray-600">10/10/2023 - 13:47</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1 font-semibold">1x Prato especial do mo R$25.90</div>
                <div className="py-1 text-sm ml-2 text-gray-700">- Adicional de mofo (R$1.00)</div>
                <div className="py-1 text-sm ml-2 text-gray-700 italic">Obs: Nilo color cebola</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1 font-semibold">1x Suco natural R$9.90</div>
                <hr className="my-2 border-gray-400" />
                <div className="text-right font-bold text-lg">Total R$36.22</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800">Observações:</div>
                <div className="text-sm text-gray-700 italic">Nilo precisa incular talheres. Por gentileza buzinar quando chegar.</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800">Entrega</div>
                <div className="text-sm">Avenida Brasil, 100</div>
                <div className="text-sm">Centro - São Paulo, SP</div>
                <div className="text-sm">CEP 01015-100</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800">Cliente</div>
                <div className="text-sm">Maria Silva</div>
                <div className="text-sm">(99) 9999 9999</div>
                <div className="text-xs text-gray-600">Pedido realizado via Hubt</div>
                <div className="text-center text-xs mt-3 text-gray-600 font-medium bg-gray-100 py-1 rounded">Via da cozinha</div>
              </div>
            )}
            {selectedTemplate === 'delivery' && (
              <div className="text-gray-900">
                <div className="text-center font-bold text-lg">Mr. Burger</div>
                <div className="text-center font-semibold">Pedido #120</div>
                <div className="text-center text-xs text-gray-600">10/10/2023 - 13:47</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1 font-semibold">1x Prato especial do mo R$25.90</div>
                <div className="py-1 text-sm ml-2 text-gray-700">- Adicional de mofo (R$1.00)</div>
                <div className="py-1 text-sm ml-2 text-gray-700 italic">Obs: Nilo color cebola</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1 font-semibold">1x Suco natural R$9.90</div>
                <div className="py-1 text-sm text-gray-700 italic">Obs: Nilo precisa incular talheres. Por gentileza buzinar quando chegar.</div>
                <hr className="my-2 border-gray-400" />
                <div className="text-right font-bold text-lg">Total: R$36.22</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800 bg-yellow-50 p-2 rounded">ENDEREÇO PARA ENTREGA:</div>
                <div className="text-sm mt-1">Avenida Brasil, 100</div>
                <div className="text-sm">Centro - São Paulo, SP</div>
                <div className="text-sm">CEP 01015-100</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800">Cliente: Maria Silva</div>
                <div className="text-sm">(99) 9999 9999</div>
                <div className="text-xs text-gray-600">Pedido realizado via Hubt</div>
                <div className="text-center text-xs mt-3 text-gray-600 font-medium bg-gray-100 py-1 rounded">Via do entregador</div>
              </div>
            )}
            {selectedTemplate === 'complete' && (
              <div className="text-gray-900">
                <div className="text-center font-bold text-lg">Mr. Burger</div>
                <div className="text-center font-semibold">Pedido #120</div>
                <div className="text-center text-xs text-gray-600">10/10/2023 - 13:47</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1 font-semibold">1x Prato especial do mo R$25.90</div>
                <div className="py-1 text-sm ml-2 text-gray-700">- Adicional de mofo (R$1.00)</div>
                <div className="py-1 text-sm ml-2 text-gray-700 italic">Obs: Nilo color cebola</div>
                <hr className="my-2 border-gray-400" />
                <div className="py-1 font-semibold">1x Suco natural R$9.90</div>
                <div className="py-1 text-sm text-gray-700 italic">Obs: Nilo precisa incular talheres. Por gentileza buzinar quando chegar.</div>
                <hr className="my-2 border-gray-400" />
                <div className="text-right font-bold text-lg">Total: R$36.22</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800 bg-blue-50 p-2 rounded">DADOS DO CLIENTE:</div>
                <div className="text-sm mt-1">Cliente: Maria Silva</div>
                <div className="text-sm">(99) 9999 9999</div>
                <div className="text-sm">Forma de pagamento: Cartão</div>
                <hr className="my-2 border-gray-400" />
                <div className="font-semibold text-gray-800 bg-green-50 p-2 rounded">ENDEREÇO DE ENTREGA:</div>
                <div className="text-sm mt-1">Entrega em Avenida Brasil, 100</div>
                <div className="text-sm">Centro - São Paulo, SP</div>
                <div className="text-sm">CEP 01015-100</div>
                <hr className="my-2 border-gray-400" />
                <div className="text-xs text-gray-600">Pedido realizado via Hubt</div>
                <div className="text-center text-xs mt-3 text-gray-600 font-medium bg-gray-100 py-1 rounded">Via do cliente</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configurações Adicionais */}
      <div className="ninja-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Configurações Adicionais</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Imprimir automaticamente</div>
              <div className="text-xs text-muted-foreground">Imprimir comanda assim que o pedido for confirmado</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Número de vias</div>
              <div className="text-xs text-muted-foreground">Quantidade de cópias para cada impressão</div>
            </div>
            <select className="bg-input px-3 py-1 rounded text-sm">
              <option value="1">1 via</option>
              <option value="2">2 vias</option>
              <option value="3">3 vias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diálogo de Impressão Windows-like */}
      {showPrintDialog && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground w-full max-w-sm rounded-lg shadow-lg overflow-hidden border border-border">
            <div className="p-4 flex justify-between items-center border-b border-border">
              <h3 className="text-lg font-medium">Imprimir</h3>
              <div className="text-sm text-muted-foreground">6 folhas de papel</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm">Destino</div>
                <div className="flex-1 ml-4">
                  <select className="w-full bg-input text-foreground border border-input rounded p-2 text-sm">
                    <option>{printers.find(p => p.id === selectedPrinter)?.name || 'EPSON L3250 Series'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Páginas</div>
                <div className="flex-1 ml-4">
                  <select 
                    className="w-full bg-input text-foreground border border-input rounded p-2 text-sm"
                    value={printSettings.pages}
                    onChange={(e) => setPrintSettings({...printSettings, pages: e.target.value})}
                  >
                    <option>Todas</option>
                    <option>Seleção</option>
                    <option>Atual</option>
                    <option>Personalizado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Cópias</div>
                <div className="flex-1 ml-4">
                  <input 
                    type="number" 
                    className="w-full bg-input text-foreground border border-input rounded p-2 text-sm" 
                    value={printSettings.copies}
                    onChange={(e) => setPrintSettings({...printSettings, copies: Number(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Layout</div>
                <div className="flex-1 ml-4">
                  <select 
                    className="w-full bg-input text-foreground border border-input rounded p-2 text-sm"
                    value={printSettings.layout}
                    onChange={(e) => setPrintSettings({...printSettings, layout: e.target.value})}
                  >
                    <option>Retrato</option>
                    <option>Paisagem</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Colorido</div>
                <div className="flex-1 ml-4">
                  <select 
                    className="w-full bg-input text-foreground border border-input rounded p-2 text-sm"
                    value={printSettings.colorMode}
                    onChange={(e) => setPrintSettings({...printSettings, colorMode: e.target.value})}
                  >
                    <option>Colorido</option>
                    <option>Preto e branco</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Mais definições</div>
                <div className="flex-1 ml-4 text-right">
                  <button className="text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-end space-x-2 border-t border-border">
              <button 
                onClick={handlePrint}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded shadow-sm transition-colors"
              >
                Imprimir
              </button>
              <button 
                onClick={handleCancelPrint}
                className="bg-transparent border border-input text-foreground px-4 py-2 rounded hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintConfig;