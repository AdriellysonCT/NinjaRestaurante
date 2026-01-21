import React, { useState } from 'react';
import DeliveryChat from './DeliveryChat';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';

export const OrderDetailModalSimple = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

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
  const [showChat, setShowChat] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pedido #${order.numero_pedido}`} size="lg">
      <div className="space-y-6">
        {/* Cliente e Total */}
        <div className="flex justify-between items-start pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">{order.nome_cliente || order.customerName}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Icons.PhoneIcon className="w-4 h-4" />
              {order.telefone_cliente || order.customerPhone || 'Não informado'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">R$ {(order.total || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div>
          <h4 className="text-lg font-semibold text-card-foreground mb-3">Itens do Pedido</h4>
          <div className="space-y-2">
            {(order.items || []).map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-foreground font-medium">{item.qty || 1}x {item.name}</span>
                </div>
                <span className="text-primary font-bold">R$ {(item.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informações do Pedido */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Tempo de Preparo</p>
            <p className="text-foreground font-bold flex items-center gap-2">
              <Icons.ClockIcon className="w-4 h-4 text-primary" />
              {totalPrepMinutes > 0 ? `${totalPrepMinutes} min` : 'Não definido'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Forma de Pagamento</p>
            <p className="text-foreground font-bold">{order.metodo_pagamento || order.paymentMethod || 'Não informado'}</p>
          </div>
        </div>

        {/* Observações */}
        {(order.observacoes || order.comments) && (
          <div>
            <h4 className="text-sm font-bold text-muted-foreground mb-2 uppercase">Observações</h4>
            <p className="text-foreground bg-secondary/50 p-3 rounded-lg border border-border italic">{order.observacoes || order.comments}</p>
          </div>
        )}

        {/* Chat com Entregador */}
        {showChat && (
          <DeliveryChat order={order} />
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg font-bold transition-all"
          >
            <Icons.PrinterIcon className="w-5 h-5" />
            Imprimir
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-bold transition-all ${
              showChat 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
            }`}
          >
            <span className="text-lg">💬</span>
            Chat
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-success hover:bg-success/90 text-white rounded-lg font-bold transition-all shadow-sm"
          >
            WhatsApp
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold transition-all shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
