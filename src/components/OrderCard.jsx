import React, { useState, useEffect } from 'react';
import * as Icons from './icons/index.jsx';

const OrderCard = ({ order, onUpdateStatus, onClick, onAccept, onReject, onReady, onDispatch }) => {
  const [tempoRestante, setTempoRestante] = useState(0);
  const [statusTempo, setStatusTempo] = useState('Tempo Restante');

  useEffect(() => {
    if (!order.started_at || !order.prepTime) return;

    const calcularTempo = () => {
      const agora = new Date();
      const inicio = new Date(order.started_at);
      const tempoEstimado = order.prepTime * 60 * 1000; // em milissegundos
      const passado = agora - inicio;
      const restante = tempoEstimado - passado;

      if (restante <= 0) {
        setStatusTempo('Atrasado');
        setTempoRestante(0);
      } else {
        setStatusTempo('Tempo Restante');
        setTempoRestante(Math.ceil(restante / 60000)); // em minutos
      }
    };

    calcularTempo(); // Calcula imediatamente
    const interval = setInterval(calcularTempo, 1000); // Atualiza a cada segundo

    return () => clearInterval(interval);
  }, [order.started_at, order.prepTime]);

  const handleReadyClick = (e) => {
    e.stopPropagation();
    if (onReady) {
      onReady(order.id);
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, 'coletado');
    }
  };

  const handleAcceptClick = (e) => {
    e.stopPropagation();
    if (onAccept) {
      onAccept(order.id);
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, 'aceito');
    }
  };

  const handleRejectClick = (e) => {
    e.stopPropagation();
    if (onReject) {
      onReject(order.id);
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, 'rejeitado');
    }
  };

  const handleDispatchClick = (e) => {
    e.stopPropagation();
    if (onDispatch) {
      onDispatch(order.id);
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, 'despachado');
    }
  };

  // Calcular porcentagem da barra de progresso
  const progressPercentage = order.prepTime && tempoRestante > 0
    ? Math.max(0, (tempoRestante / order.prepTime) * 100)
    : 0;

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onClick && onClick(order)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-card-foreground">Pedido #{order.numero_pedido}</h3>
          <p className="text-sm text-muted-foreground">{order.customerName}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-orange-500 font-semibold">{order.paymentType.toUpperCase()}</p>
            {order.tipo_pedido && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                order.tipo_pedido === 'delivery' ? 'bg-blue-600 text-white' :
                order.tipo_pedido === 'balcao' ? 'bg-green-600 text-white' :
                order.tipo_pedido === 'mesa' ? 'bg-purple-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {order.tipo_pedido === 'delivery' ? '🚚 Entrega' :
                 order.tipo_pedido === 'balcao' ? '🏪 Retirada' :
                 order.tipo_pedido === 'mesa' ? '🍽️ Mesa' :
                 order.tipo_pedido === 'online' ? '💻 Online' :
                 order.tipo_pedido}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-orange-500">R$ {order.total.toFixed(2)}</p>
          {order.isVip && (
            <div className="flex items-center justify-end gap-1 text-xs text-yellow-400 mt-1">
              <Icons.NinjaStarIcon className="w-3 h-3 fill-current" />
              <span>Cliente VIP</span>
            </div>
          )}
        </div>
      </div>

      <ul className="text-sm space-y-1">
        {order.items.map((item, index) => <li key={index}>{item.qty}x {item.name}</li>)}
      </ul>

      {order.status === 'aceito' && order.started_at && order.prepTime > 0 && (
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-semibold">{statusTempo}:</span>
            <span className={`flex items-center gap-1 ${statusTempo === 'Atrasado' ? 'text-red-500 font-bold' : ''}`}>
              <Icons.ClockIcon className="w-4 h-4"/>
              {tempoRestante} MIN
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded">
            <div
              className={`h-2 rounded transition-all duration-1000 ease-linear ${
                statusTempo === 'Atrasado' ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {order.status === 'disponivel' && (
          <button
            onClick={handleAcceptClick}
            className="w-full px-3 py-2 text-sm font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
          >
            <Icons.CheckCircleIcon className="w-4 h-4" />
            Aceitar
          </button>
        )}
        {order.status === 'aceito' && (
            <button
              onClick={handleReadyClick}
              className="w-full px-3 py-2 text-sm font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
            >
              <Icons.CheckCircleIcon className="w-4 h-4" />
              Pronto Para Entrega
            </button>
        )}
      </div>

      {/* Modal de detalhes é gerenciado pelo componente pai */}
    </div>
  );
};

export default OrderCard;