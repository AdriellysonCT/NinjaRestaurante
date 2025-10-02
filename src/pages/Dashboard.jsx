import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import * as Icons from "../components/icons/index.jsx";
import { supabase } from "../lib/supabase";
import ImprimirComanda from "../components/ImprimirComanda";
import { OrderDetailModal } from "../components/OrderDetailModal";

const Dashboard = () => {
  const { user, restaurante } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentType, setPaymentType] = useState("all");
  const notificationSoundRef = useRef(null);
  const [playedNotifications, setPlayedNotifications] = useState(new Set());
  const [restaurantId, setRestaurantId] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const progressTimerRef = useRef(null);
  const [progressTick, setProgressTick] = useState(0);
  const [printJob, setPrintJob] = useState(null);
  const audioRef = useRef(null);
  const audioLoopRef = useRef(null);
  const audioVolumeRef = useRef(0.8);

  // Mapeamento de status para colunas
  const orderStatusMapping = {
    disponivel: "Novas Missões",
    em_preparo: "Em Preparo",
    pronto_para_entrega: "Prontos Para Entrega",
    a_caminho: "A Caminho",
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
          )
        `)
        .eq("id_restaurante", restaurantId)
        .in("status", [
          "disponivel",
          "aceito",
          "em_preparo",
          "pronto_para_entrega",
          "a_caminho",
        ])
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
        console.log(
          "Processando pedido:",
          pedido.numero_pedido,
          "com",
          pedido.itens_pedido?.length || 0,
          "itens"
        );

        const totalPrepFromItems =
          pedido.itens_pedido?.reduce((sum, item) => {
            const itemPrep = Number(item?.itens_cardapio?.tempo_preparo) || 0;
            return sum + itemPrep;
          }, 0) || 0;

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          customerName: pedido.nome_cliente || "Cliente não informado",
          telefone_cliente: pedido.telefone_cliente || null,
          status: pedido.status === "aceito" ? "em_preparo" : pedido.status,
          total: parseFloat(pedido.valor_total || 0),
          paymentType: pedido.metodo_pagamento || pedido.forma_pagamento || "N/A",
          paymentMethod: pedido.metodo_pagamento || pedido.forma_pagamento || "N/A",
          created_at: pedido.criado_em,
          started_at: pedido.started_at || pedido.iniciado_em,
          prepTime:
            (Number.isFinite(Number(pedido.prep_time)) && Number(pedido.prep_time) > 0)
              ? Number(pedido.prep_time)
              : totalPrepFromItems,
          isVip: pedido.cliente_vip || pedido.is_vip || false,
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
        (payload) => {
          console.log("Mudança detectada nos pedidos:", payload);
          fetchOrders(); // Recarregar pedidos quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders]);

  // Copiar pedido para entregas_padronizadas
  const copyToEntregas = async (pedidoId) => {
    try {
      // Buscar dados do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_padronizados")
        .select("*")
        .eq("id", pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      // Inserir na tabela entregas_padronizadas
      const { error: entregaError } = await supabase
        .from("entregas_padronizadas")
        .insert({
          id_pedido: pedido.id,
          id_restaurante: pedido.id_restaurante,
          numero_pedido: pedido.numero_pedido,
          nome_cliente: pedido.nome_cliente,
          endereco_entrega: pedido.endereco_entrega,
          telefone_cliente: pedido.telefone_cliente,
          valor_total: pedido.valor_total,
          forma_pagamento: pedido.forma_pagamento,
          status_entrega: "aguardando_coleta",
          criado_em: new Date().toISOString(),
        });

      if (entregaError) throw entregaError;

      console.log("Pedido copiado para entregas com sucesso");
    } catch (error) {
      console.error("Erro ao copiar pedido para entregas:", error);
      throw error;
    }
  };

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch((e) => {
        console.warn("Erro ao tocar áudio do arquivo:", e);
        // Fallback: criar som usando Web Audio API
        try {
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
          }
        } catch (fallbackError) {
          console.warn("Erro no fallback de áudio:", fallbackError);
        }
      });
    }
  }, []);

  // Notificações sonoras - Audio API
  const tocarSomNotificacao = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = audioVolumeRef.current;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch (_) {}
  }, []);

  const verificarNovosPedidos = useCallback(() => {
    return orders.some((o) => o.status === "disponivel");
  }, [orders]);

  const iniciarLoopNotificacao = useCallback(() => {
    if (audioLoopRef.current) return; // já rodando
    tocarSomNotificacao();
    audioLoopRef.current = setInterval(() => {
      tocarSomNotificacao();
    }, 5000);
  }, [tocarSomNotificacao]);

  const pararLoopNotificacao = useCallback(() => {
    if (audioLoopRef.current) {
      clearInterval(audioLoopRef.current);
      audioLoopRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Inicializar Audio na montagem
  useEffect(() => {
    const audio = new Audio("/sounds/Notificação_Pedidos.wav");
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      pararLoopNotificacao();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [pararLoopNotificacao]);

  // Monitorar lista de pedidos para iniciar/parar o loop
  useEffect(() => {
    if (verificarNovosPedidos()) {
      iniciarLoopNotificacao();
    } else {
      pararLoopNotificacao();
    }
  }, [orders, iniciarLoopNotificacao, pararLoopNotificacao, verificarNovosPedidos]);

  // Calcular tempo restante para pedidos em preparo
  const calcularTempoRestante = (startedAt, totalMinutes) => {
    if (!startedAt || !Number.isFinite(Number(totalMinutes)) || Number(totalMinutes) <= 0) {
      return { minutos: 0, atrasado: false, elapsedMin: 0 };
    }
    const inicio = new Date(startedAt).getTime();
    const agora = Date.now();
    const totalMs = Number(totalMinutes) * 60 * 1000;
    const decorridoMs = Math.max(0, agora - inicio);
    const restanteMs = totalMs - decorridoMs;
    const atrasado = restanteMs <= 0;
    const minutos = atrasado ? 0 : Math.ceil(restanteMs / 60000);
    const elapsedMin = Math.floor(decorridoMs / 60000);
    return { minutos, atrasado, elapsedMin };
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

  const getStatusTempo = (minutosRestantes) => {
    return minutosRestantes <= 0 ? "Atrasado" : "Tempo Restante";
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const searchTermMatch =
      searchTerm === "" ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.numero_pedido?.toString().includes(searchTerm);
    const paymentTypeMatch =
      paymentType === "all" || order.paymentMethod === paymentType;
    return searchTermMatch && paymentTypeMatch;
  });

  // Organizar pedidos por status
  const statusColumns = Object.keys(orderStatusMapping).map((status) => ({
    title: orderStatusMapping[status],
    status: status,
    orders: filteredOrders.filter((order) => order.status === status),
  }));

  // Calcular ranking de produtos mais vendidos hoje
  const calculateProductRanking = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(
        order.created_at || order.timestamp
      ).toDateString();
      return (
        orderDate === today &&
        (order.status === "entregue" ||
          order.status === "a_caminho" ||
          order.status === "pronto_para_entrega")
      );
    });

    const productCount = {};

    todayOrders.forEach((order) => {
      if (order.items) {
        order.items.forEach((item) => {
          const productName = item.name;
          productCount[productName] =
            (productCount[productName] || 0) + (item.qty || 1);
        });
      }
    });

    // Converter para array e ordenar por quantidade
    const ranking = Object.entries(productCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Top 3

    return ranking;
  };

  const productRanking = calculateProductRanking();

  // Atualizar status do pedido
  const handleStatusChange = async (orderId, newStatus) => {
    // Marcar pedido como sendo atualizado
    setUpdatingOrders((prev) => new Set(prev).add(orderId));

    try {
      const updates = { status: newStatus };

      // Adicionar timestamp quando aceitar o pedido
      if (newStatus === "em_preparo") {
        updates.iniciado_em = new Date().toISOString();
      }

      // Atualizar no banco
      const { error } = await supabase
        .from("pedidos_padronizados")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      // Se mudou para "pronto_para_entrega", copiar para entregas
      if (newStatus === "pronto_para_entrega") {
        await copyToEntregas(orderId);
      }

      // Atualizar estado local imediatamente
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                started_at:
                  newStatus === "em_preparo"
                    ? new Date().toISOString()
                    : order.started_at,
              }
            : order
        )
      );

      // Impressão automática ao aceitar missão
      if (newStatus === "em_preparo") {
        try {
          const pedidoBase = orders.find((o) => o.id === orderId);
          if (pedidoBase) {
            const pedidoParaImpressao = {
              id: pedidoBase.id,
              numero_pedido: pedidoBase.numero_pedido,
              nome_cliente: pedidoBase.customerName,
              telefone_cliente: pedidoBase.telefone_cliente,
              tipo_pedido: pedidoBase.tipo_pedido || "Balcão",
              criado_em: pedidoBase.created_at,
              itens_pedido: (pedidoBase.items || []).map((it) => ({
                quantidade: it.qty,
                itens_cardapio: { nome: it.name },
                preco_unitario: it.price,
              })),
              subtotal: pedidoBase.total,
              valor_total: pedidoBase.total,
              metodo_pagamento: pedidoBase.paymentMethod,
              prep_time: pedidoBase.prepTime,
            };
            setPrintJob({ pedido: pedidoParaImpressao, restaurante });
          }
        } catch (e) {
          console.warn("Falha ao preparar comanda para impressão:", e);
        }
      }

      // Parar som de notificação se aceitar um pedido
      if (newStatus === "em_preparo" && notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current.currentTime = 0;
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
  };

  // Fechar modal
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  // Renderizar botão de status
  const renderStatusButton = (order) => {
    const buttonConfig = {
      disponivel: {
        text: "Aceitar Missão",
        nextStatus: "em_preparo",
        className: "bg-green-600 hover:bg-green-700 text-white",
      },
      em_preparo: {
        text: "Pronto para Entrega",
        nextStatus: "pronto_para_entrega",
        className: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      pronto_para_entrega: {
        text: "Coletado",
        nextStatus: "a_caminho",
        className: "bg-yellow-600 hover:bg-yellow-700 text-white",
      },
      a_caminho: {
        text: "Entregue",
        nextStatus: "entregue",
        className: "bg-gray-600 hover:bg-gray-700 text-white",
      },
    };

    const config = buttonConfig[order.status];
    if (!config) return null;

    const isUpdating = updatingOrders.has(order.id);

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isUpdating) {
            handleStatusChange(order.id, config.nextStatus);
          }
        }}
        disabled={isUpdating}
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
    if (order.status !== "em_preparo" || !order.started_at || !order.prepTime)
      return null;

    const { minutos, atrasado } = calcularTempoRestante(order.started_at, order.prepTime);
    const progressPercentage = calcularPorcentagemProgresso(order.started_at, order.prepTime);

    return (
      <div className="mt-3">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-semibold">{getStatusTempo(minutos)}:</span>
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
              atrasado ? "bg-red-500" : "bg-orange-500"
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Atualização do progresso em tempo real a cada segundo
  useEffect(() => {
    const hasActive = orders.some(
      (o) => o.status === "em_preparo" && o.started_at && o.prepTime > 0
    );
    if (hasActive) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        setProgressTick((t) => t + 1);
      }, 1000);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [orders]);

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

          {/* Ranking de Produtos */}
          <div className="w-80 bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Icons.BarChart3Icon className="w-5 h-5 text-orange-500" />
              <h3 className="text-white font-bold">
                Ranking de Produtos (Hoje)
              </h3>
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
              placeholder="Filtrar por nome ou ID..."
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

          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-600 text-sm">
            <Icons.BellIcon className="w-4 h-4" />
            Sons
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-600 text-sm">
            <Icons.PrinterIcon className="w-4 h-4" />
            Imprimir Lote
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-600 text-sm">
            <Icons.FileTextIcon className="w-4 h-4" />
            Histórico
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-600 text-sm">
            <Icons.SettingsIcon className="w-4 h-4" />
            Config. Impressão
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-600 text-sm">
            <Icons.DownloadIcon className="w-4 h-4" />
            Exportar CSV
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
                        className="bg-gray-800 rounded-lg p-3 space-y-2 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600"
                        onClick={() => handleCardClick(order)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-sm truncate">
                              Pedido #{order.numero_pedido}
                            </h3>
                            <p className="text-xs text-gray-300 truncate">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-orange-400 font-semibold">
                              {order.paymentType?.toUpperCase() || "N/A"}
                            </p>
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

        {/* Modal de detalhes - novo design */}
        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={handleCloseModal}
          order={selectedOrder}
        />

        {/* Áudio de notificação */}
        <audio ref={notificationSoundRef} preload="none">
          <source src="/sounds/Notificação_Pedidos.wav" type="audio/wav" />
          <source src="/sounds/notification.mp3" type="audio/mpeg" />
        </audio>
      </div>
    {printJob && (
      <ImprimirComanda
        pedido={printJob.pedido}
        restaurante={printJob.restaurante}
        auto={true}
        onAfterPrint={() => setPrintJob(null)}
      />
    )}
    </ErrorBoundary>
  );
};

export default Dashboard;
