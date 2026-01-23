import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 1. Tentar obter do localStorage
    const savedTheme = localStorage.getItem('fome-ninja-theme');
    if (savedTheme) return savedTheme;

    // 2. Se não houver no localStorage, verificar preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 3. Padrão para light se nada mais for encontrado
    return 'light';
  });

  useEffect(() => {
    // Aplicar o tema ao elemento html
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Sincronizar classes do Tailwind para modo dark se necessário
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Salvar no localStorage
    localStorage.setItem('fome-ninja-theme', theme);
  }, [theme]);

  // Ouvir mudanças de tema do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Só muda automaticamente se o usuário não tiver uma preferência salva no localStorage?
      // Ou se estivermos em modo "auto"? Por enquanto, vamos ser proativos se não houver trava.
      // Mas geralmente, se o usuário mudou manualmente, respeitamos a manual.
      // Se não houver nada no localStorage, seguimos o sistema.
      if (!localStorage.getItem('fome-ninja-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeContext };