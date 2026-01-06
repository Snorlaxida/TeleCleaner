import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { telegramClient } from '@/lib/telegram';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { phoneNumber, phoneCodeHash } = useLocalSearchParams<{
    phoneNumber: string;
    phoneCodeHash: string;
  }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (index === 5 && text) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (fullCode: string) => {
    if (!phoneNumber || !phoneCodeHash) {
      Alert.alert('Error', 'Missing phone number or code hash.');
      return;
    }

    setIsLoading(true);

    try {
      await telegramClient.signIn(phoneNumber, phoneCodeHash, fullCode);
      router.replace('/(tabs)/chats');
    } catch (error) {
      console.error(error);
      Alert.alert('Invalid Code', 'The verification code you entered is incorrect.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
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
            {phoneNumber}
          </Text>
          <Text className="text-gray-600 text-base">
            We've sent you a code via Telegram
          </Text>
        </View>

        {/* Code Input */}
        <View className="flex-row justify-between mb-8">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              className="w-12 h-14 border-2 border-telegram-blue rounded-lg text-center text-2xl font-bold"
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              editable={!isLoading}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Resend Code */}
        <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
          <Text className="text-telegram-blue text-center text-base">
            Didn't receive the code? Resend
          </Text>
        </TouchableOpacity>

        {/* Loading Indicator */}
        {isLoading && (
          <View className="mt-8">
            <Text className="text-gray-500 text-center">Verifying...</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
