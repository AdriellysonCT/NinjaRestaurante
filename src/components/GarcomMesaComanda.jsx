import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addItemToMesa, fetchMesaItems, markMesaItemsAsPrinted } from '../services/mesaItemsService';
import { updateTableStatus } from '../services/tableService';
import { printService } from '../services/printService';

const GarcomMesaComanda = ({ mesa, garcomLogado, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [comandaItens, setComandaItens] = useState([]);
  const [produtos, setProdutos] = useState([]);
  
  // Estado para adicionar item
  const [menuAberto, setMenuAberto] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [buscaProduto, setBuscaProduto] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  // Lógica de Filtro
  const produtosFiltrados = React.useMemo(() => {
    if (!buscaProduto.trim()) return produtos;
    
    const termo = buscaProduto.toLowerCase();
    const result = {};
    
    Object.keys(produtos).forEach(cat => {
      const filtrados = produtos[cat].filter(p => 
        p.nome.toLowerCase().includes(termo) || 
        (p.descricao && p.descricao.toLowerCase().includes(termo))
      );
      if (filtrados.length > 0) {
        result[cat] = filtrados;
      }
    });
    
    return result;
  }, [produtos, buscaProduto]);

  useEffect(() => {
    carregarDados();
  }, [mesa]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar Itens da Mesa do Banco (Sincronizado com o Painel)
      const itens = await fetchMesaItems(mesa.id);
      setComandaItens(itens || []);

      // 2. Carregar Cardápio
      const { data: produtosData, error: produtosError } = await supabase.rpc('get_produtos_garcom', {
        p_restaurante_id: garcomLogado.restaurante_id
      });
      if (produtosError) throw produtosError;
      
      let lista = [];
      if (typeof produtosData === 'string') {
        try { lista = JSON.parse(produtosData); } catch(e) {}
      } else if (Array.isArray(produtosData)) {
        lista = produtosData;
      }

      const agrupado = lista.reduce((acc, p) => {
        const cat = p.categoria || 'Diversos';
        acc[cat] = acc[cat] || [];
        acc[cat].push(p);
        return acc;
      }, {});
      
      setProdutos(agrupado);

    } catch (err) {
      console.error('Erro ao carregar dados da mesa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirMesa = async () => {
    setActionLoading(true);
    try {
      // No novo fluxo, apenas marcamos a mesa como ocupada no banco
      await updateTableStatus(mesa.id, 'ocupada', { 
        started_at: new Date().toISOString(),
        id_garcom_atual: garcomLogado.id 
      });
      
      // Atualiza o objeto local para refletir a mudança de UI imediata
      mesa.status = 'ocupada';
      mesa.id_garcom_atual = garcomLogado.id;
      
      await carregarDados(); 
    } catch (err) {
      console.error('Erro ao abrir mesa:', err);
      alert('Erro ao abrir mesa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdicionarItem = async () => {
    if (!produtoSelecionado) return;
    setActionLoading(true);
    try {
      // Usar serviço unificado: Grava na tabela 'itens_mesa' que o painel do restaurante monitora
      await addItemToMesa(mesa.id, produtoSelecionado.id, quantidade, observacao);
      
      // Sucesso
      setMenuAberto(false);
      setProdutoSelecionado(null);
      setQuantidade(1);
      setObservacao('');
      
      // Se a mesa estava livre e o garçom adicionou item direto (edge case do PWA), garante status ocupada
      if (mesa.status === 'livre' || mesa.status === 'disponivel') {
        await updateTableStatus(mesa.id, 'ocupada', { 
           started_at: new Date().toISOString(),
           id_garcom_atual: garcomLogado.id 
        });
        mesa.status = 'ocupada';
      }
      
      await carregarDados(); 
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      alert('Erro ao adicionar item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImprimirComanda = async () => {
    // Filtrar apenas itens não impressos
    const itensNovos = comandaItens.filter(item => !item.impresso);
    
    if (itensNovos.length === 0) {
      alert('Todos os itens já foram enviados para a cozinha!');
      return;
    }

    setActionLoading(true);
    try {
      const result = await printService.printMesaTicket(mesa, comandaItens, { onlyNew: true });
      
      if (result.success) {
        // Marcar como impressos no banco
        await markMesaItemsAsPrinted(mesa.id, result.printedIds);
        
        // Recarregar dados para atualizar UI (checks de impresso)
        await carregarDados();
        
        alert('Comanda enviada para a cozinha com sucesso!');
      } else {
        alert('Erro ao imprimir: ' + result.message);
      }
    } catch (err) {
      console.error('Erro ao processar impressão:', err);
      alert('Erro ao imprimir comanda.');
    } finally {
      setActionLoading(false);
    }
  };

  const calcularTotalComanda = () => {
    return comandaItens.reduce((acc, item) => acc + (Number(item.quantidade || 0) * Number(item.preco_unitario || 0)), 0);
  };

  // UI Components
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p>Acessando mesa {mesa.numero}...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative">
      
      {/* Header Modal */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="text-center font-bold">
          <h2 className="text-xl">Mesa {mesa.numero}</h2>
          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mt-1 ${mesa.status === 'livre' ? 'bg-slate-700 text-slate-300' : 'bg-blue-600/30 text-blue-400 border border-blue-500/20'}`}>
            {mesa.status}
          </span>
        </div>
        <div className="w-10"></div> {/* Espaçador para centralizar */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {mesa.status === 'livre' ? (
          // ESTADO: MESA LIVRE
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <span className="text-4xl text-slate-400">🍽️</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Mesa Livre</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-[250px] mx-auto">Esta mesa não possui clientes no momento. Deseja abrir a comanda?</p>
            </div>
            <button 
              onClick={handleAbrirMesa}
              disabled={actionLoading}
              className="mt-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 px-8 rounded-full shadow-xl w-full max-w-[280px] transition-all flex items-center justify-center gap-2"
            >
              {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Abrir Mesa {mesa.numero}</span>}
            </button>
          </div>
        ) : (
          // ESTADO: MESA OCUPADA (COMANDA)
          <div className="space-y-6">
            
            {/* Header da Comanda */}
             <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total da Comanda</p>
                    <h3 className="text-3xl font-black text-white">{formatCurrency(calcularTotalComanda())}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Itens</p>
                    <span className="text-2xl font-bold text-blue-400">{comandaItens.length}</span>
                  </div>
                </div>

                {/* Botão de Enviar para Cozinha / Imprimir */}
                {comandaItens.some(i => !i.impresso) && (
                  <button 
                    onClick={handleImprimirComanda}
                    disabled={actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 rounded-2xl shadow-lg border border-emerald-500/30 flex items-center justify-center gap-2 transition-all mt-1"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
                        <span>ENVIAR PARA COZINHA</span>
                      </>
                    )}
                  </button>
                )}
             </div>

            {/* Itens List */}
            <div>
              <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[11px] mb-3 ml-2">Itens Solicitados</h4>
              
              {comandaItens.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-6 text-center text-slate-500 text-sm">
                  Nenhum item na comanda ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {comandaItens.map(item => (
                      <div key={item.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center relative overflow-hidden">
                        {item.impresso && (
                          <div className="absolute top-0 right-0 p-1">
                             <div className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-tighter border-l border-b border-emerald-500/20">Impresso</div>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${item.impresso ? 'bg-slate-800 text-slate-500' : 'bg-blue-900/50 text-blue-400'}`}>{item.quantidade}x</span>
                            <span className={`font-bold ${item.impresso ? 'text-slate-400' : 'text-white'}`}>{item.itens_cardapio?.nome || 'Produto'}</span>
                          </div>
                          {item.observacao && (
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">" {item.observacao} "</p>
                          )}
                        </div>
                        <span className={`font-bold ml-2 ${item.impresso ? 'text-slate-500' : 'text-slate-300'}`}>{formatCurrency(Number(item.quantidade) * Number(item.preco_unitario))}</span>
                      </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* FIXED BUTTON BAR (Mesa Ocupada) */}
      {mesa.status !== 'livre' && !menuAberto && (
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-10">
           <button 
             onClick={() => setMenuAberto(true)}
             className="w-full bg-blue-600 active:scale-95 text-white font-bold py-4 rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] border border-blue-500 flex items-center justify-center gap-2 text-lg transition-transform"
           >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             Adicionar Item
           </button>
        </div>
      )}

      {/* DRAWER MENU / ADICIONAR ITEM */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay Escuro */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setMenuAberto(false); setProdutoSelecionado(null); setBuscaProduto(''); }}></div>
          
          {/* Menu Panel */}
          <div className="relative bg-[#0f172a] rounded-t-[2rem] border-t border-slate-700 h-[90%] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.6)] animate-slideUp">
            
            {/* Grabber */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
               <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
            </div>

            {/* Header / Fechar */}
            <div className="px-5 pb-4 flex justify-between items-center shrink-0">
               <div>
                 <h3 className="font-black text-2xl tracking-tight text-white">Cardápio</h3>
                 <p className="text-sm text-blue-400 font-medium">Busque e adicione rapidamente</p>
               </div>
               <button onClick={() => { setMenuAberto(false); setProdutoSelecionado(null); setBuscaProduto(''); }} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 transition-colors">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 pb-4 shrink-0 border-b border-slate-800 shadow-sm relative z-10 bg-[#0f172a]">
              <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Buscar pizza, bebida, hambúrguer..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-slate-500 border-none focus:outline-none text-[15px]"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
                {buscaProduto && (
                  <button onClick={() => setBuscaProduto('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Corpo do Menu (Lista) */}
            <div className="flex-1 overflow-y-auto p-3 shrink-1 min-h-0 bg-slate-900/50">
              {Object.keys(produtosFiltrados).length > 0 ? (
                Object.keys(produtosFiltrados).map(cat => (
                  <div key={cat} className="mb-6">
                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md pt-3 pb-2 px-2 z-10 flex items-center gap-2">
                       <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                       <h4 className="font-black text-slate-300 uppercase tracking-widest text-[11px]">{cat}</h4>
                    </div>
                    
                    <div className="space-y-2 px-1 mt-1">
                      {produtosFiltrados[cat].map(prod => {
                        const isExpanded = produtoSelecionado?.id === prod.id;
                        
                        return (
                          <div 
                            key={prod.id} 
                            className={`rounded-[1.25rem] border transition-all duration-200 overflow-hidden ${
                              isExpanded 
                                ? 'bg-slate-800 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60'
                            }`}
                          >
                            {/* Card Header (Sempre visivel) */}
                            <div 
                              className="p-4 flex gap-4 cursor-pointer"
                              onClick={() => {
                                if (isExpanded) {
                                  setProdutoSelecionado(null);
                                } else {
                                  setProdutoSelecionado(prod);
                                  setQuantidade(1);
                                  setObservacao('');
                                }
                              }}
                            >
                               {/* Icon/Image Placeholder */}
                               <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex flex-col items-center justify-center shrink-0 border border-slate-600/30 uppercase text-xs font-bold text-slate-400">
                                  {prod.nome.substring(0, 2)}
                               </div>
                               
                               <div className="flex-1 min-w-0 flex flex-col justify-center">
                                 <h5 className={`font-bold text-[15px] truncate transition-colors ${isExpanded ? 'text-blue-400' : 'text-slate-200'}`}>{prod.nome}</h5>
                                 {prod.descricao && !isExpanded && (
                                   <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{prod.descricao}</p>
                                 )}
                               </div>

                               <div className="shrink-0 flex flex-col items-end justify-center">
                                  <span className="font-bold text-slate-100">{formatCurrency(prod.preco)}</span>
                                  {!isExpanded && (
                                    <span className="text-[10px] text-blue-500 font-bold uppercase mt-1 px-2 py-0.5 bg-blue-500/10 rounded-md">Add +</span>
                                  )}
                               </div>
                            </div>

                            {/* Detalhes Expandidos (Qtd + Obs) */}
                            {isExpanded && (
                              <div className="px-4 pb-4 animate-fadeIn">
                                <div className="h-px w-full bg-slate-700/50 mb-4"></div>
                                
                                <div className="flex gap-4 items-end">
                                  
                                  {/* Observação Input */}
                                  <div className="flex-1">
                                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Alguma Observação?</label>
                                     <input 
                                       type="text" 
                                       placeholder="Ex: sem cebola..." 
                                       className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                       value={observacao}
                                       onChange={(e) => setObservacao(e.target.value)}
                                     />
                                  </div>

                                  {/* Qtd Selector */}
                                  <div className="shrink-0">
                                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 text-center">Qtd</label>
                                     <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl h-[42px] px-1">
                                        <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-lg active:scale-95">-</button>
                                        <span className="w-8 text-center font-bold text-sm">{quantidade}</span>
                                        <button onClick={() => setQuantidade(quantidade + 1)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-lg active:scale-95">+</button>
                                     </div>
                                  </div>
                                </div>

                                {/* Adicionar Button */}
                                <button 
                                  onClick={handleAdicionarItem}
                                  disabled={actionLoading}
                                  className="mt-4 w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-between px-5 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.4)]"
                                >
                                   <div className="flex items-center gap-2">
                                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                     <span>Adicionar à Comanda</span>
                                   </div>
                                   {actionLoading ? (
                                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                   ) : (
                                      <span className="bg-black/20 px-2.5 py-1 rounded-lg text-sm">{formatCurrency(prod.preco * quantidade)}</span>
                                   )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="text-slate-400 font-medium">Nenhum produto encontrado.</p>
                  <p className="text-slate-500 text-sm mt-1">Tente buscar por outro termo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GarcomMesaComanda;
