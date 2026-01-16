import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { telegramClient, TelegramChat } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DeletionOption, CustomDateRange } from '@/app/(tabs)/chats';
import DateRangePicker from '@/components/DateRangePicker';

export default function ConfirmDeletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse selected chat IDs from params
  const selectedChatIds = typeof params.chatIds === 'string' 
    ? JSON.parse(params.chatIds) 
    : [];
  
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<DeletionOption>('last_day');
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSelectedChats();
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      calculateTotalMessages();
    }
  }, [selectedTimeRange, customRange, chats]);

  const loadSelectedChats = async () => {
    try {
      setIsLoading(true);
      // Load quick info for selected chats
      const allChats = await telegramClient.getChatsQuick();
      const selectedChats = allChats.filter(chat => selectedChatIds.includes(chat.id));
      
      // Load message counts for selected chats
      const chatsWithCounts = await Promise.all(
        selectedChats.map(async (chat) => {
          const isPrivateChat = chat.type === 'private';
          const count = await telegramClient.getChatMessageCount(chat.id, isPrivateChat).catch(() => 0);
          return { ...chat, messageCount: count };
        })
      );
      
      setChats(chatsWithCounts);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalMessages = async () => {
    setIsCalculating(true);
    try {
      // For now, use estimated count based on time range
      // In a real implementation, you'd query the backend for exact counts
      let total = 0;
      
      for (const chat of chats) {
        // Get approximate message count based on time range
        const chatTotal = chat.messageCount || 0;
        
        // Apply time range multiplier (rough estimate)
        let multiplier = 1;
        if (selectedTimeRange === 'last_day') {
          multiplier = 0.1; // Assume ~10% of messages in last day
        } else if (selectedTimeRange === 'last_week') {
          multiplier = 0.3; // Assume ~30% of messages in last week
        } else if (selectedTimeRange === 'custom' && customRange) {
          // Estimate based on date range (very rough)
          const days = Math.ceil((customRange.endDate.getTime() - customRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
          multiplier = Math.min(days / 365, 1); // Assume messages spread over a year
        }
        
        total += Math.floor(chatTotal * multiplier);
      }
      
      setTotalMessages(total);
    } catch (error) {
      console.error('Failed to calculate total messages:', error);
      setTotalMessages(0);
    } finally {
      setIsCalculating(false);
    }
  };

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
      let totalDeleted = 0;

      // Process each selected chat
      for (const chat of chats) {
        const result = await telegramClient.deleteMessages(chat.id, {
          timeRange: selectedTimeRange,
          startDate: customRange?.startDate,
          endDate: customRange?.endDate,
        });
        totalDeleted += result.deletedCount;
      }

      // Show success message
      setSuccessMessage(`Successfully deleted ${totalDeleted} messages!`);
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

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-telegram-blue px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Confirm Deletion</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Selected Chats Section */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Selected Chats ({chats.length})
          </Text>
          <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            {chats.map((chat, index) => (
              <View key={chat.id}>
                <View className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full bg-telegram-lightBlue items-center justify-center mr-3">
                    <Text className="text-lg">{chat.avatar || '💬'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
                      {chat.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {chat.messageCount} total messages
                    </Text>
                  </View>
                </View>
                {index < chats.length - 1 && (
                  <View className="h-px bg-gray-200 ml-13" />
                )}
              </View>
            ))}
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

        {/* Total Messages Estimate */}
        <View className="px-4 py-4 border-t border-gray-200">
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Estimated Messages to Delete
            </Text>
            <View className="flex-row items-center">
              {isCalculating ? (
                <>
                  <ActivityIndicator size="small" color="#0088cc" />
                  <Text className="ml-2 text-gray-600">Calculating...</Text>
                </>
              ) : (
                <Text className="text-2xl font-bold text-telegram-blue">
                  ~{totalMessages.toLocaleString()}
                </Text>
              )}
            </View>
            <Text className="text-sm text-gray-600 mt-2">
              {getTimeRangeDescription()}
            </Text>
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
      <View className="p-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          className={`py-4 rounded-lg ${isDeleting ? 'bg-red-300' : 'bg-red-500'}`}
          onPress={handleDeletePress}
          disabled={isDeleting || isCalculating}
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
        message={`Are you sure you want to delete approximately ${totalMessages.toLocaleString()} messages from ${chats.length} chat${chats.length > 1 ? 's' : ''}? This action cannot be undone.`}
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
