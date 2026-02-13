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

  useEffect(() => {
    // Wait for i18n to be initialized
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      initI18n().then(() => setIsReady(true));
    }
  }, [i18n.isInitialized]);

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
