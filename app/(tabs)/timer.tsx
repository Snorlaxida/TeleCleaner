import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, Switch } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { telegramClient } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';

export type TimerFrequency = 'minutely' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DeletionTimer {
  id: string;
  chats: {
    id: string;
    chatId: string;
    chatName: string;
    chatType: string;
    photoId?: string | null;
  }[];
  frequency: TimerFrequency;
  customDays?: number | null;
  startHour: number;
  startMinute: number;
  userTimezone?: string;
  isActive: boolean;
  createdAt: string;
  lastRun?: string | null;
  nextRun: string;
}

export default function TimerScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  const [timers, setTimers] = useState<DeletionTimer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [timerToDelete, setTimerToDelete] = useState<string | null>(null);

  // Load timers from API
  const loadTimers = async () => {
    try {
      setIsLoading(true);
      const fetchedTimers = await telegramClient.getTimers();
      
      // Load cached avatars for each timer's chats
      const { avatarCache } = await import('@/lib/avatarCache');
      
      const timersWithAvatars = await Promise.all(
        fetchedTimers.map(async (timer) => {
          const chatsWithAvatars = await Promise.all(
            timer.chats.map(async (chat) => {
              if (!chat.photoId) {
                return chat;
              }
              
              try {
                const cachedPhoto = await avatarCache.get(chat.chatId, chat.photoId, false);
                return {
                  ...chat,
                  cachedAvatar: cachedPhoto,
                };
              } catch (error) {
                console.error(`Failed to load avatar for chat ${chat.chatId}:`, error);
                return chat;
              }
            })
          );
          
          return {
            ...timer,
            chats: chatsWithAvatars,
          };
        })
      );
      
      setTimers(timersWithAvatars);
    } catch (error) {
      console.error('Failed to load timers:', error);
      setTimers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load timers when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTimers();
    }, [])
  );

  const handleAddTimer = () => {
    router.push('/select-chats-timer');
  };

  const handleEditTimer = (timer: DeletionTimer) => {
    // Convert backend format to frontend format
    const chatsData = timer.chats.map(chat => ({
      id: chat.chatId,
      name: chat.chatName,
      type: chat.chatType,
      photoId: chat.photoId,
    }));
    
    router.push({
      pathname: '/select-chats-timer',
      params: { 
        editMode: 'true',
        timerId: timer.id,
        chatsData: JSON.stringify(chatsData),
        frequency: timer.frequency,
        customDays: timer.customDays?.toString() || '',
      }
    });
  };

  const handleDeleteTimer = (timerId: string) => {
    setTimerToDelete(timerId);
    setShowDeleteDialog(true);
  };

  const handleToggleTimer = async (timerId: string, currentState: boolean) => {
    try {
      await telegramClient.toggleTimer(timerId);
      // Update local state
      const updatedTimers = timers.map(t => 
        t.id === timerId ? { ...t, isActive: !currentState } : t
      );
      setTimers(updatedTimers);
    } catch (error) {
      console.error('Failed to toggle timer:', error);
    }
  };

  const confirmDeleteTimer = async () => {
    if (!timerToDelete) return;

    try {
      await telegramClient.deleteTimer(timerToDelete);
      const updatedTimers = timers.filter(t => t.id !== timerToDelete);
      setTimers(updatedTimers);
      setShowDeleteDialog(false);
      setTimerToDelete(null);
    } catch (error) {
      console.error('Failed to delete timer:', error);
    }
  };

  const getFrequencyText = (timer: DeletionTimer): string => {
    switch (timer.frequency) {
      case 'minutely':
        return t('minute');
      case 'daily':
        return t('day');
      case 'weekly':
        return t('week');
      case 'monthly':
        return t('month');
      case 'custom':
        return t('days', { count: timer.customDays || 0 });
      default:
        return '';
    }
  };

  const renderTimerItem = ({ item }: { item: DeletionTimer }) => {
    // Get up to 3 avatars for display
    const displayAvatars = item.chats.slice(0, 3);
    
    return (
      <TouchableOpacity
        onPress={() => handleEditTimer(item)}
        onLongPress={() => handleDeleteTimer(item.id)}
        className="mx-4 mb-3 p-4 rounded-lg border"
        style={{ 
          backgroundColor: colors.secondaryBackground,
          borderColor: colors.border,
          opacity: item.isActive ? 1 : 0.5,
        }}
      >
        {/* Header with Toggle */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="flex-row" style={{ marginRight: 12 }}>
              {displayAvatars.map((chat, index) => {
                const chatName = chat.chatName;
                const chatType = chat.chatType;
                const cachedAvatar = (chat as any).cachedAvatar;
                
                // Проверяем, есть ли кешированная аватарка
                const isBase64Image = cachedAvatar && cachedAvatar.startsWith('data:image');
                
                // Если нет кешированной аватарки, определяем fallback
                let fallback = '💬';
                if (chatType === 'channel') {
                  fallback = '📢';
                } else if (chatType === 'group' || chatType === 'supergroup') {
                  fallback = '👥';
                } else if (chatType === 'private') {
                  fallback = chatName.charAt(0).toUpperCase();
                }
                
                const isEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(fallback);
                const zIndex = displayAvatars.length - index;
                const marginLeft = index === 0 ? 0 : -12;
                
                return (
                  <View
                    key={chat.chatId}
                    className="w-12 h-12 rounded-full items-center justify-center border-2 overflow-hidden"
                    style={{
                      backgroundColor: isBase64Image ? 'transparent' : colors.primary,
                      borderColor: colors.secondaryBackground,
                      zIndex,
                      marginLeft,
                    }}
                  >
                    {isBase64Image ? (
                      <Image 
                        source={{ uri: cachedAvatar }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className={isEmoji ? "text-xl" : "text-lg font-bold text-white"}>
                        {fallback}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            
            {/* Chat count and frequency */}
            <View className="flex-1">
              <Text 
                className="text-base font-semibold mb-1"
                style={{ color: colors.text }}
              >
                {t('chatsCount', { count: item.chats.length })}
              </Text>
              <Text 
                className="text-sm"
                style={{ color: colors.secondaryText }}
              >
                {t('deletesEvery', { frequency: getFrequencyText(item) })}
              </Text>
            </View>
          </View>
          
          {/* Toggle Switch */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleTimer(item.id, item.isActive);
            }}
          >
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleTimer(item.id, item.isActive)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        {/* Next Run Info */}
        <View 
          className="flex-row items-center mb-2 px-3 py-2 rounded-lg"
          style={{ 
            backgroundColor: colorScheme === 'dark' ? '#1a3d3d' : '#f0f9ff',
            borderColor: colorScheme === 'dark' ? '#2d7272' : '#bfdbfe',
            borderWidth: 1
          }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.primary }}>
            {item.lastRun 
              ? `🔄 ${t('nextRunAt')}: ${new Date(item.nextRun).toLocaleDateString()} ${new Date(item.nextRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `🕐 ${t('startsAt')}: ${new Date(item.nextRun).toLocaleDateString()} ${new Date(item.nextRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
          </Text>
        </View>
        
        {/* Chat names preview */}
        <Text 
          className="text-xs"
          style={{ color: colors.secondaryText }}
          numberOfLines={2}
        >
          {item.chats.map(c => c.chatName).join(', ')}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAddButton = () => (
    <TouchableOpacity
      onPress={handleAddTimer}
      className="mx-4 mb-3 p-8 rounded-lg border-2 border-dashed items-center justify-center"
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }}
    >
      <Text 
        className="text-4xl mb-2"
        style={{ color: colors.primary }}
      >
        +
      </Text>
      <Text 
        className="text-base font-medium"
        style={{ color: colors.primary }}
      >
        {t('addTimer')}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View 
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          className="mt-4"
          style={{ color: colors.secondaryText }}
        >
          {t('loading')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {timers.length === 0 ? (
        <ScrollView 
          contentContainerClassName="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: colors.background }}
        >
          <Text className="text-6xl mb-4">⏰</Text>
          <Text 
            className="text-2xl font-bold mb-2 text-center"
            style={{ color: colors.text }}
          >
            {t('noTimers')}
          </Text>
          <Text 
            className="text-base text-center mb-8"
            style={{ color: colors.secondaryText }}
          >
            {t('noTimersDescription')}
          </Text>
          <TouchableOpacity
            className="py-4 px-8 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={handleAddTimer}
          >
            <Text className="text-white text-lg font-semibold">
              {t('addTimer')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={timers}
          keyExtractor={(item) => item.id}
          renderItem={renderTimerItem}
          ListHeaderComponent={
            <View className="py-4">
              <Text 
                className="text-sm font-medium px-4 mb-3"
                style={{ color: colors.secondaryText }}
              >
                {t('timers').toUpperCase()}
              </Text>
            </View>
          }
          ListFooterComponent={renderAddButton}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title={t('deleteTimer')}
        message={t('confirmDeleteTimer')}
        onClose={() => {
          setShowDeleteDialog(false);
          setTimerToDelete(null);
        }}
        onConfirm={confirmDeleteTimer}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        confirmDestructive
      />
    </View>
  );
}
