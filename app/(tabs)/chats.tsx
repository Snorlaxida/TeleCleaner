import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import ChatListItem from '@/components/ChatListItem';
import DeletionOptionsModal from '@/components/DeletionOptionsModal';

// Mock data - will be replaced with real Telegram API data
const MOCK_CHATS = [
  { id: '1', name: 'John Doe', lastMessage: 'Hey, how are you?', timestamp: '2:30 PM', avatar: '👤', messageCount: 145 },
  { id: '2', name: 'Work Group', lastMessage: 'Meeting at 3 PM', timestamp: '1:15 PM', avatar: '👥', messageCount: 892 },
  { id: '3', name: 'Family', lastMessage: 'Dinner tonight?', timestamp: 'Yesterday', avatar: '👨‍👩‍👧‍👦', messageCount: 2341 },
  { id: '4', name: 'Tech News', lastMessage: 'New AI breakthrough', timestamp: 'Yesterday', avatar: '📰', messageCount: 567 },
  { id: '5', name: 'Sarah Wilson', lastMessage: 'Thanks!', timestamp: 'Monday', avatar: '👤', messageCount: 89 },
];

export type DeletionOption = 'last_day' | 'last_week' | 'all';

export default function ChatsScreen() {
  const router = useRouter();
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showDeletionModal, setShowDeletionModal] = useState(false);

  const toggleChatSelection = (chatId: string) => {
    const newSelection = new Set(selectedChats);
    if (newSelection.has(chatId)) {
      newSelection.delete(chatId);
    } else {
      newSelection.add(chatId);
    }
    setSelectedChats(newSelection);
  };

  const handleDeleteMessages = (option: DeletionOption) => {
    setShowDeletionModal(false);
    
    const chatCount = selectedChats.size;
    const optionText = option === 'last_day' ? 'from the last day' 
      : option === 'last_week' ? 'from the last week' 
      : 'all messages';
    
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${optionText} from ${chatCount} chat${chatCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => processDeletion(option)
        }
      ]
    );
  };

  const processDeletion = async (option: DeletionOption) => {
    // TODO: Implement actual deletion logic with Telegram API
    Alert.alert('Success', 'Messages deleted successfully!');
    setSelectedChats(new Set());
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header with selection count */}
      {selectedChats.size > 0 && (
        <View className="bg-telegram-lightBlue px-4 py-3 flex-row justify-between items-center">
          <Text className="text-white font-semibold">
            {selectedChats.size} chat{selectedChats.size > 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity onPress={() => setSelectedChats(new Set())}>
            <Text className="text-white font-semibold">Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            isSelected={selectedChats.has(item.id)}
            onToggle={() => toggleChatSelection(item.id)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-gray-200 ml-16" />
        )}
      />

      {/* Delete Button */}
      {selectedChats.size > 0 && (
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            className="bg-red-500 py-4 rounded-lg"
            onPress={() => setShowDeletionModal(true)}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Delete Messages
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Deletion Options Modal */}
      <DeletionOptionsModal
        visible={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
        onSelectOption={handleDeleteMessages}
      />
    </View>
  );
}
