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
      // Para retirada/local: vai direto para concluído
      // Para delivery: vai para pronto_para_entrega
      const isLocalOrder = order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local';
      const nextStatus = isLocalOrder ? 'concluido' : 'pronto_para_entrega';
      onUpdateStatus(order.id, nextStatus);
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
      className="bg-card rounded-lg p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow border border-border"
      onClick={() => onClick && onClick(order)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-card-foreground">Pedido #{order.numero_pedido}</h3>
          <p className="text-sm text-muted-foreground">{order.customerName}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-primary font-bold">{(order.paymentType || order.paymentMethod || 'DINHEIRO').toUpperCase()}</p>
            {/* Indicador de status de pagamento */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              order.paymentStatus === 'pago' ? 'bg-green-600 text-white' :
              order.paymentStatus === 'pendente' ? 'bg-warning text-warning-foreground' :
              'bg-destructive text-destructive-foreground'
            }`}>
              {order.paymentStatus === 'pago' ? '🟢 Pago' :
               order.paymentStatus === 'pendente' ? '🟡 Pendente' :
               '🔴 Estornado'}
            </span>
            {order.tipo_pedido && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                order.tipo_pedido === 'delivery' ? 'bg-blue-600 text-white' :
                order.tipo_pedido === 'retirada' ? 'bg-green-600 text-white' :
                order.tipo_pedido === 'local' ? 'bg-purple-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {order.tipo_pedido === 'delivery' ? '🚚 Entrega' :
                 order.tipo_pedido === 'retirada' ? '🏪 Retirada' :
                 order.tipo_pedido === 'local' ? '🍽️ Local' :
                 order.tipo_pedido}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-lg text-primary">
            R$ {(parseFloat(order.total) || 0).toFixed(2)}
          </p>
          {order.isVip && (
            <div className="flex items-center justify-end gap-1 text-xs text-warning mt-1 font-bold">
              <Icons.NinjaStarIcon className="w-3 h-3 fill-current" />
              <span>Cliente VIP</span>
            </div>
          )}
        </div>
      </div>

      <ul className="text-sm space-y-1 text-muted-foreground border-t border-border/50 pt-2">
        {order.items.map((item, index) => <li key={index} className="flex justify-between"><span>{item.qty}x {item.name}</span></li>)}
      </ul>

      {/* Mostrar troco para pedidos pendentes (dinheiro) */}
      {order.paymentStatus === 'pendente' && order.troco > 0 && (
        <div className="mt-2 p-2 bg-warning/20 border border-warning/50 rounded flex items-center gap-2">
          <Icons.CoinIcon className="w-4 h-4 text-warning" />
          <span className="text-warning text-xs font-bold">
            Troco: R$ {order.troco.toFixed(2)}
          </span>
        </div>
      )}

      {/* Barra de tempo de preparo */}
      {order.status === 'aceito' && order.started_at && order.prepTime > 0 && (
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-semibold text-card-foreground">{statusTempo}:</span>
            <span className={`flex items-center gap-1 font-bold ${statusTempo === 'Atrasado' ? 'text-destructive' : 'text-primary'}`}>
              <Icons.ClockIcon className="w-4 h-4"/>
              {tempoRestante}m
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ease-linear shadow-sm ${
                statusTempo === 'Atrasado' ? 'bg-destructive animate-pulse' : 'bg-primary'
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
            className="w-full px-3 py-2 text-sm font-bold rounded-md bg-success text-white hover:bg-success/90 transition-all flex items-center justify-center gap-1 shadow-sm"
          >
            <Icons.CheckCircleIcon className="w-4 h-4" />
            Aceitar Pedido
          </button>
        )}
        {order.status === 'aceito' && (
            <button
              onClick={handleReadyClick}
              className="w-full px-3 py-2 text-sm font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <Icons.CheckCircleIcon className="w-4 h-4" />
              {(order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local') ? 'Concluir Pedido' : 'Pronto Para Entrega'}
            </button>
        )}
      </div>

      {/* Modal de detalhes é gerenciado pelo componente pai */}
    </div>
  );
};

export default OrderCard;