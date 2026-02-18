import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import ChatListItem from '@/components/ChatListItem';
import { telegramClient, TelegramChat } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

export default function SelectChatsTimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  // Check if we're in edit mode
  const editMode = params.editMode === 'true';
  const timerId = typeof params.timerId === 'string' ? params.timerId : undefined;
  const existingChatsData = typeof params.chatsData === 'string' 
    ? JSON.parse(params.chatsData) 
    : [];
  
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [filteredChats, setFilteredChats] = useState<TelegramChat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(
    new Set(existingChatsData.map((c: any) => c.id))
  );
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
        // Load chats quickly with cached avatars (no message count needed!)
        const result = await telegramClient.getChatsQuick();
        
        // Import avatarCache
        const { avatarCache } = await import('@/lib/avatarCache');
        
        // Load cached avatars immediately
        const chatsWithCachedAvatars = await Promise.all(
          result.map(async (chat) => {
            const cachedPhoto = await avatarCache.get(chat.id, chat.photoId, false).catch(() => null);
            return {
              ...chat,
              avatar: cachedPhoto || chat.avatar || '💬',
              avatarLoading: cachedPhoto ? false : true,
              messageCount: 0, // Not needed for timer selection
            };
          })
        );
        
        setChats(chatsWithCachedAvatars);
        setIsLoadingChats(false);

        // Load missing avatars in background
        const batchSize = 15;
        
        for (let i = 0; i < result.length; i += batchSize) {
          const batch = result.slice(i, i + batchSize);
          
          const photoPromises = batch.map(async (chat) => {
            const currentChat = chatsWithCachedAvatars.find(c => c.id === chat.id);
            const needsAvatar = currentChat?.avatarLoading === true;
            
            if (needsAvatar) {
              const photo = await telegramClient.getChatProfilePhoto(chat.id, chat.photoId).catch(() => null);
              return { chatId: chat.id, photo };
            }
            return { chatId: chat.id, photo: null };
          });

          const photos = await Promise.all(photoPromises);

          // Update chats with avatars
          setChats(prevChats => {
            const updatedChats = [...prevChats];
            photos.forEach(({ chatId, photo }) => {
              const index = updatedChats.findIndex(c => c.id === chatId);
              if (index !== -1 && photo) {
                updatedChats[index] = {
                  ...updatedChats[index],
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
        
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
          console.log('[SelectChatsTimer] Session expired, redirecting to login...');
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
      const result = await telegramClient.getChatsQuick();
      const { avatarCache } = await import('@/lib/avatarCache');
      
      const chatsWithCachedAvatars = await Promise.all(
        result.map(async (chat) => {
          const cachedPhoto = await avatarCache.get(chat.id, chat.photoId, false).catch(() => null);
          return {
            ...chat,
            avatar: cachedPhoto || chat.avatar || '💬',
            avatarLoading: false,
            messageCount: 0,
          };
        })
      );
      
      setChats(chatsWithCachedAvatars);
    } catch (error) {
      console.error('Failed to refresh chats:', error);
      
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        console.log('[SelectChatsTimer] Session expired during refresh, redirecting to login...');
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

    // Navigate to timer configuration screen
    const selectedChatsData = chats
      .filter(chat => selectedChats.has(chat.id))
      .map(chat => ({
        id: chat.id,
        name: chat.name,
        photoId: chat.photoId,
        avatar: chat.avatar && !chat.avatar.startsWith('data:image') ? chat.avatar : null,
      }));
    
    router.push({
      pathname: '/confirm-timer-deletion',
      params: { 
        chatsData: JSON.stringify(selectedChatsData),
        editMode: editMode ? 'true' : 'false',
        timerId: timerId || '',
      }
    });
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('selectChatsForTimer'),
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
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
          <TouchableOpacity
            className="py-3 rounded-lg"
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
                messageCount: -3, // Hide message count (use value that won't show anything)
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
    </>
  );
}
