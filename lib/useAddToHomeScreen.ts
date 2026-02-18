import { useState, useCallback, useEffect } from 'react';

export interface UseAddToHomeScreenResult {
  isAvailable: boolean;
  isInstalled: boolean;
  isLoading: boolean;
  addToHomeScreen: () => void;
  checkStatus: () => Promise<void>;
}

/**
 * Hook for managing the "Add to Home Screen" functionality in Telegram Mini Apps
 * Uses the native Telegram WebApp API
 */
export function useAddToHomeScreen(): UseAddToHomeScreenResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get Telegram WebApp instance
  const getTelegramWebApp = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return (window as any).__TELEGRAM_WEB_APP__ || (window as any).Telegram?.WebApp || null;
  }, []);

  // Check if the feature is available and check installation status
  useEffect(() => {
    const tg = getTelegramWebApp();
    
    if (!tg) {
      console.log('[AddToHomeScreen] Telegram WebApp not available');
      setIsAvailable(false);
      return;
    }

    // Check if addToHomeScreen method exists (Bot API 8.0+)
    const available = typeof tg.addToHomeScreen === 'function';
    setIsAvailable(available);
    
    console.log('[AddToHomeScreen] Feature available:', available);

    if (!available) {
      return;
    }

    // Set up event listeners for home_screen_added and home_screen_failed
    const handleAdded = () => {
      console.log('[AddToHomeScreen] App added to home screen');
      setIsInstalled(true);
      setIsLoading(false);
    };

    const handleFailed = () => {
      console.log('[AddToHomeScreen] User declined or failed');
      setIsLoading(false);
    };

    // Listen to Telegram events
    if (typeof tg.onEvent === 'function') {
      tg.onEvent('home_screen_added', handleAdded);
      tg.onEvent('home_screen_failed', handleFailed);
    }

    // Check installation status if checkHomeScreenStatus is available
    if (typeof tg.checkHomeScreenStatus === 'function') {
      tg.checkHomeScreenStatus((status: string) => {
        console.log('[AddToHomeScreen] Home screen status:', status);
        setIsInstalled(status === 'added');
      });
    }

    // Cleanup
    return () => {
      if (typeof tg.offEvent === 'function') {
        tg.offEvent('home_screen_added', handleAdded);
        tg.offEvent('home_screen_failed', handleFailed);
      }
    };
  }, [getTelegramWebApp]);

  const handleAddToHomeScreen = useCallback(() => {
    const tg = getTelegramWebApp();
    
    if (!tg) {
      console.warn('[AddToHomeScreen] Telegram WebApp not available');
      return;
    }

    if (!isAvailable) {
      console.warn('[AddToHomeScreen] Feature is not available');
      return;
    }

    if (isInstalled) {
      console.log('[AddToHomeScreen] App is already installed');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call addToHomeScreen method
      tg.addToHomeScreen();
      console.log('[AddToHomeScreen] addToHomeScreen() called');
    } catch (error) {
      console.error('[AddToHomeScreen] Error calling addToHomeScreen:', error);
      setIsLoading(false);
    }
  }, [getTelegramWebApp, isAvailable, isInstalled]);

  const checkStatus = useCallback(async () => {
    const tg = getTelegramWebApp();
    
    if (!tg || typeof tg.checkHomeScreenStatus !== 'function') {
      return;
    }

    try {
      tg.checkHomeScreenStatus((status: string) => {
        console.log('[AddToHomeScreen] Status check result:', status);
        setIsInstalled(status === 'added');
      });
    } catch (error) {
      console.error('Failed to check home screen status:', error);
    }
  }, [getTelegramWebApp]);

  return {
    isAvailable,
    isInstalled,
    isLoading,
    addToHomeScreen: handleAddToHomeScreen,
    checkStatus,
  };
}
