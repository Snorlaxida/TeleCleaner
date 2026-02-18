import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar?: string; // Emoji, initial letter, or base64 data URL
  photoId?: string; // Telegram photo_id for caching
  messageCount?: number; // Total user's messages in this chat (-1 means loading, -2 means private chat shows "?") - optional now
  avatarLoading?: boolean; // True if avatar is being loaded
}

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onToggle: () => void;
}

export default function ChatListItem({ chat, isSelected, onToggle }: ChatListItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // Generate background color based on chat name for variety
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-400',
      'bg-green-400', 
      'bg-purple-400',
      'bg-pink-400',
      'bg-orange-400',
      'bg-teal-400',
      'bg-indigo-400',
      'bg-red-400',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const isBase64Image = chat.avatar && chat.avatar.startsWith('data:image');
  const isEmoji = chat.avatar && !isBase64Image && /[\u{1F300}-\u{1F9FF}]/u.test(chat.avatar);
  const bgColor = isEmoji || isBase64Image ? 'bg-telegram-lightBlue' : getAvatarColor(chat.name);

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3"
      style={{ backgroundColor: colors.cardBackground }}
      onPress={onToggle}
    >
      {/* Checkbox */}
      <View 
        className="w-6 h-6 rounded-full border-2 mr-3 items-center justify-center"
        style={{
          backgroundColor: isSelected ? colors.primary : 'transparent',
          borderColor: isSelected ? colors.primary : colors.secondaryText,
          borderWidth: 2
        }}
      >
        {isSelected && (
          <Text className="text-white text-xs font-bold">✓</Text>
        )}
      </View>

      {/* Avatar */}
      <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 overflow-hidden ${bgColor}`}>
        {chat.avatarLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isBase64Image ? (
          <Image 
            source={{ uri: chat.avatar }} 
            className="w-12 h-12"
            resizeMode="cover"
          />
        ) : (
          <Text className={isEmoji ? "text-2xl" : "text-xl font-bold text-white"}>
            {chat.avatar || '💬'}
          </Text>
        )}
      </View>

      {/* Chat Info */}
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text 
            className="text-base font-semibold" 
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {chat.name}
          </Text>
          <Text 
            className="text-xs" 
            style={{ color: colors.secondaryText }}
          >
            {chat.timestamp}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text 
            className="text-sm flex-1" 
            style={{ color: colors.secondaryText }}
            numberOfLines={1}
          >
            {chat.lastMessage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
