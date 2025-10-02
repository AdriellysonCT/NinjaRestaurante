import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderDetailModal } from "../components/OrderDetailModal";
import * as Icons from "../components/icons/index.jsx";
import { fetchOrders } from '../services/orderService';
import StatusManager from "../components/StatusManager";
const { DownloadIcon, StarIcon, MessageSquareIcon } = Icons;

const Orders = () => {
  // Estados
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Carregar pedidos do Supabase
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const fetchedOrders = await fetchOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      }
    };
    loadOrders();
  }, []);

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // Atualiza o estado do pedido selecionado se ele estiver aberto no modal
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Status para exibição ajustados
  const statusLabels = {
    disponivel: 'Disponível',
    aceito: 'Aceito',
    coletado: 'Coletado',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      order.numero_pedido.toString().includes(searchTerm) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    // Verificar se o pedido está dentro do intervalo de datas
    const orderDate = new Date(order.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // Incluir todo o dia final

    const matchesDate = orderDate >= startDate && orderDate <= endDate;

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Ordenar pedidos por data (mais recentes primeiro)
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // Manipuladores de eventos
  const handleViewDetails = (order) => {
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
              statusLabels[o.status]
            },${new Date(o.created_at).toLocaleString()}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pedidos_fome_ninja.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estatísticas
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex justify-end items-center">
        <button
          onClick={handleExportOrders}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80"
        >
          <DownloadIcon className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalOrders}</p>
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
        </div>
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            R$ {totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">Receita Total</p>
        </div>
        <div className="ninja-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            R$ {averageOrderValue.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="ninja-card p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por ID ou cliente..."
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="bg-input px-3 py-2 rounded-md text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novos</option>
              <option value="preparing">Em Preparo</option>
              <option value="ready">Prontos</option>
              <option value="dispatched">A Caminho</option>
              <option value="delivered">Entregues</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm mb-1">De:</label>
            <input
              type="date"
              className="bg-input px-3 py-2 rounded-md text-sm"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Até:</label>
            <input
              type="date"
              className="bg-input px-3 py-2 rounded-md text-sm"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="ninja-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Data
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Total
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border hover:bg-secondary/20 cursor-pointer"
                  onClick={() => handleViewDetails(order)}
                >
                  <td className="px-4 py-3 text-sm">{order.numero_pedido}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      {order.customerName}
                      {order.isVip && (
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(order.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    R$ {order.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold status-${order.status}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <StatusManager order={order} onUpdateStatus={handleUpdateStatus} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {sortedOrders.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum pedido encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            isOpen={isDetailsModalOpen}
            onClose={handleCloseDetailsModal}
            order={selectedOrder}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
