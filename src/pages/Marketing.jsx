import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiSparkles, 
  HiChevronRight, 
  HiUpload, 
  HiCheckCircle, 
  HiClipboard, 
  HiDownload, 
  HiStar,
  HiClock,
  HiExclamationCircle
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { marketingService } from '../services/marketingService';
import { Modal } from '../components/ui/Modal';
import debugLogger from '../utils/debugLogger';

const Marketing = () => {
  const { restauranteId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [limitStatus, setLimitStatus] = useState({ allowed: true, remaining: 5, count: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [objective, setObjective] = useState('Promoção 🔥');
  const [scenario, setScenario] = useState('Estúdio');
  const [format, setFormat] = useState('1:1');
  const [result, setResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const objectives = [
    'Promoção 🔥',
    'Novo Item 🆕',
    'Mais Vendido ⭐',
    'Combo 🍔',
    'Chamar Atenção ⚡'
  ];

  const scenarios = ['Rústico', 'Estúdio', 'Urbano'];
  const formats = ['1:1', '9:16', '3:4', '16:9'];

  useEffect(() => {
    if (restauranteId) {
      loadData();
    }
  }, [restauranteId]);

  const loadData = async () => {
    try {
      const [historyData, status] = await Promise.all([
        marketingService.getHistory(restauranteId),
        marketingService.checkDailyLimit(restauranteId)
      ]);
      setHistory(historyData);
      setLimitStatus(status);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return alert("Selecione uma imagem primeiro!");
    
    setLoading(true);
    try {
      debugLogger.info('MARKETING', 'Iniciando geração com IA', { objective });
      const marketingData = await marketingService.generateMarketing(
        restauranteId, 
        selectedImage, 
        scenario, // Passamos o cenário escolhido agora
        format // Passamos o formato escolhido
      );
      setResult(marketingData);
      setIsResultModalOpen(true);
      debugLogger.success('MARKETING', 'Geração concluída com sucesso');
      await loadData(); // Recarregar histórico e limite
    } catch (error) {
      debugLogger.error('MARKETING', 'Erro na geração de marketing', {
        error,
        message: error.message,
        objective
      });
      
      let errorMsg = error.message;
      if (errorMsg.includes('429')) {
        errorMsg = "O Google atingiu o limite de gerações grátis por minuto. Aguarde 30-60 segundos e tente novamente. Dica: evite cliques seguidos!";
      } else if (errorMsg.includes('quota')) {
        errorMsg = "Limite diário do Google atingido para esta chave de API. Tente novamente amanhã ou troque a chave no .env.";
      }

      alert(`Atenção: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  const handleHighlight = async (id) => {
    try {
      await marketingService.requestHighlight(id);
      alert("Solicitação enviada para o ADM com sucesso!");
      loadData();
    } catch (error) {
      alert("Erro ao solicitar destaque.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-background min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Nano <span className="text-primary italic">Banana</span> <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full animate-pulse">V2 PRO</span>
          </h1>
          <p className="text-muted-foreground">O motor de inteligência visual ultra-premium para o seu restaurante.</p>
        </div>
        
        <div className="ninja-card flex items-center gap-4 px-6 py-3 border-primary/20 bg-primary/5">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Gerações Hoje</p>
            <p className="text-xl font-black text-primary">{limitStatus.count} / 5</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col">
             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${limitStatus.allowed ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
               {limitStatus.allowed ? 'PLANO GRÁTIS' : 'LIMITE ATINGIDO'}
             </span>
             {!import.meta.env.VITE_GEMINI_API_KEY && (
               <span className="text-[10px] text-destructive font-bold mt-1 animate-pulse">CHAVE NÃO DETECTADA</span>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload and Control Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="ninja-card p-6 !bg-card/50 backdrop-blur-xl border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors"
        >
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                1. Foto do Produto
              </h2>
              <div 
                onClick={() => fileInputRef.current.click()}
                className="relative group cursor-pointer aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-border flex flex-col items-center justify-center bg-secondary/30 hover:bg-secondary/50 transition-all"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-white font-bold">Trocar Imagem</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <HiUpload className="text-3xl text-primary" />
                    </div>
                    <p className="font-bold">Clique para enviar</p>
                    <p className="text-xs text-muted-foreground">JPG ou PNG (Máx 5MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4">2. Cenário e Formato</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">Ambiente</label>
                  <div className="flex flex-wrap gap-2">
                    {scenarios.map((s) => (
                      <button
                        key={s}
                        onClick={() => setScenario(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          scenario === s 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">Formato (Tamanho)</label>
                  <div className="flex flex-wrap gap-2">
                    {formats.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          format === f 
                            ? 'bg-foreground text-background' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedImage || !limitStatus.allowed}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                loading || !selectedImage || !limitStatus.allowed
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Conectando ao Motor Google...
                </>
              ) : (
                <>
                  <HiSparkles /> Ativar Motor Nano Machine
                </>
              )}
            </button>
            
            {!limitStatus.allowed && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
                <HiExclamationCircle className="text-destructive text-xl shrink-0" />
                <p className="text-sm text-destructive font-medium">Você atingiu seu limite diário. Tente novamente amanhã ou faça upgrade para o Plano PRO.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* History / Recent Generations */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Gerados Recentemente</h2>
            <button className="text-xs text-primary font-bold hover:underline">Ver todos</button>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="ninja-card p-4 flex gap-4 hover:border-primary/30 transition-colors group">
                <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden shrink-0 relative">
                   <img 
                     src={item.imagem_processada_url || item.imagem_original_url || 'https://placehold.co/100/1a1a1a/ffa500?text=Ninja'} 
                     className="w-full h-full object-cover" 
                     alt="Histórico" 
                   />
                   {item.imagem_processada_url && (
                     <div className="absolute top-1 right-1 bg-primary text-[8px] font-black px-1 rounded text-white shadow-lg">PRO IA</div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold truncate text-sm">{item.nome_sugerido}</h3>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <HiClock /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic">
                    "{item.texto_banner}"
                  </p>
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setResult(item); setIsResultModalOpen(true); }}
                      className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
                    >
                      Visualizar
                    </button>
                    {!item.solicitado_destaque && (
                      <button 
                         onClick={() => handleHighlight(item.id)}
                         className="text-[10px] font-bold bg-success/10 text-success px-2 py-1 rounded hover:bg-success/20"
                      >
                         Destaque
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                <HiSparkles className="mx-auto text-4xl mb-4 opacity-20" />
                <p>Nenhuma arte gerada ainda.</p>
                <p className="text-xs mt-1">Sua primeira geração está a um clique!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Result Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="✨ Material Gerado com Sucesso!"
        size="2xl"
      >
        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10 relative group bg-black/50">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={result.imagem_processada_url}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      src={result.imagem_processada_url || result.imagem_original_url || imagePreview} 
                      className="w-full aspect-square object-cover" 
                      alt="Resultado IA" 
                    />
                  </AnimatePresence>
                  
                  {result.imagem_processada_url && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground font-black px-3 py-1 rounded-full text-[10px] shadow-2xl flex items-center gap-1">
                      <HiSparkles className="text-xs" /> MÁGICA IA ATIVADA
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-[10px] text-white/70 italic">Fundo gerado por IA com base no contexto do produto.</p>
                  </div>
                </div>
                
                {result.imagem_original_url && result.imagem_processada_url && (
                   <div className="flex justify-center">
                      <button 
                        onMouseDown={() => {
                          const img = document.querySelector('[alt="Resultado IA"]');
                          if (img) img.src = result.imagem_original_url;
                        }}
                        onMouseUp={() => {
                          const img = document.querySelector('[alt="Resultado IA"]');
                          if (img) img.src = result.imagem_processada_url;
                        }}
                        onMouseLeave={() => {
                          const img = document.querySelector('[alt="Resultado IA"]');
                          if (img) img.src = result.imagem_processada_url;
                        }}
                        className="text-[10px] font-bold text-muted-foreground hover:text-primary flex items-center gap-2 border border-border px-3 py-1.5 rounded-full transition-colors"
                      >
                         <HiClock /> Segure para ver a foto original
                      </button>
                   </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                   <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                      <p className="text-[10px] font-black text-primary uppercase">MÉTODO NANO BANANA</p>
                   </div>
                   {result.color_vibes && (
                      <div className="px-3 py-1 bg-secondary border border-border rounded-full">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase">VIBE: {result.color_vibes}</p>
                      </div>
                   )}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <HiStar className="text-primary" /> Nome do Produto
                  </label>
                  <p className="text-xl font-black text-foreground">{result.nome_sugerido}</p>
                </div>

                <div className="ninja-card p-4 bg-secondary/30 relative group">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-2">Texto Banner (Curto)</label>
                  <p className="text-lg font-bold leading-tight">{result.texto_banner}</p>
                  <button 
                    onClick={() => copyToClipboard(result.texto_banner)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-card text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <HiClipboard />
                  </button>
                </div>

                <button 
                   className="w-full py-3 rounded-xl bg-success text-success-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                   onClick={() => copyToClipboard(result.texto_whatsapp)}
                >
                  <HiClipboard /> Copiar Texto WhatsApp
                </button>
                <button 
                   className="w-full py-3 rounded-xl bg-secondary text-foreground font-bold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                   onClick={() => alert("Função de download será ativada na versão PRO.")}
                >
                  <HiDownload /> Baixar Imagem
                </button>
              </div>
            </div>

            <div className="ninja-card p-4 !bg-primary/5 border-primary/20">
              <label className="text-xs font-bold text-primary uppercase block mb-2">Copy p/ WhatsApp:</label>
              <p className="text-sm whitespace-pre-line text-muted-foreground italic">
                {result.texto_whatsapp}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                onClick={() => setIsResultModalOpen(false)}
                className="px-6 py-2 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={() => handleHighlight(result.id)}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <HiCheckCircle /> Enviar p/ Destaque
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Marketing;
