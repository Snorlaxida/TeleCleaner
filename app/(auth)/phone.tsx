import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { telegramClient } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage(t('enterPhoneNumber'));
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const { phoneCodeHash } = await telegramClient.sendCode(phoneNumber);

      router.push({
        pathname: '/(auth)/verify',
        params: { phoneNumber, phoneCodeHash },
      });
    } catch (error) {
      console.error(error);
      setErrorMessage(t('error'));
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View className="flex-1 px-6 pt-20">
        {/* Header */}
        <View className="mb-12">
          <Text 
            className="text-4xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {t('phoneAuth')}
          </Text>
          <Text 
            className="text-base"
            style={{ color: colors.secondaryText }}
          >
            {t('enterPhoneNumber')}
          </Text>
        </View>

        {/* Phone Input */}
        <View className="mb-8">
          <View 
            className="border-b pb-2"
            style={{ borderBottomColor: colors.primary }}
          >
            <TextInput
              className="text-lg"
              style={{ color: colors.text }}
              placeholder={t('phoneNumberPlaceholder')}
              placeholderTextColor={colors.secondaryText}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus
              editable={!isLoading}
            />
          </View>
          <Text 
            className="text-sm mt-2"
            style={{ color: colors.secondaryText }}
          >
            {t('enterVerificationCode')}
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className="py-4 rounded-lg"
          style={{
            backgroundColor: phoneNumber.length >= 10 && !isLoading
              ? colors.primary
              : colors.border
          }}
          onPress={handleSendCode}
          disabled={phoneNumber.length < 10 || isLoading}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {isLoading ? t('loading') : t('sendCode')}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <View className="mt-8">
          <Text 
            className="text-sm text-center leading-5"
            style={{ color: colors.secondaryText }}
          >
            {t('enterVerificationCode')}
          </Text>
        </View>
      </View>

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
    </KeyboardAvoidingView>
  );
}
