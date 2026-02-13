import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Telegram theme colors based on official Telegram dark theme
export const telegramColors = {
  light: {
    primary: '#0088cc',
    background: '#ffffff',
    secondaryBackground: '#f4f4f5',
    text: '#000000',
    secondaryText: '#707579',
    destructive: '#e53935',
    border: '#e5e5ea',
    cardBackground: '#ffffff',
    headerBackground: '#0088cc',
    tabBarBackground: '#f8f9fa',
    tabBarInactive: '#8e8e93',
    success: '#4caf50',
  },
  dark: {
    primary: '#64b5ef',
    background: '#212121',
    secondaryBackground: '#181818',
    text: '#ffffff',
    secondaryText: '#aaaaaa',
    destructive: '#e53935',
    border: '#2c2c2e',
    cardBackground: '#2c2c2e',
    headerBackground: '#17212b',
    tabBarBackground: '#17212b',
    tabBarInactive: '#6d6d72',
    success: '#4caf50',
  }
};

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  colors: typeof telegramColors.light;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

// Check if we're in Telegram Mini App
const isTelegramMiniApp = (): boolean => {
  if (Platform.OS !== 'web') return false;
  try {
    return typeof window !== 'undefined' && 
           window.Telegram?.WebApp !== undefined;
  } catch {
    return false;
  }
};

// Get Telegram Mini App theme
const getTelegramTheme = (): ColorScheme | null => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const colorScheme = window.Telegram.WebApp.colorScheme;
      return colorScheme === 'dark' ? 'dark' : 'light';
    }
  } catch (error) {
    console.error('Error getting Telegram theme:', error);
  }
  return null;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [telegramTheme, setTelegramTheme] = useState<ColorScheme | null>(null);

  // Determine effective color scheme
  const getEffectiveColorScheme = (): ColorScheme => {
    if (themeMode === 'system') {
      // For Telegram Mini App on web, use Telegram's theme
      if (isTelegramMiniApp() && telegramTheme) {
        return telegramTheme;
      }
      // Otherwise use system theme
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode === 'dark' ? 'dark' : 'light';
  };

  const colorScheme = getEffectiveColorScheme();
  const colors = telegramColors[colorScheme];

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Listen to Telegram theme changes for Mini App
  useEffect(() => {
    if (!isTelegramMiniApp()) return;

    // Initial theme
    const initialTheme = getTelegramTheme();
    if (initialTheme) {
      setTelegramTheme(initialTheme);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const newTheme = getTelegramTheme();
      if (newTheme) {
        setTelegramTheme(newTheme);
      }
    };

    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.onEvent('themeChanged', handleThemeChange);
        
        return () => {
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.offEvent('themeChanged', handleThemeChange);
          }
        };
      }
    } catch (error) {
      console.error('Error setting up Telegram theme listener:', error);
    }
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, colorScheme, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Type declarations for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          subtitle_text_color?: string;
          destructive_text_color?: string;
        };
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
      };
    };
  }
}
