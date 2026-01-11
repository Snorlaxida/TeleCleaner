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
      // Small delay for splash screen animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to load saved session
      const sessionData = await telegramClient.loadSession();
      
      if (sessionData) {
        // We have saved session, try to restore it with backend
        const isValid = await telegramClient.restoreSession(
          sessionData.userId,
          sessionData.sessionString
        );
        
        if (isValid) {
          // Session is valid, go to chats
          console.log('Session restored, redirecting to chats');
          router.replace('/(tabs)/chats');
          return;
        } else {
          // Session is invalid, clear it
          console.log('Session invalid, clearing...');
          await telegramClient.clearSession();
        }
      }
      
      // No session or invalid session, go to auth
      console.log('No valid session, redirecting to auth');
      router.replace('/(auth)/phone');
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
