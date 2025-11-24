import React from 'react';
import * as Icons from './icons/index.jsx';

export const OrderDetailModalSimple = ({ isOpen, onClose, order }) => {
  console.log('🔧 [MODAL] Renderizado - isOpen:', isOpen, 'order:', order?.numero_pedido);
  
  if (!isOpen || !order) {
    console.log('🔧 [MODAL] Retornando null - isOpen:', isOpen, 'order:', !!order);
    return null;
  }
  
  console.log('🔧 [MODAL] Renderizando modal completo');

  const formatDateBr = (raw) => {
    try {
      if (!raw) return '';
      const str = typeof raw === 'string' ? raw.replace(' ', 'T') : raw;
      const d = new Date(str);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('pt-BR', { hour12: false });
    } catch {
      return '';
    }
  };

  const handleWhatsApp = () => {
    const phoneRaw = order.telefone_cliente || order.customerPhone || order.phone || '';
    const digits = (phoneRaw || '').replace(/\D/g, '');
    if (!digits) {
      alert('Telefone do cliente não informado neste pedido.');
      return;
    }
    const withCountry = digits.length <= 13 && !digits.startsWith('55') ? `55${digits}` : digits;
    const message = `Olá ${order.nome_cliente || order.customerName || ''}, sobre seu pedido #${order.numero_pedido}`;
    window.open(`https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const totalPrepMinutes = order.prepTime || order.prep_time || 0;

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Pedido #{order.numero_pedido}</h2>
            <p className="text-sm text-gray-400">{formatDateBr(order.criado_em || order.created_at)}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cliente e Total */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">{order.nome_cliente || order.customerName}</h3>
            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {order.telefone_cliente || order.customerPhone || 'Não informado'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-500">R$ {(order.total || 0).toFixed(2)}</p>
            {order.isVip && (
              <span className="inline-flex items-center gap-1 text-yellow-400 text-sm mt-1">
                <Icons.NinjaStarIcon className="w-4 h-4" />
                VIP
              </span>
            )}
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">Itens do Pedido</h4>
          <div className="space-y-2">
            {(order.items || []).map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <div>
                  <span className="text-white font-medium">{item.qty || 1}x {item.name}</span>
                  {item.description && (
                    <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                  )}
                </div>
                <span className="text-orange-400 font-semibold">R$ {(item.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informações do Pedido */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-gray-700">
          <div>
            <p className="text-sm text-gray-400 mb-1">Tempo de Preparo</p>
            <p className="text-white font-medium flex items-center gap-2">
              <Icons.ClockIcon className="w-4 h-4 text-orange-500" />
              {totalPrepMinutes > 0 ? `${totalPrepMinutes} min` : 'Não definido'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Forma de Pagamento</p>
            <p className="text-white font-medium">{order.metodo_pagamento || order.paymentMethod || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status do Pagamento</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              order.paymentStatus === 'pago' ? 'bg-green-600 text-white' :
              order.paymentStatus === 'pendente' ? 'bg-yellow-600 text-white' :
              'bg-red-600 text-white'
            }`}>
              {order.paymentStatus === 'pago' ? '🟢 Pago' :
               order.paymentStatus === 'pendente' ? '🟡 Pendente' :
               '🔴 Estornado'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Tipo de Entrega</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              order.tipo_pedido === 'delivery' ? 'bg-blue-600 text-white' :
              order.tipo_pedido === 'retirada' ? 'bg-green-600 text-white' :
              order.tipo_pedido === 'local' ? 'bg-purple-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {order.tipo_pedido === 'delivery' ? '🚚 Entrega' :
               order.tipo_pedido === 'retirada' ? '🏪 Retirada' :
               order.tipo_pedido === 'local' ? '🍽️ Consumo Local' :
               order.tipo_pedido || 'Não informado'}
            </span>
          </div>
        </div>

        {/* Troco */}
        {order.paymentStatus === 'pendente' && order.troco > 0 && (
          <div className="mb-6 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
            <div className="flex items-center gap-2">
              <Icons.CoinIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">
                Troco para: R$ {order.troco.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Entregador */}
        {order.tipo_pedido === 'delivery' && order.nome_entregador && (
          <div className="mb-6 p-3 bg-blue-900/20 border border-blue-600/30 rounded">
            <p className="text-sm text-gray-400 mb-1">Entregador Responsável</p>
            <p className="text-white font-semibold flex items-center gap-2">
              <Icons.TruckIcon className="w-5 h-5 text-blue-400" />
              {order.nome_entregador}
            </p>
          </div>
        )}

        {/* Observações */}
        {(order.observacoes || order.comments) && (
          <div className="mb-6">
            <h4 className="text-sm text-gray-400 mb-2">Observações</h4>
            <p className="text-white bg-gray-800 p-3 rounded">{order.observacoes || order.comments}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <Icons.PrinterIcon className="w-5 h-5" />
            Imprimir
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
