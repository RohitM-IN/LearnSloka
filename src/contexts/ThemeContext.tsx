import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get system preferred theme
  const getSystemTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Fallback to light if media queries not supported
  };

  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('shlokpatham-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme as Theme;
      }
      // If no saved theme, use system preference
      return getSystemTheme();
    }
    return 'dark'; // Default to dark theme
  });

  // Apply theme immediately to prevent flash (synchronous DOM update)
  useLayoutEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Save theme to localStorage (can be async)
  useEffect(() => {
    localStorage.setItem('shlokpatham-theme', theme);
  }, [theme]);

  // Listen for system theme changes (only if no saved preference)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if there's no saved user preference
      const savedTheme = localStorage.getItem('shlokpatham-theme');
      if (!savedTheme) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(current => current === 'light' ? 'dark' : 'light');
  };

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;