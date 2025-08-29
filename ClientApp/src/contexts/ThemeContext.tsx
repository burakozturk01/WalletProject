import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserSettings } from '../hooks/useUserSettings';

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  isDark: boolean;
  isLight: boolean;
  refreshSettings?: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, updateSetting, loading, refresh } = useUserSettings();
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [localTheme, setLocalTheme] = useState<Theme | null>(null);

  // Use local theme if set, otherwise fall back to settings
  const theme: Theme = localTheme ?? settings.theme ?? 'dark';

  // Sync local theme with settings when settings change
  useEffect(() => {
    if (settings.theme && localTheme !== settings.theme) {
      setLocalTheme(null); // Reset local theme when settings are loaded
    }
  }, [settings.theme, localTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'auto' ? systemTheme : theme;

  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme, loading]);

  const setTheme = async (newTheme: Theme) => {
    // Set local theme immediately for instant UI update
    setLocalTheme(newTheme);
    
    // Update backend setting
    try {
      await updateSetting('theme', newTheme);
    } catch (error) {
      // If backend update fails, revert local theme
      console.error('Failed to update theme setting:', error);
      setLocalTheme(null);
      throw error;
    }
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeClasses() {
  const { isDark } = useTheme();

  return {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      tertiary: isDark ? 'bg-gray-700' : 'bg-gray-100',
      card: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      active: isDark ? 'bg-gray-600' : 'bg-gray-200',
    },
    
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
      muted: isDark ? 'text-gray-500' : 'text-gray-400',
      inverse: isDark ? 'text-gray-900' : 'text-white',
    },
    
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      secondary: isDark ? 'border-gray-600' : 'border-gray-300',
      light: isDark ? 'border-gray-800' : 'border-gray-100',
    },
    
    ring: {
      primary: isDark ? 'ring-blue-400' : 'ring-blue-500',
      focus: isDark ? 'focus:ring-blue-400' : 'focus:ring-blue-500',
    },
    
    shadow: {
      sm: isDark ? 'shadow-lg shadow-black/20' : 'shadow-sm',
      md: isDark ? 'shadow-xl shadow-black/25' : 'shadow-md',
      lg: isDark ? 'shadow-2xl shadow-black/30' : 'shadow-lg',
    },
    
    input: {
      base: isDark 
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400' 
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
      disabled: isDark 
        ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' 
        : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed',
    },
    
    button: {
      primary: isDark 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: isDark 
        ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
        : 'bg-gray-600 hover:bg-gray-700 text-white',
      success: isDark 
        ? 'bg-green-600 hover:bg-green-700 text-white' 
        : 'bg-green-600 hover:bg-green-700 text-white',
      danger: isDark 
        ? 'bg-red-600 hover:bg-red-700 text-white' 
        : 'bg-red-600 hover:bg-red-700 text-white',
      teal: isDark 
        ? 'bg-teal-600 hover:bg-teal-700 text-white' 
        : 'bg-teal-500 hover:bg-teal-600 text-white',
      ghost: isDark 
        ? 'bg-transparent hover:bg-gray-700 text-gray-300 border-gray-600' 
        : 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
    },
    
    status: {
      success: isDark ? 'text-green-400' : 'text-green-600',
      warning: isDark ? 'text-yellow-400' : 'text-yellow-600',
      error: isDark ? 'text-red-400' : 'text-red-600',
      info: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    
    amount: {
      positive: isDark ? 'text-green-400' : 'text-green-600',
      negative: isDark ? 'text-red-400' : 'text-red-600',
      neutral: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    
    brand: {
      primary: isDark ? 'text-blue-400' : 'text-blue-600',
      secondary: isDark ? 'text-teal-400' : 'text-teal-500',
    },
    
    alert: {
      success: isDark ? 'bg-green-900/50 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800',
      warning: isDark ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: isDark ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800',
      info: isDark ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800',
    },
  };
}
