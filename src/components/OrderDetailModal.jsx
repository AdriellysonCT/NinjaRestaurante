import React, { useState } from 'react';
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

  if (!order) return null;

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
    const formattedPhone = formatPhoneForWhatsApp(phoneRaw);
    const message = `Olá ${order.nome_cliente || order.customerName || ''}, sobre seu pedido #${order.numero_pedido}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePrintTicket = async () => {
    setIsPrinting(true);
    setPrintMessage(null);
    
    try {
      const result = await printService.reprintOrderTicket(order);
      setPrintMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
      
      // Mostrar prévia da comanda no console
      console.log('Prévia da comanda:');
      console.log(result.ticketContent);
    } catch (error) {
      setPrintMessage({
        type: 'error',
        text: 'Erro ao imprimir comanda: ' + error.message
      });
    } finally {
      setIsPrinting(false);
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setPrintMessage(null);
      }, 3000);
    }
  };

  const handleAccept = async () => {
    // Imprimir comanda automaticamente ao aceitar
    setIsPrinting(true);
    
    try {
      const result = await printService.printOrderTicket(order);
      console.log('Resultado da impressão:', result);
      
      // Mostrar prévia da comanda no console
      console.log('Prévia da comanda:');
      console.log(result.ticketContent);
      
      // Chamar a função de aceitar do componente pai
      onAccept(order.id);
      onClose();
    } catch (error) {
      console.error('Erro ao imprimir comanda:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSaveComments = () => {
    // Aqui seria implementada a lógica para salvar os comentários
    // Por enquanto, apenas fechamos o modal de comentários
    setShowComments(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="">
        <div className="space-y-4" style={{ backgroundColor: '#121212' }}>
          <h2 className="text-center text-xl font-bold text-white">{`Detalhes do Pedido #${order.numero_pedido}`}</h2>
          {/* Cabeçalho do pedido */}
          <div className="flex justify-between items-start text-white">
            <div>
              <h3 className="font-bold">{order.nome_cliente || order.customerName}</h3>
              <p className="text-xs text-gray-300">{new Date(order.criado_em || order.timestamp).toLocaleString('pt-BR', { hour12: false })}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-[#FF6B00]">R$ {(parseFloat(order.valor_total ?? order.total ?? 0)).toFixed(2)}</p>
            </div>
          </div>
          
          {/* Itens do pedido */}
          <div className="border-t border-gray-700 pt-3">
            <h4 className="font-semibold mb-2 text-white">Itens do Pedido</h4>
            <ul className="space-y-2 text-gray-200">
              {(order.items || []).map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{(item.qty ?? item.quantidade ?? 1)}x {item.name ?? item?.itens_cardapio?.nome}</span>
                  <span className="font-medium">R$ {(Number(item.price ?? item.preco_unitario ?? 0)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Informações adicionais */}
          <div className="border-t border-gray-700 pt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Tempo de Preparo</p>
              <p className="font-medium flex items-center gap-1 text-white">
                <Icons.ClockIcon className="w-4 h-4" />
                {Number(order.prep_time ?? order.prepTime) ? `${Number(order.prep_time ?? order.prepTime)} min` : 'NaN min'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Forma de Pagamento</p>
              <p className="font-medium text-white">{order.metodo_pagamento || order.paymentMethod || 'Não informado'}</p>
            </div>
          </div>
          
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
                onClick={() => {
                  const raw = order.telefone_cliente || '';
                  const n = raw.replace(/\D/g, '');
                  if (!n) return;
                  const dest = n.startsWith('55') ? n : `55${n}`;
                  const text = `Olá ${order.nome_cliente || order.customerName || ''}, sobre seu pedido #${order.numero_pedido}`;
                  window.open(`https://wa.me/${dest}?text=${encodeURIComponent(text)}`, '_blank');
                }}
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
          <div className="border-t border-gray-700 pt-4 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
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
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium flex-1"
              >
                <Icons.PrinterIcon className="w-5 h-5" />
                {isPrinting ? 'Imprimindo...' : 'Imprimir Comanda'}
              </button>
              
              <button
                onClick={() => {
                  const raw = order.telefone_cliente || '';
                  const n = raw.replace(/\D/g, '');
                  if (!n) return;
                  const dest = n.startsWith('55') ? n : `55${n}`;
                  const text = `Olá ${order.nome_cliente || order.customerName || ''}, sobre seu pedido #${order.numero_pedido}`;
                  window.open(`https://wa.me/${dest}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-[#28A745] hover:bg-[#23913D] text-white text-sm font-medium flex-1"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M11.999 1.99C6.47 1.99 1.99 6.47 1.99 12s4.48 10.01 10.009 10.01c5.53 0 10.01-4.48 10.01-10.01S17.53 1.99 11.999 1.99zm0 18.08c-4.46 0-8.08-3.62-8.08-8.08s3.62-8.08 8.08-8.08 8.08 3.62 8.08 8.08-3.62 8.08-8.08 8.08z"/>
                </svg>
                WhatsApp
              </button>
            </div>
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