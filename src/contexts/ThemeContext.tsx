'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    return (localStorage.getItem('theme') as ThemeMode) || 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme();
    const resolved = resolveTheme(storedTheme);
    
    setThemeState(storedTheme);
    setResolvedTheme(resolved);
    setMounted(true);

    // Apply theme class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeMode) => {
    const resolved = resolveTheme(newTheme);
    
    setThemeState(newTheme);
    setResolvedTheme(resolved);
    
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      // Ignore localStorage errors
    }

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  };

  const toggleTheme = () => {
    // Cycle through: light -> dark -> system -> light
    const themeOrder: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

