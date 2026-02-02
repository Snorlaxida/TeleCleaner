import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { telegramClient, TelegramChat } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DeletionOption, CustomDateRange } from '@/app/(tabs)/chats';
import DateRangePicker from '@/components/DateRangePicker';

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
      setSuccessMessage(`Messages successfully deleted from ${chats.length} chat${chats.length > 1 ? 's' : ''}!`);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to delete messages:', error);
      setErrorMessage('Failed to delete messages. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    router.back();
  };

  const getTimeRangeText = () => {
    if (selectedTimeRange === 'custom' && customRange) {
      return `${customRange.startDate.toLocaleDateString()} - ${customRange.endDate.toLocaleDateString()}`;
    }
    
    const labels: Record<DeletionOption, string> = {
      last_day: 'Last 24 Hours',
      last_week: 'Last 7 Days',
      all: 'All Messages',
      custom: 'Custom Range',
    };
    
    return labels[selectedTimeRange];
  };

  const getTimeRangeDescription = () => {
    if (selectedTimeRange === 'custom' && customRange) {
      return 'Custom date range';
    }
    
    const descriptions: Record<DeletionOption, string> = {
      last_day: 'Messages from the last 24 hours',
      last_week: 'Messages from the last 7 days',
      all: 'All your messages in selected chats',
      custom: 'Custom date range',
    };
    
    return descriptions[selectedTimeRange];
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0088cc" />
        <Text className="mt-4 text-gray-600">Loading chats...</Text>
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
    
    return (
      <View>
        <View className="flex-row items-center py-3 px-3">
          {/* Avatar */}
          <View className="w-10 h-10 rounded-full bg-telegram-lightBlue items-center justify-center mr-3">
            <Text className={isEmoji ? "text-lg" : "text-base font-bold text-white"}>
              {avatar}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </View>
        {index < chats.length - 1 && (
          <View className="h-px bg-gray-200 ml-13" />
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Selected Chats Section - Using FlatList for virtualization */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Selected Chats ({chats.length})
          </Text>
          <View className="bg-gray-50 rounded-lg border border-gray-200">
            <FlatList
              data={chats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </View>
        </View>

        {/* Time Range Selection */}
        <View className="px-4 py-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Time Period
          </Text>
          <View className="space-y-2">
            {[
              { value: 'last_day' as DeletionOption, label: 'Last 24 Hours' },
              { value: 'last_week' as DeletionOption, label: 'Last 7 Days' },
              { value: 'custom' as DeletionOption, label: 'Custom Date Range' },
              { value: 'all' as DeletionOption, label: 'All Messages' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`p-4 rounded-lg border-2 ${
                  selectedTimeRange === option.value
                    ? 'border-telegram-blue bg-telegram-lightBlue/10'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => handleTimeRangeSelect(option.value)}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`text-base font-medium ${
                    selectedTimeRange === option.value ? 'text-telegram-blue' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </Text>
                  {selectedTimeRange === option.value && (
                    <Text className="text-telegram-blue text-lg">✓</Text>
                  )}
                </View>
                {selectedTimeRange === option.value && option.value === 'custom' && customRange && (
                  <Text className="text-sm text-gray-500 mt-2">
                    {customRange.startDate.toLocaleDateString()} - {customRange.endDate.toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* Warning */}
        <View className="px-4 py-4">
          <View className="bg-red-50 border border-red-200 rounded-lg p-4">
            <Text className="text-sm font-semibold text-red-800 mb-1">
              ⚠️ Warning
            </Text>
            <Text className="text-sm text-red-700">
              This action cannot be undone. Messages will be permanently deleted from Telegram.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Button */}
      <View 
        className="p-4 border-t border-gray-200 bg-white"
        style={{ 
          paddingBottom: Platform.OS === 'android' ? Math.max(16, insets.bottom) : 16 
        }}
      >
        <TouchableOpacity
          className={`py-4 rounded-lg ${isDeleting ? 'bg-red-300' : 'bg-red-500'}`}
          onPress={handleDeletePress}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white text-center text-lg font-semibold ml-2">
                Deleting...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Delete Messages
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
        title="Confirm Deletion"
        message={`Are you sure you want to delete messages from ${chats.length} chat${chats.length > 1 ? 's' : ''} for ${getTimeRangeText()}? This action cannot be undone.`}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDeletion}
        confirmText="Delete"
        cancelText="Cancel"
        confirmDestructive
      />

      {/* Success Dialog */}
      <ConfirmDialog
        visible={showSuccessDialog}
        title="Success"
        message={successMessage}
        onClose={() => {}}
        onConfirm={handleSuccessConfirm}
        confirmText="OK"
        cancelText=""
      />

      {/* Error Dialog */}
      <ConfirmDialog
        visible={showErrorDialog}
        title="Error"
        message={errorMessage}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        confirmText="OK"
        cancelText=""
      />
    </View>
  );
}
