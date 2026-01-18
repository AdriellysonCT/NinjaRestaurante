import React from 'react';
import * as Icons from './icons/index.jsx';

const OrderModal = ({ order, onClose, onUpdateStatus }) => {
  if (!order) return null;

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-auto text-card-foreground shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
          <h2 className="text-xl font-bold">Detalhes do Pedido #{order.numero_pedido}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icons.CloseIcon className="w-6 h-6" />
          </button>
        </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;