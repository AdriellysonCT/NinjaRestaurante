import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";
import * as Icons from "../components/icons/index.jsx";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { supabase } from "../lib/supabase";
import { printService } from "../services/printService";
import { logger } from "../utils/logger";
import * as orderService from "../services/orderService";
import { notificationService } from "../services/notificationService";
import { isToday } from "../utils/dateFormatter";
import { utcToSaoPaulo, nowInSaoPaulo } from "../utils/timezone";

const AUTO_ACCEPT_DELAY_MS = 500;

const STAGE_ORDER = {
  novas_missoes: 0,
  em_preparo: 1,
  pronto: 2,
  aceito: 3,
  coletado: 4,
  falha_entrega: 5,
  cancelado: 6,
  concluido: 7,
};

const STAGE_META = {
  novas_missoes: {
    label: "Nova missao",
    shortLabel: "Novas",
    pillClass: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
  },
  em_preparo: {
    label: "Em preparo",
    shortLabel: "Preparo",
    pillClass: "bg-orange-500/15 text-orange-500 border border-orange-500/30",
  },
  pronto: {
    label: "Pronto para entrega",
    shortLabel: "Pronto",
    pillClass: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
  },
  aceito: {
    label: "Em preparo",
    shortLabel: "Preparo",
    pillClass: "bg-sky-500/15 text-sky-500 border border-sky-500/30",
  },
  coletado: {
    label: "Coletados",
    shortLabel: "Coletados",
    pillClass: "bg-violet-500/15 text-violet-500 border border-violet-500/30",
  },
  falha_entrega: {
    label: "Falha na entrega",
    shortLabel: "Falha",
    pillClass: "bg-rose-500/15 text-rose-500 border border-rose-500/30",
  },
  cancelado: {
    label: "Cancelados",
    shortLabel: "Cancelados",
    pillClass: "bg-slate-500/15 text-slate-500 border border-slate-500/30",
  },
  concluido: {
    label: "Concluídos",
    shortLabel: "Concluídos",
    pillClass: "bg-teal-500/15 text-teal-500 border border-teal-500/30",
  },
  pausado: {
    label: "Pausado",
    shortLabel: "Pausado",
    pillClass: "bg-slate-500/20 text-slate-500 border border-slate-500/30",
  },
};

const FILTER_TABS = [
  { key: "all", label: "Todos" },
  { key: "novas_missoes", label: "Nova missão" },
  { key: "em_preparo", label: "Em preparo" },
  { key: "pronto", label: "Pronto p/ entrega" },
  { key: "coletado", label: "Coletados" },
  { key: "problemas", label: "Falhas / Cancelados" },
  { key: "concluido", label: "Concluídos" },
];

const TYPE_BADGE_LABELS = {
  delivery: "DEL",
  retirada: "RET",
  local: "LOCAL",
};

const TYPE_BADGE_CLASSES = {
  delivery: "bg-blue-600 text-white",
  retirada: "bg-green-600 text-white",
  local: "bg-purple-600 text-white",
};

const isPendingStatus = (status) => ["pendente", "novo", "disponivel"].includes(status);

const getVisualStage = (order) => {
  if (!order) return "novas_missoes";

  const isLocalOrPickup = order.tipo_pedido === "retirada" || order.tipo_pedido === "local";

  if (isLocalOrPickup) {
    switch (order.status) {
      case "pendente":
      case "novo":
      case "disponivel":
        return "novas_missoes";
      case "aceito":
      case "em_preparo":
        return "em_preparo";
      case "concluido":
        return "concluido";
      case "cancelado":
        return "cancelado";
      default:
        return "novas_missoes";
    }
  }

  switch (order.status) {
    case "pendente":
    case "novo":
    case "disponivel":
      return "novas_missoes";
    case "aceito":
    case "em_preparo":
      return "em_preparo";
    case "pronto_para_entrega":
      return "pronto";
    case "coletado":
      return "coletado";
    case "concluido":
      return "concluido";
    case "falha_entrega":
      return "falha_entrega";
    case "cancelado":
      return "cancelado";
    default:
      return "novas_missoes";
  }
};

const getTypeBadgeLabel = (tipoPedido) => TYPE_BADGE_LABELS[tipoPedido] || "PED";
const getTypeBadgeClass = (tipoPedido) => TYPE_BADGE_CLASSES[tipoPedido] || "bg-gray-600 text-white";

