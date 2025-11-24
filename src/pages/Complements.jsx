import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../components/ui/Modal';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import complementsService from '../services/complementsService';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';

// TELA 1 - Lista de Complementos
const ComplementCard = ({ complement, onEdit, onToggle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ninja-card overflow-hidden"
    >
      <div className="relative">
        <img 
          src={complement.image || `https://placehold.co/200x150/1a1a1a/ff6f00?text=${encodeURIComponent(complement.name.substring(0, 8))}`}
          alt={complement.name} 
          className="w-full h-32 object-cover"
          onError={(e) => {
            e.target.src = `https://placehold.co/200x150/1a1a1a/ff6f00?text=${encodeURIComponent(complement.name.substring(0, 8))}`;
          }}
        />
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-card-foreground text-sm">{complement.nome || complement.name}</h3>
          <p className="font-bold text-[#ff6f00] text-sm">R$ {(complement.preco || complement.price || 0).toFixed(2)}</p>
        </div>
        {(complement.descricao || complement.description) && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{complement.descricao || complement.description}</p>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            (complement.status === 'disponivel' || complement.available)
              ? 'bg-[hsla(142,76%,36%,0.2)] text-[hsl(142,76%,36%)]' 
              : 'bg-[hsla(0,84%,60%,0.2)] text-[hsl(0,84%,60%)]'
          }`}>
            {(complement.status === 'disponivel' || complement.available) ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(complement)}
            className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors"
          >
            Editar
          </button>
          <button 
            onClick={() => onToggle(complement.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              (complement.status === 'disponivel' || complement.available)
                ? 'bg-[hsla(0,84%,60%,0.1)] text-[hsl(0,84%,60%)] hover:bg-[hsla(0,84%,60%,0.2)]' 
                : 'bg-[hsla(142,76%,36%,0.1)] text-[hsl(142,76%,36%)] hover:bg-[hsla(142,76%,36%,0.2)]'
            }`}
          >
            {(complement.status === 'disponivel' || complement.available) ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// TELA 2 - Card de Grupo
const GroupCard = ({ group, onEdit, onManage, complementsCount }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="ninja-card p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-card-foreground">{group.name}</h3>
            {group.section && (
              <span className="text-xs px-2 py-1 rounded-full bg-[hsla(220,70%,50%,0.2)] text-blue-400">
                {group.section}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              group.required 
                ? 'bg-[hsla(25,95%,53%,0.2)] text-[#ff6f00]' 
                : 'bg-[hsla(0,0%,50%,0.2)] text-gray-400'
            }`}>
              {group.required ? 'Obrigatório' : 'Opcional'}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-[hsla(0,0%,20%,1)] text-gray-300">
              {group.selectionType === 'single' ? 'Seleção Única' : 'Múltipla Seleção'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
          <p className="text-xs text-gray-400">
            {complementsCount} complemento{complementsCount !== 1 ? 's' : ''} associado{complementsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button 
            onClick={() => onEdit(group)}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors"
          >
            Editar Grupo
          </button>
          <button 
            onClick={() => onManage(group)}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-[#ff6f00] text-white hover:bg-[#ff8c00] transition-colors"
          >
            Gerenciar Complementos
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Complements = () => {
  const { restauranteId, restaurante } = useAuth();  // ✅ Pegar do contexto de autenticação
  const toast = useToast();  // ✅ Hook de notificações
  const [activeTab, setActiveTab] = useState('complements'); // 'complements' ou 'groups'
  const [complements, setComplements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchComplementTerm, setSearchComplementTerm] = useState(''); // ✅ Novo: busca no modal
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [isComplementModalOpen, setIsComplementModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [currentComplement, setCurrentComplement] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Debug: ver o que está vindo do contexto
  useEffect(() => {
    console.log('🔍 Debug Complements:');
    console.log('  restauranteId:', restauranteId);
    console.log('  restaurante:', restaurante);
    console.log('  localStorage:', localStorage.getItem('restaurante_id'));
  }, [restauranteId, restaurante]);

  // Pegar restauranteId com fallback
  const getRestauranteId = () => {
    return restauranteId || restaurante?.id || localStorage.getItem('restaurante_id');
  };

  // Carregar dados quando restauranteId estiver disponível
  useEffect(() => {
    const id = getRestauranteId();
    if (id) {
      loadData();
    }
  }, [restauranteId, restaurante]);

  const loadData = async () => {
    const id = getRestauranteId();
    
    if (!id) {
      console.warn('⚠️ Restaurante ID não disponível ainda. Aguardando autenticação...');
      return;
    }
    
    setLoading(true);
    console.log('🔍 Carregando dados para restaurante:', id);

    try {
      // Carregar grupos
      const groupsResult = await complementsService.getGroups(id);
      if (groupsResult.success) {
        console.log('✅ Grupos carregados:', groupsResult.data);
        // Normalizar dados do banco
        const normalizedGroups = (groupsResult.data || []).map(g => ({
          ...g,
          name: g.nome || g.name,
          description: g.descricao || g.description,
          section: g.secao || g.section,  // ✅ Normalizar seção
          selectionType: g.tipo_selecao || g.selectionType,
          required: g.obrigatorio !== undefined ? g.obrigatorio : g.required
        }));
        setGroups(normalizedGroups);
      } else {
        console.error('❌ Erro ao carregar grupos:', groupsResult.error);
      }

      // Carregar complementos
      const complementsResult = await complementsService.getComplements(id);
      if (complementsResult.success) {
        console.log('✅ Complementos carregados:', complementsResult.data);
        // Normalizar dados do banco
        const normalizedComplements = (complementsResult.data || []).map(c => ({
          ...c,
          name: c.nome || c.name,
          description: c.descricao || c.description,
          price: c.preco || c.price,
          image: c.imagem_url || c.image,
          available: c.status === 'disponivel' || c.available
        }));
        setComplements(normalizedComplements);
      } else {
        console.error('❌ Erro ao carregar complementos:', complementsResult.error);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar complementos
  const filteredComplements = complements.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = !showOnlyAvailable || comp.available;
    return matchesSearch && matchesAvailability;
  });

  // Estatísticas
  const stats = {
    total: complements.length,
    available: complements.filter(c => c.available).length,
    unavailable: complements.filter(c => !c.available).length,
    groups: groups.length
  };

  // Handlers
  const handleToggleComplement = async (id) => {
    try {
      console.log('🔄 Alternando disponibilidade do complemento:', id);
      const result = await complementsService.toggleComplementAvailability(id);
      
      if (result.success) {
        console.log('✅ Disponibilidade alterada!');
        setComplements(complements.map(c => 
          c.id === id ? result.data : c
        ));
        toast.success('Status alterado com sucesso!');
      } else {
        console.error('❌ Erro ao alternar disponibilidade:', result.error);
        toast.error('Erro ao alternar disponibilidade: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao alternar disponibilidade: ' + error.message);
    }
  };

  const handleEditComplement = (complement) => {
    setCurrentComplement(complement);
    setIsComplementModalOpen(true);
  };

  const handleAddComplement = () => {
    setCurrentComplement({
      id: Date.now(),
      name: '',
      description: '',
      price: 0,
      image: '',
      available: true,
      groupIds: []
    });
    setIsComplementModalOpen(true);
  };

  const handleSaveComplement = async () => {
    const id = getRestauranteId();
    
    if (!id) {
      toast.error('Erro: Restaurante não identificado. Faça login novamente.');
      console.error('❌ restauranteId não disponível:', { restauranteId, restaurante });
      return;
    }
    
    setSaving(true);

    try {
      const isEditing = complements.find(c => c.id === currentComplement.id);
      
      if (isEditing) {
        // Atualizar complemento existente
        console.log('📝 Atualizando complemento:', currentComplement);
        const result = await complementsService.updateComplement(currentComplement.id, {
          name: currentComplement.name,
          price: currentComplement.price,
          image: currentComplement.image,
          available: currentComplement.available
        });
        
        if (result.success) {
          console.log('✅ Complemento atualizado com sucesso!');
          // Normalizar dados do banco para o formato do componente
          const normalizedComplement = {
            ...result.data,
            name: result.data.nome || result.data.name,
            description: result.data.descricao || result.data.description,
            price: result.data.preco || result.data.price,
            image: result.data.imagem_url || result.data.image,
            available: result.data.status === 'disponivel' || result.data.available
          };
          setComplements(complements.map(c => 
            c.id === currentComplement.id ? normalizedComplement : c
          ));
          toast.success('Complemento atualizado com sucesso!');
        } else {
          console.error('❌ Erro ao atualizar complemento:', result.error);
          toast.error('Erro ao atualizar complemento: ' + result.error);
        }
      } else {
        // Criar novo complemento
        console.log('➕ Criando novo complemento:', currentComplement);
        const result = await complementsService.createComplement(id, {
          name: currentComplement.name,
          description: currentComplement.description,
          price: currentComplement.price,
          image: currentComplement.image,
          available: currentComplement.available
        });
        
        if (result.success) {
          console.log('✅ Complemento criado com sucesso!', result.data);
          // Normalizar dados do banco para o formato do componente
          const normalizedComplement = {
            ...result.data,
            name: result.data.nome || result.data.name,
            description: result.data.descricao || result.data.description,
            price: result.data.preco || result.data.price,
            image: result.data.imagem_url || result.data.image,
            available: result.data.status === 'disponivel' || result.data.available
          };
          setComplements([...complements, normalizedComplement]);
          toast.success('Complemento criado com sucesso!');
        } else {
          console.error('❌ Erro ao criar complemento:', result.error);
          toast.error('Erro ao criar complemento: ' + result.error);
        }
      }
      
      setIsComplementModalOpen(false);
    } catch (error) {
      console.error('❌ Erro ao salvar complemento:', error);
      toast.error('Erro ao salvar complemento: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditGroup = (group) => {
    setCurrentGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleAddGroup = () => {
    setCurrentGroup({
      id: Date.now(),
      name: '',
      description: '',
      section: '',  // ✅ Novo campo
      selectionType: 'multiple',
      required: false
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    const id = getRestauranteId();
    
    if (!id) {
      toast.error('Erro: Restaurante não identificado. Faça login novamente.');
      console.error('❌ restauranteId não disponível:', { restauranteId, restaurante });
      return;
    }
    
    setSaving(true);

    try {
      const isEditing = groups.find(g => g.id === currentGroup.id);
      
      if (isEditing) {
        // Atualizar grupo existente
        console.log('📝 Atualizando grupo:', currentGroup);
        const result = await complementsService.updateGroup(currentGroup.id, {
          name: currentGroup.name,
          description: currentGroup.description,
          section: currentGroup.section,  // ✅ Incluir seção
          selectionType: currentGroup.selectionType,
          required: currentGroup.required
        });
        
        if (result.success) {
          console.log('✅ Grupo atualizado com sucesso!');
          // Normalizar dados do banco para o formato do componente
          const normalizedGroup = {
            ...result.data,
            name: result.data.nome || result.data.name,
            description: result.data.descricao || result.data.description,
            section: result.data.secao || result.data.section,  // ✅ Normalizar seção
            selectionType: result.data.tipo_selecao || result.data.selectionType,
            required: result.data.obrigatorio !== undefined ? result.data.obrigatorio : result.data.required
          };
          setGroups(groups.map(g => 
            g.id === currentGroup.id ? normalizedGroup : g
          ));
          toast.success('Grupo atualizado com sucesso!');
        } else {
          console.error('❌ Erro ao atualizar grupo:', result.error);
          toast.error('Erro ao atualizar grupo: ' + result.error);
        }
      } else {
        // Criar novo grupo
        console.log('➕ Criando novo grupo:', currentGroup);
        const result = await complementsService.createGroup(id, {
          name: currentGroup.name,
          description: currentGroup.description,
          section: currentGroup.section,  // ✅ Incluir seção
          selectionType: currentGroup.selectionType,
          required: currentGroup.required
        });
        
        if (result.success) {
          console.log('✅ Grupo criado com sucesso!', result.data);
          // Normalizar dados do banco para o formato do componente
          const normalizedGroup = {
            ...result.data,
            name: result.data.nome || result.data.name,
            description: result.data.descricao || result.data.description,
            section: result.data.secao || result.data.section,  // ✅ Normalizar seção
            selectionType: result.data.tipo_selecao || result.data.selectionType,
            required: result.data.obrigatorio !== undefined ? result.data.obrigatorio : result.data.required
          };
          setGroups([...groups, normalizedGroup]);
          toast.success('Grupo criado com sucesso!');
        } else {
          console.error('❌ Erro ao criar grupo:', result.error);
          toast.error('Erro ao criar grupo: ' + result.error);
        }
      }
      
      setIsGroupModalOpen(false);
    } catch (error) {
      console.error('❌ Erro ao salvar grupo:', error);
      toast.error('Erro ao salvar grupo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManageGroup = (group) => {
    setCurrentGroup(group);
    setIsManageModalOpen(true);
  };

  const handleToggleComplementInGroup = async (complementId) => {
    // Atualizar estado local primeiro (para feedback visual imediato)
    const complement = complements.find(c => c.id === complementId);
    const groupIds = complement?.groupIds || [];
    const hasGroup = groupIds.includes(currentGroup.id);
    
    setComplements(complements.map(c => {
      if (c.id === complementId) {
        return {
          ...c,
          groupIds: hasGroup 
            ? groupIds.filter(id => id !== currentGroup.id)
            : [...groupIds, currentGroup.id]
        };
      }
      return c;
    }));

    // Salvar no banco de dados
    try {
      if (hasGroup) {
        // Remover associação
        console.log('🗑️ Removendo complemento do grupo:', { complementId, groupId: currentGroup.id });
        const { error } = await supabase
          .from('grupos_complementos_itens')
          .delete()
          .eq('id_grupo', currentGroup.id)
          .eq('id_complemento', complementId);
        
        if (error) throw error;
        console.log('✅ Associação removida com sucesso!');
      } else {
        // Adicionar associação
        console.log('➕ Adicionando complemento ao grupo:', { complementId, groupId: currentGroup.id });
        const { error } = await supabase
          .from('grupos_complementos_itens')
          .insert([{
            id_grupo: currentGroup.id,
            id_complemento: complementId
          }]);
        
        if (error) throw error;
        console.log('✅ Associação criada com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar associação:', error);
      toast.error('Erro ao salvar associação: ' + error.message);
      
      // Reverter mudança no estado local em caso de erro
      setComplements(complements.map(c => {
        if (c.id === complementId) {
          return {
            ...c,
            groupIds: groupIds // Voltar ao estado anterior
          };
        }
        return c;
      }));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('complements')}
          className={`px-6 py-3 rounded-md font-semibold transition-colors ${
            activeTab === 'complements'
              ? 'bg-[#ff6f00] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
          }`}
        >
          Complementos
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 rounded-md font-semibold transition-colors ${
            activeTab === 'groups'
              ? 'bg-[#ff6f00] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
          }`}
        >
          Grupos
        </button>
      </div>

      {/* TELA 1 - Lista de Complementos */}
      {activeTab === 'complements' && (
        <>
          {/* Botão Criar */}
          <div className="flex justify-end">
            <button 
              onClick={handleAddComplement}
              className="bg-[#ff6f00] text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-[#ff8c00] transition-colors shadow-lg"
            >
              ➕ Criar Complemento
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="ninja-card p-4 text-center border-l-4 border-[#ff6f00]">
              <p className="text-3xl font-bold text-[#ff6f00]">{stats.total}</p>
              <p className="text-sm text-gray-400 mt-1">Total de Complementos</p>
            </div>
            <div className="ninja-card p-4 text-center border-l-4 border-green-500">
              <p className="text-3xl font-bold text-green-500">{stats.available}</p>
              <p className="text-sm text-gray-400 mt-1">Disponíveis</p>
            </div>
            <div className="ninja-card p-4 text-center border-l-4 border-red-500">
              <p className="text-3xl font-bold text-red-500">{stats.unavailable}</p>
              <p className="text-sm text-gray-400 mt-1">Indisponíveis</p>
            </div>
            <div className="ninja-card p-4 text-center border-l-4 border-blue-500">
              <p className="text-3xl font-bold text-blue-500">{stats.groups}</p>
              <p className="text-sm text-gray-400 mt-1">Grupos</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="ninja-card p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar complemento..." 
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-sm text-white placeholder-gray-500 focus:border-[#ff6f00] focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="available-only" 
                  checked={showOnlyAvailable}
                  onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
                  className="rounded border-gray-600 bg-[#1a1a1a]"
                />
                <label htmlFor="available-only" className="text-sm text-gray-300">Apenas disponíveis</label>
              </div>
            </div>
          </div>

          {/* Grid de Complementos */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredComplements.map(complement => (
              <ComplementCard 
                key={complement.id}
                complement={complement}
                onEdit={handleEditComplement}
                onToggle={handleToggleComplement}
              />
            ))}
            {filteredComplements.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                Nenhum complemento encontrado.
              </div>
            )}
          </div>
        </>
      )}

      {/* TELA 2 - Grupos de Complementos */}
      {activeTab === 'groups' && (
        <>
          {/* Botão Criar Grupo */}
          <div className="flex justify-end">
            <button 
              onClick={handleAddGroup}
              className="bg-[#ff6f00] text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-[#ff8c00] transition-colors shadow-lg"
            >
              ➕ Criar Grupo
            </button>
          </div>

          {/* Lista de Grupos */}
          <div className="space-y-6">
            {groups.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Nenhum grupo criado ainda.
              </div>
            ) : (
              // Agrupar por seção
              (() => {
                const groupedBySection = groups.reduce((acc, group) => {
                  const section = group.section || 'Sem Seção';
                  if (!acc[section]) acc[section] = [];
                  acc[section].push(group);
                  return acc;
                }, {});

                return Object.entries(groupedBySection).map(([section, sectionGroups]) => (
                  <div key={section} className="space-y-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-[#ff6f00]">📁</span>
                      {section}
                      <span className="text-sm text-gray-400 font-normal">
                        ({sectionGroups.length} {sectionGroups.length === 1 ? 'grupo' : 'grupos'})
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {sectionGroups.map(group => (
                        <GroupCard 
                          key={group.id}
                          group={group}
                          onEdit={handleEditGroup}
                          onManage={handleManageGroup}
                          complementsCount={complements.filter(c => c.groupIds?.includes(group.id)).length}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </>
      )}

      {/* Modal - Editar/Criar Complemento */}
      <Modal 
        isOpen={isComplementModalOpen} 
        onClose={() => setIsComplementModalOpen(false)} 
        title={complements.find(c => c.id === currentComplement?.id) ? "Editar Complemento" : "Criar Complemento"}
      >
        {currentComplement && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Nome do Complemento</label>
              <input 
                type="text" 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                value={currentComplement.name || ''}
                onChange={(e) => setCurrentComplement({...currentComplement, name: e.target.value})}
                placeholder="Ex: Cheddar Extra"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Descrição (opcional)</label>
              <textarea 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                rows="2"
                value={currentComplement.description || ''}
                onChange={(e) => setCurrentComplement({...currentComplement, description: e.target.value})}
                placeholder="Descreva o complemento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Preço (R$)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                value={currentComplement.price === undefined || currentComplement.price === null ? '' : currentComplement.price}
                onChange={(e) => setCurrentComplement({...currentComplement, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">URL da Imagem (opcional)</label>
              <input 
                type="url" 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                value={currentComplement.image || ''}
                onChange={(e) => setCurrentComplement({...currentComplement, image: e.target.value})}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="complement-available" 
                checked={currentComplement.available}
                onChange={(e) => setCurrentComplement({...currentComplement, available: e.target.checked})}
                className="rounded border-gray-600 bg-[#1a1a1a]"
              />
              <label htmlFor="complement-available" className="text-sm text-gray-300">Disponível</label>
            </div>
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => setIsComplementModalOpen(false)} 
                className="w-full py-2 text-sm font-semibold rounded-md bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveComplement} 
                className="w-full py-2 text-sm font-semibold rounded-md bg-[#ff6f00] text-white hover:bg-[#ff8c00]"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal - Editar/Criar Grupo */}
      <Modal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
        title={groups.find(g => g.id === currentGroup?.id) ? "Editar Grupo" : "Criar Grupo"}
      >
        {currentGroup && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Nome do Grupo</label>
              <input 
                type="text" 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                value={currentGroup.name || ''}
                onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})}
                placeholder="Ex: Molhos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Seção/Categoria (opcional)</label>
              <input 
                type="text" 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                value={currentGroup.section || ''}
                onChange={(e) => setCurrentGroup({...currentGroup, section: e.target.value})}
                placeholder="Ex: Bebidas, Lanches, Sobremesas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Descrição (opcional)</label>
              <textarea 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-md text-white focus:border-[#ff6f00] focus:outline-none"
                rows="3"
                value={currentGroup.description || ''}
                onChange={(e) => setCurrentGroup({...currentGroup, description: e.target.value})}
                placeholder="Descreva o grupo de complementos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Tipo de Seleção</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="selectionType"
                    value="single"
                    checked={currentGroup.selectionType === 'single'}
                    onChange={(e) => setCurrentGroup({...currentGroup, selectionType: e.target.value})}
                    className="text-[#ff6f00]"
                  />
                  <span className="text-sm text-gray-300">Único (escolher apenas 1)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="selectionType"
                    value="multiple"
                    checked={currentGroup.selectionType === 'multiple'}
                    onChange={(e) => setCurrentGroup({...currentGroup, selectionType: e.target.value})}
                    className="text-[#ff6f00]"
                  />
                  <span className="text-sm text-gray-300">Múltiplo (escolher vários)</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="group-required" 
                checked={currentGroup.required}
                onChange={(e) => setCurrentGroup({...currentGroup, required: e.target.checked})}
                className="rounded border-gray-600 bg-[#1a1a1a]"
              />
              <label htmlFor="group-required" className="text-sm text-gray-300">Obrigatório</label>
            </div>
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => setIsGroupModalOpen(false)} 
                disabled={saving}
                className="w-full py-2 text-sm font-semibold rounded-md bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveGroup} 
                disabled={saving}
                className="w-full py-2 text-sm font-semibold rounded-md bg-[#ff6f00] text-white hover:bg-[#ff8c00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal - Gerenciar Complementos do Grupo */}
      <Modal 
        isOpen={isManageModalOpen} 
        onClose={() => {
          setIsManageModalOpen(false);
          setSearchComplementTerm(''); // Limpar busca ao fechar
        }} 
        title={`Gerenciar Complementos - ${currentGroup?.name}`}
        size="lg"
      >
        {currentGroup && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Selecione os complementos que fazem parte deste grupo:
            </p>
            
            {/* Barra de Pesquisa */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="🔍 Buscar complemento..." 
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3 pl-10 rounded-md text-sm text-white placeholder-gray-500 focus:border-[#ff6f00] focus:outline-none"
                value={searchComplementTerm}
                onChange={(e) => setSearchComplementTerm(e.target.value)}
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchComplementTerm && (
                <button
                  onClick={() => setSearchComplementTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Contador de Resultados */}
            {searchComplementTerm && (
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>
                  {complements.filter(c => 
                    c.name.toLowerCase().includes(searchComplementTerm.toLowerCase())
                  ).length} complemento(s) encontrado(s)
                </span>
                <span>
                  {complements.filter(c => 
                    c.groupIds?.includes(currentGroup.id) && 
                    c.name.toLowerCase().includes(searchComplementTerm.toLowerCase())
                  ).length} selecionado(s)
                </span>
              </div>
            )}

            {/* Lista de Complementos Filtrada */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {complements
                .filter(complement => 
                  complement.name.toLowerCase().includes(searchComplementTerm.toLowerCase())
                )
                .map(complement => (
                  <label 
                    key={complement.id}
                    className="flex items-center gap-3 p-3 rounded-md bg-[#1a1a1a] hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      checked={complement.groupIds?.includes(currentGroup.id) || false}
                      onChange={() => handleToggleComplementInGroup(complement.id)}
                      className="rounded border-gray-600 bg-[#0d0d0d]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{complement.name}</p>
                      <p className="text-xs text-gray-400">R$ {complement.price.toFixed(2)}</p>
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
              
              {/* Mensagem quando não encontrar nada */}
              {complements.filter(c => 
                c.name.toLowerCase().includes(searchComplementTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="font-medium">Nenhum complemento encontrado</p>
                  <p className="text-sm mt-1">Tente buscar por outro nome</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => {
                  setIsManageModalOpen(false);
                  toast.success('Associações salvas com sucesso!');
                }} 
                className="w-full py-2 text-sm font-semibold rounded-md bg-[#ff6f00] text-white hover:bg-[#ff8c00]"
              >
                Fechar
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              💡 As alterações são salvas automaticamente ao marcar/desmarcar
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Complements;
