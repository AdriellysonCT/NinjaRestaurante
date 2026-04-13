import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as orderService from '../services/orderService';
import * as menuService from '../services/menuService';
import * as settingsService from '../services/settingsService';
import { useAuth } from './AuthContext';
import { configurarRealtimePedidos, removerRealtimePedidos } from '../services/dashboardFinanceiroService';
import { notificationHelper } from '../utils/notificationHelper';

// Criar o contexto
export const AppContext = createContext();

// Hook personalizado para usar o contexto
export const useAppContext = () => useContext(AppContext);

// Provedor do contexto
export const AppProvider = ({ children }) => {
  const { user, loading: authLoading, restauranteId: authRestauranteId } = useAuth();
  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  // Refs para os 3 tipos de som (ENTREGA, RETIRADA, CONSUMO LOCAL)
  const soundEntregaRef = useRef(null);             // Som para pedidos de ENTREGA
  const soundRetiradaRef = useRef(null);            // Som para pedidos de RETIRADA
  const soundConsumoLocalRef = useRef(null);        // Som para pedidos de CONSUMO NO LOCAL
  const notificationSoundRef = useRef(null);        // Ref auxiliar para compatibilidade
  const notificationIntervalRef = useRef(null);
  // Som LIGADO por padrão - restaurante pode desligar se quiser
  const [soundPreference, setSoundPreference] = useState(() => {
    try { 
      const saved = localStorage.getItem('fome-ninja-sound-pref');
      return saved === null ? true : saved === 'true';
    } catch (_) { 
      return true; 
    }
  });
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const soundEnabled = soundPreference && soundUnlocked;
  
  // Log do estado do som
  console.log('🔊 Estado do som:', { soundPreference, soundUnlocked, soundEnabled });
  const ordersRef = useRef([]);
  
  // Sistema de fila para múltiplos pedidos
  const pendingSoundsRef = useRef([]);
  const soundQueueTimerRef = useRef(null);
  const lastSoundPlayedRef = useRef(0);
  const SOUND_COOLDOWN = 2000; // 2 segundos de cooldown entre sons
  const QUEUE_WINDOW = 2500; // 2.5 segundos para agrupar pedidos

  // Refs para manter valores atualizados em callbacks
  const soundPreferenceRef = useRef(soundPreference);
  const soundUnlockedRef = useRef(soundUnlocked);
  
  // Manter refs sincronizadas
  useEffect(() => {
    soundPreferenceRef.current = soundPreference;
  }, [soundPreference]);
  
  useEffect(() => {
    soundUnlockedRef.current = soundUnlocked;
  }, [soundUnlocked]);
  
  // Verificar se os elementos de áudio foram carregados
  useEffect(() => {
    const checkAudioElements = () => {
      console.log('🔊 Verificando elementos de áudio...');
      console.log('  - soundEntregaRef:', !!soundEntregaRef.current, soundEntregaRef.current?.src);
      console.log('  - soundRetiradaRef:', !!soundRetiradaRef.current, soundRetiradaRef.current?.src);
      console.log('  - soundConsumoLocalRef:', !!soundConsumoLocalRef.current, soundConsumoLocalRef.current?.src);
    };
    
    // Verificar após um pequeno delay para garantir que os elementos foram montados
    const timer = setTimeout(checkAudioElements, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Função para normalizar tipo de pedido
  const normalizarTipoPedido = (tipoPedido) => {
    if (!tipoPedido) return 'entrega';
    const tipo = String(tipoPedido).toLowerCase().trim();
    
    if (tipo.includes('entrega') || tipo.includes('delivery')) return 'entrega';
    if (tipo.includes('retirada') || tipo.includes('retirar') || tipo.includes('pickup') || tipo.includes('balcao')) return 'retirada';
    if (tipo.includes('local') || tipo.includes('consumo') || tipo.includes('mesa') || tipo.includes('salao') || tipo.includes('dine')) return 'local';
    
    return 'entrega'; // padrão
  };

  // Função para obter prioridade do tipo de pedido
  const obterPrioridade = (tipoPedido) => {
    const tipo = normalizarTipoPedido(tipoPedido);
    if (tipo === 'entrega') return 1; // ALTA
    if (tipo === 'retirada') return 2; // MÉDIA
    if (tipo === 'local') return 3; // BAIXA
    return 1; // padrão
  };

  // Função para processar fila de sons
  const processarFilaSons = () => {
    const agora = Date.now();
    
    // Verificar cooldown
    if (agora - lastSoundPlayedRef.current < SOUND_COOLDOWN) {
      console.log('⏳ Cooldown ativo, aguardando...');
      return;
    }

    // Se não há sons pendentes, limpar
    if (pendingSoundsRef.current.length === 0) {
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 PROCESSANDO FILA DE SONS');
    console.log('📋 Pedidos na fila:', pendingSoundsRef.current.length);
    
    // Contar tipos
    const contagem = pendingSoundsRef.current.reduce((acc, tipo) => {
      const normalizado = normalizarTipoPedido(tipo);
      acc[normalizado] = (acc[normalizado] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Contagem por tipo:', contagem);
    
    // Encontrar tipo de maior prioridade
    const tipoMaiorPrioridade = pendingSoundsRef.current.reduce((melhor, atual) => {
      const prioridadeAtual = obterPrioridade(atual);
      const prioridadeMelhor = obterPrioridade(melhor);
      return prioridadeAtual < prioridadeMelhor ? atual : melhor;
    });
    
    const tipoNormalizado = normalizarTipoPedido(tipoMaiorPrioridade);
    console.log('🏆 Tipo de maior prioridade:', tipoNormalizado);
    
    // Criar badge visual
    const badges = [];
    if (contagem.entrega) badges.push(`🏍️ ${contagem.entrega}`);
    if (contagem.retirada) badges.push(`📦 ${contagem.retirada}`);
    if (contagem.local) badges.push(`🍽️ ${contagem.local}`);
    console.log('🏷️ Badge visual:', badges.join(' '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Tocar som do tipo de maior prioridade
    tocarSomDireto(tipoNormalizado);
    
    // Limpar fila
    pendingSoundsRef.current = [];
    lastSoundPlayedRef.current = agora;
  };

  // Função para adicionar som à fila
  const adicionarSomNaFila = (tipoPedido) => {
    console.log('➕ Adicionando som à fila:', tipoPedido);
    
    // Adicionar à fila
    pendingSoundsRef.current.push(tipoPedido);
    
    // Limpar timer anterior
    if (soundQueueTimerRef.current) {
      clearTimeout(soundQueueTimerRef.current);
    }
    
    // Configurar novo timer para processar a fila
    soundQueueTimerRef.current = setTimeout(() => {
      processarFilaSons();
      soundQueueTimerRef.current = null;
    }, QUEUE_WINDOW);
  };

  // Disponibilizar função de teste globalmente para debug
  useEffect(() => {
    window.testarSom = (tipo) => {
      console.log('🧪 Teste de som iniciado para:', tipo);
      setSoundUnlocked(true); // Forçar desbloqueio para teste
      tocarSomDireto(tipo || 'entrega');
    };
    return () => { delete window.testarSom; };
  }, []);

  // Função para tocar som direto (sem fila)
  const tocarSomDireto = (tipoPedido) => {
    // Usar refs para valores atualizados
    const prefAtual = soundPreferenceRef.current;
    const unlockedAtual = soundUnlockedRef.current;
    
    // Se for um teste explícito (chamado pelo window.testarSom), ignoramos as travas
    const isTest = window.testarSom && document.activeElement === document.body; // Heurística simples
    
    const enabledAtual = prefAtual || isTest; // Permitir teste mesmo se preferência estiver off
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 TOCANDO SOM DIRETO');
    console.log('📋 Tipo do pedido:', tipoPedido);
    console.log('📋 soundEnabled (calculado):', enabledAtual);
    console.log('📋 soundPreference (ref):', prefAtual);
    console.log('📋 soundUnlocked (ref):', unlockedAtual);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Tentar recuperar se estiver bloqueado mas houve interação recente
    if (!unlockedAtual && navigator.userActivation?.hasBeenActive) {
        console.log('🔓 Detectado UserActivation ativo, desbloqueando som...');
        setSoundUnlocked(true);
    }

    if (!enabledAtual && !unlockedAtual) {
      console.log('🔇 Som desabilitado ou bloqueado pelo navegador');
      return;
    }
    
    let audioRef = null;
    const tipo = normalizarTipoPedido(tipoPedido);
    
    // Selecionar o som EXATO baseado no tipo de pedido
    if (tipo === 'entrega') {
      audioRef = soundEntregaRef;
      console.log('🔔 Selecionado: som de ENTREGA (/sounds/som_entrega.wav)');
    } else if (tipo === 'retirada') {
      audioRef = soundRetiradaRef;
      console.log('🔔 Selecionado: som de RETIRADA (/sounds/som_retirada.wav)');
    } else if (tipo === 'local') {
      audioRef = soundConsumoLocalRef;
      console.log('🔔 Selecionado: som de CONSUMO NO LOCAL (/sounds/som_consumo_local.wav)');
    }
    
    if (audioRef?.current) {
      console.log('▶️ Tentando reproduzir áudio...');
      const audio = audioRef.current;
      
      // Resetar propriedades para garantir reprodução
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.muted = false;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Som tocado com sucesso!');
            if (!soundUnlockedRef.current) setSoundUnlocked(true);
          })
          .catch((err) => {
            console.warn('❌ Falha na reprodução:', err);
            if (err.name === 'NotAllowedError') {
                console.log('🔒 O navegador bloqueou o som (Autoplay Policy). Interaja com a página primeiro.');
            }
          });
      }
    } else {
      console.warn('⚠️ Elemento de áudio não encontrado para:', tipo);
    }
  };

  // Função principal para tocar som (com sistema de fila)
  const tocarSomPorTipo = (tipoPedido) => {
    adicionarSomNaFila(tipoPedido);
  };

  // ✅ CORREÇÃO: Expor função de som globalmente para uso no Dashboard
  useEffect(() => {
    window._tocarSomPorTipo = tocarSomPorTipo;
    return () => {
      delete window._tocarSomPorTipo;
    };
  }, []);

  // Manter referência do estado atual de pedidos para uso em handlers de evento
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Controles de som (habilitar/desabilitar mediante interação do usuário)
  const enableSound = async () => {
    try {
      console.log('AppContext - Habilitando som (preferência ON)...');
      setSoundPreference(true);
      try { localStorage.setItem('fome-ninja-sound-pref', 'true'); } catch (_) {}
      // Tentar desbloquear o áudio após gesto do usuário
      // Usar o som de entrega como teste
      if (soundEntregaRef.current) {
        console.log('AppContext - Elemento de áudio encontrado, testando...');
        soundEntregaRef.current.currentTime = 0;
        await soundEntregaRef.current.play().then(() => {
          setSoundUnlocked(true);
        }).catch(() => {});
        soundEntregaRef.current.pause();
        soundEntregaRef.current.currentTime = 0;
        console.log('AppContext - Teste de áudio concluído');
      }
      // WebAudio API: tentar resumir se existir
      // @ts-ignore
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        if (ctx.state === 'suspended') { await ctx.resume().catch(() => {}); }
        // Encerrar imediatamente para não manter recursos
        try { ctx.close(); } catch (_) {}
      }
    } catch (error) {
      console.warn('AppContext - Erro ao habilitar som:', error);
    }
  };

  const disableSound = () => {
    setSoundPreference(false);
    try { localStorage.setItem('fome-ninja-sound-pref', 'false'); } catch (_) {}
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }
    // Pausar todos os sons
    [soundEntregaRef, soundRetiradaRef, soundConsumoLocalRef].forEach(ref => {
      if (ref.current) {
        try {
          ref.current.pause();
          ref.current.currentTime = 0;
        } catch (_) {}
      }
    });
  };

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
      // Se já inicializou ou está carregando auth, não faz nada
      if (isInitialized || authLoading) return;
      
      // Se não tem usuário, para o loading global
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('🔄 AppContext: Iniciando carregamento de dados...');
        
        if (authRestauranteId) {
          setRestaurantId(authRestauranteId);
        } else if (user?.id) {
          // Fallback se não vier do contexto
          setRestaurantId(user.id);
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
  }, [user, authLoading, isInitialized, authRestauranteId]); // Dependências limpas

  // Desbloquear áudio no primeiro gesto do usuário sem alterar preferência do usuário
  useEffect(() => {
    const events = ['click', 'pointerdown', 'touchstart', 'keydown'];

    const tryUnlock = async () => {
      if (soundUnlocked) return;
      try {
        // Usar som de entrega para desbloquear
        if (soundEntregaRef.current) {
          soundEntregaRef.current.currentTime = 0;
          await soundEntregaRef.current.play().then(() => {
            setSoundUnlocked(true);
          }).catch(() => {});
          soundEntregaRef.current.pause();
          soundEntregaRef.current.currentTime = 0;
        }
        // WebAudio API
        // @ts-ignore
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          if (ctx.state === 'suspended') { await ctx.resume().catch(() => {}); }
          try { ctx.close(); } catch (_) {}
        }

        // Se já houver "Novas Missões" e preferência ON, tocar imediatamente
        const statusNovosPedidos = ['pendente', 'disponivel', 'novo'];
        const newMissions = (ordersRef.current || []).filter(o => 
          statusNovosPedidos.includes(o.status) && !o.started_at
        );
        if (newMissions.length > 0 && soundPreference) {
          const tipoPedido = newMissions[0]?.tipo_pedido || newMissions[0]?.tipo_entrega || 'entrega';
          console.log('🔔 Tipo do pedido (tryUnlock):', tipoPedido);
          tocarSomPorTipo(tipoPedido);
        }
      } finally {
        events.forEach(evt => window.removeEventListener(evt, tryUnlock, true));
      }
    };

    events.forEach(evt => window.addEventListener(evt, tryUnlock, true));
    return () => { events.forEach(evt => window.removeEventListener(evt, tryUnlock, true)); };
  }, [soundUnlocked, soundPreference]);

  // Real-time de pedidos
  useEffect(() => {
    if (!isInitialized || !restaurantId) return;

    const handleOrderPayload = async (payload) => {
      console.log('Payload recebido:', payload);

      if (payload.eventType === 'INSERT') {
        // Tocar som apenas se for "Novas Missões" (pendente/disponivel sem started_at)
        const statusNovosPedidos = ['pendente', 'disponivel', 'novo'];
        const isNewMission = statusNovosPedidos.includes(payload?.new?.status) && !payload?.new?.started_at;
        // Usar refs para valores atualizados
        const prefAtual = soundPreferenceRef.current;
        const unlockedAtual = soundUnlockedRef.current;
        const enabledAtual = prefAtual && unlockedAtual;
        
        if (isNewMission && enabledAtual) {
          // Identificar o tipo de pedido e tocar o som correspondente
          const tipoPedido = payload?.new?.tipo_pedido || payload?.new?.tipo_entrega || payload?.new?.tipo || 'entrega';
          console.log('🔔 Novo pedido INSERT - tipo:', tipoPedido);
          tocarSomPorTipo(tipoPedido);

          // --- NOTIFICAÇÃO DESKTOP ---
          try {
            const savedNotifSettings = localStorage.getItem('fome-ninja-notification-settings');
            const notifSettings = savedNotifSettings ? JSON.parse(savedNotifSettings) : { desktopNotifications: true, desktopNotificationMode: 'always' };

            if (notifSettings.desktopNotifications) {
              const shouldShow = notifSettings.desktopNotificationMode === 'always' || document.visibilityState === 'hidden';
              
              if (shouldShow) {
                const numero = payload?.new?.numero_pedido || '';
                const cliente = payload?.new?.nome_cliente || 'Cliente';
                const valor = payload?.new?.valor_total || payload?.new?.total || 0;
                const tipoFormatado = tipoPedido.charAt(0).toUpperCase() + tipoPedido.slice(1);

                notificationHelper.sendNotification(`🚀 Novo Pedido #${numero} (${tipoFormatado})`, {
                  body: `Cliente: ${cliente}\nValor: R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`,
                  tag: `pedido-${payload.new.id}`, // Notificação única para este pedido
                });
              }
            }
          } catch (err) {
            console.error('Erro ao processar notificação desktop:', err);
          }
          // ---------------------------
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

  // Efeito para tocar som APENAS UMA VEZ quando chega novo pedido (aceitação automática)
  // ✅ CORREÇÃO: Som toca apenas 1x, não em loop como antes
  useEffect(() => {
    if (!isInitialized) return;

    const checkNewOrders = () => {
      const prefAtual = soundPreferenceRef.current;
      const unlockedAtual = soundUnlockedRef.current;
      const enabledAtual = prefAtual && unlockedAtual;

      // "Novas Missões": status pendente ou disponivel, sem started_at
      const statusNovosPedidos = ['pendente', 'disponivel', 'novo'];
      const newOrders = orders.filter(order =>
        statusNovosPedidos.includes(order.status) && !order.started_at
      );

      if (newOrders.length > 0 && enabledAtual) {
        // ✅ CORREÇÃO: Tocar som APENAS UMA VEZ por pedido novo
        // Usar um Set para rastrear quais pedidos já tiveram som tocado
        const notifiedOrdersRef = window._notifiedOrders = window._notifiedOrders || new Set();
        
        newOrders.forEach(order => {
          if (!notifiedOrdersRef.has(order.id)) {
            console.log(`🔔 [SOM ÚNICO] Tocando para pedido #${order.numero_pedido}`);
            notifiedOrdersRef.add(order.id);
            
            const tipoPedido = order.tipo_pedido || order.tipo_entrega || 'entrega';
            tocarSomPorTipo(tipoPedido);
          }
        });

        // ✅ CORREÇÃO: NÃO criar intervalo de loop - som toca apenas 1x
        // Limpar notificações antigas (pedidos que já foram aceitos/cancelados)
        const currentOrderIds = new Set(orders.map(o => o.id));
        for (const id of notifiedOrdersRef) {
          if (!currentOrderIds.has(id)) {
            notifiedOrdersRef.delete(id);
          }
        }
      }
    };

    // Verificar imediatamente
    checkNewOrders();

    // Verificar a cada 3 segundos (apenas para detectar novos pedidos, não para repetir som)
    const checkInterval = setInterval(checkNewOrders, 3000);

    return () => {
      clearInterval(checkInterval);
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      if (soundQueueTimerRef.current) {
        clearTimeout(soundQueueTimerRef.current);
        soundQueueTimerRef.current = null;
      }
    };
  }, [orders, isInitialized, soundEnabled]);

  // Funções para manipular pedidos
  const addOrder = async (order) => {
    try {
      // Validar tipo_pedido antes de criar
      const tipo = order?.tipo_pedido ?? order?.tipoPedido;
      const allowed = ['delivery', 'retirada', 'local'];
      if (!tipo) {
        throw new Error('Selecione o tipo de pedido antes de continuar.');
      }
      if (!allowed.includes(tipo)) {
        throw new Error('Tipo de pedido inválido.');
      }

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
    soundEnabled,
    soundPreference,
    soundUnlocked,
    enableSound,
    disableSound,
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
      {/* Sons de notificação - 3 tipos específicos */}
      <audio ref={soundEntregaRef} src="/sounds/som_entrega.wav" preload="auto" />
      <audio ref={soundRetiradaRef} src="/sounds/som_retirada.wav" preload="auto" />
      <audio ref={soundConsumoLocalRef} src="/sounds/som_consumo_local.wav" preload="auto" />
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;