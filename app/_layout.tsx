import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { initI18n } from '@/lib/i18n';
import '../global.css';

function RootStackNavigator() {
  const { colors, colorScheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [telegramReady, setTelegramReady] = useState(false);

  useEffect(() => {
    // Dynamically load Telegram WebApp script
    if (typeof window !== 'undefined') {
      console.log('[App] Loading Telegram WebApp script dynamically...');
      
      // Check if already loaded
      if ((window as any).Telegram?.WebApp) {
        console.log('[App] ✅ Telegram WebApp already loaded!');
        initializeTelegramWebApp();
        setTelegramReady(true);
        return;
      }

      // Check if script element already exists
      const existingScript = document.querySelector('script[src*="telegram-web-app"]');
      if (existingScript) {
        console.log('[App] Script tag exists, waiting for load...');
        existingScript.addEventListener('load', () => {
          console.log('[App] ✅ Script loaded via existing tag');
          initializeTelegramWebApp();
          setTelegramReady(true);
        });
        return;
      }

      // Create and inject script
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = false; // Load synchronously
      
      script.onload = () => {
        console.log('[App] ✅ Telegram WebApp script loaded successfully!');
        initializeTelegramWebApp();
        setTelegramReady(true);
      };
      
      script.onerror = (error) => {
        console.error('[App] ❌ Failed to load Telegram WebApp script:', error);
        alert('❌ Failed to load Telegram WebApp script!\n\nNetwork error or blocked.');
        setTelegramReady(true); // Continue anyway
      };

      // Insert at the beginning of head
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
      
      console.log('[App] Script injection initiated...');
    }

    // Wait for i18n to be initialized
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      initI18n().then(() => setIsReady(true));
    }
  }, [i18n.isInitialized]);

  function initializeTelegramWebApp() {
    if (typeof window === 'undefined') return;

    // Try to get Telegram WebApp from multiple sources
    const tg = (window as any).__TELEGRAM_WEB_APP__ || 
               (window as any).Telegram?.WebApp ||
               null;
    
    console.log('[App] Initializing Telegram WebApp...');
    console.log('[App] window.Telegram:', (window as any).Telegram);
    console.log('[App] window.Telegram.WebApp:', (window as any).Telegram?.WebApp);
    
    if (tg) {
      console.log('[App] ✅ Telegram WebApp object found!');
      
      // Save global reference
      (window as any).__TELEGRAM_WEB_APP__ = tg;
      
      console.log('[App] WebApp info:', {
        version: tg.version,
        platform: tg.platform,
        initData: tg.initData ? `${tg.initData.substring(0, 50)}...` : 'EMPTY',
        initDataLength: (tg.initData || '').length,
        colorScheme: tg.colorScheme,
        isExpanded: tg.isExpanded,
      });
      
      // Initialize WebApp
      if (typeof tg.ready === 'function') {
        tg.ready();
        console.log('[App] ✅ WebApp.ready() called');
      }
      if (typeof tg.expand === 'function') {
        tg.expand();
        console.log('[App] ✅ WebApp.expand() called');
      }
      
      // Check if actually running in Telegram
      const isInTelegram = tg.initData && tg.initData.length > 0;
      
      if (isInTelegram) {
        console.log('[App] ✅✅✅ Running in Telegram Mini App!');
      } else {
        console.warn('[App] ⚠️ WebApp loaded but NO initData!');
        console.warn('[App] This means the app is opened directly, not via Telegram');
      }
    } else {
      console.error('[App] ❌ Telegram WebApp object NOT found!');
      console.error('[App] window keys:', Object.keys(window));
    }
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(auth)/phone" 
          options={{ 
            title: t('phoneAuth'),
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="(auth)/verify" 
          options={{ 
            title: t('verifyCode'),
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="(auth)/password" 
          options={{ 
            title: t('enterPassword'),
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="confirm-deletion" 
          options={{ 
            title: t('confirmDeletion'),
            headerShown: true,
            headerBackTitle: t('chats')
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStackNavigator />
    </ThemeProvider>
  );
}
