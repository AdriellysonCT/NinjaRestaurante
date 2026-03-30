import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext';
import { FiSmartphone, FiGift, FiCheck, FiCopy } from 'react-icons/fi';

const GarcomNinja = () => {
  const { restauranteId } = useAuth();
  const [garcons, setGarcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [novoGarcom, setNovoGarcom] = useState({
    nome: '',
    codigo_login: '',
    pin: ''
  });

  const appLink = `${window.location.origin}/mobile-garcom?r=${restauranteId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=2&data=${encodeURIComponent(appLink)}`;

  useEffect(() => {
    if (restauranteId) {
      carregarGarcons();
    }
  }, [restauranteId]);

  const carregarGarcons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('garcons')
        .select('*')
        .eq('id_restaurante', restauranteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGarcons(data || []);
    } catch (error) {
      console.error('Erro ao carregar garçons:', error);
      alert('Erro ao carregar lista de garçons.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoGarcom({ ...novoGarcom, [name]: value });
  };

  const salvarGarcom = async (e) => {
    e.preventDefault();
    if (!novoGarcom.nome || !novoGarcom.codigo_login || !novoGarcom.pin) {
      alert('Preencha todos os campos.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('garcons')
        .insert([
          {
            id_restaurante: restauranteId,
            nome: novoGarcom.nome,
            codigo_login: novoGarcom.codigo_login,
            pin: novoGarcom.pin,
            ativo: true
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') { 
            alert('Este código de login já está em uso.');
        } else {
            throw error;
        }
        return;
      }

      alert('Garçom adicionado com sucesso!');
      setIsModalOpen(false);
      setNovoGarcom({ nome: '', codigo_login: '', pin: '' });
      carregarGarcons();
    } catch (error) {
      console.error('Erro ao salvar garçom:', error);
      alert('Erro ao salvar garçom.');
    }
  };

  const deletarGarcom = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este garçom?')) return;

    try {
      const { error } = await supabase
        .from('garcons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Garçom removido.');
      carregarGarcons();
    } catch (error) {
      console.error('Erro ao deletar garçom:', error);
      alert('Erro ao deletar garçom.');
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(appLink);
    alert('Link copiado com sucesso!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-background min-h-screen w-full">
      
      {/* Onboarding Section - Estilo Premium Inspirado na Imagem */}
      <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 md:p-10 shadow-sm border border-blue-100 dark:border-slate-700 relative overflow-hidden w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          {/* Lado Esquerdo - Textos e QR Code */}
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                <FiSmartphone /> App do Garçom
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-semibold">
                <FiGift /> Grátis para você
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Conecte seu salão!
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg">
                Explore o app agora mesmo. O seu garçom só precisa escanear o QR Code para acessar o sistema de pedidos, sem baixar nada.
              </p>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 mt-0.5">
                  <FiCheck size={16} />
                </div>
                Sistema ágil e prático para a gestão rápida do seu salão.
              </li>
              <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 mt-0.5">
                  <FiCheck size={16} />
                </div>
                Disponível em todos os celulares. Funciona como um App direto no navegador (PWA).
              </li>
            </ul>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                <img src={qrCodeUrl} alt="QR Code App Garçom" className="w-32 h-32" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 max-w-[200px]">
                  Aponte a câmera do celular para o QRCode ao lado 📱
                </p>
                <button 
                  onClick={copiarLink}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors cursor-pointer bg-blue-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-blue-100 dark:border-slate-600"
                >
                  <FiCopy /> Copiar link de acesso
                </button>
              </div>
            </div>
          </div>

          {/* Lado Direito - Mockup do Celular */}
          <div className="flex justify-center lg:justify-end xl:pr-12">
            <div className="w-[280px] h-[580px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl relative border-4 border-slate-800 flex-shrink-0 animate-fade-in-up">
              <div className="w-full h-full bg-blue-600 rounded-[2rem] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                {/* Câmera Notel */}
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-xl w-32 mx-auto z-10"></div>
                
                <div className="space-y-6 text-white transform transition hover:scale-105 duration-300 cursor-pointer relative z-20">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm mx-auto flex items-center justify-center border border-white/30">
                    <span className="text-4xl">🥷</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Garçom Ninja</h3>
                    <p className="text-blue-100 text-sm mt-2 opacity-90">Pronto para anotar pedidos.</p>
                  </div>
                  <a href={appLink} target="_blank" rel="noopener noreferrer" className="block bg-white text-blue-600 px-6 py-3.5 rounded-xl font-bold mt-4 shadow-xl w-full border border-blue-50 text-center hover:bg-blue-50 active:scale-95 transition-all">
                    Testar App Agora
                  </a>
                </div>

                {/* Efeitos de fundo no celular */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-[50px] opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-800 rounded-full blur-[50px] opacity-40"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decoração de fundo do Container Principal (Seta e Círculos) */}
        <div className="absolute top-1/4 right-1/2 hidden lg:block opacity-20 z-0">
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 37.5C36.6667 15.8333 80 5 117 17.5M117 17.5L103 8M117 17.5L107.5 28.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400 blur-[120px] opacity-20 rounded-full pointer-events-none z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-400 blur-[120px] opacity-10 rounded-full pointer-events-none z-0"></div>

      </div>

      <hr className="border-border opacity-50 my-4" />

      {/* Seção de Gestão de Equipe */}
      <div className="px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Sua Equipe de Salão</h2>
            <p className="text-muted-foreground mt-1 text-sm">
               Adicione seus garçons para que eles possam acessar o App.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Novo Garçom
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {garcons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground border-b border-border">
                      <th className="py-4 px-6 font-semibold text-sm">Nome do Garçom</th>
                      <th className="py-4 px-6 font-semibold text-sm">Código de Login</th>
                      <th className="py-4 px-6 font-semibold text-sm">PIN de Acesso</th>
                      <th className="py-4 px-6 font-semibold text-sm">Status</th>
                      <th className="py-4 px-6 font-semibold text-sm text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {garcons.map((garcom) => (
                      <tr key={garcom.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-foreground flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {garcom.nome.charAt(0).toUpperCase()}
                          </div>
                          {garcom.nome}
                        </td>
                        <td className="py-4 px-6 text-foreground">
                          <span className="bg-secondary/80 px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">{garcom.codigo_login}</span>
                        </td>
                        <td className="py-4 px-6 text-foreground">
                          <span className="text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-md">****</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Ativo
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => deletarGarcom(garcom.id)}
                            className="text-red-500 hover:text-red-700 hover:underline transition-colors cursor-pointer text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/20">
                <div className="w-20 h-20 bg-blue-50 border border-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-5 shadow-sm">
                  <span className="text-4xl shadow-sm">🥷</span>
                </div>
                <p className="text-xl font-bold text-foreground mb-2">Sua equipe está vazia</p>
                <p className="text-sm max-w-md mb-8 leading-relaxed">Nenhum garçom foi cadastrado. Crie o primeiro acesso para um garçom. Ele usará o código e a senha para entrar no sistema pelo celular.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Cadastrar Primeiro Garçom
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add Garçom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-bold text-foreground tracking-tight">Novo Garçom</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer p-1.5 rounded-lg hover:bg-muted transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={salvarGarcom} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 shadow-sm">Nome ou Apelido</label>
                <input
                  type="text"
                  name="nome"
                  value={novoGarcom.nome}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-shadow"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Código (ID)</label>
                  <input
                    type="text"
                    name="codigo_login"
                    value={novoGarcom.codigo_login}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm font-mono text-center transition-shadow"
                    placeholder="101"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center font-medium">Matrícula Curta</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Senha (PIN)</label>
                  <input
                    type="text"
                    name="pin"
                    value={novoGarcom.pin}
                    onChange={handleInputChange}
                    maxLength="4"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono tracking-[0.5em] text-center shadow-sm transition-shadow"
                    placeholder="1234"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center font-medium">4 Dígitos</p>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-foreground font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-bold cursor-pointer shadow-md hover:shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GarcomNinja;
