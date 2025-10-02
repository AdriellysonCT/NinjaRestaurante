import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
import { printService } from '../services/printService';

export const BatchPrint = ({ isOpen, onClose, orders }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState('all');

  // Filtrar pedidos com base no filtro selecionado
  const filteredOrders = filter === 'all' 
    ? (orders || []) 
    : (orders || []).filter(order => order.status === filter);

  const handleToggleOrder = (order) => {
    if (selectedOrders.some(o => o.id === order.id)) {
      setSelectedOrders(selectedOrders.filter(o => o.id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders([...filteredOrders]);
    }
  };

  const handlePrintSelected = async () => {
    if (selectedOrders.length === 0) {
      setMessage({
        type: 'error',
        text: 'Selecione pelo menos um pedido para imprimir.'
      });
      return;
    }

    setIsPrinting(true);
    setMessage(null);
    
    try {
      const result = await printService.printMultipleTickets(selectedOrders);
      
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
      
      // Se a impressão foi bem-sucedida, limpar a seleção
      if (result.success) {
        setSelectedOrders([]);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao imprimir comandas: ' + error.message
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Impressão em Lote">
      <div className="space-y-4">
        {/* Filtros e ações */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div>
            <select 
              className="bg-input px-3 py-2 rounded-md text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todos os pedidos</option>
              <option value="new">Novos</option>
              <option value="preparing">Em preparo</option>
              <option value="ready">Prontos</option>
              <option value="dispatched">A caminho</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSelectAll}
              className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80"
            >
              {selectedOrders.length === filteredOrders.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="border border-border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card">
              <tr className="bg-secondary/50">
                <th className="px-4 py-2 text-center text-xs font-semibold w-10">
                  <input 
                    type="checkbox" 
                    checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Pedido</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Status</th>
                <th className="px-4 py-2 text-right text-xs font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr 
                    key={order.id} 
                    className={`border-t border-border hover:bg-secondary/20 cursor-pointer ${
                      selectedOrders.some(o => o.id === order.id) ? 'bg-secondary/30' : ''
                    }`}
                    onClick={() => handleToggleOrder(order)}
                  >
                    <td className="px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.some(o => o.id === order.id)}
                        onChange={() => handleToggleOrder(order)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2 text-xs">#{order.id}</td>
                    <td className="px-4 py-2 text-xs">{order.customerName}</td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        order.status === 'new' ? 'bg-primary/20 text-primary' :
                        order.status === 'preparing' ? 'bg-blue-500/20 text-blue-500' :
                        order.status === 'ready' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-purple-500/20 text-purple-500'
                      }`}>
                        {order.status === 'new' ? 'Novo' :
                         order.status === 'preparing' ? 'Em preparo' :
                         order.status === 'ready' ? 'Pronto' :
                         'A caminho'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-right">R$ {order.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum pedido encontrado com o filtro atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo da seleção */}
        <div className="bg-secondary/20 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Pedidos selecionados: {selectedOrders.length}</p>
              <p className="text-xs text-muted-foreground">
                Total: R$ {selectedOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </p>
            </div>
            <button 
              onClick={handlePrintSelected}
              disabled={isPrinting || selectedOrders.length === 0}
              className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.PrinterIcon className="w-4 h-4" />
              {isPrinting ? 'Imprimindo...' : 'Imprimir Selecionados'}
            </button>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`text-sm p-2 rounded-md ${
            message.type === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </Modal>
  );
};