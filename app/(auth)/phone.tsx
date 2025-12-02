import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Integrate with Telegram API to send verification code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to verification screen
      router.push({
        pathname: '/(auth)/verify',
        params: { phoneNumber }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
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
            Your Phone
          </Text>
          <Text className="text-gray-600 text-base">
            Please confirm your country code and enter your phone number
          </Text>
        </View>

        {/* Phone Input */}
        <View className="mb-8">
          <View className="border-b border-telegram-blue pb-2">
            <TextInput
              className="text-lg text-gray-900"
              placeholder="+1 234 567 8900"
              placeholderTextColor="#8e8e93"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus
              editable={!isLoading}
            />
          </View>
          <Text className="text-gray-500 text-sm mt-2">
            We'll send you a code via Telegram
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-lg ${
            phoneNumber.length >= 10 && !isLoading
              ? 'bg-telegram-blue'
              : 'bg-gray-300'
          }`}
          onPress={handleSendCode}
          disabled={phoneNumber.length < 10 || isLoading}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {isLoading ? 'Sending...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <View className="mt-8">
          <Text className="text-gray-500 text-sm text-center leading-5">
            By continuing, you agree to receive a verification code via Telegram.
            Standard messaging rates may apply.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
