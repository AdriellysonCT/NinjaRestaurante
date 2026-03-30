import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createTable } from '../services/tableService';
import GarcomMesaComanda from '../components/GarcomMesaComanda';

const GarcomPWA = () => {
  const [searchParams] = useSearchParams();
  const restauranteIdUrl = searchParams.get('r');
  
  const [codigo, setCodigo] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado para armazenar dados se logado
  const [garcomLogado, setGarcomLogado] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);

  // Estados para Criar Mesa
  const [modalCriarMesa, setModalCriarMesa] = useState(false);
  const [novoNumeroMesa, setNovoNumeroMesa] = useState('');
  const [criandoMesa, setCriandoMesa] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Verifica se já estava logado e se o restaurante é o mesmo da URL
  useEffect(() => {
    const saved = localStorage.getItem('garcomNinjaSession');
    if (saved) {
      const session = JSON.parse(saved);
      // Pode ser que ele apenas acessou o link de outro restaurante, deslogar se for diferente?
      // Neste MVP, se houver sessao, entra direto no salao.
      setGarcomLogado(session);
    } else if (!restauranteIdUrl) {
      setErrorMsg('Link de acesso inválido (Restaurante não identificado).');
    }
  }, [restauranteIdUrl]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!restauranteIdUrl) {
      setErrorMsg('Link inválido. Peça um novo QR Code ao gerente.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Faz a chamada à função Postgres que criamos (RPC)
      const { data, error } = await supabase.rpc('login_garcom_pwa', {
        p_restaurante_id: restauranteIdUrl,
        p_codigo: codigo,
        p_pin: pin
      });

      if (error) throw error;

      if (data && data.sucesso) {
        // Sucesso!
        const sessionData = {
          id: data.id,
          nome: data.nome,
          restaurante_id: restauranteIdUrl,
          logado_em: new Date().toISOString()
        };
        localStorage.setItem('garcomNinjaSession', JSON.stringify(sessionData));
        setGarcomLogado(sessionData);
      } else {
        setErrorMsg('Código ou PIN inválidos!');
      }
    } catch (err) {
      console.error('Erro no login do garçom:', err);
      setErrorMsg('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('garcomNinjaSession');
    setGarcomLogado(null);
    setCodigo('');
    setPin('');
  };

  const carregarMesas = async () => {
    if (!garcomLogado) return;
    setLoadingMesas(true);
    try {
      const { data, error } = await supabase.rpc('get_mesas_garcom', {
        p_restaurante_id: garcomLogado.restaurante_id
      });
      if (error) throw error;
      setMesas(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
    } finally {
      setLoadingMesas(false);
    }
  };

  const handleCriarMesa = async (e) => {
    e.preventDefault();
    if (!novoNumeroMesa || criandoMesa) return;
    
    setCriandoMesa(true);
    try {
      await createTable({ numero: novoNumeroMesa }, garcomLogado.restaurante_id);
      setShowSuccess(true);
      // Recarrega lista
      await carregarMesas();
      
      // Fecha o modal após 2 segundos
      setTimeout(() => {
        setModalCriarMesa(false);
        setShowSuccess(false);
        setNovoNumeroMesa('');
      }, 2000);
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      alert(err.message || 'Erro ao criar mesa. Pode ser que ela já exista.');
    } finally {
      setCriandoMesa(false);
    }
  };

  useEffect(() => {
    if (garcomLogado) {
      carregarMesas();

      // Inscrição Realtime para Mesas
      const channel = supabase
        .channel('mesas_pwa_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mesas',
            filter: `id_restaurante=eq.${garcomLogado.restaurante_id}`
          },
          (payload) => {
            console.log('Mudança detectada no salão:', payload);
            carregarMesas(); // Recarrega a grade
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [garcomLogado]);

  // Função helper para estilizar o card de mesa
  const getMesaStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'livre':
        return 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700';
      case 'ocupada':
        return 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500';
      case 'fechando':
        return 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  if (garcomLogado) {
    // Se selecionou uma mesa, renderiza a comanda
    if (mesaSelecionada) {
      return (
        <GarcomMesaComanda 
          mesa={mesaSelecionada} 
          garcomLogado={garcomLogado} 
          onBack={() => {
            setMesaSelecionada(null);
            carregarMesas(); // recarrega a grid com dados mais novos
          }} 
        />
      );
    }

    // Grid Principal do Salão
    return (
      <div className="bg-slate-950 min-h-screen text-white flex flex-col relative overflow-hidden">
        
        {/* Header Fixo */}
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-md border border-blue-500/50">
               {garcomLogado.nome.charAt(0).toUpperCase()}
             </div>
             <div>
               <h2 className="text-lg font-bold leading-tight">{garcomLogado.nome}</h2>
               <p className="text-xs text-blue-400 font-medium">Garçom Ninja</p>
             </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
        
        {/* Adicionar Mesa e Refresh Bar */}
        <div className="px-5 pt-5 flex items-center gap-3">
           <button 
             onClick={() => setModalCriarMesa(true)}
             className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all active:scale-95"
           >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             Adicionar Mesa
           </button>
           <button 
              onClick={carregarMesas}
              disabled={loadingMesas}
              className="w-12 h-12 flex items-center justify-center bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl active:scale-95 transition-all"
            >
              <svg className={loadingMesas ? "animate-spin" : ""} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </button>
        </div>
        
        {/* Conteúdo: Lista de Mesas */}
         <div className="flex-1 p-5 pb-20 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight">Mesas do Salão</h1>
            <p className="text-sm text-slate-400 mt-1">Selecione uma mesa para atender.</p>
          </div>

          {loadingMesas ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 font-medium">Mapeando salão...</p>
            </div>
          ) : mesas.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mesas.map((mesa) => (
                <div 
                  key={mesa.id}
                  onClick={() => setMesaSelecionada(mesa)}
                  className={`relative p-5 rounded-[1.5rem] border flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 ${getMesaStyle(mesa.status)}`}
                >
                  {/* Badge de Ocupada/Fechando miniatura */}
                  {mesa.status !== 'livre' && (
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-white/30 animate-pulse"></div>
                  )}

                  <span className="text-3xl font-black tracking-tighter mb-1 mt-2">{mesa.numero}</span>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                    {mesa.status}
                  </span>
                  
                  {/* Exibir o garçom atual se estiver ocupada */}
                  {mesa.id_garcom_atual && mesa.id_garcom_atual === garcomLogado.id && (
                    <div className="absolute bottom-[-10px] bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-slate-950 shadow-sm">
                      VOCÊ
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800">
              <span className="text-5xl mb-4 block opacity-50">🪑</span>
              <p className="text-slate-400 font-medium">Nenhuma mesa configurada no restaurante.</p>
            </div>
          )}
         </div>

        {/* MODAL CRIAR MESA */}
        {modalCriarMesa && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => !showSuccess && setModalCriarMesa(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
               
               {/* CONTEÚDO DE SUCESSO */}
               {showSuccess ? (
                 <div className="text-center py-4 flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 relative">
                       {/* Círculo de fundo */}
                       <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping duration-1000"></div>
                       <div className="absolute inset-0 bg-green-500/20 rounded-full"></div>
                       
                       {/* Checkmark SVG Animado */}
                       <svg className="w-full h-full text-green-500 p-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" className="animate-dash" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'dash 0.5s ease-out forwards 0.2s' }}></polyline>
                       </svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Mesa {novoNumeroMesa}!</h3>
                    <p className="text-green-400 font-bold uppercase tracking-widest text-xs">Cadastrada com Sucesso</p>
                    
                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes dash {
                        to { stroke-dashoffset: 0; }
                      }
                    `}} />
                 </div>
               ) : (
                 <>
                   <div className="text-center mb-6">
                     <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-500/20">🪑</div>
                     <h3 className="text-2xl font-black text-white">Nova Mesa</h3>
                     <p className="text-sm text-slate-400 font-medium">Cadastre a numeração no sistema</p>
                   </div>

                   <form onSubmit={handleCriarMesa} className="space-y-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest text-center">Número da Mesa</label>
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Ex: 15" 
                          value={novoNumeroMesa}
                          onChange={(e) => setNovoNumeroMesa(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-5 text-center text-4xl font-black text-blue-400 placeholder-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                     </div>

                     <div className="flex flex-col gap-3">
                       <button 
                         type="submit" 
                         disabled={criandoMesa || !novoNumeroMesa}
                         className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center transition-all"
                       >
                         {criandoMesa ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirmar Cadastro'}
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setModalCriarMesa(false)}
                         className="w-full bg-transparent hover:bg-slate-800 text-slate-500 font-bold py-3 rounded-xl transition-all"
                       >
                         Cancelar
                       </button>
                     </div>
                   </form>
                 </>
               )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative z-10">
        <span className="text-4xl">🥷</span>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400 relative z-10">
        Garçom Ninja
      </h1>
      <p className="text-slate-400 mb-8 text-center text-sm font-medium relative z-10">Acesso exclusivo para funcionários.</p>
      
      <div className="w-full max-w-sm bg-slate-800/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-700/50 shadow-2xl relative z-10">
        <form onSubmit={handleLogin} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Código de Acesso</label>
            <input 
              type="text" 
              placeholder="Ex: 101" 
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg text-center font-bold"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">PIN 4 Dígitos</label>
            <input 
              type="password" 
              placeholder="••••" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center text-2xl tracking-[0.75em] font-bold"
              maxLength="4"
              required
            />
            {errorMsg && (
                <p className="text-red-400 text-sm text-center font-semibold mt-3 bg-red-400/10 py-2 rounded-lg border border-red-400/20">{errorMsg}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !restauranteIdUrl}
            className={`w-full font-bold py-4 rounded-xl shadow-xl transition-all text-lg border relative overflow-hidden group ${
              loading || !restauranteIdUrl 
                ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border-blue-500/50 shadow-blue-500/20'
            }`}
          >
            {loading ? 'Verificando...' : 'Entrar no Salão'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default GarcomPWA;
