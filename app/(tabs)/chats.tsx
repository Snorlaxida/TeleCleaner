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
        // Step 1: Load chats quickly (without message counts and avatars)
        const result = await telegramClient.getChatsQuick();
        
        // Mark all chats as having avatars loading
        const chatsWithLoadingState = result.map(chat => ({
          ...chat,
          avatarLoading: true,
        }));
        
        setChats(chatsWithLoadingState);
        setIsLoadingChats(false);

        // Step 2: Load message counts AND profile photos for each chat incrementally
        // Process in batches to avoid overwhelming the API
        const batchSize = 5; // Process 5 chats at a time (increased from 3)
        for (let i = 0; i < result.length; i += batchSize) {
          const batch = result.slice(i, i + batchSize);
          
          // Load both counts and avatars for this batch in parallel
          const dataPromises = batch.map(async (chat) => {
            // Run count and photo fetch in parallel for each chat
            const [count, photo] = await Promise.all([
              telegramClient.getChatMessageCount(chat.id).catch(error => {
                console.error(`Failed to count messages for chat ${chat.id}:`, error);
                return 0;
              }),
              telegramClient.getChatProfilePhoto(chat.id).catch(error => {
                console.error(`Failed to get photo for chat ${chat.id}:`, error);
                return null;
              })
            ]);

            return { 
              chatId: chat.id, 
              count,
              photo: photo || chat.avatar, // Keep emoji/initial if no photo
            };
          });

          const data = await Promise.all(dataPromises);

          // Update chats with the new counts and avatars
          setChats(prevChats => {
            const updatedChats = [...prevChats];
            data.forEach(({ chatId, count, photo }) => {
              const index = updatedChats.findIndex(c => c.id === chatId);
              if (index !== -1) {
                updatedChats[index] = {
                  ...updatedChats[index],
                  messageCount: count,
                  avatar: photo,
                  avatarLoading: false,
                };
              }
            });
            return updatedChats;
          });
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load chats from Telegram.');
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
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="large" color="#0088cc" />
          <Text className="mt-4 text-gray-700 font-semibold text-lg">Loading chats...</Text>
          <Text className="mt-2 text-gray-500 text-center">
            Counting your messages in each chat.{'\n'}This may take a few minutes.
          </Text>
          <View className="mt-6 bg-blue-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm text-center">
              💡 Tip: We're analyzing all your messages to show accurate counts.{'\n'}
              Please be patient.
            </Text>
          </View>
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
                avatarLoading: item.avatarLoading ?? false,
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
