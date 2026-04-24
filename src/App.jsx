import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase.js';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/direct-styles.css';
import './styles/layout.css';

// Hook para detectar se é mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Importar componentes
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';


// Importar páginas
import Dashboard from './pages/Dashboard';
import { DashboardMobile } from './pages/DashboardMobile';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Complements from './pages/Complements';
import Settings from './pages/Settings';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import POS from './pages/POS';
import Tables from './pages/Tables';
import { Scheduled } from './pages/Scheduled';
import Finance from './pages/Finance';
import Cupons from './pages/Cupons';
import { Test } from './pages/Test';
import Marketing from './pages/Marketing';
import GarcomNinja from './pages/GarcomNinja';
import GarcomPWA from './pages/GarcomPWA';
// Removidos: Demo Comanda e Teste Comanda

// Importar contextos
import { ThemeContext, ThemeProvider, useTheme } from './context/ThemeContext';
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
  const { user, restauranteId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Se for mobile, renderar versão mobile simplificada
  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-background">
        <main className="bg-background">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Routes location={location}>
                <Route path="/dashboard" element={<DashboardMobile />} />
                <Route path="/pedidos" element={<DashboardMobile />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Desktop - layout completo
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleTheme={toggleTheme} theme={theme} />
        <main className="flex-1 bg-background overflow-y-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pedidos" element={<Orders />} />
                <Route path="/mesas" element={<Tables />} />
                <Route path="/pdv" element={<POS />} />
                <Route path="/agendados" element={<Scheduled />} />
                <Route path="/cardapio" element={<Menu />} />
                <Route path="/complementos" element={<Complements />} />
                <Route path="/financeiro" element={<Finance />} />
                <Route path="/cupons" element={<Cupons />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/garcom-ninja" element={<GarcomNinja />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/test" element={<Test />} />
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
      
      {/* Rota Externa Isolada: Garçom PWA */}
      <Route path="/mobile-garcom" element={<GarcomPWA />} />
      
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
  }, []);
  
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <AppRoutes />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;