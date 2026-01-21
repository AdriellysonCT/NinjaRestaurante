import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from '../components/icons/index.jsx';
const { XIcon, StarIcon } = Icons;
import { Modal } from '../components/ui/Modal';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ExcelImport from '../components/ExcelImport';
import MenuItemComplements from '../components/MenuItemComplements';
import complementsService from '../services/complementsService';
import { AnimatePresence } from 'framer-motion';

const SuccessToast = ({ message, show }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.8 }}
    animate={show ? { opacity: 1, y: 0, x: '-50%', scale: 1 } : { opacity: 0, y: 50, x: '-50%', scale: 0.8 }}
    className="fixed bottom-10 left-1/2 z-[2147483647] bg-[hsl(var(--color-success))] text-white px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 font-bold border border-white/20 backdrop-blur-md"
  >
    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
      <Icons.CheckIcon className="w-5 h-5" />
    </div>
    <span className="text-lg">{message}</span>
  </motion.div>
);

// Componente para o item do cardápio
const initialMenuItems = [
  {
    id: 1,
    name: 'Ramen do Ichiraku',
    description: 'Tradicional ramen com caldo de porco, naruto, ovo e carne suína.',
    price: 25.00,
    category: 'Pratos Principais',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Ramen',
    available: true,
    featured: true,
    prepTime: 15,
    ingredients: ['Macarrão', 'Caldo de porco', 'Naruto', 'Ovo', 'Carne suína']
  },
  {
    id: 2,
    name: 'Onigiri',
    description: 'Bolinho de arroz recheado com atum, salmão ou umeboshi.',
    price: 8.50,
    category: 'Entradas',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Onigiri',
    available: true,
    featured: false,
    prepTime: 5,
    ingredients: ['Arroz', 'Alga nori', 'Recheio (atum, salmão ou umeboshi)']
  },
  {
    id: 3,
    name: 'Salada Ninja',
    description: 'Mix de folhas frescas, tomate, pepino e molho especial da casa.',
    price: 15.00,
    category: 'Entradas',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Salada',
    available: true,
    featured: false,
    prepTime: 8,
    ingredients: ['Alface', 'Rúcula', 'Tomate', 'Pepino', 'Molho especial']
  },
  {
    id: 4,
    name: 'Peixe Grelhado',
    description: 'Filé de salmão grelhado com molho teriyaki e legumes.',
    price: 42.00,
    category: 'Pratos Principais',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Peixe',
    available: true,
    featured: true,
    prepTime: 20,
    ingredients: ['Salmão', 'Molho teriyaki', 'Legumes', 'Arroz']
  },
  {
    id: 5,
    name: 'Chá Verde',
    description: 'Chá verde tradicional japonês.',
    price: 6.00,
    category: 'Bebidas',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Chá',
    available: true,
    featured: false,
    prepTime: 3,
    ingredients: ['Chá verde']
  },
  {
    id: 6,
    name: 'Gyoza',
    description: 'Pastéis japoneses recheados com carne e legumes.',
    price: 18.00,
    category: 'Entradas',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Gyoza',
    available: true,
    featured: false,
    prepTime: 12,
    ingredients: ['Massa', 'Carne suína', 'Repolho', 'Cebolinha', 'Gengibre']
  },
  {
    id: 7,
    name: 'Sushi Combo',
    description: 'Combinado com 12 peças de sushi variado.',
    price: 45.00,
    category: 'Pratos Principais',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Sushi',
    available: false,
    featured: true,
    prepTime: 25,
    ingredients: ['Arroz', 'Peixe variado', 'Alga nori', 'Wasabi', 'Gengibre']
  },
  {
    id: 8,
    name: 'Mochi',
    description: 'Doce japonês feito de arroz glutinoso recheado com pasta de feijão doce.',
    price: 12.00,
    category: 'Sobremesas',
    image: 'https://placehold.co/300x200/1a1a1a/ffa500?text=Mochi',
    available: true,
    featured: false,
    prepTime: 0,
    ingredients: ['Arroz glutinoso', 'Pasta de feijão doce']
  }
];

