import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as orderService from '../services/orderService';
import * as menuService from '../services/menuService';
import * as settingsService from '../services/settingsService';
import * as cashService from '../services/cashService';
import { useAuth } from './AuthContext';
import { configurarRealtimePedidos, removerRealtimePedidos } from '../services/dashboardFinanceiroService';

// Criar o contexto
export const AppContext = createContext();

// Hook personalizado para usar o contexto
export const useAppContext = () => useContext(AppContext);

// Provedor do contexto
export const AppProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const notificationSoundRef = useRef(null);
  const notificationIntervalRef = useRef(null);

  // Monitorar estado da conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicializar dados
  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized || !user || authLoading) return;
      
      try {
        setIsLoading(true);
        
        try {
          const { data: restaurante, error: restauranteError } = await supabase
            .from('restaurantes_app')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (restauranteError) throw restauranteError;
          setRestaurantId(restaurante.id);
        } catch (error) {
          console.error("Não foi possível obter o ID do restaurante para o realtime:", error.message);
        }
        
        // Tentar carregar dados do Supabase
        if (isOnline) {
          try {
            // Carregar pedidos
            const ordersData = await orderService.fetchOrders();
            setOrders(ordersData);
            localStorage.setItem('fome-ninja-orders', JSON.stringify(ordersData));
            
            // Carregar itens do cardápio
            const menuData = await menuService.fetchMenuItems();
            // Mapear os campos da nova estrutura para a estrutura esperada pelo frontend
            const mappedMenuData = menuData.map(item => ({
              id: item.id,
              name: item.nome,
              description: item.descricao,
              price: item.preco,
              category: item.categoria,
              image: item.imagem_url,
              available: item.disponivel,
              featured: item.destaque,
              prepTime: item.tempo_preparo,
              ingredients: item.ingredientes,
              createdAt: item.criado_em,
              updatedAt: item.atualizado_em,
              restaurantId: item.id_restaurante
            }));
            setMenuItems(mappedMenuData);
            localStorage.setItem('fome-ninja-menu', JSON.stringify(mappedMenuData));
            
            // Carregar configurações
            const settingsData = await settingsService.fetchSettings();
            if (settingsData) {
              const formattedSettings = {
                restaurantName: settingsData.restaurant_name,
                address: settingsData.address,
                phone: settingsData.phone,
                openingHours: settingsData.opening_hours,
                deliverySettings: settingsData.delivery_settings,
                notificationSettings: settingsData.notification_settings,
                paymentMethods: settingsData.payment_methods
              };
              
              setSettings(formattedSettings);
              
              // Salvar configurações no localStorage
              localStorage.setItem('fome-ninja-restaurant-name', formattedSettings.restaurantName || 'Fome Ninja');
              localStorage.setItem('fome-ninja-address', formattedSettings.address || 'Rua Konoha, 123 - Vila da Folha');
              localStorage.setItem('fome-ninja-phone', formattedSettings.phone || '(11) 99999-9999');
              
              if (formattedSettings.openingHours) {
                localStorage.setItem('fome-ninja-opening-hours', JSON.stringify(formattedSettings.openingHours));
              }
              
              if (formattedSettings.deliverySettings) {
                localStorage.setItem('fome-ninja-delivery-settings', JSON.stringify(formattedSettings.deliverySettings));
              }
              
              if (formattedSettings.notificationSettings) {
                localStorage.setItem('fome-ninja-notification-settings', JSON.stringify(formattedSettings.notificationSettings));
              }
              
              if (formattedSettings.paymentMethods) {
                localStorage.setItem('fome-ninja-payment-methods', JSON.stringify(formattedSettings.paymentMethods));
              }
            }
          } catch (error) {
            console.error('Erro ao carregar dados do Supabase:', error);
            // Se falhar, carregar do localStorage
            loadFromLocalStorage();
          }
        } else {
          // Se estiver offline, carregar do localStorage
          loadFromLocalStorage();
        }
        
        setIsInitialized(true);
      } catch (error) {
        setError(error.message);
        console.error('Erro ao inicializar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadFromLocalStorage = () => {
      // Carregar pedidos do localStorage
      const savedOrders = localStorage.getItem('fome-ninja-orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      
      // Carregar itens do cardápio do localStorage
      const savedMenu = localStorage.getItem('fome-ninja-menu');
      if (savedMenu) {
        setMenuItems(JSON.parse(savedMenu));
      }
      
      // Carregar configurações do localStorage
      const restaurantName = localStorage.getItem('fome-ninja-restaurant-name') || 'Fome Ninja';
      const address = localStorage.getItem('fome-ninja-address') || 'Rua Konoha, 123 - Vila da Folha';
      const phone = localStorage.getItem('fome-ninja-phone') || '(11) 99999-9999';
      
      const openingHours = localStorage.getItem('fome-ninja-opening-hours');
      const deliverySettings = localStorage.getItem('fome-ninja-delivery-settings');
      const notificationSettings = localStorage.getItem('fome-ninja-notification-settings');
      const paymentMethods = localStorage.getItem('fome-ninja-payment-methods');
      
      setSettings({
        restaurantName,
        address,
        phone,
        openingHours: openingHours ? JSON.parse(openingHours) : null,
        deliverySettings: deliverySettings ? JSON.parse(deliverySettings) : null,
        notificationSettings: notificationSettings ? JSON.parse(notificationSettings) : null,
        paymentMethods: paymentMethods ? JSON.parse(paymentMethods) : null
      });
    };
    
    initializeData();
  }, [isOnline, isInitialized, user, authLoading]);

  // Real-time de pedidos
  useEffect(() => {
    if (!isInitialized || !restaurantId) return;

    const handleOrderPayload = async (payload) => {
      console.log('Payload recebido:', payload);

      if (payload.eventType === 'INSERT') {
        if (notificationSoundRef.current) {
          notificationSoundRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
        }
        
        const newOrder = await orderService.fetchOrderById(payload.new.id);
        setOrders(prev => {
          if (prev.find(o => o.id === newOrder.id)) return prev;
          const updated = [newOrder, ...prev];
          localStorage.setItem('fome-ninja-orders', JSON.stringify(updated));
          return updated;
        });

      } else if (payload.eventType === 'UPDATE') {
        const updatedOrder = await orderService.fetchOrderById(payload.new.id);
        setOrders(prev => {
          const updated = prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
          localStorage.setItem('fome-ninja-orders', JSON.stringify(updated));
          return updated;
        });
      }
    };

    const canal = configurarRealtimePedidos(restaurantId, handleOrderPayload);
    console.log('Inscrito no canal de pedidos.');

    return () => {
      if (canal) {
        removerRealtimePedidos(canal);
        console.log('Inscrição do canal de pedidos removida.');
      }
    };
  }, [isInitialized, restaurantId]);

  // Efeito para tocar som em loop quando há pedidos não lidos
  useEffect(() => {
    if (!isInitialized) return;

    const checkUnreadOrders = () => {
      const unreadOrders = orders.filter(order => order.status === 'disponivel');
      
      if (unreadOrders.length > 0 && notificationSoundRef.current) {
        // Tocar som imediatamente
        notificationSoundRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
        
        // Configurar intervalo para tocar a cada 5 segundos
        if (!notificationIntervalRef.current) {
          notificationIntervalRef.current = setInterval(() => {
            if (notificationSoundRef.current) {
              notificationSoundRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
            }
          }, 5000); // 5 segundos
        }
      } else {
        // Parar o intervalo se não houver pedidos não lidos
        if (notificationIntervalRef.current) {
          clearInterval(notificationIntervalRef.current);
          notificationIntervalRef.current = null;
        }
      }
    };

    // Verificar imediatamente
    checkUnreadOrders();
    
    // Configurar verificação a cada 5 segundos
    const checkInterval = setInterval(checkUnreadOrders, 5000);

    return () => {
      clearInterval(checkInterval);
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
    };
  }, [orders, isInitialized]);

  // Funções para manipular pedidos
  const addOrder = async (order) => {
    try {
      if (isOnline) {
        // Adicionar no Supabase
        const newOrder = await orderService.createOrder(order);
        setOrders(prev => [...prev, newOrder]);
        localStorage.setItem('fome-ninja-orders', JSON.stringify([...orders, newOrder]));
        return newOrder;
      } else {
        // Adicionar apenas no localStorage
        const newOrder = { ...order, id: Date.now(), timestamp: new Date().toISOString() };
        setOrders(prev => [...prev, newOrder]);
        localStorage.setItem('fome-ninja-orders', JSON.stringify([...orders, newOrder]));
        return newOrder;
      }
    } catch (error) {
      console.error('Erro ao adicionar pedido:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const updates = { status };
      if (status === 'aceito') {
        updates.started_at = new Date().toISOString();
      }

      if (isOnline) {
        // Atualizar no Supabase
        await orderService.updateOrder(id, updates);
      }
      
      // Atualizar no estado local
      const updatedOrders = orders.map(order => 
        order.id === id ? { ...order, ...updates } : order
      );
      
      setOrders(updatedOrders);
      localStorage.setItem('fome-ninja-orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${id}:`, error);
      throw error;
    }
  };

  const deleteOrder = async (id) => {
    try {
      if (isOnline) {
        // Excluir no Supabase
        await orderService.deleteOrder(id);
      }
      
      // Excluir no estado local
      const updatedOrders = orders.filter(order => order.id !== id);
      setOrders(updatedOrders);
      localStorage.setItem('fome-ninja-orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.error(`Erro ao excluir pedido ${id}:`, error);
      throw error;
    }
  };

  // Funções para manipular itens do cardápio
  const addMenuItem = async (item) => {
    try {
      if (isOnline) {
        // Adicionar no Supabase
        const newItemFromDB = await menuService.createMenuItem(item);
        // Mapear os campos da resposta do banco para a estrutura esperada pelo frontend
        const mappedNewItem = {
          id: newItemFromDB.id,
          name: newItemFromDB.nome,
          description: newItemFromDB.descricao,
          price: newItemFromDB.preco,
          category: newItemFromDB.categoria,
          image: newItemFromDB.imagem_url,
          available: newItemFromDB.disponivel,
          featured: newItemFromDB.destaque,
          prepTime: newItemFromDB.tempo_preparo,
          ingredients: newItemFromDB.ingredientes,
          createdAt: newItemFromDB.criado_em,
          updatedAt: newItemFromDB.atualizado_em,
          restaurantId: newItemFromDB.id_restaurante
        };
        setMenuItems(prev => [...prev, mappedNewItem]);
        localStorage.setItem('fome-ninja-menu', JSON.stringify([...menuItems, mappedNewItem]));
        return mappedNewItem;
      } else {
        // Adicionar apenas no localStorage
        const newItem = { ...item, id: Date.now() };
        setMenuItems(prev => [...prev, newItem]);
        localStorage.setItem('fome-ninja-menu', JSON.stringify([...menuItems, newItem]));
        return newItem;
      }
    } catch (error) {
      console.error('Erro ao adicionar item do cardápio:', error);
      throw error;
    }
  };

  const updateMenuItem = async (id, updates) => {
    try {
      if (isOnline) {
        // Atualizar no Supabase
        await menuService.updateMenuItem(id, updates);
      }
      
      // Atualizar no estado local
      const updatedItems = menuItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      
      setMenuItems(updatedItems);
      localStorage.setItem('fome-ninja-menu', JSON.stringify(updatedItems));
    } catch (error) {
      console.error(`Erro ao atualizar item do cardápio ${id}:`, error);
      throw error;
    }
  };

  const toggleMenuItemAvailability = async (id) => {
    try {
      console.log('🔄 Alterando disponibilidade do item:', id);
      
      // Encontrar o item atual
      const item = menuItems.find(item => item.id === id);
      if (!item) {
        console.error('❌ Item não encontrado:', id);
        throw new Error(`Item ${id} não encontrado`);
      }
      
      console.log('📋 Item encontrado:', item.name, 'Disponível:', item.available);
      const newAvailability = !item.available;
      console.log('🔄 Nova disponibilidade:', newAvailability);
      
      if (isOnline) {
        console.log('🌐 Atualizando no Supabase...');
        try {
          // Atualizar no Supabase
          const result = await menuService.updateMenuItemAvailability(id, newAvailability);
          console.log('✅ Resultado do Supabase:', result);
        } catch (supabaseError) {
          console.warn('⚠️ Erro no Supabase, continuando apenas com localStorage:', supabaseError);
          // Continua mesmo se o Supabase falhar
        }
      } else {
        console.log('📱 Modo offline - apenas localStorage');
      }
      
      // Atualizar no estado local
      const updatedItems = menuItems.map(item => 
        item.id === id ? { ...item, available: newAvailability } : item
      );
      
      console.log('💾 Atualizando estado local...');
      setMenuItems(updatedItems);
      localStorage.setItem('fome-ninja-menu', JSON.stringify(updatedItems));
      
      console.log('✅ Disponibilidade alterada com sucesso!');
      alert(`Item ${newAvailability ? 'marcado como disponível' : 'marcado como indisponível'}!`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar disponibilidade do item ${id}:`, error);
      alert(`Erro ao alterar disponibilidade: ${error.message}`);
      throw error;
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      if (isOnline) {
        // Excluir no Supabase
        await menuService.deleteMenuItem(id);
      }
      
      // Excluir no estado local
      const updatedItems = menuItems.filter(item => item.id !== id);
      setMenuItems(updatedItems);
      localStorage.setItem('fome-ninja-menu', JSON.stringify(updatedItems));
    } catch (error) {
      console.error(`Erro ao excluir item do cardápio ${id}:`, error);
      throw error;
    }
  };

  // Funções para manipular configurações
  const updateSettings = async (newSettings) => {
    try {
      if (isOnline) {
        // Salvar no Supabase
        await settingsService.saveSettings(newSettings);
      }
      
      // Atualizar no estado local
      setSettings(newSettings);
      
      // Salvar no localStorage
      localStorage.setItem('fome-ninja-restaurant-name', newSettings.restaurantName || 'Fome Ninja');
      localStorage.setItem('fome-ninja-address', newSettings.address || 'Rua Konoha, 123 - Vila da Folha');
      localStorage.setItem('fome-ninja-phone', newSettings.phone || '(11) 99999-9999');
      
      if (newSettings.openingHours) {
        localStorage.setItem('fome-ninja-opening-hours', JSON.stringify(newSettings.openingHours));
      }
      
      if (newSettings.deliverySettings) {
        localStorage.setItem('fome-ninja-delivery-settings', JSON.stringify(newSettings.deliverySettings));
      }
      
      if (newSettings.notificationSettings) {
        localStorage.setItem('fome-ninja-notification-settings', JSON.stringify(newSettings.notificationSettings));
      }
      
      if (newSettings.paymentMethods) {
        localStorage.setItem('fome-ninja-payment-methods', JSON.stringify(newSettings.paymentMethods));
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  };

  // Valor do contexto
  const contextValue = {
    isLoading,
    error,
    isOnline,
    orders,
    menuItems,
    settings,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    addMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    deleteMenuItem,
    updateSettings
  };

  return (
    <AppContext.Provider value={contextValue}>
      <audio ref={notificationSoundRef} src="/sounds/Notificação_Pedidos.wav" preload="auto" />
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;