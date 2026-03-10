import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as Icons from './icons/index.jsx';

export default function DeliveryChat({ order }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Obter ID do usuário atual (restaurante)
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });

    if (order?.id) {
        // Buscar mensagens iniciais
        fetchMessages();

        // Inscrever no canal para receber mensagens em tempo real
        // Nota: A tabela 'mensagens_entrega' DEVE estar na publicação 'supabase_realtime'
        const channel = supabase
        .channel(`chat_delivery_${order.id}`) // Canal único por pedido
        .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'mensagens_entrega', 
              filter: `pedido_id=eq.${order.id}` 
            },
            (payload) => {
               const newMessage = payload.new;
               console.log('💬 [Realtime] Nova mensagem recebida:', newMessage);
               
               setMessages(prev => {
                 // Verificação robusta contra duplicidade (ID ou timestamp+conteúdo)
                 const exists = prev.some(msg => 
                    msg.id === newMessage.id || 
                    (msg.timestamp === newMessage.timestamp && msg.conteudo === newMessage.conteudo)
                 );
                 if (exists) return prev;
                 
                 const updated = [...prev, newMessage];
                 // Ordenar por data de criação para garantir ordem cronológica
                 return updated.sort((a, b) => 
                    new Date(a.criado_em || a.timestamp).getTime() - 
                    new Date(b.criado_em || b.timestamp).getTime()
                 );
               });
            }
        )
        .subscribe((status) => {
          console.log(`📡 [Realtime] Status da conexão chat: ${status}`);
        });

        return () => {
          console.log(`🔕 [Realtime] Removendo canal chat: ${order.id}`);
          supabase.removeChannel(channel);
        };
    }
  }, [order?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens_entrega')
        .select('*')
        .eq('pedido_id', order.id)
        .order('criado_em', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const content = newMessage.trim();
    setNewMessage(''); // Limpeza otimista

    try {
      const { data, error } = await supabase
        .from('mensagens_entrega')
        .insert({
          pedido_id: order.id,
          remetente_id: userId,
          tipo_remetente: 'restaurante',
          conteudo: content,
          lida: false
        })
        .select();

      if (error) throw error;
      
      // Se tivermos os dados retornados, adicionamos para UI instantânea
      if (data && data[0]) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data[0].id);
          if (exists) return prev;
          return [...prev, data[0]];
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
      setNewMessage(content); // Restaurar em caso de erro
    }
  };

  return (
    <div className="flex flex-col h-[300px] bg-background border border-border rounded-lg overflow-hidden mt-4 shadow-sm">
      {/* Header do Chat */}
      <div className="p-3 border-b border-border bg-secondary/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
             <span className="text-xs">💬</span>
           </div>
           <div>
             <p className="font-semibold text-sm text-foreground">Chat com Entregador</p>
             <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
               {order.nome_entregador ? 'Online' : 'Aguardando...'}
             </p>
           </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/5">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 flex flex-col items-center gap-2">
            <span className="text-2xl opacity-50">👋</span>
            <p>Este é o início da conversa.<br/>Envie uma mensagem para o entregador.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.tipo_remetente === 'restaurante' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-md ${
                msg.tipo_remetente === 'restaurante' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-muted dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border rounded-tl-none'
              }`}>
                <p className="leading-relaxed">{msg.conteudo}</p>
                <p className={`text-[10px] mt-1 text-right opacity-70`}>
                  {msg.criado_em ? new Date(msg.criado_em).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envio */}
      <form onSubmit={handleSend} className="p-2 border-t border-border bg-background flex gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 bg-secondary/20 border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 placeholder:text-muted-foreground/50 transition-all"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
}

