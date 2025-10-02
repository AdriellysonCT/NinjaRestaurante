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
      
      console.log('Fazendo login diretamente com Supabase...');
      
      // Fazer login diretamente com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      
      if (error) {
        console.error('Erro ao fazer login:', error);
        setErro('Email ou senha incorretos. Por favor, tente novamente.');
        return;
      }
      
      console.log('Login bem-sucedido:', data);
      setLoginSucesso(true);
      
      // Redirecionar para o dashboard após um breve atraso
      setTimeout(() => {
        console.log('Redirecionando para o dashboard...');
        window.location.href = '/dashboard'; // Usar window.location para forçar um refresh completo
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErro('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Fome Ninja</h1>
          <p className="mt-2 text-muted-foreground">Faça login para acessar seu painel</p>
        </div>
        
        {loginSucesso ? (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
            <p className="font-medium">Login realizado com sucesso!</p>
            <p className="mt-2">Redirecionando para o dashboard...</p>
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
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
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