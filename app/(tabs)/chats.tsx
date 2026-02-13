import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import ChatListItem from '@/components/ChatListItem';
import { telegramClient, TelegramChat } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

export type DeletionOption = 'last_day' | 'last_week' | 'all' | 'custom';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export default function ChatsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [filteredChats, setFilteredChats] = useState<TelegramChat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarCache, setAvatarCache] = useState<Map<string, string>>(new Map());

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
        const newAvatarCache = new Map<string, string>();
        
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

            // Cache the avatar
            const finalAvatar = photo || chat.avatar || '💬';
            newAvatarCache.set(chat.id, finalAvatar);

            return { 
              chatId: chat.id, 
              count,
              photo: finalAvatar,
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
        
        // Save the avatar cache
        setAvatarCache(newAvatarCache);
      } catch (error) {
        console.error(error);
        
        // Check if session expired
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
          console.log('[Chats] Session expired, redirecting to login...');
          router.replace('/(auth)/phone');
          return;
        }
        
        setErrorMessage(t('error'));
        setShowErrorDialog(true);
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, []);

  // Refresh chats only after deletion (when shouldRefresh param is set)
  useEffect(() => {
    if (params.shouldRefresh === 'true' && chats.length > 0 && !isLoadingChats && !isRefreshing) {
      console.log('Refreshing chats after deletion...');
      handleRefreshChats();
      
      // Clear the shouldRefresh parameter after triggering refresh
      // This prevents infinite refresh loops
      router.replace({
        pathname: '/(tabs)/chats',
        params: { shouldRefresh: 'false' }
      });
    }
  }, [params.shouldRefresh]);

  const toggleChatSelection = (chatId: string) => {
    const newSelection = new Set(selectedChats);
    if (newSelection.has(chatId)) {
      newSelection.delete(chatId);
    } else {
      newSelection.add(chatId);
    }
    setSelectedChats(newSelection);
  };

  const selectAllChats = () => {
    const allChatIds = new Set(filteredChats.map(chat => chat.id));
    setSelectedChats(allChatIds);
  };

  const deselectAllChats = () => {
    setSelectedChats(new Set());
  };

  const handleRefreshChats = async () => {
    if (isRefreshing || isLoadingChats) return;
    
    setIsRefreshing(true);
    try {
      // Step 1: Load chats quickly (without message counts)
      const result = await telegramClient.getChatsQuick();
      
      // Use cached avatars instead of reloading them
      const chatsWithCachedAvatars = result.map(chat => ({
        ...chat,
        avatar: avatarCache.get(chat.id) || chat.avatar,
        avatarLoading: false,
      }));
      
      setChats(chatsWithCachedAvatars);

      // Step 2: ONLY reload message counts (NOT avatars)
      const batchSize = 15;
      for (let i = 0; i < result.length; i += batchSize) {
        const batch = result.slice(i, i + batchSize);
        
        const dataPromises = batch.map(async (chat) => {
          const isPrivateChat = chat.type === 'private';
          
          // Only fetch message count, NOT avatar
          const count = await telegramClient.getChatMessageCount(chat.id, isPrivateChat).catch(error => {
            console.error(`Failed to count messages for chat ${chat.id}:`, error);
            return 0;
          });

          return { 
            chatId: chat.id, 
            count,
          };
        });

        const data = await Promise.all(dataPromises);

        // Update only message counts, keep cached avatars
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          data.forEach(({ chatId, count }) => {
            const index = updatedChats.findIndex(c => c.id === chatId);
            if (index !== -1) {
              updatedChats[index] = {
                ...updatedChats[index],
                messageCount: count,
                // Keep the cached avatar
              };
            }
          });
          return updatedChats;
        });
      }
    } catch (error) {
      console.error('Failed to refresh chats:', error);
      
      // Check if session expired
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        console.log('[Chats] Session expired during refresh, redirecting to login...');
        router.replace('/(auth)/phone');
        return;
      }
      
      setErrorMessage(t('error'));
      setShowErrorDialog(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedChats.size === 0) {
      setErrorMessage(t('selectAtLeastOneChat'));
      setShowErrorDialog(true);
      return;
    }

    // Navigate to confirm deletion screen with only chat IDs and names (without heavy base64 avatars)
    // This dramatically improves performance for large selections
    const selectedChatsData = chats
      .filter(chat => selectedChats.has(chat.id))
      .map(chat => ({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        // Use emoji/initial avatars only (no base64 images)
        avatar: chat.avatar && !chat.avatar.startsWith('data:image') ? chat.avatar : null,
      }));
    
    router.push({
      pathname: '/confirm-deletion',
      params: { chatsData: JSON.stringify(selectedChatsData) }
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Search Bar */}
      <View 
        className="px-4 pt-3 pb-2 border-b" 
        style={{ 
          backgroundColor: colors.secondaryBackground,
          borderBottomColor: colors.border 
        }}
      >
        <View 
          className="rounded-lg border flex-row items-center px-3 py-2"
          style={{ 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }}
        >
          <Text style={{ color: colors.secondaryText }} className="mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base"
            style={{ color: colors.text }}
            placeholder={t('search')}
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!isLoadingChats}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-lg" style={{ color: colors.secondaryText }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Select All Button */}
      <View 
        className="px-4 py-3 border-b"
        style={{ 
          backgroundColor: colors.secondaryBackground,
          borderBottomColor: colors.border 
        }}
      >
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={selectedChats.size === filteredChats.length ? deselectAllChats : selectAllChats}
            disabled={filteredChats.length === 0 || isLoadingChats}
          >
            <Text className="text-white text-center font-semibold">
              {isLoadingChats
                ? t('loading')
                : filteredChats.length === 0
                ? t('noChatsAvailable')
                : selectedChats.size === filteredChats.length
                ? '✓ ' + t('cancel')
                : t('selectChats')}
            </Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && !isLoadingChats && (
            <TouchableOpacity
              className="py-3 px-4 rounded-lg"
              style={{ backgroundColor: colors.success }}
              onPress={handleRefreshChats}
              disabled={isRefreshing}
            >
              <Text className="text-white text-center font-semibold">
                {isRefreshing ? '🔄' : '↻'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Header with selection count */}
      {selectedChats.size > 0 && (
        <View 
          className="px-4 py-3 flex-row justify-between items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold">
            {t('selected')}: {selectedChats.size}
          </Text>
          <TouchableOpacity onPress={deselectAllChats}>
            <Text className="text-white font-semibold">{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat List */}
      {isLoadingChats ? (
        <View 
          className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: colors.background }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text 
            className="mt-4 font-semibold text-lg"
            style={{ color: colors.text }}
          >
            {t('loadingChats')}
          </Text>
          <Text 
            className="mt-2 text-center"
            style={{ color: colors.secondaryText }}
          >
            {t('loading')}
          </Text>
          <View 
            className="mt-6 p-4 rounded-lg"
            style={{ backgroundColor: colors.secondaryBackground }}
          >
            <Text 
              className="text-sm text-center"
              style={{ color: colors.secondaryText }}
            >
              💡 {t('loading')}
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
            <View className="h-px ml-16" style={{ backgroundColor: colors.border }} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-10">
              <Text style={{ color: colors.secondaryText }}>{t('noChatsAvailable')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefreshChats}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title={t('loading')}
              titleColor={colors.secondaryText}
            />
          }
        />
      )}

      {/* Confirm Selection Button */}
      {selectedChats.size > 0 && (
        <View 
          className="p-4 border-t"
          style={{ 
            backgroundColor: colors.background,
            borderTopColor: colors.border 
          }}
        >
          <TouchableOpacity
            className="py-4 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={handleConfirmSelection}
          >
            <Text className="text-white text-center text-lg font-semibold">
              {t('next')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Dialog */}
      <ConfirmDialog
        visible={showErrorDialog}
        title={t('error')}
        message={errorMessage}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        confirmText={t('ok')}
        cancelText=""
      />
    </View>
  );
}
