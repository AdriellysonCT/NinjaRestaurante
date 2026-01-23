import React, { useMemo, useState } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
import { useAuth } from '../context/AuthContext';
import ImprimirComanda from './ImprimirComanda';
import DeliveryChat from './DeliveryChat';
import { ratingService } from '../services/ratingService';
import { formatPhoneForWhatsApp, formatDisplayPhone } from '../utils/phoneFormatter';
// Detalhes do pedido - modal estilizado escuro

export const OrderDetailModal = ({ isOpen, onClose, order }) => {
  const { restaurante } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printJob, setPrintJob] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isRated, setIsRated] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  // Sincronizar comentários quando o pedido mudar
  React.useEffect(() => {
    if (order) {
      setComments(order.observacoes || order.comments || '');
      
      // Verificar se já foi avaliado
      if (order.tipo_pedido === 'delivery' && (order.status === 'concluido' || order.status === 'finalizado')) {
        ratingService.getRatingByPedido(order.id).then(data => {
          if (data) {
            setExistingRating(data);
            setIsRated(true);
            setRating(data.estrelas);
            setRatingComment(data.comentario || '');
          } else {
            setExistingRating(null);
            setIsRated(false);
            setRating(0);
            setRatingComment('');
          }
        });
      }
    }
  }, [order]);


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
    const formattedPhone = formatPhoneForWhatsApp(phoneRaw);
    
    if (!formattedPhone) {
      alert('Telefone do cliente inválido ou não informado.');
      return;
    }
    
    const message = `Olá ${order.nome_cliente || order.customerName || ''}, sobre seu pedido #${order.numero_pedido}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
  
  const handleRateDriver = async () => {
    if (rating === 0) {
      alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    
    try {
      setIsLoading(true);
      await ratingService.createDriverRating({
        pedidoId: order.id,
        restauranteId: restaurante.id,
        entregadorId: order.id_entregador,
        estrelas: rating,
        comentario: ratingComment
      });
      setIsRated(true);
      alert('Avaliação enviada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar avaliação. Verifique se a tabela de avaliações foi criada.');
    } finally {
      setIsLoading(false);
    }
  };

  // Se não houver pedido, o Modal interno lidará com o isOpen=false
  // Mas precisamos garantir que não acessemos propriedades de order se ele for null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="">
        {order && (
          <div className="space-y-3">
            <h2 className="text-center text-lg font-bold text-foreground mb-3">{`Detalhes do Pedido #${order.numero_pedido}`}</h2>
          {/* Cabeçalho do pedido */}
          <div className="flex justify-between items-start text-foreground pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-base">{order.nome_cliente || order.customerName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDateBr(order.criado_em || order.created_at || order.timestamp)}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-xl text-primary">R$ {(parseFloat(order.valor_total ?? order.total ?? 0)).toFixed(2)}</p>
            </div>
          </div>
          
          {/* Itens do pedido */}
          <div className="py-2">
            <h4 className="font-semibold mb-2 text-foreground text-sm">Itens do Pedido</h4>
            <ul className="space-y-1.5 text-foreground">
              {(order.items || []).map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{(item.qty ?? item.quantidade ?? 1)}x <span className="text-foreground">{item.name ?? item?.itens_cardapio?.nome}</span></span>
                  <span className="font-bold text-primary">R$ {(Number(item.price ?? item.preco_unitario ?? 0)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Informações adicionais */}
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tempo de Preparo</p>
              <p className="font-bold flex items-center gap-1 text-foreground">
                <Icons.ClockIcon className="w-4 h-4 text-primary" />
                {totalPrepMinutes > 0 ? `${totalPrepMinutes} min` : '-- min'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pagamento</p>
              <p className="font-bold text-foreground">{order.metodo_pagamento || order.paymentMethod || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Logística</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  order.tipo_pedido === 'delivery' ? 'bg-blue-600 text-white shadow-sm' :
                  order.tipo_pedido === 'retirada' ? 'bg-success text-white shadow-sm' :
                  order.tipo_pedido === 'local' ? 'bg-purple-600 text-white shadow-sm' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {order.tipo_pedido === 'delivery' ? '🚚 Entrega' :
                   order.tipo_pedido === 'retirada' ? '🏪 Retirada' :
                   order.tipo_pedido === 'local' ? '🍽️ Local' :
                   order.tipo_pedido || 'N/A'}
                </span>
              </div>
            </div>
            {/* Mostrar troco para pedidos em dinheiro */}
            {order.troco > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Troco para</p>
                <p className="font-black text-primary">R$ {order.troco.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          {/* Entregador Responsável - apenas para pedidos de entrega */}
          {order.tipo_pedido === 'delivery' && ['aceito', 'coletado', 'concluido'].includes(order.status) && order.nome_entregador && (
            <div className="border-t border-border pt-3">
              <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Entregador Responsável</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.TruckIcon className="w-5 h-5 text-success" />
                  <span className="text-base font-bold text-foreground">
                    {order.nome_entregador}
                  </span>
                </div>
              </div>

              {/* Sistema de Avaliação */}
              {(order.status === 'concluido' || order.status === 'finalizado') && (
                <div className="mt-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
                  <h5 className="text-[10px] font-black text-primary uppercase mb-2">Avalie o Entregador</h5>
                  
                  {isRated ? (
                    <div className="space-y-1">
                      <div className="flex gap-1 text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icons.StarIcon 
                            key={star} 
                            className={`w-4 h-4 ${star <= rating ? 'fill-current' : 'text-muted-foreground/30'}`} 
                          />
                        ))}
                      </div>
                      {ratingComment && (
                        <p className="text-xs text-muted-foreground italic mt-1">"{ratingComment}"</p>
                      )}
                      <p className="text-[9px] text-success font-bold mt-1.5 flex items-center gap-1">
                        <Icons.CheckCircleIcon className="w-3 h-3" /> Avaliação enviada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setRating(star); }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-125 focus:outline-none"
                          >
                            <Icons.StarIcon 
                              className={`w-6 h-6 transition-colors ${
                                star <= (hoverRating || rating) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-muted-foreground/30'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Algum comentário? (opcional)"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-secondary/50 text-xs px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRateDriver(); }}
                        disabled={isLoading || rating === 0}
                        className="w-full py-2 bg-primary text-primary-foreground text-xs font-black rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 uppercase"
                      >
                        Enviar Avaliação
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Informação específica para pedidos locais */}
          {(order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local') && order.status === 'concluido' && (
            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Icons.CheckCircleIcon className="w-5 h-5 text-success" />
                <span className="text-base font-bold text-foreground">
                  {order.tipo_pedido === 'retirada' ? 'Pedido retirado pelo cliente' : 'Pedido consumido no local'}
                </span>
              </div>
            </div>
          )}
          
          {/* Comentários */}
          <div className="border-t border-border pt-3 text-foreground">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-sm">Observações</h4>
              <button 
                onClick={() => setShowComments(true)}
                className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
              >
                Editar
              </button>
            </div>
            <p className="text-sm bg-secondary p-3 rounded-lg text-muted-foreground italic">
              {order.observacoes || order.comments || "Nenhuma observação informada."}
            </p>
          </div>
          
          {/* Mensagem de impressão (removida variável antiga) */}
          
          
          {/* Chat com o Entregador */}
          {showChat && (
            <div className="border-t border-border pt-3">
              <DeliveryChat order={order} />
            </div>
          )}

          {/* Contato do cliente */}
          <div className="border-t border-border pt-3 text-foreground">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-sm">Contato do Cliente</h4>
              <button 
                onClick={handleWhatsApp}
                className="flex items-center gap-1.5 text-xs font-bold text-success hover:opacity-80 transition-opacity"
              >
                <Icons.PhoneIcon className="w-3.5 h-3.5" />
                Abrir WhatsApp
              </button>
            </div>
            <div className="text-sm bg-secondary p-3 rounded-lg flex items-center justify-between gap-2 text-foreground font-bold shadow-inner">
              <div className="flex items-center gap-2">
                <Icons.PhoneIcon className="w-4 h-4 text-muted-foreground" />
                <span>{formatDisplayPhone(order.telefone_cliente || order.customerPhone)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-medium">via NinjaPay</span>
            </div>
          </div>
          
          {/* Ações */}
          <div className="border-t border-border pt-4 flex gap-3">
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
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-bold flex-1 transition-all shadow-sm border border-border"
              >
                <Icons.PrinterIcon className="w-4 h-4 text-primary" />
                {isPrinting ? 'Aguarde...' : 'Imprimir'}
              </button>
              
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-success hover:bg-success/90 text-white text-sm font-bold flex-1 transition-all shadow-sm"
              >
                <Icons.PhoneIcon className="w-4 h-4" />
                WhatsApp
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold flex-1 transition-all shadow-sm border ${
                  showChat 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
                }`}
              >
                <span className="text-lg">💬</span>
                Chat
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal de edição de comentários */}
      <Modal 
        isOpen={showComments} 
        onClose={() => setShowComments(false)} 
        title="Editar Observações"
      >
        <div className="space-y-4">
          <textarea
            className="w-full bg-secondary text-foreground px-4 py-3 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary border border-border resize-none font-medium"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Adicione observações sobre o pedido..."
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowComments(false)}
              className="flex-1 py-3 text-sm font-bold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowComments(false)}
              className="flex-1 py-3 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
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