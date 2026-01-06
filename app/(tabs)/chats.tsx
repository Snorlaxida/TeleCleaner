import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import ChatListItem from '@/components/ChatListItem';
import DeletionOptionsModal from '@/components/DeletionOptionsModal';
import { telegramClient, TelegramChat } from '@/lib/telegram';

export type DeletionOption = 'last_day' | 'last_week' | 'all' | 'custom';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export default function ChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showDeletionModal, setShowDeletionModal] = useState(false);

  useEffect(() => {
    const loadChats = async () => {
      setIsLoadingChats(true);
      try {
        const result = await telegramClient.getChats();
        setChats(result);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load chats from Telegram.');
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, []);

  const toggleChatSelection = (chatId: string) => {
    const newSelection = new Set(selectedChats);
    if (newSelection.has(chatId)) {
      newSelection.delete(chatId);
    } else {
      newSelection.add(chatId);
    }
    setSelectedChats(newSelection);
  };

  const handleDeleteMessages = (option: DeletionOption, customRange?: CustomDateRange) => {
    const chatCount = selectedChats.size;
    let optionText = '';
    
    if (option === 'custom' && customRange) {
      const startStr = customRange.startDate.toLocaleDateString();
      const endStr = customRange.endDate.toLocaleDateString();
      optionText = `from ${startStr} to ${endStr}`;
    } else {
      optionText = option === 'last_day' ? 'from the last day' 
        : option === 'last_week' ? 'from the last week' 
        : 'all messages';
    }
    
    // Close modal first to ensure UI is responsive
    setShowDeletionModal(false);
    
    // Small delay to ensure modal is fully closed before showing alert
    setTimeout(() => {
      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to delete ${optionText} from ${chatCount} chat${chatCount > 1 ? 's' : ''}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => processDeletion(option, customRange)
          }
        ]
      );
    }, 300);
  };

  const processDeletion = async (option: DeletionOption, customRange?: CustomDateRange) => {
    try {
      setIsProcessing(true);

      for (const chatId of selectedChats) {
        const messages = await telegramClient.getMessages(chatId);
        const filtered = telegramClient.filterMessagesByTime(
          messages,
          option,
          customRange
            ? {
                startDate: customRange.startDate,
                endDate: customRange.endDate,
              }
            : undefined
        );
        const messageIds = filtered.map((m) => m.id);
        if (messageIds.length > 0) {
          await telegramClient.deleteMessages(chatId, messageIds);
        }
      }

      Alert.alert('Success', 'Messages deleted successfully!');
      setSelectedChats(new Set());
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete messages. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectAllChats = () => {
    const allChatIds = new Set(chats.map(chat => chat.id));
    setSelectedChats(allChatIds);
  };

  const deselectAllChats = () => {
    setSelectedChats(new Set());
  };

  return (
    <View className="flex-1 bg-white">
      {/* Select All Button */}
      <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          className="bg-telegram-blue py-3 rounded-lg"
          onPress={selectedChats.size === chats.length ? deselectAllChats : selectAllChats}
          disabled={chats.length === 0 || isLoadingChats}
        >
          <Text className="text-white text-center font-semibold">
            {isLoadingChats
              ? 'Loading...'
              : chats.length === 0
              ? 'No chats'
              : selectedChats.size === chats.length
              ? '✓ Deselect All'
              : 'Select All Chats'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header with selection count */}
      {selectedChats.size > 0 && (
        <View className="bg-telegram-lightBlue px-4 py-3 flex-row justify-between items-center">
          <Text className="text-white font-semibold">
            {selectedChats.size} chat{selectedChats.size > 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity onPress={deselectAllChats}>
            <Text className="text-white font-semibold">Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat List */}
      {isLoadingChats ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0088cc" />
          <Text className="mt-4 text-gray-500">Loading chats...</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              chat={{
                id: item.id,
                name: item.name,
                lastMessage: item.lastMessage ?? '',
                timestamp: item.timestamp ?? '',
                avatar: item.avatar ?? '💬',
                messageCount: item.messageCount ?? 0,
              }}
              isSelected={selectedChats.has(item.id)}
              onToggle={() => toggleChatSelection(item.id)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-200 ml-16" />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-10">
              <Text className="text-gray-500">No chats found.</Text>
            </View>
          }
        />
      )}

      {/* Delete Button */}
      {selectedChats.size > 0 && (
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            className="bg-red-500 py-4 rounded-lg"
            onPress={() => setShowDeletionModal(true)}
            disabled={isProcessing}
          >
            <Text className="text-white text-center text-lg font-semibold">
              {isProcessing ? 'Deleting...' : 'Delete Messages'}
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
