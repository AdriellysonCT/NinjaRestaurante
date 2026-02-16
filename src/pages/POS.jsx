import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '../components/icons/index.jsx';
import { useAppContext } from '../context/AppContext';
import { printService } from '../services/printService';
import { createOrder } from '../services/orderService';
import { logger } from '../utils/logger';

const POS = () => {
  const { menuItems } = useAppContext();
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  const [comandas, setComandas] = useState([]); 
  const [comandaAtiva, setComandaAtiva] = useState(null);
  const [numeroComanda, setNumeroComanda] = useState('');
  const [showComandas, setShowComandas] = useState(false);

  // Ref para scroll horizontal com mouse wheel
  const categoriesScrollRef = useRef(null);

  const categories = useMemo(() => {
    return ['Todos', ...new Set(menuItems.map(item => item.category))];
  }, [menuItems]);

  const popularItems = useMemo(() => {
    return menuItems.filter(item => item.available && item.featured).slice(0, 6);
  }, [menuItems]);

  useEffect(() => {
    const saved = localStorage.getItem('fome-ninja-comandas');
    if (saved) setComandas(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('fome-ninja-comandas', JSON.stringify(comandas));
  }, [comandas]);

  // Hook para scroll horizontal com mouse wheel
  useEffect(() => {
    const scrollContainer = categoriesScrollRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && item.available;
    });
  }, [menuItems, selectedCategory, searchTerm]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing.qty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod('');
    setCashReceived('');
    setCustomerName('');
    setComandaAtiva(null);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return received > cartTotal ? received - cartTotal : 0;
  };

  const handleOpenComanda = () => {
    if (!numeroComanda) return;
    const exists = comandas.find(c => c.numero === numeroComanda);
    if (exists) {
        setComandaAtiva(exists);
        setCart(exists.items);
        setCustomerName(exists.customerName);
    } else {
        const newComanda = {
            id: Date.now(),
            numero: numeroComanda,
            items: [],
            total: 0,
            customerName: `Mesa ${numeroComanda}`,
            createdAt: new Date().toISOString()
        };
        setComandas([...comandas, newComanda]);
        setComandaAtiva(newComanda);
        setCart([]);
    }
    setNumeroComanda('');
    setShowComandas(false);
  };

  const handleFinishOrder = async () => {
    if (cart.length === 0 || !paymentMethod || isProcessing) return;
    setIsProcessing(true);
    try {
      const orderData = {
        customerName: customerName || (comandaAtiva ? `Mesa ${comandaAtiva.numero}` : 'Balcão'),
        total: cartTotal,
        subtotal: cartTotal,
        tipo_pedido: comandaAtiva ? 'local' : 'retirada',
        status: 'concluido',
        metodo_pagamento: paymentMethod,
        pagamento_recebido_pelo_sistema: true,
        mesa_numero: comandaAtiva?.numero || null,
        items: cart.map(i => ({ 
            id_item_cardapio: i.id, 
            quantidade: i.qty, 
            preco_unitario: i.price,
            name: i.name 
        }))
      };
      const savedOrder = await createOrder(orderData);
      await printService.autoPrintOnAccept({
        ...savedOrder,
        items: cart,
        troco: calculateChange(),
        valor_recebido: parseFloat(cashReceived) || cartTotal
      }, null, 'pdv');
      if (comandaAtiva) setComandas(prev => prev.filter(c => c.id !== comandaAtiva.id));
      setOrderDetails({ ...savedOrder, change: calculateChange() });
      setOrderComplete(true);
      clearCart();
      setTimeout(() => setOrderComplete(false), 4000);
    } catch (error) {
      logger.error('Erro no checkout POS:', error);
      alert('Falha ao processar venda: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 gap-6 select-none">
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Coluna 1: PRODUTOS */}
        <div className="flex-[7] flex flex-col gap-5 min-w-0">
          
          {/* CABEÇALHO PILL - CORREÇÃO DE ALINHAMENTO MATEMÁTICO */}
          <div className="bg-card border border-border h-16 rounded-full px-6 flex items-center justify-between shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3 h-full">
              <div className="w-10 h-10 bg-[#fb923c20] rounded-xl flex items-center justify-center">
                <Icons.CashRegisterIcon className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xl font-black text-white leading-none tracking-tight">
                PDV Balcão
              </span>
            </div>
            
            <button 
              onClick={() => setShowComandas(true)} 
              className="bg-[#3b4b61] hover:bg-[#4a5b75] text-white px-6 h-11 rounded-full text-sm font-black flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Icons.ClipboardListIcon className="w-4 h-4 text-orange-400" />
              <span className="leading-none">Comandas ({comandas.length})</span>
            </button>
          </div>

          {/* BUSCA PILL */}
          <div className="relative flex-shrink-0">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 flex items-center justify-center">
              <Icons.SearchIcon className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar produto pelo nome..."
              className="w-full bg-card border border-border h-14 rounded-full pl-16 pr-6 text-white text-base focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* CATEGORIAS PILLS - DESIGN MELHORADO SEM SCROLLBAR */}
          <div className="relative flex-shrink-0">
            <div 
              ref={categoriesScrollRef}
              className="flex items-center gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
            >
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`h-11 px-6 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap ${
                     selectedCategory === cat 
                       ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                       : 'bg-card border border-border text-muted-foreground hover:text-white hover:border-primary/30 hover:bg-card/80'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
            {/* Gradient fade para indicar scroll */}
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>

          {/* GRID DE PRODUTOS */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-8 custom-scrollbar">
             {popularItems.length > 0 && selectedCategory === 'Todos' && !searchTerm && (
               <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 ml-4">Mais Vendidos</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                     {popularItems.map(item => (
                       <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="bg-card border border-border p-3 rounded-2xl hover:border-primary/50 transition-all flex flex-col items-center gap-2 text-center group"
                       >
                          <div className="w-full aspect-square bg-secondary/30 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                             {item.image ? (
                               <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             ) : (
                               <div className="text-2xl opacity-10">🍱</div>
                             )}
                          </div>
                          <div className="space-y-0.5 w-full">
                             <p className="font-bold text-[10px] text-white line-clamp-1">{item.name}</p>
                             <p className="font-black text-primary text-xs">R$ {item.price.toFixed(2)}</p>
                          </div>
                       </button>
                     ))}
                  </div>
               </section>
             )}

             <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 ml-4">Todos os Itens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                   {filteredItems.map(item => (
                     <button
                       key={item.id}
                       onClick={() => addToCart(item)}
                       className="bg-card border border-border p-4 rounded-3xl hover:bg-white/[0.02] hover:border-primary/30 transition-all flex items-center gap-5 text-left group active:scale-[0.98]"
                     >
                       <div className="w-16 h-16 bg-secondary/30 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.image ? (
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                             <div className="text-2xl opacity-10">🍱</div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-white truncate mb-1">{item.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">{item.category}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-primary text-base whitespace-nowrap">R$ {item.price.toFixed(2)}</p>
                       </div>
                     </button>
                   ))}
                </div>
             </section>
          </div>
        </div>

        {/* Coluna 2: CHECKOUT - REDESIGN LIMPO */}
        <div className="flex-[3] flex flex-col gap-5 min-w-[340px]">
          
          {/* Card Carrinho - Estilo Moderno */}
          <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden flex-1 flex flex-col min-h-0">
             <div className="px-6 py-4 flex justify-between items-center">
                <h2 className="font-black text-lg text-foreground">Carrinho</h2>
                <span className="text-sm font-bold text-muted-foreground">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto px-6 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 py-12">
                    <Icons.ShoppingBagIcon className="w-16 h-16 mb-3 opacity-20" />
                    <p className="text-base font-bold">Carrinho vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{item.name}</h4>
                          <p className="text-xs text-primary font-black mt-0.5">R$ {item.price.toFixed(2)}</p>
                       </div>
                       <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-2 py-1">
                          <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                            <Icons.MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="font-black text-sm text-foreground min-w-[24px] text-center">{item.qty}</span>
                          <button onClick={() => addToCart(item)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                            <Icons.PlusIcon className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>

             <div className="px-6 py-5 border-t border-border bg-secondary/5 flex justify-between items-center">
                <span className="text-base font-bold text-foreground">Total</span>
                <div className="text-3xl font-black text-primary">R$ {cartTotal.toFixed(2)}</div>
             </div>
          </div>

          {/* Card Nome do Cliente */}
          <div className="bg-card border border-border rounded-3xl shadow-lg p-6">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-base text-foreground">Nome do Cliente (opcional)</h3>
                {comandaAtiva && (
                  <div className="bg-primary/20 text-primary text-xs font-black px-3 py-1 rounded-full border border-primary/30">
                      MESA {comandaAtiva.numero}
                  </div>
                )}
             </div>
             <input 
                type="text" 
                placeholder="Cliente balcão"
                className="w-full bg-secondary/50 text-foreground px-5 py-3.5 rounded-2xl border border-border focus:border-primary/50 focus:outline-none font-medium text-sm transition-all placeholder:text-muted-foreground/50"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
             />
          </div>

          {/* Card Método de Pagamento */}
          <div className="bg-card border border-border rounded-3xl shadow-lg p-6 space-y-5">
             <h3 className="font-black text-base text-foreground">Método de Pagamento</h3>
             
             <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'cash', label: 'Dinheiro', icon: Icons.DollarSignIcon },
                    { id: 'card', label: 'Cartão', icon: Icons.CreditCardIcon },
                    { id: 'pix', label: 'PIX', icon: Icons.QrCodeIcon }
                ].map(method => (
                    <button 
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-2 py-5 rounded-2xl transition-all ${
                            paymentMethod === method.id 
                                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/70'
                        }`}
                    >
                        <method.icon className="w-7 h-7" />
                        <span className="text-xs font-bold">{method.label}</span>
                    </button>
                ))}
             </div>

             {paymentMethod === 'cash' && (
               <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 pt-2">
                  <div className="flex-1">
                     <input 
                        type="number" 
                        placeholder="Valor recebido"
                        className="w-full bg-secondary/50 text-foreground p-4 rounded-2xl border border-border font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                        value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
                     />
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center bg-success/10 border-2 border-success/30 rounded-2xl px-3">
                     <span className="text-xs font-bold text-success/70 uppercase">Troco</span>
                     <span className="text-xl font-black text-success">R$ {calculateChange().toFixed(2)}</span>
                  </div>
               </div>
             )}

             <button 
                disabled={cart.length === 0 || !paymentMethod || isProcessing}
                onClick={handleFinishOrder}
                className={`w-full py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-lg ${
                  cart.length > 0 && paymentMethod && !isProcessing
                    ? 'bg-success text-white hover:brightness-110 active:scale-[0.98]'
                    : 'bg-secondary/30 text-muted-foreground/30 cursor-not-allowed'
                }`}
             >
                {isProcessing ? (
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.CheckIcon className="w-5 h-5" />
                    Finalizar Pedido
                  </>
                )}
             </button>
          </div>
        </div>
      </div>

      {/* MODAIS */}
      <AnimatePresence>
        {showComandas && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card border border-border w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                   <h3 className="text-xl font-black text-primary">COMANDA VIVA</h3>
                   <button onClick={() => setShowComandas(false)} className="bg-secondary p-2 rounded-full"> <Icons.XIcon className="w-5 h-5" /> </button>
                </div>
                <div className="p-8 space-y-6">
                   <div className="flex gap-3">
                      <input type="number" placeholder="Nº Mesa" className="flex-1 bg-secondary h-16 rounded-2xl border border-border font-black text-3xl text-center focus:ring-4 focus:ring-primary/10 outline-none" value={numeroComanda} onChange={e => setNumeroComanda(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleOpenComanda()} />
                      <button onClick={handleOpenComanda} className="bg-primary text-white px-8 font-black rounded-2xl shadow-lg">ABRIR</button>
                   </div>
                   <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {comandas.map(c => (
                        <div key={c.id} onClick={() => { setComandaAtiva(c); setCart(c.items); setCustomerName(c.customerName); setShowComandas(false); }} className="bg-secondary/20 p-5 rounded-2xl border border-border hover:border-primary transition-all flex justify-between items-center cursor-pointer">
                           <div className="flex items-center gap-4"> 
                              <div className="bg-card w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl text-primary">{c.numero}</div>
                              <span className="font-black text-white">MESA {c.numero}</span>
                           </div>
                           <p className="font-black text-primary text-xl">R$ {c.total.toFixed(2)}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;