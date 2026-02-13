import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { telegramClient } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function TwoFactorAuthScreen() {
  const router = useRouter();
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
      setErrorMessage('Please enter your 2FA password');
      setShowErrorDialog(true);
      return;
    }

    if (!phoneNumber) {
      setErrorMessage('Missing phone number.');
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      await telegramClient.signInWith2FA(phoneNumber, password);
      router.replace('/(tabs)/chats');
    } catch (error) {
      console.error(error);
      setErrorMessage('The 2FA password you entered is incorrect. Please try again.');
      setShowErrorDialog(true);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar style="dark" />
      
      <View className="flex-1 px-6 pt-20">
        {/* Header */}
        <View className="mb-12">
          <Text className="text-4xl font-bold text-gray-900 mb-2">
            Two-Factor Authentication
          </Text>
          <Text className="text-gray-600 text-base mb-4">
            {phoneNumber}
          </Text>
          <Text className="text-gray-600 text-base">
            Your account has 2FA enabled. Please enter your password to continue.
          </Text>
        </View>

        {/* Password Input */}
        <View className="mb-8">
          <View className="border-b border-telegram-blue pb-2">
            <TextInput
              className="text-lg text-gray-900"
              placeholder="Enter your 2FA password"
              placeholderTextColor="#8e8e93"
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
            <Text className="text-telegram-blue text-sm">
              {showPassword ? 'Hide' : 'Show'} password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-lg ${
            password.length > 0 && !isLoading
              ? 'bg-telegram-blue'
              : 'bg-gray-300'
          }`}
          onPress={handleVerifyPassword}
          disabled={password.length === 0 || isLoading}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {isLoading ? 'Verifying...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <View className="mt-8 p-4 bg-blue-50 rounded-lg">
          <Text className="text-gray-700 text-sm leading-5">
            💡 This is the password you set up in Telegram's Privacy and Security settings, 
            not your phone's password.
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
          <Text className="text-telegram-blue text-center text-base">
            Go back
          </Text>
        </TouchableOpacity>
      </View>

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
    </KeyboardAvoidingView>
  );
}
