import React, { useMemo, useState } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
import { useAuth } from '../context/AuthContext';
import ImprimirComanda from './ImprimirComanda';
// Detalhes do pedido - modal estilizado escuro

export const OrderDetailModal = ({ isOpen, onClose, order }) => {
  const { restaurante } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(order?.observacoes || order?.comments || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printJob, setPrintJob] = useState(null);

  // Função para formatar número de telefone para WhatsApp
  const formatPhoneForWhatsApp = (phone) => {
    // Remover todos os caracteres não numéricos
    const numericOnly = phone ? phone.replace(/\D/g, '') : '';
    
    // Se o número já começar com 55 (código do Brasil), não adicionar novamente
    if (numericOnly.startsWith('55') && numericOnly.length >= 12) {
      return numericOnly;
    }
    
    // Adicionar 55 (Brasil) se não tiver código de país
    return `55${numericOnly}`;
  };

  // Ações simples: imprimir e WhatsApp
  const handlePrint = () => {
    try {
      setIsPrinting(true);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 600);
    }
  };

  const handleWhatsApp = () => {
    const phoneRaw = order.telefone_cliente || order.customerPhone || order.phone || '';
    const digits = (phoneRaw || '').replace(/\D/g, '');
    if (!digits) {
      alert('Telefone do cliente não informado neste pedido.');
      return;
    }
    // Se o número tiver 10 ou 11 dígitos (formato BR sem DDI), prefixa 55
    const withCountry = digits.length <= 13 && !digits.startsWith('55') ? `55${digits}` : digits;
    const message = `Olá ${order.nome_cliente || order.customerName || ''}, sobre seu pedido #${order.numero_pedido}`;
    window.open(`https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Helpers de exibição
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

  const totalPrepMinutes = useMemo(() => {
    if (!order) return 0;
    const explicit = Number(order?.prep_time ?? order?.prepTime);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const items = Array.isArray(order?.items)
      ? order.items
      : (Array.isArray(order?.itens_pedido) ? order.itens_pedido : []);
    const sum = items.reduce((acc, it) => {
      const itemPrep = Number(it?.prepTime ?? it?.itens_cardapio?.tempo_preparo ?? 0);
      return acc + (Number.isFinite(itemPrep) ? itemPrep : 0);
    }, 0);
    return sum || 0;
  }, [order]);

  if (!order) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="">
        <div className="space-y-3">
          <h2 className="text-center text-lg font-bold text-white mb-3">{`Detalhes do Pedido #${order.numero_pedido}`}</h2>
          {/* Cabeçalho do pedido */}
          <div className="flex justify-between items-start text-white pb-3 border-b border-gray-700">
            <div>
              <h3 className="font-bold text-base">{order.nome_cliente || order.customerName}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{formatDateBr(order.criado_em || order.created_at || order.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl text-[#FF6B00]">R$ {(parseFloat(order.valor_total ?? order.total ?? 0)).toFixed(2)}</p>
            </div>
          </div>
          
          {/* Itens do pedido */}
          <div className="py-2">
            <h4 className="font-semibold mb-2 text-white text-sm">Itens do Pedido</h4>
            <ul className="space-y-1.5 text-gray-200">
              {(order.items || []).map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{(item.qty ?? item.quantidade ?? 1)}x {item.name ?? item?.itens_cardapio?.nome}</span>
                  <span className="font-medium text-[#FF6B00]">R$ {(Number(item.price ?? item.preco_unitario ?? 0)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Informações adicionais */}
          <div className="border-t border-gray-700 pt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Tempo de Preparo</p>
              <p className="font-medium flex items-center gap-1 text-white">
                <Icons.ClockIcon className="w-4 h-4" />
                {totalPrepMinutes > 0 ? `${totalPrepMinutes} min` : 'NaN min'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Forma de Pagamento</p>
              <p className="font-medium text-white">{order.metodo_pagamento || order.paymentMethod || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tipo de Entrega</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
            {/* Mostrar troco para pedidos em dinheiro */}
            {order.troco > 0 && (
              <div>
                <p className="text-xs text-gray-400">Troco para</p>
                <p className="font-medium text-yellow-400">R$ {order.troco.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          {/* Entregador Responsável - apenas para pedidos de entrega */}
          {order.tipo_pedido === 'delivery' && ['aceito', 'coletado', 'concluido'].includes(order.status) && order.nome_entregador && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-1">Entregador Responsável</h4>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <span className="text-base font-semibold text-white">
                  {order.nome_entregador}
                </span>
              </div>
            </div>
          )}
          
          {/* Informação específica para pedidos locais */}
          {(order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local') && order.status === 'concluido' && (
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span className="text-base font-semibold text-white">
                  {order.tipo_pedido === 'retirada' ? 'Pedido retirado pelo cliente' : 'Pedido consumido no local'}
                </span>
              </div>
            </div>
          )}
          
          {/* Comentários */}
          <div className="border-t border-gray-700 pt-3 text-white">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Observações</h4>
              <button 
                onClick={() => setShowComments(true)}
                className="text-xs text-[#FF6B00] hover:opacity-90"
              >
                Editar
              </button>
            </div>
            <p className="text-sm bg-gray-800 p-2 rounded-md text-gray-200">
              {order.observacoes || order.comments || "Nenhuma observação."}
            </p>
          </div>
          
          {/* Mensagem de impressão (removida variável antiga) */}
          
          {/* Contato do cliente */}
          <div className="border-t border-gray-700 pt-3 text-white">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Contato</h4>
              <button 
                onClick={handleWhatsApp}
                className="flex items-center gap-1 text-xs text-[#28A745] hover:opacity-90"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M11.999 1.99C6.47 1.99 1.99 6.47 1.99 12s4.48 10.01 10.009 10.01c5.53 0 10.01-4.48 10.01-10.01S17.53 1.99 11.999 1.99zm0 18.08c-4.46 0-8.08-3.62-8.08-8.08s3.62-8.08 8.08-8.08 8.08 3.62 8.08 8.08-3.62 8.08-8.08 8.08z"/>
                </svg>
                Contatar via WhatsApp
              </button>
            </div>
            <p className="text-sm bg-gray-800 p-2 rounded-md flex items-center gap-2 text-gray-200">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {order.telefone_cliente || order.customerPhone || 'Não informado'}
            </p>
          </div>
          
          {/* Ações */}
          <div className="border-t border-gray-700 pt-3 flex gap-2">
              <button
                onClick={() => {
                  try {
                    setIsPrinting(true);
                    const pedidoParaImpressao = {
                      id: order.id,
                      numero_pedido: order.numero_pedido,
                      nome_cliente: order.nome_cliente || order.customerName,
                      telefone_cliente: order.telefone_cliente || order.customerPhone || order.phone,
                      tipo_pedido: order.tipo_pedido || 'Balcão',
                      criado_em: order.criado_em || order.created_at || order.timestamp,
                      itens_pedido: (order.items || []).map((it) => ({
                        quantidade: it.qty ?? 1,
                        itens_cardapio: { nome: it.name },
                        preco_unitario: it.price ?? 0,
                      })),
                      subtotal: order.total,
                      valor_total: order.total,
                      metodo_pagamento: order.metodo_pagamento || order.paymentMethod,
                      prep_time: order.prep_time || order.prepTime || 0,
                    };
                    setPrintJob({ pedido: pedidoParaImpressao, restaurante });
                  } finally {
                    // isPrinting será limpo no onAfterPrint
                  }
                }}
                disabled={isPrinting}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium flex-1 transition-colors"
              >
                <Icons.PrinterIcon className="w-4 h-4" />
                {isPrinting ? 'Imprimindo...' : 'Imprimir'}
              </button>
              
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-medium flex-1 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                WhatsApp
              </button>
            </div>
        </div>
      </Modal>
      
      {/* Modal de edição de comentários */}
      <Modal 
        isOpen={showComments} 
        onClose={() => setShowComments(false)} 
        title="Editar Observações"
      >
        <div className="space-y-4">
          <textarea
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-md min-h-[100px]"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Adicione observações sobre o pedido..."
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowComments(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowComments(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-[#FF6B00] text-white hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
      {printJob && (
        <ImprimirComanda
          pedido={printJob.pedido}
          restaurante={printJob.restaurante}
          auto={true}
          onAfterPrint={() => {
            setIsPrinting(false);
            setPrintJob(null);
          }}
        />
      )}
      {/* Envio WhatsApp feito pelo botão principal */}
    </>
  );
};