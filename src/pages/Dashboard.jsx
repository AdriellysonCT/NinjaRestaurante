import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import ErrorBoundary from "../components/ErrorBoundary";
import * as Icons from "../components/icons/index.jsx";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { supabase } from "../lib/supabase";

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
    
    console.log(`Mapeando pedido ${order.numero_pedido}: status="${order.status}", tipo_pedido="${order.tipo_pedido}"`);
    
    // Para pedidos de retirada/consumo local, fluxo simplificado
    const isLocalOrPickup = order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local';
    if (isLocalOrPickup) {
      switch (order.status) {
        case 'disponivel':
          console.log(`  -> Pedido LOCAL ${order.numero_pedido} mapeado para: novas_missoes`);
          return 'novas_missoes';
        case 'aceito':
          console.log(`  -> Pedido LOCAL ${order.numero_pedido} mapeado para: em_preparo`);
          return 'em_preparo';
        case 'concluido':
          console.log(`  -> Pedido LOCAL ${order.numero_pedido} mapeado para: concluido`);
          return 'concluido';
        case 'cancelado':
          console.log(`  -> Pedido LOCAL ${order.numero_pedido} mapeado para: cancelado`);
          return 'cancelado';
        default:
          console.log(`  -> Pedido LOCAL ${order.numero_pedido} mapeado para: novas_missoes (default)`);
          return 'novas_missoes';
      }
    }
    
    // Para pedidos de entrega (delivery), fluxo completo
    switch (order.status) {
      case 'disponivel':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: novas_missoes`);
        return 'novas_missoes';
      case 'em_preparo':
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: em_preparo`);
        return 'em_preparo';
      case 'aceito':
        // No backend, 'aceito' significa em preparo
        console.log(`  -> Pedido ENTREGA ${order.numero_pedido} mapeado para: em_preparo`);
        return 'em_preparo';
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

  // Configurar realtime para novos pedidos
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel("pedidos_dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos_padronizados",
          filter: `id_restaurante=eq.${restaurantId}`,
        },
        async (payload) => {
          console.log("Mudança detectada nos pedidos:", payload);
          
          // Aceitar automaticamente novos pedidos se a opção estiver ativada
          if (payload?.eventType === 'INSERT' && autoAcceptEnabled) {
            const newOrder = payload.new;
            if (newOrder.status === 'disponivel') {
              console.log('🤖 Aceitação automática ativada - aceitando pedido:', newOrder.numero_pedido);
              try {
                // Atualizar diretamente no banco
                const { error: updateError } = await supabase
                  .from("pedidos_padronizados")
                  .update({ 
                    status: 'aceito',
                    started_at: new Date().toISOString()
                  })
                  .eq("id", newOrder.id);

                if (updateError) {
                  console.error('❌ Erro ao aceitar pedido automaticamente:', updateError);
                } else {
                  console.log('✅ Pedido aceito automaticamente:', newOrder.numero_pedido);
                }
              } catch (error) {
                console.error('❌ Erro ao aceitar pedido automaticamente:', error);
              }
            }
          }
          
          // Marcar badge quando mudança vier (UPDATE) com status do entregador
          try {
            if (payload?.eventType === 'UPDATE') {
              const oldStatus = payload?.old?.status;
              const newStatus = payload?.new?.status;
              const relevant = ['aceito','coletado','concluido'];
              if (oldStatus !== newStatus && relevant.includes(newStatus)) {
                setDriverUpdatedAt((prev) => ({ ...prev, [payload.new.id]: Date.now() }));
              }
            }
          } catch (_) {}
          fetchOrders(); // Recarregar pedidos quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders, autoAcceptEnabled]);

  // Limpar badges antigos (expiram em 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverUpdatedAt((prev) => {
        const now = Date.now();
        const out = {};
        for (const id in prev) {
          if (now - prev[id] < 5 * 60 * 1000) out[id] = prev[id];
        }
        return out;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Copiar pedido para entregas_padronizadas
  // Removido: agora a sincronização é feita por trigger no banco de dados

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    console.log('Tentando tocar som de notificação...');
    if (notificationSoundRef.current) {
      console.log('Elemento de áudio encontrado, tocando som...');
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch((e) => {
        console.warn("Erro ao tocar áudio do arquivo:", e);
        // Fallback: criar som usando Web Audio API
        try {
          console.log('Tentando fallback com Web Audio API...');
          // @ts-ignore - Suporte para navegadores antigos
          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(
              600,
              audioContext.currentTime + 0.1
            );

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.3
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            console.log('Fallback executado com sucesso');
          }
        } catch (fallbackError) {
          console.warn("Erro no fallback de áudio:", fallbackError);
        }
      });
    } else {
      console.warn('Elemento de áudio não encontrado');
    }
  }, []);

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
      orders: filteredOrders.filter((order) => getVisualStage(order) === stage),
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
  };

  // Fechar modal
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  // Toggle de aceitação automática
  const toggleAutoAccept = async () => {
    const newValue = !autoAcceptEnabled;
    setAutoAcceptEnabled(newValue);
    try {
      localStorage.setItem('fome-ninja-auto-accept', newValue ? 'true' : 'false');
    } catch (_) {}
    console.log('Aceitação automática:', newValue ? 'ATIVADA' : 'DESATIVADA');

    // Se ativou, aceitar pedidos pendentes automaticamente
    if (newValue) {
      console.log('🔄 Verificando pedidos pendentes para aceitar automaticamente...');
      const pedidosPendentes = orders.filter(order => order.status === 'disponivel' && !order.started_at);
      
      if (pedidosPendentes.length > 0) {
        setProcessingAutoAccept(true);
        console.log(`📋 Encontrados ${pedidosPendentes.length} pedidos pendentes para aceitar`);
        
        // Processar pedidos em lote com pequeno delay entre cada um
        for (let i = 0; i < pedidosPendentes.length; i++) {
          const pedido = pedidosPendentes[i];
          try {
            console.log(`⏳ Aceitando pedido ${i + 1}/${pedidosPendentes.length}: #${pedido.numero_pedido}...`);
            await handleStatusChange(pedido.id, 'aceito');
            console.log(`✅ Pedido #${pedido.numero_pedido} aceito com sucesso`);
            // Pequeno delay para não sobrecarregar
            if (i < pedidosPendentes.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (error) {
            console.error(`❌ Erro ao aceitar pedido #${pedido.numero_pedido}:`, error);
          }
        }
        
        setProcessingAutoAccept(false);
        console.log('✅ Todos os pedidos pendentes foram processados!');
      } else {
        console.log('ℹ️ Não há pedidos pendentes para aceitar');
      }
    }
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
        className: "bg-green-600 hover:bg-green-700 text-white",
      },
      em_preparo: {
        // Retirada/Local: finaliza direto; Delivery: vai para pronto_para_entrega
        text: isLocalOrder ? "Concluir" : "Pronto para Entrega",
        nextStatus: isLocalOrder ? "concluido" : "pronto_para_entrega",
        className: isLocalOrder ? "bg-green-600 hover:bg-green-700 text-white" : "bg-yellow-600 hover:bg-yellow-700 text-white",
      },
      pronto: {
        text: "Aguardando Entregador",
        nextStatus: null,
        className: "bg-green-700 text-white cursor-not-allowed",
      },
      coletado: {
        text: "Aguardando Conclusão",
        nextStatus: null,
        className: "bg-orange-700 text-white cursor-not-allowed",
      },
      concluido: {
        text: "Concluído",
        nextStatus: null,
        className: "bg-gray-700 text-white cursor-not-allowed",
      },
      cancelado: {
        text: "Cancelado",
        nextStatus: null,
        className: "bg-red-700 text-white cursor-not-allowed",
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
        className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${
          isUpdating ? "bg-gray-500 cursor-not-allowed" : config.className
        }`}
      >
        {isUpdating && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
        {isUpdating ? "Atualizando..." : config.text}
      </button>
    );
  };

  // Renderizar barra de progresso
  const renderProgressBar = (order) => {
    if (order.status !== "aceito" || !order.started_at || !order.prepTime)
      return null;

    const { minutos, atrasado } = calcularTempoRestante(order.started_at, order.prepTime);
    const progressPercentage = calcularPorcentagemProgresso(order.started_at, order.prepTime);

    return (
      <div className="mt-3">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-semibold">
            {atrasado ? "Atrasado" : "Tempo Restante"}:
          </span>
          <span
            className={`flex items-center gap-1 ${
              atrasado ? "text-red-500 font-bold" : "text-orange-500"
            }`}
          >
            <Icons.ClockIcon className="w-4 h-4" />
            {minutos} MIN
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded">
          <div
            className={`h-2 rounded transition-all duration-1000 ease-linear ${
              atrasado ? "bg-red-500" : "bg-yellow-500"
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen"
        style={{ backgroundColor: "#121212" }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <div className="text-white text-lg">Carregando pedidos...</div>
        <div className="text-gray-400 text-sm mt-2">
          Conectando ao sistema...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen"
        style={{ backgroundColor: "#121212" }}
      >
        <div className="text-red-500 text-center max-w-md">
          <Icons.AlertCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Erro ao carregar pedidos</h2>
          <p className="text-gray-300 mb-4">
            {error.message || "Erro desconhecido"}
          </p>
          <button
            onClick={fetchOrders}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg"
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
        className="flex flex-col justify-center items-center h-screen"
        style={{ backgroundColor: "#121212" }}
      >
        <div className="text-yellow-500 text-center">
          <Icons.AlertCircleIcon className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Configuração Necessária</h2>
          <p className="text-gray-300">Configurando seu restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ backgroundColor: "#121212" }} className="min-h-screen p-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
        </div>

        {/* Banner Modo Batalha + Ranking */}
        <div className="flex gap-4 mb-4">
          {/* Banner Modo Batalha */}
          <div className="flex-1 bg-gradient-to-r from-orange-800 to-orange-600 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.NinjaStarIcon className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-white font-bold text-lg">Modo Batalha</h2>
                <p className="text-orange-100 text-sm">
                  Você está 3 pedidos à frente do "Sushi Palace"!
                </p>
              </div>
            </div>
            <button className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 px-4 rounded-lg">
              Ver Ranking
            </button>
          </div>

          {/* Resumo de Pagamentos */}
          <div className="w-80 bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Icons.CreditCardIcon className="w-5 h-5 text-orange-500" />
              <h3 className="text-white font-bold">Status de Pagamentos</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-400 text-sm font-medium">🟢 Pagos (PIX/Cartão)</span>
                <span className="text-white font-bold">
                  {orders.filter(o => o.paymentStatus === 'pago').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400 text-sm font-medium">🟡 Pendentes (Dinheiro)</span>
                <span className="text-white font-bold">
                  {orders.filter(o => o.paymentStatus === 'pendente').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400 text-sm font-medium">🔴 Estornados</span>
                <span className="text-white font-bold">
                  {orders.filter(o => o.paymentStatus === 'estornado').length}
                </span>
              </div>
              <div className="border-t border-gray-600 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">Total de Pedidos</span>
                  <span className="text-orange-400 font-bold text-lg">
                    {orders.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking de Produtos */}
            <div className="w-80 bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Icons.BarChart3Icon className="w-5 h-5 text-orange-500" />
              <h3 className="text-white font-bold">
                Ranking de Produtos ({rankingPeriod === 'week' ? 'Semana' : 'Hoje'})
              </h3>
            </div>

            <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
              <span>{rankingSinceLabel}</span>
              <select value={rankingPeriod} onChange={(e)=> setRankingPeriod(e.target.value)} className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600">
                <option value="day">Hoje</option>
                <option value="week">Semana</option>
              </select>
            </div>

            <div className="space-y-2">
              {productRanking.length === 0 ? (
                <p className="text-gray-400 text-center py-2 text-sm">
                  Nenhum produto vendido hoje
                </p>
              ) : (
                productRanking.map((product, index) => {
                  const maxCount = productRanking[0]?.count || 1;
                  const percentage = (product.count / maxCount) * 100;

                  return (
                    <div key={product.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-medium">
                          {index + 1}. {product.name}
                        </span>
                        <span className="text-gray-300 text-xs">{product.count}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
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
        <div className="flex gap-3 items-center mb-4">
          <div className="relative">
            <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar por nome ou número do pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600 w-64"
            />
          </div>

          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
          >
            <option value="all">Tipo de Pagamento</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="debit_card">Cartão de Débito</option>
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
          </select>

          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
          >
            <option value="all">Tipo de Entrega</option>
            <option value="delivery">🚚 Entrega</option>
            <option value="retirada">🏪 Retirada</option>
            <option value="local">🍽️ Consumo Local</option>
          </select>

          <button
            onClick={() => {
              if (!soundEnabled) {
                enableSound && enableSound();
              } else {
                disableSound && disableSound();
              }
            }}
            className={`bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-600 text-sm ${soundEnabled ? 'ring-2 ring-green-500' : ''}`}
          >
            <Icons.BellIcon className={`w-4 h-4 ${soundEnabled ? 'text-green-400' : ''}`} />
            {soundEnabled ? 'Sons ON' : 'Sons OFF'}
          </button>

          <button
            onClick={toggleAutoAccept}
            disabled={processingAutoAccept}
            className={`py-2 px-3 rounded-lg flex items-center gap-2 border text-sm font-semibold transition-all ${
              processingAutoAccept
                ? 'bg-orange-600 text-white border-orange-500 cursor-wait'
                : autoAcceptEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-500 ring-2 ring-green-400' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
            }`}
          >
            {processingAutoAccept ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </>
            ) : (
              <>
                <Icons.CheckCircleIcon className={`w-4 h-4 ${autoAcceptEnabled ? 'text-green-200' : ''}`} />
                {autoAcceptEnabled ? 'Aceitar Auto: ON' : 'Aceitar Auto: OFF'}
              </>
            )}
          </button>
        </div>

        {/* Grid de colunas adaptativas */}
        <div className="grid grid-cols-4 gap-4 auto-cols-fr">
          {statusColumns.map((column) => (
            <div
              key={column.status}
              className="border-2 rounded-lg min-w-0"
              style={{ borderColor: "#FF6B00" }}
            >
              <div style={{ backgroundColor: "#FF6B00" }} className="p-3">
                <h2 className="text-white font-bold text-sm">
                  {column.title} ({column.orders.length})
                </h2>
              </div>
              <div
                style={{ backgroundColor: "#121212" }}
                className="p-3 min-h-96"
              >
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
                        className="bg-gray-800 rounded-lg p-3 space-y-2 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600 relative"
                        onClick={() => handleCardClick(order)}
                      >
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
                            <h3 className="font-bold text-white text-sm truncate">
                              Pedido #{order.numero_pedido}
                            </h3>
                            <p className="text-xs text-gray-300 truncate">
                              {order.customerName}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-orange-400 font-semibold">
                                {order.paymentType?.toUpperCase() || "N/A"}
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
                            <p className="font-bold text-orange-400 text-sm">
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

                        <ul className="text-xs space-y-1 text-gray-300">
                          {order.items?.map((item, index) => (
                            <li key={index} className="truncate">
                              {item.qty}x {item.name}
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
