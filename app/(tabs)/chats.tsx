import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
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
  const [filteredChats, setFilteredChats] = useState<TelegramChat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showDeletionModal, setShowDeletionModal] = useState(false);

  // Filter chats based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(query)
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  // Setup real-time message count updates
  useEffect(() => {
    const handleMessageCountUpdate = (data: { chatId: string; count: number }) => {
      console.log('📬 Real-time update received:', data);
      
      // Update chat message count in state
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        const index = updatedChats.findIndex(c => c.id === data.chatId);
        
        if (index !== -1) {
          updatedChats[index] = {
            ...updatedChats[index],
            messageCount: data.count,
          };
          console.log(`✅ Updated chat ${data.chatId} count to ${data.count}`);
        } else {
          console.warn(`⚠️ Chat ${data.chatId} not found in state`);
        }
        
        return updatedChats;
      });
    };

    // Register callback
    telegramClient.onMessageCountUpdate(handleMessageCountUpdate);

    // Cleanup: unregister callback when component unmounts
    return () => {
      telegramClient.offMessageCountUpdate(handleMessageCountUpdate);
    };
  }, []);

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
        const batchSize = 15; // Process 15 chats at a time for faster loading
        for (let i = 0; i < result.length; i += batchSize) {
          const batch = result.slice(i, i + batchSize);
          
          // Load both counts and avatars for this batch in parallel
          const dataPromises = batch.map(async (chat) => {
            const isPrivateChat = chat.type === 'private';
            
            // Run count and photo fetch in parallel for each chat
            const [count, photo] = await Promise.all([
              telegramClient.getChatMessageCount(chat.id, isPrivateChat).catch(error => {
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

        // Step 3: Subscribe to real-time updates
        console.log('Subscribing to real-time updates...');
        const subscribed = await telegramClient.subscribeToUpdates();
        if (subscribed) {
          console.log('✅ Subscribed to real-time updates');
        } else {
          console.warn('⚠️ Failed to subscribe to real-time updates');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load chats from Telegram.');
        setIsLoadingChats(false);
      }
    };

    loadChats();

    // Cleanup: unsubscribe when component unmounts
    return () => {
      telegramClient.unsubscribeFromUpdates().catch(err => {
        console.error('Error unsubscribing from updates:', err);
      });
    };
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
      let totalDeleted = 0;

      // Process each selected chat
      for (const chatId of selectedChats) {
        const result = await telegramClient.deleteMessages(chatId, {
          timeRange: option,
          startDate: customRange?.startDate,
          endDate: customRange?.endDate,
        });
        totalDeleted += result.deletedCount;

        // Update message count for this chat
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex !== -1) {
          const chat = chats[chatIndex];
          const isPrivateChat = chat.type === 'private';
          
          // Refresh count from server
          try {
            const newCount = await telegramClient.getChatMessageCount(chatId, isPrivateChat);
            setChats(prevChats => {
              const updated = [...prevChats];
              updated[chatIndex] = {
                ...updated[chatIndex],
                messageCount: newCount,
              };
              return updated;
            });
          } catch (error) {
            console.error(`Failed to update count for chat ${chatId}:`, error);
          }
        }
      }

      Alert.alert('Success', `Deleted ${totalDeleted} messages successfully!`);
      setSelectedChats(new Set());
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete messages. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectAllChats = () => {
    const allChatIds = new Set(filteredChats.map(chat => chat.id));
    setSelectedChats(allChatIds);
  };

  const deselectAllChats = () => {
    setSelectedChats(new Set());
  };

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="bg-gray-50 px-4 pt-3 pb-2 border-b border-gray-200">
        <View className="bg-white rounded-lg border border-gray-300 flex-row items-center px-3 py-2">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search chats..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!isLoadingChats}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Select All Button */}
      <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          className="bg-telegram-blue py-3 rounded-lg"
          onPress={selectedChats.size === filteredChats.length ? deselectAllChats : selectAllChats}
          disabled={filteredChats.length === 0 || isLoadingChats}
        >
          <Text className="text-white text-center font-semibold">
            {isLoadingChats
              ? 'Loading...'
              : filteredChats.length === 0
              ? 'No chats'
              : selectedChats.size === filteredChats.length
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
          data={filteredChats}
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
