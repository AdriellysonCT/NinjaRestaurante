import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const PrintConfig = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('client');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(() => {
    const saved = localStorage.getItem('fome-ninja-selected-printer');
    return saved || 'epson-tm-t20';
  });
  const [printSettings, setPrintSettings] = useState(() => {
    const saved = localStorage.getItem('fome-ninja-print-settings');
    return saved ? JSON.parse(saved) : {
      copies: 1,
      layout: 'Retrato',
      colorMode: 'Preto e branco',
      pages: 'Todas',
      autoPrint: false,
      paperWidth: '80mm',
      fontSize: 12,
      autoCut: true
    };
  });

  // Estado para impressoras detectadas
  const [detectedPrinters, setDetectedPrinters] = useState([
    { id: 'system-default', name: 'Impressora Padrão do Sistema', status: 'online', type: 'system' }
  ]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showDetectModal, setShowDetectModal] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Configuração de modelos por seção (agora suporta múltiplos)
  const [sectionTemplates, setSectionTemplates] = useState(() => {
    const saved = localStorage.getItem('fome-ninja-section-templates');
    return saved ? JSON.parse(saved) : {
      dashboard: ['complete'],
      mesas: ['client'],
      pdv: ['client']
    };
  });

  // Função para detectar impressoras conectadas
  const detectPrinters = async () => {
    setShowDetectModal(true);
    setIsDetecting(true);
    setDetectionMessage('Buscando impressoras conectadas...');
    
    // Simular busca (em produção, aqui você usaria uma API real)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Lista de impressoras encontradas (simulação)
      // Em produção, você pode usar Electron ou uma API nativa
      const foundPrinters = [];
      
      // Sempre manter a impressora padrão
      const defaultPrinter = {
        id: 'system-default',
        name: 'Impressora Padrão do Sistema',
        status: 'online',
        type: 'system'
      };
      
      // Simular detecção (em produção, substituir por API real)
      // Por exemplo: const printers = await window.electron.getPrinters();
      
      // Parar o loading primeiro
      setIsDetecting(false);
      
      if (foundPrinters.length > 0) {
        setDetectedPrinters([defaultPrinter, ...foundPrinters]);
        setDetectionMessage(`✅ ${foundPrinters.length} impressora(s) encontrada(s)!`);
      } else {
        setDetectedPrinters([defaultPrinter]);
        setDetectionMessage('⚠️ Nenhuma impressora adicional encontrada. Usando impressora padrão do sistema.');
      }
      
      // Fechar modal após 3 segundos para dar tempo de ler a mensagem
      setTimeout(() => {
        setShowDetectModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
      setIsDetecting(false);
      setDetectionMessage('❌ Erro ao detectar impressoras. Usando impressora padrão do sistema.');
      setDetectedPrinters([{
        id: 'system-default',
        name: 'Impressora Padrão do Sistema',
        status: 'online',
        type: 'system'
      }]);
      
      setTimeout(() => {
        setShowDetectModal(false);
      }, 3000);
    }
  };

  // Salvar preferências quando mudar
  useEffect(() => {
    localStorage.setItem('fome-ninja-section-templates', JSON.stringify(sectionTemplates));
  }, [sectionTemplates]);

  // Salvar configurações de impressora
  useEffect(() => {
    localStorage.setItem('fome-ninja-selected-printer', selectedPrinter);
  }, [selectedPrinter]);

  useEffect(() => {
    localStorage.setItem('fome-ninja-print-settings', JSON.stringify(printSettings));
  }, [printSettings]);

  // Função para alternar seleção de template
  const toggleTemplate = (section, templateId) => {
    setSectionTemplates(prev => {
      const current = prev[section] || [];
      const isSelected = current.includes(templateId);
      
      if (isSelected) {
        // Remove se já estiver selecionado
        return {
          ...prev,
          [section]: current.filter(id => id !== templateId)
        };
      } else {
        // Adiciona se não estiver selecionado
        return {
          ...prev,
          [section]: [...current, templateId]
        };
      }
    });
  };

  const templates = [
    { id: 'client', name: 'Via do Cliente', description: 'Comanda simplificada para o cliente' },
    { id: 'kitchen', name: 'Via da Cozinha', description: 'Detalhada com observações para preparo' },
    { id: 'delivery', name: 'Via do Entregador', description: 'Com endereço e dados da entrega' },
    { id: 'complete', name: 'Comanda Completa', description: 'Todos os detalhes do pedido' }
  ];

  const sections = [
    { id: 'dashboard', name: 'Dashboard / Pedidos', icon: '📊' },
    { id: 'mesas', name: 'Mesas', icon: '🪑' },
    { id: 'pdv', name: 'PDV Balcão', icon: '💰' }
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
      {/* Configuração de Impressora Térmica */}
      <div className="ninja-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-2xl">🖨️</span>
              Configuração de Impressora
            </h4>
            <p className="text-xs text-muted-foreground mt-1">Configure sua impressora térmica (80mm)</p>
          </div>
          <button
            onClick={() => setShowPrintDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Impressora Selecionada</div>
            <div className="font-bold text-foreground">
              {detectedPrinters.find(p => p.id === selectedPrinter)?.name || 'Impressora Padrão do Sistema'}
            </div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              detectedPrinters.find(p => p.id === selectedPrinter)?.status === 'online' 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {detectedPrinters.find(p => p.id === selectedPrinter)?.status === 'online' ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Largura do Papel</div>
            <div className="font-bold text-foreground">{printSettings.paperWidth || '80mm'} (Padrão Térmico)</div>
            <div className="text-xs text-muted-foreground mt-1">Ideal para comandas</div>
          </div>
        </div>
      </div>

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
          <div className="bg-white p-6 rounded shadow max-w-sm mx-auto text-xs text-gray-900 border border-gray-300 font-mono">
            {selectedTemplate === 'client' && (
              <div className="text-gray-900">
                <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
                  <div className="font-bold text-base">🥷 FOME NINJA RESTAURANTE</div>
                </div>
                <div className="text-center font-bold text-sm mb-1">PEDIDO: #1 | MESA 1</div>
                <div className="text-center text-[10px] text-gray-600 mb-2">DATA: 23/01/2026 - 03:11</div>
                <div className="border-t-2 border-b-2 border-gray-400 py-2 my-2">
                  <div className="flex justify-between font-bold text-[10px] mb-1">
                    <span>QTD  ITEM</span>
                    <span>TOTAL</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>02   Coca-Cola</span>
                    <span>R$ 11,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>01   Pastel de Carne</span>
                    <span>R$ 8,50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>01   Pizza de Chocolate</span>
                    <span>R$ 29,00</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-400 mt-2 pt-2">
                  <div className="flex justify-between font-bold">
                    <span>TOTAL DO PEDIDO:</span>
                    <span>R$ 48,50</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">FORMA PGTO: Não informado</div>
                </div>
                <div className="border-t-2 border-gray-400 mt-2 pt-2 text-center">
                  <div className="text-[10px]">Obrigado pela preferência!</div>
                  <div className="text-[10px] text-gray-600">(81) 98456-6469 | Guarabira</div>
                </div>
                <div className="border-t-2 border-dashed border-gray-400 mt-2 pt-1"></div>
              </div>
            )}
            {selectedTemplate === 'kitchen' && (
              <div className="text-gray-900">
                <div className="text-center border-b-2 border-gray-900 pb-1 mb-2">
                  <div className="font-bold text-sm">VIA COZINHA - #1</div>
                </div>
                <div className="text-[10px] mb-2">
                  <div>DATA: 23/01/2026 | HORA: 03:11</div>
                  <div className="font-bold">CLIENTE: MESA 1 (BALCÃO)</div>
                </div>
                <div className="border-t-2 border-b-2 border-gray-400 py-1 my-2">
                  <div className="font-bold text-[10px]">QTD   ITEM / DESCRIÇÃO</div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-start gap-2">
                      <span>[ ]</span>
                      <span className="font-bold">02  Coca-Cola</span>
                    </div>
                    <div className="text-[10px] text-gray-600 ml-5">OBS: _________________________________</div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <span>[ ]</span>
                      <span className="font-bold">01  Pastel de Carne</span>
                    </div>
                    <div className="text-[10px] text-gray-600 ml-5">OBS: SEM CEBOLA / BEM FRITO</div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <span>[ ]</span>
                      <span className="font-bold">01  Pizza de Chocolate</span>
                    </div>
                    <div className="text-[10px] text-gray-600 ml-5">OBS: ADICIONAL DE MORANGO</div>
                  </div>
                </div>
                <div className="border-t-2 border-gray-400 mt-3 pt-2">
                  <div className="text-[10px] font-bold">OBS. GERAL: ______________________________</div>
                </div>
                <div className="border-t-2 border-dashed border-gray-400 mt-2"></div>
              </div>
            )}
            {selectedTemplate === 'delivery' && (
              <div className="text-gray-900">
                <div className="text-center border-b-2 border-gray-900 pb-1 mb-2">
                  <div className="font-bold text-sm">VIA ENTREGA - #1</div>
                </div>
                <div className="text-[10px] mb-2">
                  <div className="font-bold">CLIENTE: MESA 1</div>
                  <div>TEL: (81) 98456-6469</div>
                </div>
                <div className="border-t-2 border-gray-400 py-2 my-2">
                  <div className="text-[10px] font-bold mb-1">ENDEREÇO: Rua Amaro Guedes, 407</div>
                  <div className="text-[10px]">BAIRRO: Nordeste 2, Guarabira</div>
                </div>
                <div className="border-t-2 border-gray-400 py-2 my-2">
                  <div className="text-[10px]">PAGAMENTO: Não informado</div>
                  <div className="text-[10px] font-bold">VALOR A RECEBER: R$ 48,50</div>
                  <div className="text-[10px]">TROCO PARA: R$ ___________</div>
                </div>
                <div className="border-t-2 border-gray-400 py-2 my-2">
                  <div className="text-[10px]">SAÍDA: ____:____  ENTREGA: ____:____</div>
                </div>
                <div className="border-t-2 border-dashed border-gray-400 mt-2"></div>
              </div>
            )}
            {selectedTemplate === 'complete' && (
              <div className="text-gray-900">
                <div className="text-center border-b-2 border-gray-900 pb-2 mb-2">
                  <div className="font-bold text-base">🥷 FOME NINJA RESTAURANTE</div>
                </div>
                <div className="text-[10px] mb-2">
                  <div className="font-bold">FENIX CARNES</div>
                  <div>Rua Amaro Guedes, 407 - Nordeste 2</div>
                  <div>Guarabira - PB</div>
                  <div>WhatsApp: (81) 98456-6469</div>
                  <div>CNPJ: 14.466.272/0001-96</div>
                </div>
                <div className="border-t-2 border-gray-400 py-2 my-2">
                  <div className="flex justify-between text-[10px]">
                    <div>
                      <div className="font-bold">PEDIDO: #1</div>
                      <div>DATA: 23/01/2026</div>
                      <div>CLIENTE: MESA 1</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">TIPO: BALCÃO</div>
                      <div>HORA: 03:11</div>
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-b-2 border-gray-400 py-1 my-2">
                  <div className="font-bold text-[10px]">ITENS DO PEDIDO</div>
                </div>
                <div className="flex justify-between font-bold text-[10px] mb-1">
                  <span>QTD  ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <div>
                      <div>02   Coca-Cola</div>
                      <div className="text-gray-600">(un: R$ 5,50)</div>
                    </div>
                    <span>R$ 11,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>01   Pastel de Carne</span>
                    <span>R$ 8,50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>01   Pizza de Chocolate</span>
                    <span>R$ 29,00</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-400 mt-2 pt-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>R$ 48,50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TAXA DE SERVIÇO:</span>
                    <span>R$ 0,00</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL:</span>
                    <span>R$ 48,50</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-400 py-2 my-2">
                  <div className="font-bold text-[10px] mb-1">PAGAMENTO</div>
                  <div className="flex justify-between text-[10px]">
                    <span>FORMA: Não informado</span>
                    <span>R$ 48,50</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-400 pt-2 text-center text-[10px]">
                  <div>Obrigado pela preferência!</div>
                  <div className="font-bold">Volte sempre ao Fome Ninja!</div>
                </div>
                <div className="border-t-2 border-dashed border-gray-400 mt-2"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configurações Adicionais */}
      <div className="ninja-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Impressão Múltipla por Seção</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione quais modelos de comanda serão impressos automaticamente em cada seção. Você pode escolher múltiplos modelos!
        </p>
        
        <div className="space-y-6">
          {sections.map(section => {
            const selectedTemplates = sectionTemplates[section.id] || [];
            const selectedCount = selectedTemplates.length;
            
            return (
              <div key={section.id} className="p-4 rounded-lg border-2 border-border hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{section.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-base">{section.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedCount === 0 && 'Nenhum modelo selecionado'}
                      {selectedCount === 1 && `1 modelo selecionado: ${templates.find(t => t.id === selectedTemplates[0])?.name}`}
                      {selectedCount > 1 && `${selectedCount} modelos selecionados`}
                    </div>
                  </div>
                  {selectedCount > 0 && (
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                      {selectedCount} {selectedCount === 1 ? 'via' : 'vias'}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map(template => {
                    const isSelected = selectedTemplates.includes(template.id);
                    
                    return (
                      <div
                        key={template.id}
                        onClick={() => toggleTemplate(section.id, template.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-border bg-input'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {template.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {template.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {selectedCount > 1 && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        Ao imprimir, serão geradas {selectedCount} comandas diferentes automaticamente
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-bold mb-1">💡 Exemplo de uso:</p>
              <p>Selecione "Via da Cozinha" + "Via do Cliente" para imprimir automaticamente 2 comandas: uma para a cozinha preparar e outra para entregar ao cliente.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Impressão */}
      <div className="ninja-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Configurações de Impressão</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Impressão Automática
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Imprimir comandas automaticamente quando o pedido for aceito (sem precisar clicar)
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={printSettings.autoPrint || false}
                onChange={(e) => {
                  const newSettings = { ...printSettings, autoPrint: e.target.checked };
                  setPrintSettings(newSettings);
                  localStorage.setItem('fome-ninja-auto-print-enabled', JSON.stringify(e.target.checked));
                }}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Número de vias</div>
              <div className="text-xs text-muted-foreground">Quantidade de cópias para cada modelo selecionado</div>
            </div>
            <select 
              className="bg-input px-3 py-1 rounded text-sm"
              value={printSettings.copies || 1}
              onChange={(e) => {
                const newSettings = { ...printSettings, copies: parseInt(e.target.value) };
                setPrintSettings(newSettings);
                localStorage.setItem('fome-ninja-print-copies', e.target.value);
              }}
            >
              <option value="1">1 via</option>
              <option value="2">2 vias</option>
              <option value="3">3 vias</option>
            </select>
          </div>
        </div>
        
        {printSettings.autoPrint && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-bold mb-1">✅ Impressão Automática Ativada!</p>
                <p>As comandas selecionadas serão impressas automaticamente quando você aceitar um pedido no Dashboard.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Moderno de Configuração de Impressora - COM PORTAL */}
      {showPrintDialog && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}>
          <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Configurar Impressora</h3>
                    <p className="text-xs text-muted-foreground">Impressora Térmica 80mm</p>
                  </div>
                </div>
                <button 
                  onClick={handleCancelPrint}
                  className="w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Seleção de Impressora */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Impressora Térmica
                  </label>
                  {isDetecting && (
                    <span className="text-xs text-primary animate-pulse">Detectando...</span>
                  )}
                </div>
                <select 
                  className="w-full bg-input text-foreground border-2 border-border hover:border-primary/50 focus:border-primary rounded-lg p-3 text-sm transition-colors"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  disabled={isDetecting}
                >
                  {detectedPrinters.map(printer => (
                    <option key={printer.id} value={printer.id}>
                      {printer.name} {printer.status === 'online' ? '✓' : '✗'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {detectedPrinters.find(p => p.id === selectedPrinter)?.status === 'online' 
                    ? '✅ Impressora conectada e pronta' 
                    : '⚠️ Impressora offline ou desconectada'}
                </p>
              </div>

              {/* Botão Detectar Impressora */}
              <div>
                <button
                  onClick={detectPrinters}
                  disabled={isDetecting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {isDetecting ? 'Detectando...' : 'Detectar Impressora'}
                </button>
              </div>

              {/* Largura do Papel */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Largura do Papel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['58mm', '80mm'].map(width => (
                    <button
                      key={width}
                      onClick={() => setPrintSettings({...printSettings, paperWidth: width})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        printSettings.paperWidth === width || (width === '80mm' && !printSettings.paperWidth)
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {width}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  80mm é o padrão para a maioria das impressoras térmicas
                </p>
              </div>

              {/* Corte Automático */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <div className="font-medium text-sm text-foreground">Corte Automático</div>
                  <div className="text-xs text-muted-foreground">Cortar papel após impressão</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={printSettings.autoCut !== false}
                    onChange={(e) => setPrintSettings({...printSettings, autoCut: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Tamanho da Fonte */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tamanho da Fonte
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="10" 
                    max="16" 
                    step="1"
                    value={printSettings.fontSize || 12}
                    onChange={(e) => setPrintSettings({...printSettings, fontSize: parseInt(e.target.value)})}
                    className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-bold text-primary w-12 text-center">
                    {printSettings.fontSize || 12}px
                  </span>
                </div>
              </div>

              {/* Teste de Impressão */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-bold mb-1">💡 Dica</p>
                    <p>Faça um teste de impressão para verificar se está tudo configurado corretamente.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-secondary/20 border-t border-border flex gap-3">
              <button
                onClick={handleCancelPrint}
                className="flex-1 px-4 py-3 border-2 border-border text-foreground rounded-lg hover:bg-secondary transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handlePrint();
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 3000);
                }}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-bold shadow-lg"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Detecção de Impressora - ELEGANTE */}
      {showDetectModal && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          <div 
            className="bg-gradient-to-br from-card via-card to-card/95 border-2 border-primary/40 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-scaleIn" 
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {isDetecting ? (
              // Estado de Loading
              <div className="p-12 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {/* Círculo externo pulsante */}
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  {/* Círculo do meio */}
                  <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse"></div>
                  {/* Ícone de impressora no centro */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-3 animate-pulse">
                  Detectando Impressoras
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aguarde enquanto procuramos por impressoras conectadas...
                </p>
                
                {/* Barra de progresso animada */}
                <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary via-primary/70 to-primary rounded-full animate-progress"></div>
                </div>
              </div>
            ) : (
              // Estado de Resultado
              <div className="p-10 text-center">
                {/* Ícone de resultado com animação */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {detectionMessage.includes('✅') ? (
                    <>
                      {/* Sucesso - Verde */}
                      <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 animate-scaleIn">
                        <svg className="w-14 h-14 text-white animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Aviso - Amarelo */}
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50 animate-scaleIn">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Título */}
                <h3 className="text-2xl font-bold text-foreground mb-3 animate-slideUp">
                  {detectionMessage.includes('✅') ? '🎉 Impressoras Encontradas!' : '⚠️ Detecção Concluída'}
                </h3>
                
                {/* Mensagem */}
                <div className="bg-secondary/30 border border-border rounded-xl p-4 mb-4 animate-slideUp">
                  <p className="text-sm text-foreground font-medium">
                    {detectionMessage.replace('✅', '').replace('⚠️', '').trim()}
                  </p>
                </div>
                
                {/* Lista de impressoras (se encontrou) */}
                {detectionMessage.includes('✅') && detectedPrinters.length > 1 && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 animate-slideUp">
                    <div className="text-xs font-bold text-green-800 dark:text-green-200 mb-2">
                      Impressoras Detectadas:
                    </div>
                    {detectedPrinters.slice(1).map((printer, index) => (
                      <div key={printer.id} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 py-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {printer.name}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Informação adicional */}
                <div className="mt-4 text-xs text-muted-foreground animate-slideUp">
                  Este modal fechará automaticamente em alguns segundos...
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      
      {/* Estilos CSS para animações customizadas */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes checkmark {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        
        .animate-checkmark {
          animation: checkmark 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Toast de Sucesso Moderno */}
      {showSuccessToast && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <div 
          className="fixed top-4 right-4 z-[9999999] animate-slideInRight"
          style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999999 }}
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border-2 border-green-400">
            {/* Ícone de sucesso animado */}
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-scaleIn">
              <svg className="w-7 h-7 text-white animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Conteúdo */}
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">Sucesso!</h4>
              <p className="text-sm text-white/90">Configurações salvas com sucesso</p>
            </div>
            
            {/* Botão fechar */}
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Barra de progresso */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <div className="h-full bg-white/40 animate-shrink" style={{ animationDuration: '3s' }}></div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Estilos adicionais para o toast */}
      <style jsx>{`
        @keyframes slideInRight {
          from { 
            transform: translateX(400px);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-shrink {
          animation: shrink linear;
        }
      `}</style>
    </div>
  );
};

export default PrintConfig;