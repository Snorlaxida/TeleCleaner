import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { telegramClient } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { phoneNumber, phoneCodeHash } = useLocalSearchParams<{
    phoneNumber: string;
    phoneCodeHash: string;
  }>();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Handle paste operation (when text contains multiple characters)
    if (text.length > 1) {
      // Extract only digits from pasted text
      const digits = text.replace(/\D/g, '').slice(0, 5);
      
      if (digits.length > 0) {
        const newCode = [...code];
        
        // Fill all 5 inputs with the pasted digits
        for (let i = 0; i < 5; i++) {
          newCode[i] = digits[i] || '';
        }
        
        setCode(newCode);
        
        // Focus the last filled input or trigger verification
        if (digits.length === 5) {
          inputRefs.current[4]?.focus();
          verifyCode(digits);
        } else if (digits.length > 0) {
          inputRefs.current[Math.min(digits.length, 4)]?.focus();
        }
      }
      return;
    }

    // Handle single character input (normal typing)
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (index === 4 && text) {
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
      setErrorMessage('Missing phone number or code hash.');
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const result = await telegramClient.signIn(phoneNumber, phoneCodeHash, fullCode);
      
      // Check if 2FA is required
      if (result.requires2FA) {
        router.push({
          pathname: '/(auth)/password',
          params: { phoneNumber },
        });
      } else {
        router.replace('/(tabs)/chats');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('The verification code you entered is incorrect.');
      setShowErrorDialog(true);
      setCode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setShowSuccessDialog(true);
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

      {/* Error Dialog */}
      <ConfirmDialog
        visible={showErrorDialog}
        title="Invalid Code"
        message={errorMessage}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        confirmText="OK"
        cancelText=""
      />

      {/* Success Dialog */}
      <ConfirmDialog
        visible={showSuccessDialog}
        title="Code Sent"
        message="A new verification code has been sent to your phone."
        onClose={() => setShowSuccessDialog(false)}
        onConfirm={() => setShowSuccessDialog(false)}
        confirmText="OK"
        cancelText=""
      />
    </KeyboardAvoidingView>
  );
}
