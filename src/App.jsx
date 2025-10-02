import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase.js';
import './index.css';
import './styles/direct-styles.css';
import './styles/layout.css';

// Importar componentes
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Importar páginas
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Settings from './pages/Settings';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import POS from './pages/POS';
import { Cash } from './pages/Cash';
import { CashSimple } from './pages/CashSimple';
import Tables from './pages/Tables';
import { Scheduled } from './pages/Scheduled';
import Finance from './pages/Finance';
import { Test } from './pages/Test';
import ComandaDemo from './pages/ComandaDemo';
import TesteComanda from './pages/TesteComanda';

// Importar contextos
import { ThemeContext } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Debug tools
import DebugPanel from './components/DebugPanel';
import debugLogger from './utils/debugLogger';

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    console.log('Usuário não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Usuário autenticado, renderizando conteúdo protegido');
  return children;
};

// Componente de layout principal
const MainLayout = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('fome-ninja-theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.add('antialiased');
    localStorage.setItem('fome-ninja-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleTheme={toggleTheme} theme={theme} />
        <main className="flex-1 bg-background overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pedidos" element={<Orders />} />
                <Route path="/pedidos/:id" element={<ComandaDemo />} />
                <Route path="/mesas" element={<Tables />} />
                <Route path="/pdv" element={<POS />} />
                <Route path="/caixa" element={<CashSimple />} />
                <Route path="/agendados" element={<Scheduled />} />
                <Route path="/cardapio" element={<Menu />} />
                <Route path="/financeiro" element={<Finance />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/test" element={<Test />} />
                <Route path="/teste-comanda" element={<TesteComanda />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {import.meta.env.DEV && <DebugPanel />}
    </div>
  );
};

// Componente interno que usa o AuthContext
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/cadastro" element={!isAuthenticated ? <Cadastro /> : <Navigate to="/dashboard" replace />} />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  // Log inicial da aplicação
  useEffect(() => {
    debugLogger.info('APP', '🚀 Aplicação Fome Ninja iniciada');
    debugLogger.info('APP', '🔍 Verificando dependências críticas...');
    
    // Verificar se os módulos críticos estão disponíveis
    const checkCriticalModules = async () => {
      try {
        // Verificar ícones
        const iconsModule = await import('./components/icons/index.jsx');
        const iconNames = Object.keys(iconsModule);
        debugLogger.success('MODULES', `✅ Módulo de ícones carregado com ${iconNames.length} ícones`, iconNames);
        
        // Verificar Supabase
        if (supabase) {
          debugLogger.success('MODULES', '✅ Supabase configurado');
        } else {
          debugLogger.error('MODULES', '❌ Supabase não configurado');
        }
        
        // Verificar contextos
        debugLogger.info('MODULES', '🔍 Verificando contextos...');
        
      } catch (error) {
        debugLogger.error('MODULES', '❌ Erro ao verificar módulos críticos', error);
      }
    };
    
    checkCriticalModules();
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
            <AppRoutes />
          </ThemeContext.Provider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;