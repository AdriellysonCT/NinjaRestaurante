import React from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';

const OrderModal = ({ order, onClose, onUpdateStatus }) => {
  if (!order) return null;

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
    onClose();
  };

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Detalhes do Pedido #${order.numero_pedido}`} size="md">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-primary">Cliente:</h3>
          <p className="font-medium text-foreground">{order.customerName}</p>
        </div>
        <div>
          <h3 className="font-semibold text-primary">Itens:</h3>
          <ul className="divide-y divide-border rounded-md bg-secondary/20 p-2 mt-1">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between py-1 text-sm">
                <span>{item.qty}x {item.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-primary">Total:</h3>
          <p className="text-xl font-black text-foreground">R$ {order.total.toFixed(2)}</p>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          {order.status === 'pending' && (
            <button onClick={() => handleStatusUpdate('in_progress')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded shadow-sm transition-colors">
              Aceitar Pedido
            </button>
          )}
          {order.status === 'in_progress' && (
            <button onClick={() => handleStatusUpdate('ready_for_pickup')} className="bg-success hover:bg-success/90 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">
              Pronto para Coleta
            </button>
          )}
           {order.status === 'ready_for_pickup' && (
            <button onClick={() => handleStatusUpdate('out_for_delivery')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">
              Saiu para Entrega
            </button>
          )}
          <button onClick={onClose} className="bg-secondary text-foreground py-2 px-4 rounded font-bold">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderModal;