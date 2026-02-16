import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { telegramClient } from '@/lib/telegram';

// Get Telegram WebApp instance
const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;
  // Try multiple sources
  return (window as any).__TELEGRAM_WEB_APP__ || 
         (window as any).Telegram?.WebApp ||
         null;
};

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionModal({ visible, onClose, onSuccess }: SubscriptionModalProps) {
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);

  // Check if running in Telegram Mini App
  useEffect(() => {
    const WebApp = getTelegramWebApp();
    const isInTelegram = WebApp && 
                        WebApp.initData && 
                        WebApp.initData.length > 0 &&
                        typeof WebApp.openInvoice === 'function';
    
    setIsTelegramMiniApp(!!isInTelegram);
    console.log('[SubscriptionModal] Environment check:', {
      hasTelegramObject: !!WebApp,
      hasInitData: !!(WebApp?.initData),
      initDataLength: WebApp?.initData?.length || 0,
      hasOpenInvoice: typeof WebApp?.openInvoice === 'function',
      isTelegramMiniApp: !!isInTelegram,
    });
  }, []);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create invoice
      const invoice = await telegramClient.createSubscriptionInvoice();
      console.log('[SubscriptionModal] Invoice created:', invoice);

      const WebApp = getTelegramWebApp();

      // TEST MODE: For development/testing outside Telegram
      if (!isTelegramMiniApp) {
        console.warn('[SubscriptionModal] Not in Telegram Mini App, using test mode');
        
        const simulatePayment = confirm(
          `🧪 TEST MODE\n\nSimulate payment of ${invoice.amount} Telegram Stars?\n\n⚠️ This is for testing only.`
        );
        
        if (simulatePayment) {
          try {
            await telegramClient.processSuccessfulPayment(
              invoice.invoiceId,
              'test_charge_' + Date.now(),
              invoice.amount
            );
            
            alert('✅ Test payment successful! Subscription activated.');
            setIsLoading(false);
            onSuccess();
          } catch (error) {
            console.error('Failed to process test payment:', error);
            setError(t('subscriptionError'));
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
        return;
      }

      // PRODUCTION MODE: Open real Telegram Stars invoice
      console.log('[SubscriptionModal] Opening Telegram Stars invoice...');
      
      if (!WebApp || typeof WebApp.openInvoice !== 'function') {
        throw new Error('Telegram WebApp openInvoice not available');
      }

      WebApp.openInvoice(invoice.invoiceId, async (status: string) => {
        console.log('[SubscriptionModal] Payment status:', status);
        
        if (status === 'paid') {
          try {
            await telegramClient.processSuccessfulPayment(
              invoice.invoiceId,
              'charge_' + Date.now(),
              invoice.amount
            );
            
            console.log('[SubscriptionModal] Payment processed successfully');
            setIsLoading(false);
            onSuccess();
          } catch (error) {
            console.error('Failed to process payment:', error);
            setError(t('subscriptionError'));
            setIsLoading(false);
          }
        } else if (status === 'cancelled') {
          console.log('[SubscriptionModal] Payment cancelled by user');
          setIsLoading(false);
        } else if (status === 'failed') {
          console.error('[SubscriptionModal] Payment failed');
          setError(t('subscriptionError'));
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setError(t('subscriptionError'));
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="rounded-t-3xl p-6 pb-8"
          style={{ backgroundColor: colors.background }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {t('monthlySubscription')}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Text className="text-2xl" style={{ color: colors.secondaryText }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: colors.secondaryBackground }}
          >
            <Text className="text-lg font-semibold text-center" style={{ color: colors.primary }}>
              {t('subscriptionPrice', { amount: 50 })}
            </Text>
          </View>

          {/* Benefits */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              {t('subscriptionBenefits')}
            </Text>
            <Text className="text-base mb-2" style={{ color: colors.text }}>
              {t('benefitCustomDates')}
            </Text>
            <Text className="text-base mb-2" style={{ color: colors.text }}>
              {t('benefitAllMessages')}
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              {t('benefitUnlimited')}
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <View
              className="p-3 rounded-lg mb-4"
              style={{
                backgroundColor: colorScheme === 'dark' ? '#3d1a1a' : '#fef2f2',
              }}
            >
              <Text style={{ color: colors.destructive }}>{error}</Text>
            </View>
          )}

          {/* Purchase button */}
          <TouchableOpacity
            className="py-4 rounded-lg"
            style={{
              backgroundColor: isLoading
                ? (colorScheme === 'dark' ? '#1e3a8a' : '#93c5fd')
                : colors.primary,
            }}
            onPress={handlePurchase}
            disabled={isLoading}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white text-center text-lg font-semibold ml-2">
                  {t('loading')}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                {t('purchaseNow')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            className="py-4 mt-2"
            onPress={onClose}
            disabled={isLoading}
          >
            <Text className="text-center text-base" style={{ color: colors.secondaryText }}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
