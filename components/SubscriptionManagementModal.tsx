import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { telegramClient } from '@/lib/telegram';
import ConfirmDialog from '@/components/ConfirmDialog';

interface SubscriptionManagementModalProps {
  visible: boolean;
  subscription: {
    id: string;
    status: string;
    startDate: Date;
    endDate: Date;
    amount: number;
    telegramChargeId: string | null;
    telegramUserId: string | null;
    isRecurring: boolean;
  };
  onClose: () => void;
  onUpdated: () => void;
}

export default function SubscriptionManagementModal({
  visible,
  subscription,
  onClose,
  onUpdated,
}: SubscriptionManagementModalProps) {
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysRemaining = Math.ceil(
    (subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleToggleAutoRenewal = () => {
    console.log('[SubscriptionManagement] Toggle button pressed, isRecurring:', subscription.isRecurring);
    setShowConfirmDialog(true);
  };

  const confirmToggleAutoRenewal = async () => {
    console.log('[SubscriptionManagement] Confirm pressed, calling API...');
    setShowConfirmDialog(false);
    
    try {
      setIsLoading(true);
      
      if (subscription.isRecurring) {
        // Cancel auto-renewal
        console.log('[SubscriptionManagement] Calling cancelSubscriptionAutoRenewal...');
        await telegramClient.cancelSubscriptionAutoRenewal();
      } else {
        // Enable auto-renewal
        console.log('[SubscriptionManagement] Calling enableSubscriptionAutoRenewal...');
        await telegramClient.enableSubscriptionAutoRenewal();
      }
      
      console.log('[SubscriptionManagement] API call successful');
      setIsLoading(false);
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('[SubscriptionManagement] Failed to toggle auto-renewal:', error);
      setIsLoading(false);
      
      // Check if error message indicates subscription doesn't support recurring
      const errorMsg = error?.message || error?.toString() || '';
      if (errorMsg.includes('does not support auto-renewal') || errorMsg.includes('не поддерживает автопродление')) {
        setErrorMessage(t('enableAutoRenewalNotSupported'));
      } else {
        setErrorMessage(subscription.isRecurring ? t('cancelAutoRenewalError') : t('enableAutoRenewalError'));
      }
      
      setShowErrorDialog(true);
    }
  };

  const handleSuccess = () => {
    setShowSuccessDialog(false);
    onUpdated();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <View className="p-6">
            {/* Header */}
            <Text
              className="text-xl font-bold mb-1"
              style={{ color: colors.text }}
            >
              {t('subscriptionStatus')}
            </Text>
            <Text
              className="text-sm mb-4"
              style={{ color: colors.secondaryText }}
            >
              {t('activeSubscription')}
            </Text>

            {/* Subscription Info Card */}
            <View
              className="p-4 rounded-2xl mb-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              {/* Status Badge */}
              <View className="flex-row items-center mb-3">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colorScheme === 'dark' ? '#1a4d1a' : '#d1fad1' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colorScheme === 'dark' ? '#4ade80' : '#16a34a' }}
                  >
                    ✓ {t('subscriptionActive')}
                  </Text>
                </View>
              </View>

              {/* Days Remaining */}
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
                {daysRemaining} {t('daysRemaining')}
              </Text>

              {/* Dates */}
              <View className="mt-3 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm" style={{ color: colors.secondaryText }}>
                    {t('startDate')}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {formatDate(subscription.startDate)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm" style={{ color: colors.secondaryText }}>
                    {t('expiryDate')}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {formatDate(subscription.endDate)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm" style={{ color: colors.secondaryText }}>
                    {t('price')}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {subscription.amount} ⭐ / {t('month')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Auto-renewal Info/Warning */}
            {subscription.isRecurring ? (
              <View
                className="p-3 rounded-xl mb-4"
                style={{
                  backgroundColor: colorScheme === 'dark' ? '#1a3a1a' : '#f0f9f0',
                }}
              >
                <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
                  🔄 {t('autoRenewalEnabled')}
                </Text>
                <Text className="text-xs" style={{ color: colors.secondaryText }}>
                  {t('autoRenewalInfo', { date: formatDate(subscription.endDate) })}
                </Text>
              </View>
            ) : (
              <View
                className="p-3 rounded-xl mb-4"
                style={{
                  backgroundColor: colorScheme === 'dark' ? '#3a2a1a' : '#fff9f0',
                }}
              >
                <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
                  ⏸️ {t('autoRenewalDisabled')}
                </Text>
                <Text className="text-xs" style={{ color: colors.secondaryText }}>
                  {t('autoRenewalDisabledInfo', { date: formatDate(subscription.endDate) })}
                </Text>
              </View>
            )}

            {/* Actions */}
            <TouchableOpacity
              className="py-4 rounded-xl items-center mb-2"
              style={{
                backgroundColor: isLoading
                  ? (colorScheme === 'dark' ? '#5a5a5a' : '#ddd')
                  : subscription.isRecurring
                  ? colors.destructive
                  : colors.primary,
              }}
              onPress={handleToggleAutoRenewal}
              disabled={isLoading}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-base font-semibold ml-2">
                    {t('loading')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-semibold">
                  {subscription.isRecurring ? t('cancelAutoRenewal') : t('enableAutoRenewal')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Note */}
            <Text
              className="text-xs text-center mb-4"
              style={{ color: colors.secondaryText }}
            >
              {subscription.isRecurring 
                ? t('cancelAutoRenewalNote')
                : t('enableAutoRenewalNote')
              }
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.secondaryBackground }}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.text }}
              >
                {t('close')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={showConfirmDialog}
        title={subscription.isRecurring ? t('cancelAutoRenewal') : t('enableAutoRenewal')}
        message={
          subscription.isRecurring 
            ? t('cancelAutoRenewalConfirm')
            : t('enableAutoRenewalConfirm', { 
                date: formatDate(subscription.endDate),
                amount: subscription.amount 
              })
        }
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmToggleAutoRenewal}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
        confirmDestructive={subscription.isRecurring}
      />

      {/* Success Dialog */}
      <ConfirmDialog
        visible={showSuccessDialog}
        title={t('success')}
        message={subscription.isRecurring ? t('autoRenewalCancelled') : t('autoRenewalEnabled')}
        onClose={handleSuccess}
        onConfirm={handleSuccess}
        confirmText={t('ok')}
        cancelText=""
      />

      {/* Error Dialog */}
      <ConfirmDialog
        visible={showErrorDialog}
        title={t('error')}
        message={errorMessage}
        onClose={() => {
          setShowErrorDialog(false);
          setErrorMessage('');
        }}
        onConfirm={() => {
          setShowErrorDialog(false);
          setErrorMessage('');
        }}
        confirmText={t('ok')}
        cancelText=""
      />
    </Modal>
  );
}
