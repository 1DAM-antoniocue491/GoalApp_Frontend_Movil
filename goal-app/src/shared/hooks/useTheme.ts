import { useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

interface UseThemeReturn {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

/**
 * useTheme - Hook para gestionar el tema de la app
 */
export function useTheme(initialTheme: ThemeMode = 'dark'): UseThemeReturn {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, isDark: theme === 'dark', toggleTheme, setTheme };
}