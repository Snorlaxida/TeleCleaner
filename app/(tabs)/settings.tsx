import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { telegramClient } from '@/lib/telegram';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ phone?: string; username?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get app version from package.json via expo-constants
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      // Get user info from backend
      const session = await telegramClient.loadSession();
      if (session) {
        const info = await telegramClient.getMe();
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear session on both client and server
              await telegramClient.logout();
              router.replace('/(auth)/phone');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly, but local session was cleared.');
              router.replace('/(auth)/phone');
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    onPress, 
    destructive = false 
  }: { 
    title: string; 
    subtitle?: string; 
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      className="bg-white px-4 py-4 border-b border-gray-200"
      onPress={onPress}
    >
      <Text className={`text-base font-semibold ${destructive ? 'text-red-500' : 'text-gray-900'}`}>
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <ActivityIndicator size="large" color="#0088cc" />
        <Text className="mt-4 text-gray-500">Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Account Section */}
      <View className="mt-6">
        <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
          ACCOUNT
        </Text>
        <SettingItem
          title="Phone Number"
          subtitle={userInfo?.phone ? `+${userInfo.phone}` : 'Not available'}
          onPress={() => {}}
        />
        <SettingItem
          title="Username"
          subtitle={userInfo?.username ? `@${userInfo.username}` : 'No username'}
          onPress={() => {}}
        />
      </View>

      {/* About */}
      <View className="mt-6">
        <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
          ABOUT
        </Text>
        <SettingItem
          title="Version"
          subtitle={appVersion}
          onPress={() => {}}
        />
      </View>

      {/* Logout */}
      <View className="mt-6 mb-8">
        <SettingItem
          title="Logout"
          onPress={handleLogout}
          destructive
        />
      </View>

      {/* Footer */}
      <View className="items-center pb-8">
        <Text className="text-gray-400 text-sm">
          TeleCleaner v{appVersion}
        </Text>
        <Text className="text-gray-400 text-xs mt-1">
          Made with ❤️ for Telegram users
        </Text>
      </View>
    </ScrollView>
  );
}
