import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { telegramClient } from '@/lib/telegram';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Small delay for splash screen animation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('[Splash] Checking authentication...');
        
        // Try to load saved session (also loads token into memory)
        const sessionData = await telegramClient.loadSession();
        
        if (sessionData) {
          console.log('[Splash] Session found, checking if authenticated...');
          
          // Check if we have a valid token
          if (telegramClient.isAuthenticated()) {
            console.log('[Splash] Already authenticated with token, redirecting to chats');
            router.replace('/(tabs)/chats');
            return;
          }
          
          // We have session but no token, try to restore with backend
          console.log('[Splash] No token found, restoring session with backend...');
          const isValid = await telegramClient.restoreSession(
            sessionData.userId,
            sessionData.sessionString
          );
          
          if (isValid) {
            // Session is valid, go to chats
            console.log('[Splash] Session restored successfully, redirecting to chats');
            router.replace('/(tabs)/chats');
            return;
          } else {
            // Session is invalid, clear it
            console.log('[Splash] Session invalid, clearing...');
            await telegramClient.clearSession();
          }
        }
        
        // No session or invalid session, go to auth
        console.log('[Splash] No valid session, redirecting to auth');
        router.replace('/(auth)/phone');
      } catch (error) {
        console.error('[Splash] Error during auth check:', error);
        router.replace('/(auth)/phone');
      }
    };

    checkAuth();
  }, []);

  return (
    <View className="flex-1 bg-telegram-blue items-center justify-center">
      <StatusBar style="light" />
      
      {/* App Logo/Icon */}
      <View className="items-center mb-8">
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-4">
          <Text className="text-6xl">🧹</Text>
        </View>
        <Text className="text-white text-3xl font-bold">TeleCleaner</Text>
        <Text className="text-white/80 text-lg mt-2">Clean Your Messages</Text>
      </View>

      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
