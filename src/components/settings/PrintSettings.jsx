import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import * as Icons from '../icons/index.jsx';
import { printService } from '../../services/printService';

export const PrintSettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(printService.getPrintSettings());
  const [printers, setPrinters] = useState([]);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(printService.isAutoPrintEnabled());

  // Carregar impressoras automaticamente ao abrir
  const loadPrinters = useCallback(async () => {
    setLoadingPrinters(true);
    try {
      const availablePrinters = await printService.getAvailablePrinters();
      setPrinters(availablePrinters);
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
    } finally {
      setLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Carregar impressoras automaticamente quando o modal abrir
      loadPrinters();
      setAutoPrintEnabled(printService.isAutoPrintEnabled());
    }
  }, [isOpen, loadPrinters]);

  const handleRefreshPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const refreshedPrinters = await printService.refreshPrinters();
      setPrinters(refreshedPrinters);
      setMessage({ type: 'success', text: 'Lista de impressoras atualizada!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar impressoras' });
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleToggleAutoPrint = () => {
    const newValue = !autoPrintEnabled;
    const result = printService.setAutoPrintEnabled(newValue);
    if (result.success) {
      setAutoPrintEnabled(newValue);
      setMessage({ 
        type: 'success', 
        text: newValue ? 'Impressão automática ativada!' : 'Impressão automática desativada!' 
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    try {
      const result = await printService.updatePrintSettings(settings);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Configurações salvas com sucesso!'
        });
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao salvar configurações: ' + error.message
      });
    }
  };

  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      try {
        const result = await printService.resetPrintSettings();
        
        if (result.success) {
          setSettings(result.settings);
          setMessage({
            type: 'success',
            text: 'Configurações restauradas com sucesso!'
          });
          
          // Limpar mensagem após 3 segundos
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        } else {
          setMessage({
            type: 'error',
            text: result.message
          });
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Erro ao restaurar configurações: ' + error.message
        });
      }
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanyInfoChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações de Impressão">
      <div className="space-y-4">
        {/* Abas */}
        <div className="flex border-b border-border overflow-x-auto">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('general')}
          >
            Geral
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'layout' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('layout')}
          >
            Layout
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'company' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('company')}
          >
            Empresa
          </button>
        </div>

        {/* Configurações Gerais */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Impressora</label>
                <button
                  onClick={handleRefreshPrinters}
                  disabled={loadingPrinters}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  {loadingPrinters ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <span>🔄</span>
                  )}
                  Atualizar
                </button>
              </div>
              <select 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.printerName}
                onChange={(e) => handleChange('printerName', e.target.value)}
              >
                {loadingPrinters ? (
                  <option>Carregando impressoras...</option>
                ) : printers.length === 0 ? (
                  <option>Nenhuma impressora encontrada</option>
                ) : (
                  printers.map(printer => (
                    <option key={printer.id} value={printer.name}>
                      {printer.name} {printer.isDefault ? '(Padrão)' : ''} {printer.isThermal ? '🖨️' : ''}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                💡 As impressoras disponíveis serão mostradas no diálogo de impressão do sistema
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Número de Cópias</label>
              <input 
                type="number" 
                min="1"
                max="10"
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.copies}
                onChange={(e) => handleChange('copies', parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="autocut" 
                checked={settings.autocut}
                onChange={(e) => handleChange('autocut', e.target.checked)}
              />
              <label htmlFor="autocut" className="text-sm">Corte automático</label>
            </div>
            
            {/* Impressão automática ao aceitar */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Impressão automática</div>
                  <div className="text-xs text-muted-foreground">
                    Imprimir comanda automaticamente ao aceitar pedido
                  </div>
                </div>
                <button
                  onClick={handleToggleAutoPrint}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoPrintEnabled ? 'bg-primary' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoPrintEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configurações de Layout */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Largura do Papel (mm)</label>
              <input 
                type="number" 
                min="58"
                max="80"
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.paperWidth}
                onChange={(e) => handleChange('paperWidth', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tamanho da Fonte</label>
              <input 
                type="number" 
                min="8"
                max="16"
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Cabeçalho</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.header}
                onChange={(e) => handleChange('header', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Rodapé</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.footer}
                onChange={(e) => handleChange('footer', e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showLogo" 
                checked={settings.showLogo}
                onChange={(e) => handleChange('showLogo', e.target.checked)}
              />
              <label htmlFor="showLogo" className="text-sm">Mostrar logo</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showQRCode" 
                checked={settings.showQRCode}
                onChange={(e) => handleChange('showQRCode', e.target.checked)}
              />
              <label htmlFor="showQRCode" className="text-sm">Mostrar QR Code</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showItemPrice" 
                checked={settings.showItemPrice}
                onChange={(e) => handleChange('showItemPrice', e.target.checked)}
              />
              <label htmlFor="showItemPrice" className="text-sm">Mostrar preço dos itens</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showTimestamp" 
                checked={settings.showTimestamp}
                onChange={(e) => handleChange('showTimestamp', e.target.checked)}
              />
              <label htmlFor="showTimestamp" className="text-sm">Mostrar data e hora</label>
            </div>
          </div>
        )}

        {/* Configurações da Empresa */}
        {activeTab === 'company' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.companyInfo.name}
                onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.companyInfo.address}
                onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.companyInfo.phone}
                onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.companyInfo.cnpj}
                onChange={(e) => handleCompanyInfoChange('cnpj', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">URL do Logo</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={settings.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Mensagem de feedback */}
        {message && (
          <div className={`text-sm p-2 rounded-md ${
            message.type === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {message.text}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2 pt-4">
          <button 
            onClick={handleReset}
            className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Restaurar Padrão
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </Modal>
  );
};