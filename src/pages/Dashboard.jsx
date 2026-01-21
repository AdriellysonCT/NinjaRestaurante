import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import ErrorBoundary from "../components/ErrorBoundary";
import * as Icons from "../components/icons/index.jsx";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { supabase } from "../lib/supabase";
import { printService } from "../services/printService";

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentType, setPaymentType] = useState("all");
  const [deliveryType, setDeliveryType] = useState("all");
  const notificationSoundRef = useRef(null);
  const [playedNotifications, setPlayedNotifications] = useState(new Set());
  const [restaurantId, setRestaurantId] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const [rankingPeriod, setRankingPeriod] = useState("day"); // 'day' | 'week'
  const progressTimerRef = useRef(null);
  const [progressTick, setProgressTick] = useState(0);
  const [driverUpdatedAt, setDriverUpdatedAt] = useState({}); // { [orderId]: timestamp }
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(() => {
    try {
      return localStorage.getItem('fome-ninja-auto-accept') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [processingAutoAccept, setProcessingAutoAccept] = useState(false);
  const autoAcceptRef = useRef(false); // Ref para evitar problemas de closure
  const processedOrdersRef = useRef(new Set()); // Evitar processar o mesmo pedido duas vezes
  const [unreadMessages, setUnreadMessages] = useState({}); // { [orderId]: count }

  // Obter controle de som do contexto
  const { soundEnabled, enableSound, disableSound } = useAppContext?.() || {};

  // Removido: não forçar auto-enable; respeitar preferência + desbloqueio por gesto

  // Mapeamento das "etapas visuais" (não são novos status no banco)
  const orderStatusMapping = {
    novas_missoes: "Novas Missões",
    em_preparo: "Em Preparo",
    pronto: "Pronto para Entregar",
    aceito: "Aceitos",
    coletado: "Coletados",
    concluido: "Concluídos",
    cancelado: "Cancelados",
  };

  // Determina a etapa visual a partir do status real + tipo_pedido
  const getVisualStage = (order) => {
    if (!order) return 'novas_missoes';
    
    console.log(`Mapeando pedido ${order.numero_pedido}: status="${order.status}", tipo_pedido="${order.tipo_pedido}", entregador="${order.nome_entregador || 'nenhum'}"`);
    
    // Para pedidos de retirada/consumo local, fluxo simplificado
    // Fluxo: Novas Missões -> Em Preparo -> Concluído/Cancelado
    const isLocalOrPickup = order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local';
    if (isLocalOrPickup) {
      switch (order.status) {
        case 'pendente':
        case 'novo':
        case 'disponivel':
          console.log(`  -> Pedido LOCAL/RETIRADA ${order.numero_pedido} mapeado para: novas_missoes`);
          return 'novas_missoes';
        case 'aceito':
        case 'em_preparo':
          console.log(`  -> Pedido LOCAL/RETIRADA ${order.numero_pedido} mapeado para: em_preparo`);
          return 'em_preparo';
        case 'concluido':
          console.log(`  -> Pedido LOCAL/RETIRADA ${order.numero_pedido} mapeado para: concluido`);
          return 'concluido';
        case 'cancelado':
          console.log(`  -> Pedido LOCAL/RETIRADA ${order.numero_pedido} mapeado para: cancelado`);
          return 'cancelado';
        // Casos de status de entrega que não devem ocorrer em pedidos locais/retirada
        // mas se ocorrerem, tratamos adequadamente
        case 'pronto_para_entrega':
        case 'coletado':
          console.log(`  -> ⚠️ Pedido LOCAL/RETIRADA ${order.numero_pedido} com status de entrega inválido "${order.status}", mapeando para: em_preparo`);
          return 'em_preparo';
        default:
          console.log(`  -> Pedido LOCAL/RETIRADA ${order.numero_pedido} mapeado para: novas_missoes (default)`);
          return 'novas_missoes';
      }
    }
    
    // Para pedidos de entrega (delivery), fluxo completo
    switch (order.status) {
      case 'pendente':
      case 'novo':
      case 'disponivel':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: novas_missoes`);
        return 'novas_missoes';
      case 'em_preparo':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: em_preparo`);
        return 'em_preparo';
      case 'aceito':
        // CORREÇÃO: Diferenciar entre "aceito pelo restaurante" e "aceito pelo entregador"
        // Se tem entregador associado, significa que foi aceito pelo entregador
        if (order.nome_entregador || order.id_entregador) {
          console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: aceito (aceito pelo entregador)`);
          return 'aceito';
        } else {
          // Se não tem entregador, significa que foi aceito pelo restaurante (em preparo)
          console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: em_preparo (aceito pelo restaurante)`);
          return 'em_preparo';
        }
      case 'pronto_para_entrega':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: pronto`);
        return 'pronto';
      case 'coletado':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: coletado`);
        return 'coletado';
      case 'concluido':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: concluido`);
        return 'concluido';
      case 'cancelado':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: cancelado`);
        return 'cancelado';
      default:
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: novas_missoes (default)`);
        return 'novas_missoes';
    }
  };

  // Buscar ID do restaurante
  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("restaurantes_app")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar restaurante:", error);
          setError(
            new Error("Restaurante não encontrado. Verifique sua configuração.")
          );
          return;
        }

        if (data?.id) {
          setRestaurantId(data.id);
        }
      } catch (error) {
        console.error("Erro ao buscar ID do restaurante:", error);
        setError(error);
      }
    };

    fetchRestaurantId();
  }, [user]);

  // Buscar pedidos do banco
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("Buscando pedidos para restaurante:", restaurantId);

      // Buscar pedidos com embedding explícito
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos_padronizados")
        .select(`
          *,
          itens_pedido!itens_pedido_id_pedido_fkey (
            id,
            quantidade,
            preco_unitario,
            preco_total,
            id_item_cardapio,
            itens_cardapio!fk_itens_pedido_itens_cardapio (
              id,
              nome,
              descricao,
              preco,
              categoria,
              tempo_preparo
            )
          ),
          entregas_padronizadas (
            nome_entregador,
            id_entregador,
            status
          )
        `)
        .eq("id_restaurante", restaurantId)
        .order("criado_em", { ascending: false });

      if (pedidosError) {
        console.error("Erro ao buscar pedidos:", pedidosError);
        throw pedidosError;
      }

      console.log("Pedidos encontrados:", pedidosData?.length || 0);

      const pedidosDataFinal = pedidosData || [];
      console.log("Pedidos processados:", pedidosDataFinal.length);

      // Transformar dados para o formato esperado pelo frontend
      const formattedOrders = pedidosDataFinal.map((pedido) => {
        const totalPrepFromItems =
          pedido.itens_pedido?.reduce((sum, item) => {
            const itemPrep = Number(item?.itens_cardapio?.tempo_preparo) || 0;
            return sum + itemPrep;
          }, 0) || 0;
        console.log(
          "Processando pedido:",
          pedido.numero_pedido,
          "Status do banco:",
          pedido.status,
          "Started_at:",
          pedido.started_at,
          "com",
          pedido.itens_pedido?.length || 0,
          "itens"
        );

        // Calcular total a partir dos itens se valor_total estiver zerado ou nulo
        const valorTotalBanco = parseFloat(pedido.valor_total || pedido.total || 0);
        const totalCalculadoItens = pedido.itens_pedido?.reduce((sum, item) => {
          const precoItem = parseFloat(item.preco_total || (item.preco_unitario * item.quantidade) || 0);
          return sum + precoItem;
        }, 0) || 0;
        
        const totalFinal = valorTotalBanco > 0 ? valorTotalBanco : totalCalculadoItens;

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          customerName: pedido.nome_cliente || "Cliente não informado",
          telefone_cliente: pedido.telefone_cliente || null,
          status: pedido.status,
          originalStatus: pedido.status,
          total: totalFinal,
          valor_total: totalFinal, // Adicionar também como valor_total para o modal
          paymentType: pedido.metodo_pagamento || pedido.forma_pagamento || "N/A",
          paymentMethod: pedido.metodo_pagamento || pedido.forma_pagamento || "N/A",
          paymentStatus: pedido.status_pagamento || (pedido.pagamento_recebido_pelo_sistema ? 'pago' : 'pendente'),
          troco: pedido.troco || 0,
          tipo_pedido: pedido.tipo_pedido, // Tipo agora é obrigatório e vem do front
          created_at: pedido.criado_em,
          started_at: pedido.started_at,
          prepTime:
            (Number.isFinite(Number(pedido.prep_time)) && Number(pedido.prep_time) > 0)
              ? Number(pedido.prep_time)
              : totalPrepFromItems,
          isVip: pedido.cliente_vip || pedido.is_vip || false,
          nome_entregador: pedido.entregas_padronizadas?.nome_entregador || null,
          id_entregador: pedido.entregas_padronizadas?.id_entregador || null,
          items:
            pedido.itens_pedido?.map((item) => ({
              id: item.id,
              name: item.itens_cardapio?.nome || "Item desconhecido",
              qty: item.quantidade || 1,
              price: parseFloat(item.preco_unitario || item.preco_total || 0),
              prepTime: item.itens_cardapio?.tempo_preparo || 0,
              category: item.itens_cardapio?.categoria || "",
              description: item.itens_cardapio?.descricao || "",
            })) || [],
            unreadCount: 0, // Será preenchido pelo estado local no render
        };
      });

      console.log("Pedidos formatados:", formattedOrders.length);
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Carregar pedidos ao montar o componente
  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
    }
  }, [restaurantId, fetchOrders]);

  // Manter ref sincronizado com estado
  useEffect(() => {
    autoAcceptRef.current = autoAcceptEnabled;
  }, [autoAcceptEnabled]);

  // Função para aceitar pedido automaticamente (isolada para reutilização)
  const autoAcceptOrder = useCallback(async (order) => {
    // Verificar se já foi processado
    if (processedOrdersRef.current.has(order.id)) {
      console.log(`⏭️ Pedido #${order.numero_pedido} já foi processado, ignorando...`);
      return false;
    }
    
    // Marcar como processado
    processedOrdersRef.current.add(order.id);
    
    console.log(`🤖 Aceitando pedido automaticamente: #${order.numero_pedido}`);
    
    try {
      const { error: updateError } = await supabase
        .from("pedidos_padronizados")
        .update({ 
          status: 'aceito',
          started_at: new Date().toISOString()
        })
        .eq("id", order.id)
        .eq("status", "disponivel"); // Só atualiza se ainda estiver disponível

      if (updateError) {
        console.error(`❌ Erro ao aceitar pedido #${order.numero_pedido}:`, updateError);
        processedOrdersRef.current.delete(order.id); // Permitir retry
        return false;
      }
      
      console.log(`✅ Pedido #${order.numero_pedido} aceito automaticamente!`);
      
      // Impressão automática
      try {
        console.log('🖨️ Disparando impressão automática...');
        const { data: restauranteData } = await supabase
          .from('restaurantes_app')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        printService.autoPrintOnAccept(order, restauranteData).catch(err => {
          console.warn('Erro na impressão automática:', err);
        });
      } catch (printError) {
        console.warn('Erro ao tentar impressão automática:', printError);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao aceitar pedido #${order.numero_pedido}:`, error);
      processedOrdersRef.current.delete(order.id); // Permitir retry
      return false;
    }
  }, [restaurantId]);

  // Configurar realtime para novos pedidos
  useEffect(() => {
    if (!restaurantId) return;

    console.log('📡 Configurando realtime para restaurante:', restaurantId);

    const channel = supabase
      .channel(`pedidos_dashboard_${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos_padronizados",
          filter: `id_restaurante=eq.${restaurantId}`,
        },
        async (payload) => {
          const eventType = payload?.eventType;
          const pedidoNum = payload?.new?.numero_pedido || payload?.old?.numero_pedido;
          
          console.log(`📨 Mudança detectada nos pedidos: ${eventType} - Pedido #${pedidoNum}`);
          
          // Log detalhado para UPDATE
          if (eventType === 'UPDATE') {
            const oldStatus = payload?.old?.status;
            const newStatus = payload?.new?.status;
            const hasDriver = payload?.new?.id_entregador || payload?.new?.nome_entregador;
            
            if (oldStatus !== newStatus) {
              console.log(`  📊 Status mudou: "${oldStatus}" -> "${newStatus}"${hasDriver ? ' (com entregador)' : ''}`);
            }
          }
          
          // Aceitar automaticamente novos pedidos se a opção estiver ativada
          if (eventType === 'INSERT' && autoAcceptRef.current) {
            const newOrder = payload.new;
            if (newOrder?.status === 'disponivel') {
              console.log(`  🤖 Novo pedido detectado, aceitação automática ativada`);
              // Pequeno delay para garantir que o pedido foi salvo completamente
              setTimeout(() => {
                autoAcceptOrder(newOrder);
              }, 500);
            }
          }
          
          // Marcar badge quando mudança vier (UPDATE) com status do entregador
          try {
            if (eventType === 'UPDATE') {
              const oldStatus = payload?.old?.status;
              const newStatus = payload?.new?.status;
              const relevant = ['aceito','coletado','concluido'];
              if (oldStatus !== newStatus && relevant.includes(newStatus)) {
                console.log(`  🔔 Badge de atualização ativado para pedido #${pedidoNum}`);
                setDriverUpdatedAt((prev) => ({ ...prev, [payload.new.id]: Date.now() }));
              }
            }
          } catch (_) {}
          
          // Recarregar pedidos quando houver mudanças (ATUALIZAÇÃO EM TEMPO REAL)
          console.log(`  🔄 Recarregando pedidos em tempo real...`);
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal realtime:', status);
      });

    return () => {
      console.log('📡 Desconectando canal realtime');
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders, autoAcceptOrder]);



  // Função para tocar som de notificação (movida para o início para evitar TDZ)
  const playNotificationSound = useCallback((type = 'order') => {
    console.log(`Tentando tocar som de notificação (${type})...`);
    
    // Se for som de chat (bip curto)
    if (type === 'chat') {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audioContext = new AudioContextClass();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            console.warn("Erro ao tocar som de chat:", e);
        }
        return;
    }

    if (notificationSoundRef.current) {
      console.log('Elemento de áudio encontrado, tocando som...');
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch((e) => {
        console.warn("Erro ao tocar áudio do arquivo:", e);
        // Fallback: criar som usando Web Audio API
        try {
          console.log('Tentando fallback com Web Audio API...');
          // @ts-ignore
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          }
        } catch (fallbackError) {
          console.warn("Erro no fallback de áudio:", fallbackError);
        }
      });
    } else {
      console.warn('Elemento de áudio não encontrado');
    }
  }, []);

  // Realtime para MENSAGENS DE CHAT
  useEffect(() => {
    if (!restaurantId) return;

    const channelChat = supabase
      .channel(`mensagens_global_${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_entrega",
          filter: `tipo_remetente=eq.entregador`, // Só interessa msg de entregador
        },
        async (payload) => {
           console.log('💬 Nova mensagem recebida:', payload.new);
           const pedidoId = payload.new.pedido_id;
           
           // Tocar som discreto
           playNotificationSound('chat');
           
           // Incrementar contador de não lidas para este pedido
           setUnreadMessages(prev => ({
             ...prev,
             [pedidoId]: (prev[pedidoId] || 0) + 1
           }));
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channelChat);
    };
  }, [restaurantId, playNotificationSound]);

  // Verificação periódica de pedidos pendentes (backup do realtime)
  useEffect(() => {
    if (!restaurantId || !autoAcceptEnabled) return;
    
    const checkPendingOrders = async () => {
      if (!autoAcceptRef.current) return;
      
      const pendingOrders = orders.filter(
        order => order.status === 'disponivel' && !processedOrdersRef.current.has(order.id)
      );
      
      if (pendingOrders.length > 0) {
        console.log(`🔄 Verificação periódica: ${pendingOrders.length} pedidos pendentes encontrados`);
        for (const order of pendingOrders) {
          await autoAcceptOrder(order);
          await new Promise(resolve => setTimeout(resolve, 300)); // Delay entre pedidos
        }
      }
    };
    
    // Verificar a cada 10 segundos
    const interval = setInterval(checkPendingOrders, 10000);
    
    // Verificar imediatamente ao ativar
    checkPendingOrders();
    
    return () => clearInterval(interval);
  }, [restaurantId, autoAcceptEnabled, orders, autoAcceptOrder]);

  // Limpar badges antigos (expiram em 5 minutos) e pedidos processados antigos
  useEffect(() => {
    const interval = setInterval(() => {
      // Limpar badges antigos
      setDriverUpdatedAt((prev) => {
        const now = Date.now();
        const out = {};
        for (const id in prev) {
          if (now - prev[id] < 5 * 60 * 1000) out[id] = prev[id];
        }
        return out;
      });
      
      // Limpar pedidos processados que não estão mais na lista
      const currentOrderIds = new Set(orders.map(o => o.id));
      const toRemove = [];
      processedOrdersRef.current.forEach(id => {
        if (!currentOrderIds.has(id)) {
          toRemove.push(id);
        }
      });
      toRemove.forEach(id => processedOrdersRef.current.delete(id));
    }, 60000);
    return () => clearInterval(interval);
  }, [orders]);

  // Copiar pedido para entregas_padronizadas
  // Removido: agora a sincronização é feita por trigger no banco de dados

  // DESABILITADO: Lógica de som movida para AppContext para evitar conflitos
  // O AppContext já gerencia o som de notificação com loop e verificação contínua

  // Calcular tempo restante para pedidos em preparo
  const calcularTempoRestante = (startedAt, prepTime) => {
    if (!startedAt || !prepTime) return { minutos: 0, atrasado: false };

    const agora = new Date();
    const inicio = new Date(startedAt);
    const tempoEstimado = prepTime * 60 * 1000; // em milissegundos
    const passado = agora - inicio;
    const restante = tempoEstimado - passado;

    if (restante <= 0) {
      return { minutos: 0, atrasado: true };
    }

    return { minutos: Math.ceil(restante / 60000), atrasado: false };
  };
  const calcularPorcentagemProgresso = (startedAt, totalMinutes) => {
    if (!startedAt || !Number.isFinite(Number(totalMinutes)) || Number(totalMinutes) <= 0) {
      return 0;
    }
    const inicio = new Date(startedAt).getTime();
    const agora = Date.now();
    const totalMs = Number(totalMinutes) * 60 * 1000;
    const decorridoMs = Math.max(0, agora - inicio);
    const percent = (decorridoMs / totalMs) * 100;
    return Math.max(0, Math.min(100, percent));
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const searchTermMatch =
      searchTerm === "" ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.numero_pedido?.toString().includes(searchTerm);
    const paymentTypeMatch =
      paymentType === "all" || order.paymentMethod === paymentType;
    const deliveryTypeMatch =
      deliveryType === "all" || order.tipo_pedido === deliveryType;

    // Lógica para esconder pedidos concluídos/cancelados de dias anteriores
    // Isso evita que o dashboard fique poluído com histórico antigo
    const stage = getVisualStage(order);
    if (stage === 'concluido' || stage === 'cancelado') {
      if (!order.created_at) return true; // Se não tiver data, mostra por segurança
      
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      const isSameDay = 
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear();
        
      if (!isSameDay) return false;
    }

    return searchTermMatch && paymentTypeMatch && deliveryTypeMatch;
  });

  // Organizar pedidos por etapa visual (ordem clara)
  const orderedStages = [
    'novas_missoes',
    'em_preparo',
    'pronto',
    'aceito',
    'coletado',
    'concluido',
    'cancelado'
  ];
  const statusColumns = orderedStages
    .filter((s) => orderStatusMapping[s])
    .map((stage) => ({
      title: orderStatusMapping[stage],
      status: stage,
      orders: filteredOrders.map(o => ({...o, unreadCount: unreadMessages[o.id] || 0})).filter((order) => getVisualStage(order) === stage),
    }));

  // Calcular ranking de produtos mais vendidos hoje
  const calculateProductRanking = (period = "day") => {
    // Intervalo do período em horário local
    const now = new Date();
    let start;
    if (period === "week") {
      // início da semana (segunda-feira)
      const d = new Date(now);
      const day = d.getDay(); // 0 (Dom) .. 6 (Sáb)
      const diffToMonday = ((day + 6) % 7); // 0 se segunda
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - diffToMonday);
      start = d;
    } else {
      // hoje
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }
    const end = now;

    const insideToday = (d) => {
      const dt = d ? new Date(d) : null;
      if (!dt || Number.isNaN(dt.getTime())) return false;
      return dt >= start && dt <= end;
    };

    // Considera pedidos criados hoje e aceitos (status original 'aceito').
    // Observação: na formatação mapeamos 'aceito' -> 'em_preparo' para as colunas,
    // então usamos originalStatus para o ranking.
    const todayOrders = orders.filter(
      (o) => insideToday(o.created_at || o.timestamp) && (o.originalStatus === 'aceito')
    );

    const productCount = {};
    todayOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const name = it.name || 'Item';
        const qty = Number(it.qty || 1);
        productCount[name] = (productCount[name] || 0) + qty;
      });
    });

    return Object.entries(productCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const productRanking = useMemo(() => calculateProductRanking(rankingPeriod), [orders, rankingPeriod]);

  const rankingSinceLabel = useMemo(() => {
    const now = new Date();
    if (rankingPeriod === "week") {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = ((day + 6) % 7);
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - diffToMonday);
      return `desde ${d.toLocaleDateString('pt-BR')} 00:00`;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
    return `desde ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }, [rankingPeriod]);

  // removido duplicado - usamos o productRanking do useMemo acima

  // Atualizar status do pedido
  const handleStatusChange = async (orderId, newStatus) => {
    // Marcar pedido como sendo atualizado
    setUpdatingOrders((prev) => new Set(prev).add(orderId));

    try {
      const updates = { status: newStatus };

      // Adicionar timestamp quando iniciar preparo
      if (newStatus === "aceito") {
        updates.started_at = new Date().toISOString();
      }

      // Atualizar no banco
      const { error } = await supabase
        .from("pedidos_padronizados")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      // Sincronização com entregas é feita pela trigger no banco

      // Atualizar estado local imediatamente
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                started_at:
                  newStatus === "aceito"
                    ? new Date().toISOString()
                    : order.started_at,
              }
            : order
        )
      );

      // Parar som de notificação se aceitar um pedido e limpar da lista de tocados
      if (newStatus === "aceito") {
        if (notificationSoundRef.current) {
          notificationSoundRef.current.pause();
          notificationSoundRef.current.currentTime = 0;
        }
        // Remover da lista de notificações tocadas
        setPlayedNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        
        // Impressão automática ao aceitar pedido
        try {
          const orderToprint = orders.find(o => o.id === orderId);
          if (orderToprint) {
            console.log('🖨️ Disparando impressão automática ao aceitar pedido...');
            // Buscar dados do restaurante
            const { data: restauranteData } = await supabase
              .from('restaurantes_app')
              .select('*')
              .eq('id', restaurantId)
              .single();
            
            // Disparar impressão automática (não bloqueia o fluxo)
            printService.autoPrintOnAccept(orderToprint, restauranteData).catch(err => {
              console.warn('Erro na impressão automática:', err);
            });
          }
        } catch (printError) {
          console.warn('Erro ao tentar impressão automática:', printError);
          // Não bloqueia o fluxo principal
        }
      }

      console.log(`Status do pedido ${orderId} atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      // Mostrar erro temporário
      alert(`Erro ao atualizar pedido: ${error.message}`);
    } finally {
      // Remover pedido da lista de atualizações
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Abrir modal de detalhes
  const handleCardClick = (order) => {
    setSelectedOrder(order);
    // Ao abrir, remover badge de "via entregador"
    setDriverUpdatedAt((prev) => {
      if (!prev[order.id]) return prev;
      const copy = { ...prev };
      delete copy[order.id];
      return copy;
    });
    // Limpar badge de mensagens não lidas
    setUnreadMessages(prev => {
        if (!prev[order.id]) return prev;
        const copy = { ...prev };
        delete copy[order.id];
        return copy;
    });
  };

  // Fechar modal
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  // Toggle de aceitação automática
  const toggleAutoAccept = async () => {
    const newValue = !autoAcceptEnabled;
    
    // Atualizar estado e localStorage
    setAutoAcceptEnabled(newValue);
    autoAcceptRef.current = newValue;
    
    try {
      localStorage.setItem('fome-ninja-auto-accept', newValue ? 'true' : 'false');
    } catch (_) {}
    
    console.log('🔄 Aceitação automática:', newValue ? 'ATIVADA' : 'DESATIVADA');

    // Se desativou, limpar lista de processados para permitir reprocessamento futuro
    if (!newValue) {
      processedOrdersRef.current.clear();
      return;
    }

    // Se ativou, aceitar pedidos pendentes automaticamente
    console.log('🔍 Verificando pedidos pendentes para aceitar automaticamente...');
    const pedidosPendentes = orders.filter(
      order => order.status === 'disponivel' && !processedOrdersRef.current.has(order.id)
    );
    
    if (pedidosPendentes.length === 0) {
      console.log('ℹ️ Não há pedidos pendentes para aceitar');
      return;
    }
    
    setProcessingAutoAccept(true);
    console.log(`📋 Encontrados ${pedidosPendentes.length} pedidos pendentes para aceitar`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Processar pedidos em lote
    for (let i = 0; i < pedidosPendentes.length; i++) {
      const pedido = pedidosPendentes[i];
      
      // Verificar se ainda está ativado (usuário pode ter desativado durante o processamento)
      if (!autoAcceptRef.current) {
        console.log('⏹️ Aceitação automática desativada durante processamento');
        break;
      }
      
      console.log(`⏳ Aceitando pedido ${i + 1}/${pedidosPendentes.length}: #${pedido.numero_pedido}...`);
      
      const success = await autoAcceptOrder(pedido);
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Pequeno delay para não sobrecarregar
      if (i < pedidosPendentes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setProcessingAutoAccept(false);
    
    if (errorCount > 0) {
      console.log(`⚠️ Processamento concluído: ${successCount} aceitos, ${errorCount} erros`);
    } else {
      console.log(`✅ Todos os ${successCount} pedidos pendentes foram aceitos!`);
    }
    
    // Recarregar pedidos para atualizar a UI
    fetchOrders();
  };

  // Renderizar botão de status conforme fluxo solicitado por tipo_pedido
  const renderStatusButton = (order) => {
    const stage = getVisualStage(order);
    const isLocalOrder = order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local';
    
    // Configuração baseada no tipo de pedido
    const buttonConfigByStage = {
      novas_missoes: {
        text: "Aceitar Missão",
        nextStatus: "aceito", // disponivel -> aceito
        className: "bg-success hover:bg-success/90 text-white shadow-sm",
      },
      em_preparo: {
        // Retirada/Local: finaliza direto; Delivery: vai para pronto_para_entrega
        text: isLocalOrder ? "Concluir" : "Pronto para Entrega",
        nextStatus: isLocalOrder ? "concluido" : "pronto_para_entrega",
        className: isLocalOrder ? "bg-success hover:bg-success/90 text-white shadow-sm" : "bg-primary hover:bg-primary/90 text-white shadow-sm",
      },
      pronto: {
        text: "Aguardando Coleta",
        nextStatus: null,
        className: "bg-primary/20 text-primary border border-primary/30 cursor-default",
      },
      coletado: {
        text: "Em Entrega",
        nextStatus: null,
        className: "bg-secondary text-muted-foreground cursor-default",
      },
      concluido: {
        text: "Entregue",
        nextStatus: null,
        className: "bg-secondary text-muted-foreground cursor-default",
      },
      cancelado: {
        text: "Cancelado",
        nextStatus: null,
        className: "bg-destructive/20 text-destructive border border-destructive/30 cursor-default",
      },
    };

    const config = buttonConfigByStage[stage];
    if (!config) return null;

    const isUpdating = updatingOrders.has(order.id);

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isUpdating && config.nextStatus) {
            handleStatusChange(order.id, config.nextStatus);
          }
        }}
        disabled={isUpdating || !config.nextStatus}
        className={`w-full px-3 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
          isUpdating ? "bg-secondary text-muted-foreground cursor-not-allowed" : config.className
        }`}
      >
        {isUpdating && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        )}
        {isUpdating ? "Processando..." : config.text}
      </button>
    );
  };

  const renderProgressBar = (order) => {
    // Só mostrar barra de progresso se o estágio visual for 'em_preparo'
    if (getVisualStage(order) !== "em_preparo" || !order.started_at || !order.prepTime)
      return null;

    const { minutos, atrasado } = calcularTempoRestante(order.started_at, order.prepTime);
    const progressPercentage = calcularPorcentagemProgresso(order.started_at, order.prepTime);

    return (
      <div className="mt-3">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-semibold text-card-foreground">
            {atrasado ? "Atrasado" : "Restante"}:
          </span>
          <span
            className={`flex items-center gap-1 font-bold ${
              atrasado ? "text-destructive" : "text-primary"
            }`}
          >
            <Icons.ClockIcon className="w-4 h-4" />
            {minutos}m
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ease-linear shadow-sm ${
              atrasado ? "bg-destructive animate-pulse" : "bg-primary"
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <div className="text-foreground text-lg font-semibold">Carregando pedidos...</div>
        <div className="text-muted-foreground text-sm mt-2">
          Conectando ao sistema...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen bg-background"
      >
        <div className="text-destructive text-center max-w-md">
          <Icons.AlertCircleIcon className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Erro ao carregar pedidos</h2>
          <p className="text-muted-foreground mb-4">
            {error.message || "Erro desconhecido"}
          </p>
          <button
            onClick={fetchOrders}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen bg-background"
      >
        <div className="text-primary text-center">
          <Icons.AlertCircleIcon className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Configuração Necessária</h2>
          <p className="text-muted-foreground">Configurando seu restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-4 bg-background text-foreground">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        </div>

        {/* Banner Modo Batalha + Ranking */}
        <div className="flex gap-4 mb-4">
          {/* Banner Modo Batalha */}
          <div className="flex-1 bg-gradient-to-r from-primary to-primary/70 rounded-lg p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Icons.NinjaStarIcon className="w-8 h-8 text-yellow-400 drop-shadow-md" />
              <div>
                <h2 className="text-primary-foreground font-bold text-lg">Modo Batalha</h2>
                <p className="text-primary-foreground/90 text-sm">
                  Você está 3 pedidos à frente do "Sushi Palace"!
                </p>
              </div>
            </div>
            <button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">
              Ver Ranking
            </button>
          </div>

          {/* Resumo de Pagamentos */}
          <div className="w-80 bg-card rounded-lg p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Icons.CreditCardIcon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-card-foreground">Status de Pagamentos</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-success text-sm font-semibold">🟢 Pagos (PIX/Cartão)</span>
                <span className="text-card-foreground font-bold">
                  {orders.filter(o => o.paymentStatus === 'pago').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-500 dark:text-yellow-400 text-sm font-semibold">🟡 Pendentes (Dinheiro)</span>
                <span className="text-card-foreground font-bold">
                  {orders.filter(o => o.paymentStatus === 'pendente').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-destructive text-sm font-semibold">🔴 Estornados</span>
                <span className="text-card-foreground font-bold">
                  {orders.filter(o => o.paymentStatus === 'estornado').length}
                </span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Total de Pedidos</span>
                  <span className="text-primary font-bold text-lg">
                    {orders.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking de Produtos */}
            <div className="w-80 bg-card rounded-lg p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Icons.BarChart3Icon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-card-foreground">
                Ranking de Produtos ({rankingPeriod === 'week' ? 'Semana' : 'Hoje'})
              </h3>
            </div>

            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span>{rankingSinceLabel}</span>
              <select value={rankingPeriod} onChange={(e)=> setRankingPeriod(e.target.value)} className="bg-secondary text-foreground rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="day">Hoje</option>
                <option value="week">Semana</option>
              </select>
            </div>

            <div className="space-y-2">
              {productRanking.length === 0 ? (
                <p className="text-muted-foreground text-center py-2 text-sm italic">
                  Nenhum produto vendido no período
                </p>
              ) : (
                productRanking.map((product, index) => {
                  const maxCount = productRanking[0]?.count || 1;
                  const percentage = (product.count / maxCount) * 100;

                  return (
                    <div key={product.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-card-foreground text-sm font-medium truncate pr-2">
                          {index + 1}. {product.name}
                        </span>
                        <span className="text-muted-foreground text-xs font-bold">{product.count}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="flex gap-3 items-center mb-4 flex-wrap">
          <div className="relative">
            <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card text-foreground rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border w-64 shadow-sm"
            />
          </div>

          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="bg-card text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border shadow-sm"
          >
            <option value="all">Filtro de Pagamento</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="debit_card">Cartão de Débito</option>
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
          </select>

          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
            className="bg-card text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border shadow-sm"
          >
            <option value="all">Filtro de Logística</option>
            <option value="delivery">🚚 Entrega</option>
            <option value="retirada">🏪 Retirada</option>
            <option value="local">🍽️ Local</option>
          </select>

          <button
            onClick={() => {
              if (!soundEnabled) {
                enableSound && enableSound();
              } else {
                disableSound && disableSound();
              }
            }}
            className={`bg-card hover:bg-secondary text-foreground py-2 px-3 rounded-lg flex items-center gap-2 border border-border text-sm shadow-sm transition-all ${soundEnabled ? 'ring-2 ring-success bg-success/10' : ''}`}
          >
            <Icons.BellIcon className={`w-4 h-4 ${soundEnabled ? 'text-success' : 'text-muted-foreground'}`} />
            {soundEnabled ? 'Sons Ativos' : 'Silencioso'}
          </button>

          <button
            onClick={toggleAutoAccept}
            disabled={processingAutoAccept}
            className={`py-2 px-3 rounded-lg flex items-center gap-2 border text-sm font-semibold transition-all shadow-sm ${
              processingAutoAccept
                ? 'bg-primary/50 text-white border-primary cursor-wait'
                : autoAcceptEnabled 
                  ? 'bg-success hover:bg-success/90 text-white border-success ring-2 ring-success/30' 
                  : 'bg-card hover:bg-secondary text-foreground border-border'
            }`}
          >
            {processingAutoAccept ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </>
            ) : (
              <>
                <Icons.CheckCircleIcon className={`w-4 h-4 ${autoAcceptEnabled ? 'text-white' : 'text-muted-foreground'}`} />
                {autoAcceptEnabled ? 'Auto-Aceite: ON' : 'Auto-Aceite: OFF'}
              </>
            )}
          </button>
        </div>

        {/* Grid de colunas adaptativas */}
        <div className="grid grid-cols-4 gap-4 auto-cols-fr">
          {statusColumns.map((column) => (
            <div
              key={column.status}
              className="border-2 rounded-lg min-w-0 flex flex-col border-primary/30"
            >
              <div className="p-3 bg-primary">
                <h2 className="text-primary-foreground font-bold text-sm">
                  {column.title} ({column.orders.length})
                </h2>
              </div>
              <div className="p-3 min-h-[400px] flex-1 bg-secondary/20">
                {column.orders.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-center text-sm">
                      Nenhum pedido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {column.orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-card rounded-lg p-3 space-y-2 cursor-pointer hover:bg-secondary/80 transition-all border border-border shadow-sm relative group"
                        onClick={() => handleCardClick(order)}
                      >
                        {/* Badge de MENSAGENS NÃO LIDAS do CHAT */}
                        {order.unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10 animate-bounce">
                            {order.unreadCount}
                          </span>
                        )}

                        {/* Badge via entregador */}
                        {driverUpdatedAt[order.id] && ['aceito','coletado','concluido'].includes(order.status) && (
                          <span
                            title={`Atualizado às ${new Date(driverUpdatedAt[order.id]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} pelo entregador`}
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 
                              ${order.status === 'aceito' ? 'bg-blue-600' : order.status === 'coletado' ? 'bg-orange-600' : 'bg-gray-600'} text-white`}
                            aria-label="Atualizado pelo entregador"
                          >
                            <Icons.TruckIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">via entregador</span>
                          </span>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-card-foreground text-sm truncate">
                              Pedido #{order.numero_pedido}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                              {order.customerName}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-primary font-black tracking-wider uppercase">
                                {order.paymentType || "N/A"}
                              </p>
                              {order.tipo_pedido && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  order.tipo_pedido === 'delivery' ? 'bg-blue-600 text-white' :
                                  order.tipo_pedido === 'retirada' ? 'bg-green-600 text-white' :
                                  order.tipo_pedido === 'local' ? 'bg-purple-600 text-white' :
                                  'bg-gray-600 text-white'
                                }`}>
                                  {order.tipo_pedido === 'delivery' ? '🚚' :
                                   order.tipo_pedido === 'retirada' ? '🏪' :
                                   order.tipo_pedido === 'local' ? '🍽️' :
                                   '📦'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-black text-primary text-sm">
                              R$ {order.total?.toFixed(2) || "0.00"}
                            </p>
                            {order.isVip && (
                              <div className="flex items-center justify-end gap-1 text-xs text-yellow-400 mt-1">
                                <Icons.NinjaStarIcon className="w-3 h-3 fill-current" />
                                <span>VIP</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <ul className="text-xs space-y-1 text-muted-foreground border-t border-border/50 pt-2">
                          {order.items?.map((item, index) => (
                            <li key={index} className="truncate flex justify-between">
                              <span>{item.qty}x {item.name}</span>
                            </li>
                          )) || <li>Sem itens</li>}
                        </ul>

                        {/* Mostrar troco para pedidos pendentes (dinheiro) */}
                        {order.paymentStatus === 'pendente' && order.troco > 0 && (
                          <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded">
                            <div className="flex items-center gap-2">
                              <Icons.CoinIcon className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-semibold">
                                Troco: R$ {order.troco.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {renderProgressBar(order)}

                        <div className="pt-2">{renderStatusButton(order)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal de detalhes */}
        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={handleCloseModal}
          order={selectedOrder}
        />

        {/* Áudio de notificação */}
        <audio ref={notificationSoundRef} preload="auto">
          <source src="/sounds/Notificação_Pedidos.wav" type="audio/wav" />
        </audio>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
