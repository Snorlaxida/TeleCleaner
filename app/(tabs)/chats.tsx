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
        // Step 1: Load chats quickly WITH cached avatars (instant!)
        const result = await telegramClient.getChatsQuick();
        
        // Import avatarCache
        const { avatarCache } = await import('@/lib/avatarCache');
        
        // Load cached avatars immediately (NO HTTP requests!)
        const chatsWithCachedAvatars = await Promise.all(
          result.map(async (chat) => {
            // Get from cache without forcing check (uses cache if < 24h)
            const cachedPhoto = await avatarCache.get(chat.id, chat.photoId, false).catch(() => null);
            return {
              ...chat,
              avatar: cachedPhoto || chat.avatar || '💬',
              avatarLoading: cachedPhoto ? false : true, // Only loading if no cache
            };
          })
        );
        
        setChats(chatsWithCachedAvatars);
        setIsLoadingChats(false);

        // Step 2: Load message counts AND profile photos for each chat incrementally
        // Process in batches to avoid overwhelming the API
        const batchSize = 15; // Process 15 chats at a time for faster loading
        
        for (let i = 0; i < result.length; i += batchSize) {
          const batch = result.slice(i, i + batchSize);
          
          const dataPromises = batch.map(async (chat) => {
            const isPrivateChat = chat.type === 'private';
            
            // Find current chat state to check if avatar is already loaded
            const currentChat = chatsWithCachedAvatars.find(c => c.id === chat.id);
            const needsAvatar = currentChat?.avatarLoading === true;
            
            // Build promises array
            const promises: [Promise<number>, Promise<string | null>?] = [
              // For private chats, return -2 immediately without API call
              // For groups/channels, fetch message count
              isPrivateChat 
                ? Promise.resolve(-2) 
                : telegramClient.getChatMessageCount(chat.id, false).catch(error => {
                    console.error(`Failed to count messages for chat ${chat.id}:`, error);
                    return 0;
                  })
            ];
            
            // Only fetch avatar if not cached (avatarLoading === true)
            if (needsAvatar) {
              console.log(`[Chats] Fetching missing avatar for chat ${chat.id}`);
              promises.push(
                telegramClient.getChatProfilePhoto(chat.id, chat.photoId).catch(error => {
                  console.error(`Failed to get photo for chat ${chat.id}:`, error);
                  return null;
                })
              );
            }
            
            const results = await Promise.all(promises);
            const count = results[0];
            const photo = results[1]; // Will be undefined if avatar was cached

            return { 
              chatId: chat.id, 
              count,
              photo: photo || undefined, // Keep undefined if not fetched
            };
          });

          const data = await Promise.all(dataPromises);

          // Update chats with the new counts and avatars (only update avatar if fetched)
          setChats(prevChats => {
            const updatedChats = [...prevChats];
            data.forEach(({ chatId, count, photo }) => {
              const index = updatedChats.findIndex(c => c.id === chatId);
              if (index !== -1) {
                updatedChats[index] = {
                  ...updatedChats[index],
                  messageCount: count,
                  ...(photo && { avatar: photo }), // Only update avatar if new photo fetched
                  avatarLoading: false,
                };
              }
            });
            return updatedChats;
          });
        }
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
      // Step 1: Load chats quickly with cached avatars (NO HTTP requests for avatars!)
      const result = await telegramClient.getChatsQuick();
      
      // Import avatarCache dynamically
      const { avatarCache } = await import('@/lib/avatarCache');
      
      // Try to load avatars from cache first (instant, no HTTP!)
      const chatsWithCachedAvatars = await Promise.all(
        result.map(async (chat) => {
          // Try to get from cache WITHOUT forcing photoId check (uses cached data if < 24h)
          const cachedPhoto = await avatarCache.get(chat.id, chat.photoId, false).catch(() => null);
          return {
            ...chat,
            avatar: cachedPhoto || chat.avatar || '💬',
            avatarLoading: false,
          };
        })
      );
      
      setChats(chatsWithCachedAvatars);

      // Step 2: ONLY reload message counts (NOT avatars)
      const batchSize = 15;
      for (let i = 0; i < result.length; i += batchSize) {
        const batch = result.slice(i, i + batchSize);
        
        const dataPromises = batch.map(async (chat) => {
          const isPrivateChat = chat.type === 'private';
          
          // For private chats, return -2 immediately without API call
          // For groups/channels, fetch message count
          const count = isPrivateChat 
            ? -2 
            : await telegramClient.getChatMessageCount(chat.id, false).catch(error => {
                console.error(`Failed to count messages for chat ${chat.id}:`, error);
                return 0;
              });

          return { 
            chatId: chat.id, 
            count,
          };
        });

        const data = await Promise.all(dataPromises);

        // Update only message counts (keep cached avatars)
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          data.forEach(({ chatId, count }) => {
            const index = updatedChats.findIndex(c => c.id === chatId);
            if (index !== -1) {
              updatedChats[index] = {
                ...updatedChats[index],
                messageCount: count,
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

    // Navigate to confirm deletion screen with chat IDs, names, and photoIds (for cache lookup)
    // This dramatically improves performance for large selections
    const selectedChatsData = chats
      .filter(chat => selectedChats.has(chat.id))
      .map(chat => ({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        photoId: chat.photoId, // Include photoId for cached avatar loading
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
