import { View, Text, TouchableOpacity } from 'react-native';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  messageCount: number;
}

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onToggle: () => void;
}

export default function ChatListItem({ chat, isSelected, onToggle }: ChatListItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 bg-white active:bg-gray-50"
      onPress={onToggle}
    >
      {/* Checkbox */}
      <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
        isSelected ? 'bg-telegram-blue border-telegram-blue' : 'border-gray-300'
      }`}>
        {isSelected && (
          <Text className="text-white text-xs font-bold">✓</Text>
        )}
      </View>

      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-telegram-lightBlue items-center justify-center mr-3">
        <Text className="text-2xl">{chat.avatar}</Text>
      </View>

      {/* Chat Info */}
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {chat.name}
          </Text>
          <Text className="text-xs text-gray-500">{chat.timestamp}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
            {chat.lastMessage}
          </Text>
          <Text className="text-xs text-gray-400 ml-2">
            {chat.messageCount} msgs
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