export const DashboardMobile = () => {
  const { user, restaurante, atualizarDadosRestaurante, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const activeTab = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("tab") === "info" ? "info" : "pedidos";
  }, [location.search]);

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStage, setFilterStage] = useState("all");
  const [restaurantId, setRestaurantId] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(() => {
    try {
      return localStorage.getItem("fome-ninja-auto-accept") === "true";
    } catch (_) {
      return false;
    }
  });
  const [processingAutoAccept, setProcessingAutoAccept] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [isUpdatingRestaurantStatus, setIsUpdatingRestaurantStatus] = useState(false);
  const [isUpdatingPause, setIsUpdatingPause] = useState(false);
  const [showConfirmEncerrar, setShowConfirmEncerrar] = useState(false);

  const autoAcceptRef = useRef(autoAcceptEnabled);
  const processedOrdersRef = useRef(new Set());
  const isRestaurantOnline = Boolean(restaurante?.ativo);
  const isRestaurantPaused = Boolean(restaurante?.pausado);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (!user?.id) return;

      try {
        const { data, error: restaurantError } = await supabase
          .from("restaurantes_app")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (restaurantError) {
          logger.error("Erro ao buscar restaurante:", restaurantError);
          setError(new Error("Restaurante nao encontrado. Verifique sua configuracao."));
          return;
        }

        if (data?.id) {
          setRestaurantId(data.id);
        }
      } catch (fetchError) {
        logger.error("Erro ao buscar ID do restaurante:", fetchError);
        setError(fetchError);
      }
    };

    fetchRestaurantId();
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
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
            status,
            motivo_falha_entrega,
            fim_tentativa_entrega,
            tempo_espera_segundos
          )
        `)
        .eq("id_restaurante", restaurantId)
        .neq("tipo_pedido", "local");

      if (restaurante?.ultimo_fechamento_em) {
        query = query.gt("criado_em", restaurante.ultimo_fechamento_em);
      }

      const { data: pedidosData, error: pedidosError } = await query.order("criado_em", { ascending: false });

      if (pedidosError) throw pedidosError;

      const formattedOrders = (pedidosData || []).map((pedido) => {
        const totalPrepFromItems =
          pedido.itens_pedido?.reduce((sum, item) => sum + (Number(item?.itens_cardapio?.tempo_preparo) || 0), 0) || 0;

        const valorTotalBanco = parseFloat(pedido.valor_total || pedido.total || 0);
        const totalCalculadoItens =
          pedido.itens_pedido?.reduce((sum, item) => {
            const precoItem = parseFloat(item.preco_total || item.preco_unitario * item.quantidade || 0);
            return sum + precoItem;
          }, 0) || 0;

        const totalFinal = valorTotalBanco > 0 ? valorTotalBanco : totalCalculadoItens;
        const entrega = Array.isArray(pedido.entregas_padronizadas)
          ? pedido.entregas_padronizadas[0]
          : pedido.entregas_padronizadas;

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          customerName: pedido.nome_cliente || "Cliente nao informado",
          telefone_cliente: pedido.telefone_cliente || null,
          status: pedido.status,
          total: totalFinal,
          paymentType: pedido.metodo_pagamento || pedido.forma_pagamento || "N/A",
          paymentStatus: pedido.status_pagamento || (pedido.pagamento_recebido_pelo_sistema ? "pago" : "pendente"),
          troco: pedido.troco || 0,
          tipo_pedido: pedido.tipo_pedido,
          created_at: pedido.criado_em,
          started_at: pedido.started_at,
          prepTime:
            Number.isFinite(Number(pedido.prep_time)) && Number(pedido.prep_time) > 0
              ? Number(pedido.prep_time)
              : totalPrepFromItems,
          isVip: pedido.cliente_vip || pedido.is_vip || false,
          nome_entregador: entrega?.nome_entregador || null,
          id_entregador: entrega?.id_entregador || null,
          motivo_falha_entrega: entrega?.motivo_falha_entrega || null,
          tempo_espera_segundos: entrega?.tempo_espera_segundos || 0,
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

      setOrders(formattedOrders);
    } catch (fetchError) {
      logger.error("Erro ao buscar pedidos:", fetchError);
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, restaurante?.ultimo_fechamento_em]);

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
    }
  }, [restaurantId, fetchOrders]);

  useEffect(() => {
    autoAcceptRef.current = autoAcceptEnabled;
  }, [autoAcceptEnabled]);

  const autoAcceptOrder = useCallback(async (order) => {
    if (!order?.id || processedOrdersRef.current.has(order.id)) {
      return false;
    }

    processedOrdersRef.current.add(order.id);

    try {
      const { error: updateError } = await supabase
        .from("pedidos_padronizados")
        .update({
          status: "aceito",
          started_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .in("status", ["pendente", "novo", "disponivel"]);

      if (updateError) {
        processedOrdersRef.current.delete(order.id);
        return false;
      }

      if (window._tocarSomPorTipo) {
        const tipoSom = order.tipo_pedido === "retirada" ? "retirada" : order.tipo_pedido === "local" ? "local" : "entrega";
        window._tocarSomPorTipo(tipoSom);
      }

      printService.autoPrintOnAccept(order).catch((printError) => {
        logger.error("Erro na impressao automatica:", printError);
      });

      notificationService.notifyStatusChange(order, "aceito");
      return true;
    } catch (_) {
      processedOrdersRef.current.delete(order.id);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`pedidos_mobile_${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos_padronizados",
          filter: `id_restaurante=eq.${restaurantId}`,
        },
        async (payload) => {
          if (payload?.eventType === "INSERT") {
            // Vibração para novo pedido
            if (window.navigator?.vibrate) {
              window.navigator.vibrate([200, 100, 200]);
            }

            if (autoAcceptRef.current && restaurante?.ativo) {
              const newOrder = payload.new;
              if (isPendingStatus(newOrder?.status)) {
                setTimeout(async () => {
                  const fullOrder = await orderService.fetchOrderById(newOrder.id);
                  autoAcceptOrder(fullOrder || newOrder);
                }, AUTO_ACCEPT_DELAY_MS);
              }
            }
          }

          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders, autoAcceptOrder, restaurante]);

  const countsByStage = useMemo(() => {
    const counts = {
      all: 0,
      novas_missoes: 0,
      em_preparo: 0,
      pronto: 0,
      aceito: 0,
      coletado: 0,
      falha_entrega: 0,
      cancelado: 0,
      concluido: 0,
      problemas: 0,
    };

    orders.forEach((order) => {
      const stage = getVisualStage(order);
      const hideHistoricTerminal =
        ["concluido", "cancelado", "falha_entrega"].includes(stage) && order.created_at && !isToday(order.created_at);

      if (hideHistoricTerminal) {
        return;
      }

      counts.all += 1;
      if (counts[stage] !== undefined) {
        counts[stage] += 1;
      }
      if (stage === "falha_entrega" || stage === "cancelado") {
        counts.problemas += 1;
      }
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const stage = getVisualStage(order);

      if (["concluido", "cancelado", "falha_entrega"].includes(stage) && order.created_at && !isToday(order.created_at)) {
        return false;
      }

      if (filterStage === "problemas") {
        return stage === "falha_entrega" || stage === "cancelado";
      }

      if (filterStage !== "all" && stage !== filterStage) {
        return false;
      }

      return true;
    });
  }, [orders, filterStage]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const stageDifference = STAGE_ORDER[getVisualStage(a)] - STAGE_ORDER[getVisualStage(b)];
      if (stageDifference !== 0) return stageDifference;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [filteredOrders]);

  const currentTabLabel = useMemo(() => {
    const activeFilter = FILTER_TABS.find((tab) => tab.key === filterStage);
    return activeFilter?.label || "Todos";
  }, [filterStage]);

  const calcularTempoRestante = (startedAt, prepTime) => {
    if (!startedAt || !prepTime) return { minutos: 0, atrasado: false };

    const agora = nowInSaoPaulo();
    const inicio = utcToSaoPaulo(startedAt);
    const tempoEstimado = prepTime * 60 * 1000;
    const passado = agora.getTime() - inicio.getTime();
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

    const inicio = utcToSaoPaulo(startedAt).getTime();
    const agora = nowInSaoPaulo().getTime();
    const totalMs = Number(totalMinutes) * 60 * 1000;
    const decorridoMs = Math.max(0, agora - inicio);
    return Math.max(0, Math.min(100, (decorridoMs / totalMs) * 100));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId));
    
    // Feedback táctil (vibração suave)
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(50);
    }

    try {
      const updates = { status: newStatus };
      if (newStatus === "aceito") {
        updates.started_at = new Date().toISOString();
      }

      await orderService.updateOrder(orderId, updates);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                started_at: newStatus === "aceito" ? new Date().toISOString() : order.started_at,
              }
            : order
        )
      );

      // Sincronizar com o pedido selecionado no modal
      setSelectedOrder((prev) => {
        if (prev?.id === orderId) {
          return {
            ...prev,
            status: newStatus,
            started_at: newStatus === "aceito" ? new Date().toISOString() : prev.started_at,
          };
        }
        return prev;
      });

      const orderData = orders.find((order) => order.id === orderId);
      if (newStatus === "aceito" && orderData) {
        printService.autoPrintOnAccept(orderData).catch(() => {});
      }

      if (orderData) {
        const statusMap = {
          aceito: "aceito",
          pronto_para_entrega: "pronto",
          coletado: "coletado",
        };

        if (statusMap[newStatus]) {
          notificationService.notifyStatusChange(orderData, statusMap[statusMap[newStatus]]);
        }
      }
    } catch (updateError) {
      logger.error("Erro ao atualizar status:", updateError);
      alert(`Erro ao atualizar pedido: ${updateError.message}`);
    } finally {
      setUpdatingOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const toggleAutoAccept = async () => {
    const nextValue = !autoAcceptEnabled;
    setAutoAcceptEnabled(nextValue);
    autoAcceptRef.current = nextValue;

    try {
      localStorage.setItem("fome-ninja-auto-accept", nextValue ? "true" : "false");
    } catch (_) {}

    if (!nextValue) {
      processedOrdersRef.current.clear();
      return;
    }

    const pendingOrders = orders.filter((order) => isPendingStatus(order.status) && !processedOrdersRef.current.has(order.id));
    if (pendingOrders.length === 0) {
      return;
    }

    setProcessingAutoAccept(true);

    for (let index = 0; index < pendingOrders.length; index += 1) {
      if (!autoAcceptRef.current) break;
      await autoAcceptOrder(pendingOrders[index]);
      if (index < pendingOrders.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setProcessingAutoAccept(false);
    fetchOrders();
  };

  const handleToggleRestaurantStatus = async () => {
    if (!atualizarDadosRestaurante || isUpdatingRestaurantStatus) {
      return;
    }

    const nextOnline = !isRestaurantOnline;
    setIsUpdatingRestaurantStatus(true);

    try {
      await atualizarDadosRestaurante({
        ativo: nextOnline,
        ...(nextOnline ? {} : { pausado: false }),
      });
    } catch (statusError) {
      logger.error("Erro ao atualizar status da loja:", statusError);
      alert("Não foi possível atualizar o status da loja.");
    } finally {
      setIsUpdatingRestaurantStatus(false);
    }
  };

  const handleEncerrarDia = async () => {
    if (isUpdatingRestaurantStatus) return;

    try {
      setIsUpdatingRestaurantStatus(true);
      const now = new Date().toISOString();

      await atualizarDadosRestaurante({
        ativo: false,
        pausado: false,
        ultimo_fechamento_em: now
      });

      setShowConfirmEncerrar(false);
      setOrders([]); // Limpar lista local imediatamente
      
      logger.log("Dia encerrado com sucesso");
    } catch (err) {
      console.error("Erro ao encerrar dia:", err);
    } finally {
      setIsUpdatingRestaurantStatus(false);
    }
  };

  const handleToggleRestaurantPause = async () => {
    if (!atualizarDadosRestaurante || isUpdatingPause || !isRestaurantOnline) {
      return;
    }

    setIsUpdatingPause(true);

    try {
      await atualizarDadosRestaurante({
        pausado: !isRestaurantPaused,
      });
    } catch (pauseError) {
      logger.error("Erro ao atualizar pausa da loja:", pauseError);
      alert("Nao foi possivel atualizar a pausa da loja.");
    } finally {
      setIsUpdatingPause(false);
    }
  };

  const renderStatusButton = (order) => {
    let stage = getVisualStage(order);
    
    // Diferenciar estágio visual 'em_preparo' para mostrar o botão correto baseado no status real
    if (stage === "em_preparo" && order.status === "aceito") {
      stage = "aceito";
    }

    const isLocalOrder = order.tipo_pedido === "retirada" || order.tipo_pedido === "local";

    const buttonConfigByStage = {
      novas_missoes: {
        text: "Aceitar",
        nextStatus: "aceito",
        className: "bg-success hover:bg-success/90 text-white",
      },
      em_preparo: {
        text: isLocalOrder ? "Concluir" : "Pronto para entrega",
        nextStatus: isLocalOrder ? "concluido" : "pronto_para_entrega",
        className: isLocalOrder ? "bg-success hover:bg-success/90 text-white" : "bg-primary hover:bg-primary/90 text-white",
      },
      pronto: {
        text: "Aguardando coleta",
        nextStatus: null,
        className: "bg-primary/20 text-primary border border-primary/30",
      },
      coletado: {
        text: "Em entrega",
        nextStatus: null,
        className: "bg-secondary text-muted-foreground",
      },
      concluido: {
        text: "Entregue",
        nextStatus: null,
        className: "bg-secondary text-muted-foreground",
      },
      cancelado: {
        text: "Cancelado",
        nextStatus: null,
        className: "bg-destructive/20 text-destructive border border-destructive/30",
      },
      falha_entrega: {
        text: "Tratar",
        nextStatus: "concluido",
        className: "bg-destructive hover:bg-destructive/90 text-white",
      },
      aceito: {
        text: "Iniciar preparo",
        nextStatus: "em_preparo",
        className: "bg-primary hover:bg-primary/90 text-white",
      },
    };

    const config = buttonConfigByStage[stage];
    if (!config) return null;

    const isUpdating = updatingOrders.has(order.id);

    return (
      <button
        onClick={(event) => {
          event.stopPropagation();
          if (!isUpdating && config.nextStatus) {
            handleStatusChange(order.id, config.nextStatus);
          }
        }}
        disabled={isUpdating || !config.nextStatus}
        className={`w-full px-4 py-3 text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
          isUpdating ? "bg-secondary text-muted-foreground" : config.className
        }`}
      >
        {isUpdating ? "Processando..." : config.text}
      </button>
    );
  };

  const renderProgressBar = (order) => {
    if (getVisualStage(order) !== "em_preparo" || !order.started_at || !order.prepTime) {
      return null;
    }

    const { minutos, atrasado } = calcularTempoRestante(order.started_at, order.prepTime);
    const progressPercentage = calcularPorcentagemProgresso(order.started_at, order.prepTime);

    return (
      <div className="mt-3">
        <div className="flex justify-between items-center text-sm mb-1.5">
          <span className="font-medium text-muted-foreground">{atrasado ? "Atrasado" : "Restante"}:</span>
          <span className={`font-bold ${atrasado ? "text-destructive" : "text-primary"}`}>{minutos}m</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ${atrasado ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  const handleCardClick = (order) => {
    setSelectedOrder(order);
    setUnreadMessages((prev) => {
      if (!prev[order.id]) return prev;
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
  };

  const renderInfoTab = () => (
    <div className="p-4 space-y-3">
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <p className="text-sm text-muted-foreground">Restaurante</p>
        <div className="flex items-center gap-2 mt-1">
          <h2 className="text-lg font-bold text-foreground">{restaurante?.nome_fantasia || "Painel do restaurante"}</h2>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
            isRestaurantOnline 
              ? isRestaurantPaused 
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
          }`}>
            {isRestaurantOnline ? (isRestaurantPaused ? "PAUSADO" : "ONLINE") : "OFFLINE"}
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={handleToggleRestaurantStatus}
            disabled={isUpdatingRestaurantStatus}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              isRestaurantOnline
                ? "bg-destructive text-white"
                : "bg-success text-white"
            } ${isUpdatingRestaurantStatus ? "opacity-70" : ""}`}
          >
            {isUpdatingRestaurantStatus ? "Atualizando..." : isRestaurantOnline ? "Ficar offline" : "Abrir Loja"}
          </button>
          
          {isRestaurantOnline && (
            <button
              type="button"
              onClick={handleToggleRestaurantPause}
              disabled={isUpdatingPause}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                isRestaurantPaused
                  ? "bg-sky-500 text-white"
                  : "bg-amber-500 text-black"
              } ${isUpdatingPause ? "opacity-70" : ""}`}
            >
              {isUpdatingPause ? "Atualizando..." : isRestaurantPaused ? "Retomar vendas" : "Pausar vendas"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowConfirmEncerrar(true)}
            disabled={isUpdatingRestaurantStatus}
            className="w-full rounded-2xl px-4 py-3 text-sm font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors border border-border mt-1 flex items-center justify-center gap-2"
          >
            <Icons.PowerOffIcon className="w-4 h-4" />
            Encerrar o Dia
          </button>

          <button
            type="button"
            onClick={async () => {
                const confirmed = window.confirm("Deseja realmente sair do sistema?");
                if (confirmed) {
                  await logout();
                }
            }}
            className="w-full rounded-2xl px-4 py-3 text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/20 mt-3 flex items-center justify-center gap-2"
          >
            <Icons.LogOutIcon className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Tema</p>
            <h3 className="text-base font-bold text-foreground mt-1">Visual do painel</h3>
          </div>
          <div className="rounded-full bg-secondary p-1 flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Escuro
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Tema atual: <span className="font-semibold text-foreground">{theme === "dark" ? "Escuro" : "Claro"}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FILTER_TABS.filter((tab) => tab.key !== "all").map((tab) => (
          <div key={tab.key} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-sm text-muted-foreground">{tab.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{countsByStage[tab.key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <p className="text-sm text-muted-foreground">Auto aceite</p>
        <p className={`text-lg font-bold mt-1 ${autoAcceptEnabled ? "text-success" : "text-muted-foreground"}`}>
          {autoAcceptEnabled ? "Ativado" : "Desativado"}
        </p>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Filtro ativo</p>
          <p className="text-lg font-bold text-foreground mt-1">{currentTabLabel}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Pedidos visiveis</p>
          <p className="text-lg font-bold text-foreground mt-1">{sortedOrders.length}</p>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-border shadow-sm">
          <Icons.ClipboardListIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum pedido nesta aba</p>
          <p className="text-muted-foreground text-sm mt-1">Quando chegar pedido nesse status, ele aparece aqui</p>
        </div>
      ) : (
        sortedOrders.map((order) => {
          const stage = getVisualStage(order);
          const stageMeta = STAGE_META[stage] || STAGE_META.novas_missoes;
          
          // Calcular atraso para o efeito visual
          const { atrasado } = calcularTempoRestante(order.started_at, order.prepTime);

          return (
            <div
              key={order.id}
              className={`bg-card rounded-2xl p-4 border transition-all active:scale-[0.98] ${
                atrasado && stage === "em_preparo"
                  ? "border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-destructive/20"
                  : "border-border shadow-sm"
              }`}
              onClick={() => handleCardClick(order)}
            >
              {atrasado && stage === "em_preparo" && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-destructive uppercase mb-2 animate-pulse">
                  <Icons.AlertCircleIcon className="w-3 h-3" /> Pedido Atrasado
                </div>
              )}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-lg text-foreground">#{order.numero_pedido}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeClass(order.tipo_pedido)}`}>
                      {getTypeBadgeLabel(order.tipo_pedido)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${stageMeta.pillClass}`}>
                      {stageMeta.shortLabel}
                    </span>
                    {order.isVip && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-black">VIP</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{order.customerName}</p>
                  {order.nome_entregador && (
                    <p className="text-xs text-muted-foreground mt-1">Entregador: {order.nome_entregador}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">R$ {order.total?.toFixed(2) || "0.00"}</p>
                  <p className="text-xs text-muted-foreground">{order.paymentType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl bg-secondary/60 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{stageMeta.label}</p>
                </div>
                <div className="rounded-xl bg-secondary/60 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Itens</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{order.items?.length || 0} item(ns)</p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 mb-3">
                <ul className="space-y-1.5">
                  {order.items?.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.qty}x</span> {item.name}
                    </li>
                  ))}
                  {order.items?.length > 3 && (
                    <li className="text-xs text-muted-foreground italic">
                      +{order.items.length - 3} {order.items.length - 3 === 1 ? "item" : "itens"}
                    </li>
                  )}
                </ul>
              </div>

              {renderProgressBar(order)}

              <div className="mt-3">{renderStatusButton(order)}</div>
            </div>
          );
        })
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <div className="text-foreground text-lg font-semibold">Carregando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background p-6">
        <Icons.AlertCircleIcon className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2 text-center">Erro ao carregar pedidos</h2>
        <p className="text-muted-foreground text-center mb-4">{error.message}</p>
        <button onClick={fetchOrders} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Pedidos</h1>
              <p className="text-xs text-muted-foreground">{countsByStage.all} pedido{countsByStage.all !== 1 ? "s" : ""} hoje</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders()}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-secondary text-foreground active:rotate-180 transition-transform duration-500"
                aria-label="Recarregar"
              >
                <Icons.RefreshCwIcon className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                  isRestaurantOnline
                    ? isRestaurantPaused
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      : "bg-success/15 text-success border border-success/30"
                    : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                }`}
              >
                {isRestaurantOnline 
                  ? (isRestaurantPaused ? "Pausado" : "Aberto") 
                  : "Fechado Temporariamente"}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={toggleAutoAccept}
              disabled={processingAutoAccept}
              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm ${
                processingAutoAccept
                  ? "bg-primary/50 text-white"
                  : autoAcceptEnabled
                    ? "bg-success text-white"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {processingAutoAccept ? "..." : autoAcceptEnabled ? "Auto ON" : "Auto OFF"}
            </button>

            <button
              onClick={handleToggleRestaurantStatus}
              disabled={isUpdatingRestaurantStatus}
              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors ${
                isRestaurantOnline
                  ? "bg-destructive text-white"
                  : "bg-success text-white"
              } ${isUpdatingRestaurantStatus ? "opacity-70" : ""}`}
            >
              {isUpdatingRestaurantStatus ? "..." : isRestaurantOnline ? "OFFLINE" : "ONLINE"}
            </button>

            {isRestaurantOnline && (
              <button
                onClick={handleToggleRestaurantPause}
                disabled={isUpdatingPause}
                className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors ${
                  isRestaurantPaused
                    ? "bg-sky-500 text-white"
                    : "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                } ${isUpdatingPause ? "opacity-70" : ""}`}
              >
                {isUpdatingPause ? "..." : isRestaurantPaused ? "RETOMAR" : "PAUSAR"}
              </button>
            )}
          </div>

          {activeTab === "pedidos" && (
            <div className="mt-3 -mx-4 px-4 overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStage(tab.key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                      filterStage === tab.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {tab.label} ({countsByStage[tab.key] || 0})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeTab === "info" ? renderInfoTab() : renderOrdersTab()}

        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          unreadCount={selectedOrder ? unreadMessages[selectedOrder.id] || 0 : 0}
          onUpdateStatus={handleStatusChange}
        />

        {/* Modal de Confirmação de Encerramento do Dia */}
        {showConfirmEncerrar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" 
              onClick={() => !isUpdatingRestaurantStatus && setShowConfirmEncerrar(false)}
            />
            <div className="relative bg-card w-full max-w-sm rounded-[2.5rem] border border-border shadow-2xl p-8 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                <Icons.LogOutIcon className="w-10 h-10 text-foreground" />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2">Encerrar o dia?</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                A loja ficará <span className="font-bold text-orange-500">Offline</span> e as vendas serão pausadas. <br/>
                O painel será limpo, mas <span className="font-semibold text-primary">você continuará logado</span>.
              </p>
              
              <div className="w-full space-y-3">
                <button
                  type="button"
                  disabled={isUpdatingRestaurantStatus}
                  onClick={handleEncerrarDia}
                  className="w-full bg-destructive text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isUpdatingRestaurantStatus ? "Encerrando..." : "Sim, Encerrar"}
                </button>
                <button
                  type="button"
                  disabled={isUpdatingRestaurantStatus}
                  onClick={() => setShowConfirmEncerrar(false)}
                  className="w-full bg-secondary text-foreground font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  Continuar Trabalhando
                </button>
              </div>
            </div>
          </div>
        )}

        <audio preload="auto">
          <source src="/sounds/Notificação_Pedidos.wav" type="audio/wav" />
        </audio>
      </div>
    </ErrorBoundary>
  );
};




