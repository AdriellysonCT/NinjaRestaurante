import React, { useState, useEffect } from "react";
import { OrderDetailModal } from "../components/OrderDetailModal";
import * as Icons from "../components/icons/index.jsx";
import { fetchOrders } from '../services/orderService';
import StatusManager from "../components/StatusManager";
import { supabase } from "../lib/supabase";

const Orders = () => {
  // Estados
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState({}); // { [orderId]: count }
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Carregar pedidos do Supabase
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await fetchOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Configurar Realtime para atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('public:pedidos_padronizados_orders_page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos_padronizados' },
        (payload) => {
          console.log('Realtime update on Orders.jsx:', payload);
          loadOrders(); // Recarrega para manter consistência
        }
      )
      .subscribe();

    // Realtime para mensagens (unread count)
    const channelChat = supabase
      .channel('mensagens_orders_status')
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_entrega",
          filter: `tipo_remetente=eq.entregador`,
        },
        async (payload) => {
           const pedidoId = payload.new.pedido_id;
           setUnreadMessages(prev => ({
             ...prev,
             [pedidoId]: (prev[pedidoId] || 0) + 1
           }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channelChat);
    };
  }, []);

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Status para exibição ajustados aos reais do banco
  const statusLabels = {
    pendente: 'Novo',
    disponivel: 'Aguardando',
    aceito: 'Em Preparo',
    pronto_para_entrega: 'Pronto',
    coletado: 'Em Rota',
    concluido: 'Finalizado',
    cancelado: 'Cancelado'
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      order.numero_pedido?.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

    const orderDate = new Date(order.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59);

    const matchesDate = orderDate >= startDate && orderDate <= endDate;

    return matchesStatus && matchesSearch && matchesDate;
  });

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const handleViewDetails = (order) => {
    // Ao visualizar, limpa as mensagens não lidas
    setUnreadMessages(prev => {
        const copy = { ...prev };
        delete copy[order.id];
        return copy;
    });
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleExportOrders = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Cliente,Total,Status,Data\n" +
      sortedOrders
        .map(
          (o) =>
            `${o.numero_pedido},"${o.customerName}",${o.total.toFixed(2)},${
              statusLabels[o.status] || o.status
            },${new Date(o.timestamp).toLocaleString()}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_fome_ninja_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estatísticas do período filtrado
  const totalOrders = sortedOrders.length;
  const totalRevenue = sortedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
      {/* Header com título e botão na mesma linha */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Icons.ClipboardListIcon className="w-8 h-8 text-primary" />
            Histórico de Pedidos
          </h1>
          
          <button
            onClick={handleExportOrders}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm border border-border whitespace-nowrap"
          >
            <Icons.DownloadIcon className="w-4 h-4 text-primary" />
            Exportar Relatório
          </button>
        </div>
        
        <p className="text-muted-foreground text-sm">Gerencie e analise todos os seus pedidos realizados</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-md flex items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-xl">
            <Icons.ShoppingBagIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{totalOrders}</p>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pedidos no Período</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-md flex items-center gap-4">
          <div className="bg-success/10 p-4 rounded-xl">
            <Icons.DollarSignIcon className="w-8 h-8 text-success" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">R$ {totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Faturamento Líquido</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-md flex items-center gap-4">
          <div className="bg-blue-500/10 p-4 rounded-xl">
            <Icons.ActivityIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-2xl font-black text-foreground">R$ {averageOrderValue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Ticket Médio</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="text-xs font-black uppercase text-muted-foreground mb-2 block">Buscar Pedido</label>
            <div className="relative">
              <Icons.SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nº do pedido ou nome do cliente..."
                className="w-full bg-secondary text-foreground pl-11 pr-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <label className="text-xs font-black uppercase text-muted-foreground mb-2 block">Status</label>
            <select
              className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none font-bold cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">🚀 Novos</option>
              <option value="aceito">🔥 Em Preparo</option>
              <option value="pronto_para_entrega">✅ Prontos</option>
              <option value="coletado">🚚 Em Entrega</option>
              <option value="concluido">🏆 Finalizados</option>
              <option value="cancelado">❌ Cancelados</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-black uppercase text-muted-foreground mb-2 block">De</label>
              <input
                type="date"
                className="w-full bg-secondary text-foreground px-3 py-3 rounded-xl border border-border font-bold text-xs"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-black uppercase text-muted-foreground mb-2 block">Até</label>
              <input
                type="date"
                className="w-full bg-secondary text-foreground px-3 py-3 rounded-xl border border-border font-bold text-xs"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b border-border">
                <th className="px-6 py-4 text-left">Nº Pedido</th>
                <th className="px-6 py-4 text-left">Cliente</th>
                <th className="px-6 py-4 text-left">Data e Hora</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex justify-center items-center gap-3">
                         <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                         <span className="font-bold">Carregando histórico...</span>
                      </div>
                   </td>
                </tr>
              ) : sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-secondary/20 transition-colors cursor-pointer group"
                    onClick={() => handleViewDetails(order)}
                  >
                    <td className="px-6 py-5">
                      <span className="font-black text-foreground">#{order.numero_pedido}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{order.customerName}</span>
                        {order.isVip && <Icons.NinjaStarIcon className="w-4 h-4 text-yellow-400 fill-current" />}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                      {new Date(order.timestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-primary">R$ {order.total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                        order.status === 'pendente' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        order.status === 'aceito' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        order.status === 'concluido' ? 'bg-success/10 text-success border-success/20' :
                        order.status === 'cancelado' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-secondary text-muted-foreground border-border'
                      }`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                       <div className="flex items-center justify-end gap-3">
                          {unreadMessages[order.id] > 0 && (
                             <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">
                               {unreadMessages[order.id]}
                             </span>
                          )}
                          <StatusManager order={order} onUpdateStatus={handleUpdateStatus} />
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-muted-foreground">
                    <Icons.AlertCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-lg">Nenhum pedido encontrado</p>
                    <p className="text-sm">Ajuste os filtros ou tente novamente mais tarde</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <OrderDetailModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        unreadCount={selectedOrder ? (unreadMessages[selectedOrder.id] || 0) : 0}
      />
    </div>
  );
};

export default Orders;
