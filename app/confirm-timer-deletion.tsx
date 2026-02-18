import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmDialog from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { telegramClient } from '@/lib/telegram';
import { TimerFrequency } from '@/app/(tabs)/timer';

interface LightweightChat {
  id: string;
  name: string;
  avatar: string | null;
  photoId?: string;
}

export default function ConfirmTimerDeletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  
  // Check if we're in edit mode
  const editMode = params.editMode === 'true';
  const timerId = typeof params.timerId === 'string' ? params.timerId : undefined;
  
  // Parse selected chats from params
  const selectedChatsData: LightweightChat[] = typeof params.chatsData === 'string' 
    ? JSON.parse(params.chatsData) 
    : [];
  
  const [chats, setChats] = useState<LightweightChat[]>(selectedChatsData);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState<TimerFrequency>('daily');
  const [customDays, setCustomDays] = useState('');
  
  // Time selection
  const [startHour, setStartHour] = useState(0);
  const [startMinute, setStartMinute] = useState(0);
  const [hourText, setHourText] = useState('');
  const [minuteText, setMinuteText] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userTimezone, setUserTimezone] = useState('UTC');
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Handler для ввода дней - мемоизируем
  const handleCustomDaysChange = useCallback((text: string) => {
    // Оставляем только цифры
    const filtered = text.replace(/[^0-9]/g, '');
    setCustomDays(filtered);
  }, []);

  // Load cached avatars, timezone, and existing timer data on mount
  useEffect(() => {
    const loadCachedAvatars = async () => {
      try {
        const { avatarCache } = await import('@/lib/avatarCache');
        
        const updatedChats = await Promise.all(
          chats.map(async (chat) => {
            if (!chat.photoId) return chat;
            
            const cachedPhoto = await avatarCache.get(chat.id, chat.photoId, false).catch(() => null);
            
            if (cachedPhoto) {
              return { ...chat, avatar: cachedPhoto };
            }
            return chat;
          })
        );
        
        setChats(updatedChats);
        setLoadingAvatars(false);
      } catch (error) {
        console.error('[ConfirmTimerDeletion] Failed to load cached avatars:', error);
        setLoadingAvatars(false);
      }
    };
    
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setUserTimezone(timezone);
    
    // Set default start time to 1 hour from now
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultHour = oneHourLater.getHours();
    setStartHour(defaultHour);
    setStartMinute(0);
    setHourText(defaultHour.toString().padStart(2, '0'));
    setMinuteText('00');
    setSelectedStartDate(new Date()); // Today
    
    // Load existing timer data if in edit mode
    if (editMode && params.frequency) {
      setSelectedFrequency(params.frequency as TimerFrequency);
      if (params.customDays) {
        setCustomDays(params.customDays as string);
      }
    }
    
    loadCachedAvatars();
  }, []);

  const handleFrequencySelect = useCallback((frequency: TimerFrequency) => {
    setSelectedFrequency(frequency);
  }, []);

  // Мемоизируем опции частоты
  const frequencyOptions = useMemo(() => [
    { value: 'minutely' as TimerFrequency, label: t('everyMinute') },
    { value: 'daily' as TimerFrequency, label: t('everyDay') },
    { value: 'weekly' as TimerFrequency, label: t('everyWeek') },
    { value: 'monthly' as TimerFrequency, label: t('everyMonth') },
    { value: 'custom' as TimerFrequency, label: t('customDays') },
  ], [t]);

  const handleSaveTimer = async () => {
    // Validate custom days
    if (selectedFrequency === 'custom') {
      const days = parseInt(customDays);
      if (isNaN(days) || days < 1) {
        setErrorMessage(t('enterDays'));
        setShowErrorDialog(true);
        return;
      }
    }

    try {
      setIsSaving(true);

      const chatsData = chats.map(chat => ({
        id: chat.id,
        name: chat.name,
        type: 'private', // Default type, can be enhanced later
        photoId: chat.photoId,
      }));

      // Use selected start date
      const calculatedStartDate = selectedStartDate.toISOString();

      if (editMode && timerId) {
        // Update existing timer
        await telegramClient.updateTimer(timerId, {
          frequency: selectedFrequency,
          customDays: selectedFrequency === 'custom' ? parseInt(customDays) : undefined,
          startHour,
          startMinute,
          userTimezone,
          startDate: calculatedStartDate,
          chats: chatsData,
        });
        setSuccessMessage(t('timerUpdated'));
      } else {
        // Create new timer
        await telegramClient.createTimer(
          selectedFrequency,
          selectedFrequency === 'custom' ? parseInt(customDays) : undefined,
          chatsData,
          startHour,
          startMinute,
          userTimezone,
          calculatedStartDate
        );
        setSuccessMessage(t('timerCreated'));
      }
      
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to save timer:', error);
      setErrorMessage(t('timerError'));
      setShowErrorDialog(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    router.replace('/(tabs)/timer');
  };

  // Generate avatar based on chat
  const getDefaultAvatar = (chat: LightweightChat): string => {
    if (chat.avatar) return chat.avatar;
    return chat.name.charAt(0).toUpperCase() || '💬';
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('confirmTimerDeletion'),
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
        {/* Main scrollable content with all sections */}
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected Chats Header */}
          <View className="px-4 py-4">
            <Text 
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              {t('selectedChats')} ({chats.length})
            </Text>
          </View>

          {/* Chats List */}
          {chats.map((item, index) => {
            const avatar = getDefaultAvatar(item);
            const isBase64Image = avatar && avatar.startsWith('data:image');
            const isEmoji = !isBase64Image && /[\u{1F300}-\u{1F9FF}]/u.test(avatar);
            
            const isFirst = index === 0;
            const isLast = index === chats.length - 1;
            
            return (
              <View 
                key={item.id}
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
                    className="w-10 h-10 rounded-full items-center justify-center mr-3 overflow-hidden"
                    style={{ backgroundColor: isBase64Image ? 'transparent' : colors.primary }}
                  >
                    {isBase64Image ? (
                      <Image 
                        source={{ uri: avatar }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className={isEmoji ? "text-lg" : "text-base font-bold text-white"}>
                        {avatar}
                      </Text>
                    )}
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
          })}

          {/* Frequency Selection */}
          <View className="px-4 py-4 mt-4 border-t" style={{ borderTopColor: colors.border }}>
            <Text 
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              {t('timerFrequency')}
            </Text>
            <View className="space-y-2">
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className="p-4 rounded-lg border-2 mb-2"
                  style={{
                    borderColor: selectedFrequency === option.value ? colors.primary : colors.border,
                    backgroundColor: selectedFrequency === option.value 
                      ? colors.secondaryBackground 
                      : colors.cardBackground,
                  }}
                  onPress={() => handleFrequencySelect(option.value)}
                >
                  <View className="flex-row items-center justify-between">
                    <Text 
                      className="text-base font-medium"
                      style={{ 
                        color: selectedFrequency === option.value ? colors.primary : colors.text 
                      }}
                    >
                      {option.label}
                    </Text>
                    {selectedFrequency === option.value && (
                      <Text className="text-lg" style={{ color: colors.primary }}>✓</Text>
                    )}
                  </View>
                  
                  {/* Custom days input */}
                  {selectedFrequency === option.value && option.value === 'custom' && (
                    <View className="mt-3">
                      <TextInput
                        className="p-3 rounded-lg border text-base"
                        style={{ 
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        placeholder={t('daysPlaceholder')}
                        placeholderTextColor={colors.secondaryText}
                        value={customDays}
                        onChangeText={handleCustomDaysChange}
                        keyboardType="number-pad"
                        maxLength={3}
                        returnKeyType="done"
                        autoComplete="off"
                        autoCorrect={false}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Time Selection */}
          <View className="px-4 py-4 border-t" style={{ borderTopColor: colors.border }}>
            <Text 
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              🕐 {t('startTime')}
            </Text>
            
            {/* Time Picker - Compact */}
            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.secondaryText }}
              >
                {t('time')}
              </Text>
              <View className="flex-row items-center">
                <View className="w-20">
                  <TextInput
                    className="p-2 rounded-lg border text-lg text-center font-semibold"
                    style={{ 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                    placeholder="00"
                    placeholderTextColor={colors.secondaryText}
                    value={hourText}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, '');
                      setHourText(filtered);
                      
                      if (filtered === '') {
                        setStartHour(0);
                      } else {
                        const num = parseInt(filtered);
                        setStartHour(Math.min(23, Math.max(0, num)));
                      }
                    }}
                    onBlur={() => {
                      // Format on blur
                      setHourText(startHour.toString().padStart(2, '0'));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
                <Text className="text-2xl font-bold mx-2" style={{ color: colors.text }}>:</Text>
                <View className="w-20">
                  <TextInput
                    className="p-2 rounded-lg border text-lg text-center font-semibold"
                    style={{ 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                    placeholder="00"
                    placeholderTextColor={colors.secondaryText}
                    value={minuteText}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, '');
                      setMinuteText(filtered);
                      
                      if (filtered === '') {
                        setStartMinute(0);
                      } else {
                        const num = parseInt(filtered);
                        setStartMinute(Math.min(59, Math.max(0, num)));
                      }
                    }}
                    onBlur={() => {
                      // Format on blur
                      setMinuteText(startMinute.toString().padStart(2, '0'));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
              </View>
            </View>

            {/* Start Date Selection */}
            <View>
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.secondaryText }}
              >
                📅 {t('firstRunDate')}
              </Text>
              <TouchableOpacity
                className="p-4 rounded-lg border-2"
                style={{
                  borderColor: colors.primary,
                  backgroundColor: colors.secondaryBackground,
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <View className="flex-row items-center justify-between">
                  <Text 
                    className="text-base font-medium"
                    style={{ color: colors.text }}
                  >
                    {selectedStartDate.toLocaleDateString()}
                  </Text>
                  <Text className="text-xl" style={{ color: colors.primary }}>📅</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Next run preview */}
            <View 
              className="mt-4 p-3 rounded-lg border"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#1a3d3d' : '#f0f9ff',
                borderColor: colorScheme === 'dark' ? '#2d7272' : '#bfdbfe'
              }}
            >
              <Text 
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                ℹ️ {t('firstRunWillBe')}: {selectedStartDate.toLocaleDateString()}, {startHour.toString().padStart(2, '0')}:{startMinute.toString().padStart(2, '0')}
              </Text>
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
                {t('timerDeletionWarning')}
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <View 
            className="px-4 py-4"
            style={{ 
              backgroundColor: colors.background,
              paddingBottom: Platform.OS === 'android' ? Math.max(16, insets.bottom) : 16 
            }}
          >
            <TouchableOpacity
              className="py-4 rounded-lg"
              style={{ 
                backgroundColor: isSaving ? colors.border : colors.primary 
              }}
              onPress={handleSaveTimer}
              disabled={isSaving}
            >
              {isSaving ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-center text-lg font-semibold ml-2">
                    {t('loading')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center text-lg font-semibold">
                  {editMode ? t('updateTimer') : t('createTimer')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

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

        {/* Date Picker */}
        <DatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onConfirm={(date) => setSelectedStartDate(date)}
          initialDate={selectedStartDate}
        />
      </View>
    </>
  );
}
