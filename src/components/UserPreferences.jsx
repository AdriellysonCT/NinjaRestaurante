import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
const { SettingsIcon, BellIcon, SunIcon, MoonIcon, VolumeXIcon, Volume2Icon } = Icons;

export const UserPreferences = ({ isOpen, onClose, theme, toggleTheme }) => {
  const [preferences, setPreferences] = useState({
    notifications: {
      newOrders: true,
      orderUpdates: true,
      lowStock: true,
      systemUpdates: false,
      marketing: false
    },
    display: {
      theme: theme || 'dark',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true
    },
    sounds: {
      enabled: true,
      volume: 70,
      newOrderSound: true,
      completedOrderSound: true
    },
    privacy: {
      shareUsageData: false,
      allowCookies: true
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Carregar preferências do localStorage
    const savedPreferences = localStorage.getItem('fome-ninja-user-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Salvar no localStorage
      localStorage.setItem('fome-ninja-user-preferences', JSON.stringify(preferences));
      
      // Aplicar tema se mudou
      if (preferences.display.theme !== theme) {
        toggleTheme();
      }
      
      // Simular salvamento no servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Preferências salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      alert('Erro ao salvar preferências. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preferências do Usuário">
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* Notificações */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BellIcon className="w-4 h-4" />
            <h3 className="font-medium">Notificações</h3>
          </div>
          
          <div className="space-y-2 pl-6">
            {Object.entries(preferences.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm">
                  {key === 'newOrders' && 'Novos pedidos'}
                  {key === 'orderUpdates' && 'Atualizações de pedidos'}
                  {key === 'lowStock' && 'Estoque baixo'}
                  {key === 'systemUpdates' && 'Atualizações do sistema'}
                  {key === 'marketing' && 'Mensagens promocionais'}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updatePreference('notifications', key, e.target.checked)}
                  className="rounded"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            <h3 className="font-medium">Aparência</h3>
          </div>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tema</span>
              <select
                value={preferences.display.theme}
                onChange={(e) => updatePreference('display', 'theme', e.target.value)}
                className="bg-input px-2 py-1 rounded text-sm"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Tamanho da fonte</span>
              <select
                value={preferences.display.fontSize}
                onChange={(e) => updatePreference('display', 'fontSize', e.target.value)}
                className="bg-input px-2 py-1 rounded text-sm"
              >
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
              </select>
            </div>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Modo compacto</span>
              <input
                type="checkbox"
                checked={preferences.display.compactMode}
                onChange={(e) => updatePreference('display', 'compactMode', e.target.checked)}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Animações</span>
              <input
                type="checkbox"
                checked={preferences.display.showAnimations}
                onChange={(e) => updatePreference('display', 'showAnimations', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>
        </div>

        {/* Sons */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {preferences.sounds.enabled ? <Volume2Icon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
            <h3 className="font-medium">Sons</h3>
          </div>
          
          <div className="space-y-3 pl-6">
            <label className="flex items-center justify-between">
              <span className="text-sm">Habilitar sons</span>
              <input
                type="checkbox"
                checked={preferences.sounds.enabled}
                onChange={(e) => updatePreference('sounds', 'enabled', e.target.checked)}
                className="rounded"
              />
            </label>
            
            {preferences.sounds.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Volume</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={preferences.sounds.volume}
                      onChange={(e) => updatePreference('sounds', 'volume', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs w-8">{preferences.sounds.volume}%</span>
                  </div>
                </div>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm">Som de novo pedido</span>
                  <input
                    type="checkbox"
                    checked={preferences.sounds.newOrderSound}
                    onChange={(e) => updatePreference('sounds', 'newOrderSound', e.target.checked)}
                    className="rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm">Som de pedido concluído</span>
                  <input
                    type="checkbox"
                    checked={preferences.sounds.completedOrderSound}
                    onChange={(e) => updatePreference('sounds', 'completedOrderSound', e.target.checked)}
                    className="rounded"
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Privacidade */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <h3 className="font-medium">Privacidade</h3>
          </div>
          
          <div className="space-y-2 pl-6">
            <label className="flex items-center justify-between">
              <span className="text-sm">Compartilhar dados de uso</span>
              <input
                type="checkbox"
                checked={preferences.privacy.shareUsageData}
                onChange={(e) => updatePreference('privacy', 'shareUsageData', e.target.checked)}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Permitir cookies</span>
              <input
                type="checkbox"
                checked={preferences.privacy.allowCookies}
                onChange={(e) => updatePreference('privacy', 'allowCookies', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
};

export default UserPreferences;