// Componente para o item do cardápio
const MenuItem = ({ item, onEdit, onToggleAvailability }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ninja-card overflow-hidden"
    >
      <div className="relative">
        <img 
          src={item.image || 'https://placehold.co/300x200/1a1a1a/ffa500?text=' + encodeURIComponent(item.name.substring(0, 10))} 
          alt={item.name} 
          className="w-full h-40 object-cover"
          onError={(e) => {
            e.target.src = 'https://placehold.co/300x200/1a1a1a/ffa500?text=' + encodeURIComponent(item.name.substring(0, 10));
          }}
        />
        {item.featured && (
          <div className="absolute top-2 right-2 bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] px-2 py-1 rounded-md text-xs font-semibold">
            Especial
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-card-foreground">{item.name}</h3>
          <p className="font-bold text-primary">R$ {item.price.toFixed(2)}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
        <div className="flex justify-between items-center">
          <span className={`text-xs px-2 py-1 rounded-full ${
            item.available 
              ? 'bg-[hsla(var(--color-success),0.2)] text-[hsl(var(--color-success))]' 
              : 'bg-[hsla(var(--color-destructive),0.2)] text-[hsl(var(--color-destructive))]'
          }`}>
            {item.available ? 'Disponível' : 'Indisponível'}
          </span>
          <span className="text-xs text-muted-foreground">
            Preparo: {item.prepTime} min
          </span>
        </div>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => onToggleAvailability(item.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
              item.available 
                ? 'bg-[hsla(var(--color-destructive),0.1)] text-[hsl(var(--color-destructive))] hover:bg-[hsla(var(--color-destructive),0.2)]' 
                : 'bg-[hsla(var(--color-success),0.1)] text-[hsl(var(--color-success))] hover:bg-[hsla(var(--color-success),0.2)]'
            }`}
          >
            {item.available ? 'Marcar Indisponível' : 'Marcar Disponível'}
          </button>
          <button 
            onClick={() => onEdit(item)}
            className="flex-1 py-2 text-xs font-semibold rounded-md bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))] hover:bg-[hsla(var(--color-secondary),0.8)] transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Menu = () => {
  // Usar o contexto da aplicação
  const { menuItems, addMenuItem, updateMenuItem, toggleMenuItemAvailability, isOnline } = useAppContext();
  const { restauranteId } = useAuth();  // ✅ Pegar do contexto de autenticação
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' ou 'complements'
  
  // Estados para complementos (carregados do banco)
  const [groups, setGroups] = useState([]);
  const [complements, setComplements] = useState([]);
  const [loadingComplements, setLoadingComplements] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Extrair categorias únicas dos itens do menu
  useEffect(() => {
    const uniqueCategories = ['Todos', ...new Set(menuItems.map(item => item.category))];
    setCategories(uniqueCategories);
  }, [menuItems]);

  // Salvar menu no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('fome-ninja-menu', JSON.stringify(menuItems));
  }, [menuItems]);

  // Carregar grupos e complementos quando restauranteId estiver disponível
  useEffect(() => {
    if (restauranteId) {
      loadComplementsData();
    }
  }, [restauranteId]);

  const loadComplementsData = async () => {
    if (!restauranteId) {
      console.warn('⚠️ Restaurante ID não disponível ainda. Aguardando autenticação...');
      return;
    }
    
    setLoadingComplements(true);
    console.log('🔍 Carregando complementos para restaurante:', restauranteId);
    
    try {

      // Buscar grupos
      const groupsResult = await complementsService.getGroups(restauranteId);
      if (groupsResult.success) {
        setGroups(groupsResult.data || []);
      } else {
        console.error('Erro ao carregar grupos:', groupsResult.error);
        setGroups([]);
      }

      // Buscar complementos (já vem com groupIds do service)
      const complementsResult = await complementsService.getComplements(restauranteId);
      if (complementsResult.success) {
        console.log('✅ Complementos carregados com grupos:', complementsResult.data);
        setComplements(complementsResult.data || []);
      } else {
        console.error('Erro ao carregar complementos:', complementsResult.error);
        setComplements([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de complementos:', error);
      setGroups([]);
      setComplements([]);
    } finally {
      setLoadingComplements(false);
    }
  };

  // Filtrar itens do menu
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = !showOnlyAvailable || item.available;
    
    return matchesCategory && matchesSearch && matchesAvailability;
  });

  // Manipuladores de eventos
  const handleEdit = (item) => {
    setCurrentItem(item);
    setActiveTab('info'); // Reset para aba de informações
    setIsModalOpen(true);
  };

  const handleToggleAvailability = (id) => {
    toggleMenuItemAvailability(id);
  };

  const handleSaveItem = (updatedItem) => {
    updateMenuItem(updatedItem.id, updatedItem);
    setIsModalOpen(false);
  };

  const handleAddNewItem = () => {
    // Definir categorias padrão caso não existam ainda
    const defaultCategories = ['Entradas', 'Pratos Principais', 'Bebidas', 'Sobremesas'];
    const availableCategories = categories.filter(cat => cat !== 'Todos');
    const categoryToUse = availableCategories.length > 0 ? availableCategories[0] : defaultCategories[0];
    
    const newItem = {
      id: Date.now(), // Usar timestamp para evitar conflitos
      name: '',
      description: '',
      price: 0,
      category: categoryToUse,
      image: '',
      available: true,
      featured: false,
      prepTime: 0,
      ingredients: [],
      complementGroups: [] // Adicionar campo para complementos
    };
    setCurrentItem(newItem);
    setActiveTab('info');
    setIsModalOpen(true);
  };
  
  const handleSaveComplements = (updatedItem) => {
    setCurrentItem(updatedItem);
    triggerToast('Complementos vinculados com sucesso!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <SuccessToast show={showToast} message={toastMessage} />
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))] px-4 py-2 rounded-md text-sm font-semibold hover:bg-[hsla(var(--color-secondary),0.8)] transition-colors flex items-center gap-2"
        >
          📊 Importar Excel
        </button>
        <button 
          onClick={handleAddNewItem}
          className="bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] px-4 py-2 rounded-md text-sm font-semibold hover:bg-[hsla(var(--color-primary),0.9)] transition-colors"
        >
          ➕ Adicionar Item
        </button>
      </div>

      {/* Filtros */}
      <div className="ninja-card p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Buscar item..." 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select 
              className="bg-input px-3 py-2 rounded-md text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="available-only" 
              checked={showOnlyAvailable}
              onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className="rounded border-input"
            />
            <label htmlFor="available-only" className="text-sm">Apenas disponíveis</label>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--color-primary))]">{menuItems.length}</p>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Total de Itens</p>
        </div>
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--color-success))]">
            {menuItems.filter(item => item.available).length}
          </p>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Disponíveis</p>
        </div>
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--color-destructive))]">
            {menuItems.filter(item => !item.available).length}
          </p>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Indisponíveis</p>
        </div>
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--color-primary))]">
            {menuItems.filter(item => item.featured).length}
          </p>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Especiais</p>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <MenuItem 
            key={item.id} 
            item={item} 
            onEdit={handleEdit} 
            onToggleAvailability={handleToggleAvailability} 
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum item encontrado com os filtros atuais.
          </div>
        )}
      </div>

      {/* Modal de edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentItem && !menuItems.find(item => item.id === currentItem.id) ? "Adicionar Item" : "Editar Item"}
        size="xl"
      >
        {currentItem && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#2a2a2a] pb-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-t-md font-semibold transition-colors ${
                  activeTab === 'info'
                    ? 'bg-[#ff6f00] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
              >
                📝 Informações
              </button>
              <button
                onClick={() => {
                  const isNewItem = typeof currentItem.id === 'number' && currentItem.id > 1000;
                  if (isNewItem) {
                    triggerToast('Salve o item antes de gerenciar complementos');
                    return;
                  }
                  setActiveTab('complements');
                }}
                className={`px-4 py-2 rounded-t-md font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'complements'
                    ? 'bg-[#ff6f00] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
                } ${typeof currentItem.id === 'number' && currentItem.id > 1000 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={typeof currentItem.id === 'number' && currentItem.id > 1000 ? "Salve o item primeiro" : ""}
              >
                🍔 Complementos
                {typeof currentItem.id === 'number' && currentItem.id > 1000 && (
                  <span className="text-[10px] bg-red-500/20 text-red-500 px-1 rounded">Bloqueado</span>
                )}
              </button>
            </div>

            {/* Conteúdo da aba Informações */}
            {activeTab === 'info' && (
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea 
                className="w-full bg-input px-3 py-2 rounded-md"
                rows="3"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-input px-3 py-2 rounded-md"
                  value={currentItem.price}
                  onChange={(e) => setCurrentItem({...currentItem, price: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tempo de Preparo (min)</label>
                <input 
                  type="number" 
                  className="w-full bg-input px-3 py-2 rounded-md"
                  value={currentItem.prepTime}
                  onChange={(e) => setCurrentItem({...currentItem, prepTime: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select 
                className="w-full bg-input px-3 py-2 rounded-md"
                value={currentItem.category}
                onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
              >
                {/* Categorias existentes do menu */}
                {categories.filter(cat => cat !== 'Todos').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
                {/* Categorias padrão caso não existam itens ainda */}
                {categories.length <= 1 && (
                  <>
                    <option value="Entradas">Entradas</option>
                    <option value="Pratos Principais">Pratos Principais</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Sobremesas">Sobremesas</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL da Imagem</label>
              <input 
                type="url" 
                className="w-full bg-input px-3 py-2 rounded-md"
                placeholder="https://exemplo.com/imagem.jpg"
                value={currentItem.image || ''}
                onChange={(e) => setCurrentItem({...currentItem, image: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole aqui o link da imagem do item (opcional)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="available" 
                  checked={currentItem.available}
                  onChange={(e) => setCurrentItem({...currentItem, available: e.target.checked})}
                />
                <label htmlFor="available" className="text-sm">Disponível</label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="featured" 
                  checked={currentItem.featured}
                  onChange={(e) => setCurrentItem({...currentItem, featured: e.target.checked})}
                />
                <label htmlFor="featured" className="text-sm">Especial</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ingredientes (separados por vírgula)</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md"
                placeholder="Ex: Tomate, Alface, Queijo"
                value={Array.isArray(currentItem.ingredients) ? currentItem.ingredients.join(', ') : ''}
                onChange={(e) => setCurrentItem({...currentItem, ingredients: e.target.value ? e.target.value.split(',').map(i => i.trim()) : []})}
              />
            </div>
                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="w-full py-2 text-sm font-semibold rounded-md bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))] hover:bg-[hsla(var(--color-secondary),0.8)]"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        // Verificar se é um novo item (não existe na lista atual ou tem ID numérico alto)
                        const isNewItem = typeof currentItem.id === 'number' && currentItem.id > 1000;
                        
                        if (isNewItem) {
                          // Adicionar novo item
                          const savedItem = await addMenuItem(currentItem);
                          // Atualizar currentItem com o novo ID (UUID) vindo do banco
                          setCurrentItem(savedItem);
                          triggerToast('Informações básicas salvas!');
                        } else {
                          // Atualizar item existente
                          await updateMenuItem(currentItem.id, currentItem);
                          setIsModalOpen(false); // Fecha o modal apenas na edição de itens existentes
                          triggerToast('Item atualizado com sucesso!');
                        }
                      } catch (err) {
                        console.error('Erro ao salvar item:', err);
                        alert('Erro ao salvar: ' + err.message);
                      }
                    }} 
                    className="w-full py-2 text-sm font-semibold rounded-md bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsla(var(--color-primary),0.9)]"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {/* Conteúdo da aba Complementos */}
            {activeTab === 'complements' && (
              <div className="space-y-4">
                {loadingComplements ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6f00]"></div>
                    <p className="text-gray-400 mt-4">Carregando complementos...</p>
                  </div>
                ) : (
                  <MenuItemComplements 
                    menuItem={currentItem}
                    groups={groups}
                    complements={complements}
                    onSave={handleSaveComplements}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de importação Excel */}
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        title="Importar Cardápio via Excel"
        size="lg"
      >
        <ExcelImport 
          onImport={addMenuItem}
          onClose={() => setIsImportModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Menu;