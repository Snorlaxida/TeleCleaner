import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      // Simulate checking authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, always navigate to phone auth
      // In production, check if user has valid session
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
