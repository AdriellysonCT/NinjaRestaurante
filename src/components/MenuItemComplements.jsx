import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './ui/Modal';
import complementsService from '../services/complementsService';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';

// Função auxiliar para normalizar dados do banco
const normalizeGroup = (group) => ({
  id: group.id,
  name: group.nome || group.name,
  description: group.descricao || group.description,
  selectionType: group.tipo_selecao || group.selectionType,
  required: group.obrigatorio !== undefined ? group.obrigatorio : group.required
});

const normalizeComplement = (complement) => ({
  id: complement.id,
  name: complement.nome || complement.name,
  price: complement.preco || complement.price,
  available: complement.disponivel !== undefined ? complement.disponivel : complement.available,
  image: complement.imagem || complement.imagem_url || complement.image,
  groupIds: complement.groupIds || []
});

// TELA 3 - Associação de Complementos a um Item do Cardápio
const MenuItemComplements = ({ menuItem, groups, complements, onSave }) => {
  const [activeGroups, setActiveGroups] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedComplements, setSelectedComplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  
  // Normalizar dados
  const normalizedGroups = groups.map(normalizeGroup);
  const normalizedComplements = complements.map(normalizeComplement);

  // Carregar grupos ativos do banco quando o componente montar
  useEffect(() => {
    loadMenuItemGroups();
  }, [menuItem.id]);

  const loadMenuItemGroups = async () => {
    if (!menuItem.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Carregando grupos do item:', menuItem.id);
      
      // Buscar grupos associados ao item
      const groupsResult = await complementsService.getMenuItemGroups(menuItem.id);
      
      if (groupsResult.success && groupsResult.data) {
        // Mapear os dados do banco para o formato esperado
        const loadedGroups = groupsResult.data.map(item => {
          const groupId = item.grupo_id;
          
          // Buscar todos os complementos deste grupo
          // (não há seleção específica, todos os complementos do grupo estão disponíveis)
          const groupComplements = normalizedComplements.filter(c => 
            c.groupIds?.includes(groupId)
          );
          const complementIds = groupComplements.map(c => c.id);
          
          return {
            groupId,
            complementIds
          };
        });

        console.log('✅ Grupos carregados:', loadedGroups);
        setActiveGroups(loadedGroups);
      } else {
        console.log('ℹ️ Nenhum grupo associado ao item');
        setActiveGroups([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar grupos do item:', error);
      setActiveGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug: ver o que está sendo recebido
  console.log('🔍 MenuItemComplements Debug:');
  console.log('  Groups recebidos:', groups.length);
  console.log('  Complementos recebidos:', complements.length);
  console.log('  Groups normalizados:', normalizedGroups);
  console.log('  Complementos normalizados:', normalizedComplements);
  console.log('  Active groups:', activeGroups);

  // Abrir modal para gerenciar complementos de um grupo
  const handleManageGroup = (group) => {
    setSelectedGroup(group);
    const groupData = activeGroups.find(g => g.groupId === group.id);
    setSelectedComplements(groupData?.complementIds || []);
    setIsGroupModalOpen(true);
  };

  // Toggle de ativação do grupo no item
  const handleToggleGroup = (groupId) => {
    const isActive = activeGroups.some(g => g.groupId === groupId);
    
    if (isActive) {
      setActiveGroups(activeGroups.filter(g => g.groupId !== groupId));
    } else {
      setActiveGroups([...activeGroups, { groupId, complementIds: [] }]);
    }
  };

  // Salvar seleção de complementos do grupo
  const handleSaveGroupComplements = () => {
    setActiveGroups(activeGroups.map(g => 
      g.groupId === selectedGroup.id 
        ? { ...g, complementIds: selectedComplements }
        : g
    ));
    setIsGroupModalOpen(false);
  };

  // Toggle de complemento dentro do modal
  const handleToggleComplement = (complementId) => {
    if (selectedComplements.includes(complementId)) {
      setSelectedComplements(selectedComplements.filter(id => id !== complementId));
    } else {
      setSelectedComplements([...selectedComplements, complementId]);
    }
  };

  // Salvar todas as alterações no banco
  const handleSaveAll = async () => {
    // Verificar se o ID é um UUID válido (padrão Supabase)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(menuItem.id);
    
    if (!menuItem.id || !isUUID) {
      console.error('❌ Item sem ID válido (UUID necessário), não é possível salvar complementos:', menuItem.id);
      addToast('Por favor, salve primeiro as informações básicas do item antes de gerenciar complementos.', 'error');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Salvando complementos do item:', menuItem.id);
      console.log('📦 Grupos ativos:', activeGroups);

      // Passar os dados completos (grupos + complementos selecionados)
      const result = await complementsService.associateGroupsToMenuItem(menuItem.id, activeGroups);

      if (result.success) {
        console.log('✅ Complementos salvos com sucesso!');
        addToast('Complementos salvos com sucesso!', 'success');
        // Notificar o componente pai
        onSave({ ...menuItem, complementGroups: activeGroups });
      } else {
        console.error('❌ Erro ao salvar complementos:', result.error);
        addToast('Erro ao salvar: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar complementos:', error);
      addToast('Erro ao salvar complementos', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Obter complementos de um grupo
  const getGroupComplements = (groupId) => {
    return normalizedComplements.filter(c => c.groupIds?.includes(groupId));
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="space-y-6">
      {/* Card do Item */}
      <div className="ninja-card p-6">
        <div className="flex items-center gap-4">
          <img 
            src={menuItem.image || `https://placehold.co/120x120/1a1a1a/ff6f00?text=${encodeURIComponent(menuItem.name.substring(0, 8))}`}
            alt={menuItem.name}
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{menuItem.name}</h2>
            <p className="text-sm text-gray-400 mb-2">{menuItem.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-[#ff6f00]">R$ {menuItem.price.toFixed(2)}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-[hsla(0,0%,20%,1)] text-gray-300">
                {menuItem.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Complementos Disponíveis */}
      <div className="ninja-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Complementos Disponíveis</h3>
            <p className="text-sm text-gray-400">
              Ative os grupos de complementos que estarão disponíveis para este item
            </p>
          </div>
          <button 
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="px-6 py-2 rounded-md bg-[#ff6f00] text-white font-semibold hover:bg-[#ff8c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {/* Lista de Grupos */}
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-8 text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6f00]"></div>
              <p className="mt-4">Carregando...</p>
            </div>
          )}
          {!loading && normalizedGroups.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum grupo de complementos disponível.</p>
              <p className="text-sm mt-2">Crie grupos na seção de Complementos primeiro.</p>
            </div>
          )}
          {!loading && normalizedGroups.map(group => {
            const isActive = activeGroups.some(g => g.groupId === group.id);
            const groupData = activeGroups.find(g => g.groupId === group.id);
            const selectedCount = groupData?.complementIds.length || 0;
            const totalCount = getGroupComplements(group.id).length;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isActive 
                    ? 'bg-[hsla(25,95%,53%,0.1)] border-[#ff6f00]' 
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive}
                        onChange={() => handleToggleGroup(group.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff6f00]"></div>
                    </label>

                    {/* Info do Grupo */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white">{group.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          group.required 
                            ? 'bg-[hsla(25,95%,53%,0.2)] text-[#ff6f00]' 
                            : 'bg-[hsla(0,0%,20%,1)] text-gray-400'
                        }`}>
                          {group.required ? 'Obrigatório' : 'Opcional'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-[hsla(0,0%,20%,1)] text-gray-300">
                          {group.selectionType === 'single' ? 'Seleção Única' : 'Múltipla'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{group.description}</p>
                      {isActive && (
                        <p className="text-xs text-[#ff6f00] mt-2">
                          {selectedCount} de {totalCount} complementos selecionados
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botão Gerenciar */}
                  {isActive && (
                    <button 
                      onClick={() => handleManageGroup(group)}
                      className="px-4 py-2 rounded-md bg-[#2a2a2a] text-white font-semibold hover:bg-[#3a3a3a] transition-colors text-sm"
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}


        </div>
      </div>

      {/* Modal - Selecionar Complementos do Grupo */}
      <Modal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
        title={`Selecionar Complementos - ${selectedGroup?.name}`}
        size="lg"
      >
        {selectedGroup && (
          <div className="space-y-4">
            {/* Info do Grupo */}
            <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedGroup.required 
                    ? 'bg-[hsla(25,95%,53%,0.2)] text-[#ff6f00]' 
                    : 'bg-[hsla(0,0%,20%,1)] text-gray-400'
                }`}>
                  {selectedGroup.required ? 'Obrigatório' : 'Opcional'}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-[hsla(0,0%,20%,1)] text-gray-300">
                  {selectedGroup.selectionType === 'single' ? 'Cliente escolhe 1' : 'Cliente escolhe vários'}
                </span>
              </div>
              <p className="text-sm text-gray-400">{selectedGroup.description}</p>
            </div>

            {/* Lista de Complementos */}
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Selecione quais complementos deste grupo estarão disponíveis:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getGroupComplements(selectedGroup.id).map(complement => (
                  <label 
                    key={complement.id}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                      selectedComplements.includes(complement.id)
                        ? 'bg-[hsla(25,95%,53%,0.1)] border-2 border-[#ff6f00]'
                        : 'bg-[#1a1a1a] border-2 border-[#2a2a2a] hover:border-[#3a3a3a]'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedComplements.includes(complement.id)}
                      onChange={() => handleToggleComplement(complement.id)}
                      className="w-5 h-5 rounded border-gray-600 bg-[#0d0d0d] text-[#ff6f00] focus:ring-[#ff6f00]"
                    />
                    <img 
                      src={complement.image || `https://placehold.co/60x60/1a1a1a/ff6f00?text=${encodeURIComponent(complement.name.substring(0, 3))}`}
                      alt={complement.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{complement.name}</p>
                      <p className="text-sm font-bold text-[#ff6f00]">+ R$ {complement.price.toFixed(2)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      complement.available 
                        ? 'bg-[hsla(142,76%,36%,0.2)] text-[hsl(142,76%,36%)]' 
                        : 'bg-[hsla(0,84%,60%,0.2)] text-[hsl(0,84%,60%)]'
                    }`}>
                      {complement.available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </label>
                ))}
                {getGroupComplements(selectedGroup.id).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Nenhum complemento associado a este grupo.</p>
                    <p className="text-sm mt-2">Adicione complementos ao grupo primeiro.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => setIsGroupModalOpen(false)} 
                className="flex-1 py-3 text-sm font-semibold rounded-md bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveGroupComplements} 
                className="flex-1 py-3 text-sm font-semibold rounded-md bg-[#ff6f00] text-white hover:bg-[#ff8c00] transition-colors"
              >
                Salvar Seleção
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </>
  );
};

export default MenuItemComplements;
