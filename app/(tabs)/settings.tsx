import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { telegramClient } from '@/lib/telegram';

export default function SettingsScreen() {
  const router = useRouter();

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

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Account Section */}
      <View className="mt-6">
        <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
          ACCOUNT
        </Text>
        <SettingItem
          title="Phone Number"
          subtitle="+1 234 567 8900"
          onPress={() => Alert.alert('Phone Number', 'Manage your phone number')}
        />
        <SettingItem
          title="Privacy & Security"
          subtitle="Manage your privacy settings"
          onPress={() => Alert.alert('Privacy', 'Privacy settings')}
        />
      </View>

      {/* App Settings */}
      <View className="mt-6">
        <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
          APP SETTINGS
        </Text>
        <SettingItem
          title="Notifications"
          subtitle="Manage notification preferences"
          onPress={() => Alert.alert('Notifications', 'Notification settings')}
        />
        <SettingItem
          title="Data & Storage"
          subtitle="Network usage and storage settings"
          onPress={() => Alert.alert('Data', 'Data settings')}
        />
      </View>

      {/* Support */}
      <View className="mt-6">
        <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
          SUPPORT
        </Text>
        <SettingItem
          title="Help & FAQ"
          subtitle="Get help and find answers"
          onPress={() => Alert.alert('Help', 'Help center')}
        />
        <SettingItem
          title="Send Feedback"
          subtitle="Share your thoughts with us"
          onPress={() => Alert.alert('Feedback', 'Send us your feedback')}
        />
      </View>

      {/* About */}
      <View className="mt-6 mb-6">
        <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
          ABOUT
        </Text>
        <SettingItem
          title="Version"
          subtitle="1.0.0"
          onPress={() => {}}
        />
        <SettingItem
          title="Terms of Service"
          onPress={() => Alert.alert('Terms', 'Terms of Service')}
        />
        <SettingItem
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy', 'Privacy Policy')}
        />
      </View>

      {/* Logout */}
      <View className="mb-8">
        <SettingItem
          title="Logout"
          onPress={handleLogout}
          destructive
        />
      </View>

      {/* Footer */}
      <View className="items-center pb-8">
        <Text className="text-gray-400 text-sm">
          TeleCleaner v1.0.0
        </Text>
        <Text className="text-gray-400 text-xs mt-1">
          Made with ❤️ for Telegram users
        </Text>
      </View>
    </ScrollView>
  );
}
