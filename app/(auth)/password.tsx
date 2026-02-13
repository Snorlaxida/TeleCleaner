import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { telegramClient } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

export default function TwoFactorAuthScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  const { phoneNumber, phoneCodeHash } = useLocalSearchParams<{
    phoneNumber: string;
    phoneCodeHash?: string;
  }>();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerifyPassword = async () => {
    if (!password) {
      setErrorMessage(t('enterPassword'));
      setShowErrorDialog(true);
      return;
    }

    if (!phoneNumber) {
      setErrorMessage(t('error'));
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      await telegramClient.signInWith2FA(phoneNumber, password);
      router.replace('/(tabs)/chats');
    } catch (error) {
      console.error(error);
      setErrorMessage(t('error'));
      setShowErrorDialog(true);
      setPassword('');
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
            {t('twoFactorAuth')}
          </Text>
          <Text 
            className="text-base mb-4"
            style={{ color: colors.secondaryText }}
          >
            {phoneNumber}
          </Text>
          <Text 
            className="text-base"
            style={{ color: colors.secondaryText }}
          >
            {t('enterPassword')}
          </Text>
        </View>

        {/* Password Input */}
        <View className="mb-8">
          <View 
            className="border-b pb-2"
            style={{ borderBottomColor: colors.primary }}
          >
            <TextInput
              className="text-lg"
              style={{ color: colors.text }}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor={colors.secondaryText}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoFocus
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleVerifyPassword}
            />
          </View>
          
          {/* Show/Hide Password Toggle */}
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            className="mt-3"
          >
            <Text 
              className="text-sm"
              style={{ color: colors.primary }}
            >
              {showPassword ? t('cancel') : t('edit')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className="py-4 rounded-lg"
          style={{
            backgroundColor: password.length > 0 && !isLoading
              ? colors.primary
              : colors.border
          }}
          onPress={handleVerifyPassword}
          disabled={password.length === 0 || isLoading}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {isLoading ? t('loading') : t('submit')}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <View 
          className="mt-8 p-4 rounded-lg"
          style={{ backgroundColor: colors.secondaryBackground }}
        >
          <Text 
            className="text-sm leading-5"
            style={{ color: colors.secondaryText }}
          >
            💡 {t('twoFactorAuth')}
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            // If we have phoneCodeHash, go back to verify screen
            // Otherwise, go back to phone screen to start over
            if (phoneCodeHash && phoneNumber) {
              router.replace({
                pathname: '/(auth)/verify',
                params: { phoneNumber, phoneCodeHash },
              });
            } else {
              router.replace('/(auth)/phone');
            }
          }}
          className="mt-6"
          disabled={isLoading}
        >
          <Text 
            className="text-center text-base"
            style={{ color: colors.primary }}
          >
            {t('cancel')}
          </Text>
        </TouchableOpacity>
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
