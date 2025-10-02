import React from 'react';
import * as Icons from './icons/index.jsx';

const OrderModal = ({ order, onClose, onUpdateStatus }) => {
  if (!order) return null;

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto text-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detalhes do Pedido #{order.numero_pedido}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icons.CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Cliente:</h3>
            <p>{order.customerName}</p>
          </div>
          <div>
            <h3 className="font-semibold">Itens:</h3>
            <ul>
              {order.items.map((item, index) => (
                <li key={index}>{item.qty}x {item.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Total:</h3>
            <p>R$ {order.total.toFixed(2)}</p>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            {order.status === 'pending' && (
              <button onClick={() => handleStatusUpdate('in_progress')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Aceitar Pedido
              </button>
            )}
            {order.status === 'in_progress' && (
              <button onClick={() => handleStatusUpdate('ready_for_pickup')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                Pronto para Coleta
              </button>
            )}
             {order.status === 'ready_for_pickup' && (
              <button onClick={() => handleStatusUpdate('out_for_delivery')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">
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