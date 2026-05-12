import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [loginSucesso, setLoginSucesso] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Pegar a função login do contexto
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('Usuário já autenticado, redirecionando para o dashboard');
        navigate('/dashboard');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      setLoading(true);
      setErro('');
      
      console.log('🔐 Iniciando login através do AuthContext...');
      
      // ✅ USAR A FUNÇÃO login() DO AUTHCONTEXT
      // Isso garante que o status ativo seja atualizado corretamente
      await login(email, senha);
      
      console.log('✅ Login concluído com sucesso!');
      setLoginSucesso(true);
      
      // Redirecionar para o dashboard após um breve atraso
      setTimeout(() => {
        console.log('Redirecionando para o dashboard...');
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      setErro('Email ou senha incorretos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/95 flex flex-col items-center py-8 md:justify-center px-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-6 md:p-10 space-y-8 bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <span className="text-4xl">🥷</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter">Fome Ninja</h1>
          <p className="mt-2 text-muted-foreground font-medium italic">Acesso Restrito aos Mestres</p>
        </div>
        
        {loginSucesso ? (
          <div className="p-4 bg-success/20 border border-success text-success rounded-md text-center font-bold">
            <p className="font-medium">Login realizado com sucesso!</p>
            <p className="mt-2 text-sm">Redirecionando para o dashboard...</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {erro && (
              <div className="p-3 bg-destructive/20 border border-destructive text-destructive text-sm rounded">
                {erro}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-foreground">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border-b-4 border-black/20 rounded-xl shadow-lg text-base font-black uppercase tracking-widest text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Entrando nas Sombras...' : 'Entrar no Painel'}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="font-medium text-primary hover:text-primary/80">
              Cadastre-se
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}