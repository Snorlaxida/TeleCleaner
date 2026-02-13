import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { telegramClient, TelegramChat } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DeletionOption, CustomDateRange } from '@/app/(tabs)/chats';
import DateRangePicker from '@/components/DateRangePicker';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

// Lightweight chat data structure (without heavy base64 avatars)
interface LightweightChat {
  id: string;
  name: string;
  type: string;
  avatar: string | null;
}

export default function ConfirmDeletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  
  // Parse selected chats from params (now lightweight - no base64 avatars)
  const selectedChatsData: LightweightChat[] = typeof params.chatsData === 'string' 
    ? JSON.parse(params.chatsData) 
    : [];
  
  const [chats, setChats] = useState<LightweightChat[]>(selectedChatsData);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<DeletionOption>('last_day');
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);



  const handleTimeRangeSelect = (option: DeletionOption) => {
    if (option === 'custom') {
      setShowDatePicker(true);
    } else {
      setSelectedTimeRange(option);
      setCustomRange(null);
    }
  };

  const handleCustomDateConfirm = (range: CustomDateRange) => {
    setShowDatePicker(false);
    setSelectedTimeRange('custom');
    setCustomRange(range);
  };

  const handleDeletePress = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDeletion = async () => {
    try {
      setIsDeleting(true);

      // Process each selected chat
      for (const chat of chats) {
        await telegramClient.deleteMessages(chat.id, {
          timeRange: selectedTimeRange,
          startDate: customRange?.startDate,
          endDate: customRange?.endDate,
        });
      }

      // Show success message
      setSuccessMessage(t('deletionCompleteMessage', { count: chats.length }));
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to delete messages:', error);
      setErrorMessage(t('deletionErrorMessage'));
      setShowErrorDialog(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    // Navigate back with shouldRefresh parameter to trigger chat refresh
    router.replace({
      pathname: '/(tabs)/chats',
      params: { shouldRefresh: 'true' }
    });
  };

  const getTimeRangeText = () => {
    if (selectedTimeRange === 'custom' && customRange) {
      return `${customRange.startDate.toLocaleDateString()} - ${customRange.endDate.toLocaleDateString()}`;
    }
    
    const labels: Record<DeletionOption, string> = {
      last_day: t('last24Hours'),
      last_week: t('last7Days'),
      all: t('allMessages'),
      custom: t('customRange'),
    };
    
    return labels[selectedTimeRange];
  };

  const getTimeRangeDescription = () => {
    if (selectedTimeRange === 'custom' && customRange) {
      return t('customDateRange');
    }
    
    const descriptions: Record<DeletionOption, string> = {
      last_day: t('deleteFromLastDay'),
      last_week: t('deleteFromLastWeek'),
      all: t('deleteAllYourMessages'),
      custom: t('customDateRange'),
    };
    
    return descriptions[selectedTimeRange];
  };

  if (isLoading) {
    return (
      <View 
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.secondaryText }}>
          {t('loadingChats')}
        </Text>
      </View>
    );
  }

  // Generate avatar based on chat type (memoized for performance)
  const getDefaultAvatar = useMemo(() => (chat: LightweightChat): string => {
    if (chat.avatar) return chat.avatar;
    
    // Default avatars based on type
    switch (chat.type) {
      case 'user':
      case 'private':
        return chat.name.charAt(0).toUpperCase() || '👤';
      case 'channel':
        return '📢';
      case 'group':
        return '👥';
      default:
        return '💬';
    }
  }, []);

  // Render individual chat item (optimized for FlatList)
  const renderChatItem = ({ item, index }: { item: LightweightChat; index: number }) => {
    const avatar = getDefaultAvatar(item);
    const isEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(avatar);
    
    const isFirst = index === 0;
    const isLast = index === chats.length - 1;
    
    return (
      <View 
        className={`mx-4 border-x ${
          isFirst ? 'border-t rounded-t-lg' : ''
        } ${isLast ? 'border-b rounded-b-lg' : ''}`}
        style={{ 
          backgroundColor: colors.secondaryBackground,
          borderColor: colors.border 
        }}
      >
        <View className="flex-row items-center py-3 px-3">
          {/* Avatar */}
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className={isEmoji ? "text-lg" : "text-base font-bold text-white"}>
              {avatar}
            </Text>
          </View>
          <View className="flex-1">
            <Text 
              className="text-base font-medium" 
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
        </View>
        {!isLast && (
          <View className="h-px ml-13" style={{ backgroundColor: colors.border }} />
        )}
      </View>
    );
  };

  // Render header section (title)
  const renderListHeader = () => (
    <View className="px-4 py-4">
      <Text 
        className="text-lg font-semibold mb-3"
        style={{ color: colors.text }}
      >
        {t('selectedChats')} ({chats.length})
      </Text>
    </View>
  );

  // Render footer section (time range and warning)
  const renderListFooter = () => (
    <>
      {/* Time Range Selection */}
      <View className="px-4 py-4 border-t" style={{ borderTopColor: colors.border }}>
        <Text 
          className="text-lg font-semibold mb-3"
          style={{ color: colors.text }}
        >
          {t('timePeriod')}
        </Text>
        <View className="space-y-2">
          {[
            { value: 'last_day' as DeletionOption, label: t('last24Hours') },
            { value: 'last_week' as DeletionOption, label: t('last7Days') },
            { value: 'custom' as DeletionOption, label: t('customDateRange') },
            { value: 'all' as DeletionOption, label: t('allMessages') },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              className="p-4 rounded-lg border-2"
              style={{
                borderColor: selectedTimeRange === option.value ? colors.primary : colors.border,
                backgroundColor: selectedTimeRange === option.value 
                  ? colors.secondaryBackground 
                  : colors.cardBackground
              }}
              onPress={() => handleTimeRangeSelect(option.value)}
            >
              <View className="flex-row items-center justify-between">
                <Text 
                  className="text-base font-medium"
                  style={{ 
                    color: selectedTimeRange === option.value ? colors.primary : colors.text 
                  }}
                >
                  {option.label}
                </Text>
                {selectedTimeRange === option.value && (
                  <Text className="text-lg" style={{ color: colors.primary }}>✓</Text>
                )}
              </View>
              {selectedTimeRange === option.value && option.value === 'custom' && customRange && (
                <Text 
                  className="text-sm mt-2"
                  style={{ color: colors.secondaryText }}
                >
                  {customRange.startDate.toLocaleDateString()} - {customRange.endDate.toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Warning */}
      <View className="px-4 py-4">
        <View 
          className="border rounded-lg p-4"
          style={{ 
            backgroundColor: colorScheme === 'dark' ? '#3d1a1a' : '#fef2f2',
            borderColor: colorScheme === 'dark' ? '#7f1d1d' : '#fecaca'
          }}
        >
          <Text 
            className="text-sm font-semibold mb-1"
            style={{ color: colors.destructive }}
          >
            ⚠️ {t('warning')}
          </Text>
          <Text 
            className="text-sm"
            style={{ color: colors.destructive }}
          >
            {t('deletionWarning')}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Main scrollable list with chats */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={{ paddingBottom: 80 }}
        className="flex-1"
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />

      {/* Delete Button */}
      <View 
        className="p-4 border-t"
        style={{ 
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: Platform.OS === 'android' ? Math.max(16, insets.bottom) : 16 
        }}
      >
        <TouchableOpacity
          className="py-4 rounded-lg"
          style={{ 
            backgroundColor: isDeleting 
              ? (colorScheme === 'dark' ? '#7f1d1d' : '#fca5a5') 
              : colors.destructive 
          }}
          onPress={handleDeletePress}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white text-center text-lg font-semibold ml-2">
                {t('deleting')}
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              {t('deleteMessages')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Range Picker Modal */}
      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleCustomDateConfirm}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={showConfirmDialog}
        title={t('confirmDeletion')}
        message={t('deletionConfirmMessage', { 
          count: chats.length, 
          timeRange: getTimeRangeText() 
        })}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDeletion}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        confirmDestructive
      />

      {/* Success Dialog */}
      <ConfirmDialog
        visible={showSuccessDialog}
        title={t('success')}
        message={successMessage}
        onClose={() => {}}
        onConfirm={handleSuccessConfirm}
        confirmText={t('ok')}
        cancelText=""
      />

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
