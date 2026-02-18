import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { telegramClient } from '@/lib/telegram';
import Constants from 'expo-constants';
import ConfirmDialog from '@/components/ConfirmDialog';
import SelectionModal from '@/components/SelectionModal';
import { useTheme, ThemeMode } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '@/lib/i18n';
import SubscriptionModal from '@/components/SubscriptionModal';
import SubscriptionManagementModal from '@/components/SubscriptionManagementModal';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { t, i18n } = useTranslation();
  const [userInfo, setUserInfo] = useState<{ phone?: string; username?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    subscription: {
      id: string;
      status: string;
      startDate: Date;
      endDate: Date;
      amount: number;
      telegramChargeId: string | null;
      telegramUserId: string | null;
      isRecurring: boolean;
    } | null;
  } | null>(null);

  // Get app version from package.json via expo-constants
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    loadUserInfo();
    loadSubscriptionStatus();
  }, []);

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      // Get user info from backend
      const session = await telegramClient.loadSession();
      if (session) {
        const info = await telegramClient.getMe();
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const status = await telegramClient.checkSubscription();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  };

  const handleSubscriptionPress = () => {
    if (subscriptionStatus?.hasActiveSubscription && subscriptionStatus.subscription) {
      // Show management panel if subscription is active
      setShowSubscriptionManagement(true);
    } else {
      // Show purchase modal if no subscription
      setShowSubscriptionModal(true);
    }
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    loadSubscriptionStatus(); // Reload subscription status
  };

  const getSubscriptionText = () => {
    if (!subscriptionStatus) return t('loading');
    if (subscriptionStatus.hasActiveSubscription && subscriptionStatus.subscription) {
      return t('subscriptionUntil', { 
        date: subscriptionStatus.subscription.endDate.toLocaleDateString() 
      });
    }
    return t('noSubscription');
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      // Clear session on both client and server
      await telegramClient.logout();
      router.replace('/(auth)/phone');
    } catch (error) {
      console.error('Logout error:', error);
      setErrorMessage(t('logoutError'));
      setShowErrorDialog(true);
      // Still redirect to login even on error
      setTimeout(() => {
        router.replace('/(auth)/phone');
      }, 2000);
    }
  };

  const handleThemeChange = (mode: string) => {
    setThemeMode(mode as ThemeMode);
  };

  const handleLanguageChange = async (lang: string) => {
    await saveLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'system': return t('themeSystem');
      case 'light': return t('themeLight');
      case 'dark': return t('themeDark');
      default: return t('themeSystem');
    }
  };

  const getLanguageLabel = () => {
    return i18n.language === 'ru' ? t('languageRussian') : t('languageEnglish');
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    onPress, 
    destructive = false 
  }: { 
    title: string; 
    subtitle?: string; 
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      className="px-4 py-4 border-b"
      style={{ 
        backgroundColor: colors.cardBackground,
        borderBottomColor: colors.border 
      }}
      onPress={onPress}
    >
      <Text 
        className="text-base font-semibold"
        style={{ color: destructive ? colors.destructive : colors.text }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm mt-1" style={{ color: colors.secondaryText }}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View 
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.secondaryText }}>
          {t('loadingSettings')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1"
      style={{ backgroundColor: colors.secondaryBackground }}
    >
      {/* Account Section */}
      <View className="mt-6">
        <Text 
          className="text-sm font-semibold px-4 mb-2"
          style={{ color: colors.secondaryText }}
        >
          {t('account')}
        </Text>
        <SettingItem
          title={t('phoneNumber')}
          subtitle={userInfo?.phone ? `+${userInfo.phone}` : t('notAvailable')}
          onPress={() => {}}
        />
        <SettingItem
          title={t('username')}
          subtitle={userInfo?.username ? `@${userInfo.username}` : t('noUsername')}
          onPress={() => {}}
        />
        <SettingItem
          title={t('subscriptionStatus')}
          subtitle={getSubscriptionText()}
          onPress={handleSubscriptionPress}
        />
      </View>

      {/* Appearance Section */}
      <View className="mt-6">
        <Text 
          className="text-sm font-semibold px-4 mb-2"
          style={{ color: colors.secondaryText }}
        >
          {t('appearance')}
        </Text>
        <SettingItem
          title={t('theme')}
          subtitle={getThemeLabel()}
          onPress={() => setShowThemeModal(true)}
        />
        <SettingItem
          title={t('language')}
          subtitle={getLanguageLabel()}
          onPress={() => setShowLanguageModal(true)}
        />
      </View>

      {/* About */}
      <View className="mt-6">
        <Text 
          className="text-sm font-semibold px-4 mb-2"
          style={{ color: colors.secondaryText }}
        >
          {t('about')}
        </Text>
        <SettingItem
          title={t('version')}
          subtitle={appVersion}
          onPress={() => {}}
        />
      </View>

      {/* Logout */}
      <View className="mt-6 mb-8">
        <SettingItem
          title={t('logout')}
          onPress={handleLogout}
          destructive
        />
      </View>

      {/* Footer */}
      <View className="items-center pb-8">
        <Text className="text-sm" style={{ color: colors.secondaryText }}>
          TeleCleaner v{appVersion}
        </Text>
        <Text className="text-xs mt-1" style={{ color: colors.secondaryText }}>
          {t('madeWithLove')}
        </Text>
      </View>

      {/* Theme Selection Modal */}
      <SelectionModal
        visible={showThemeModal}
        title={t('theme')}
        options={[
          { value: 'system', label: t('themeSystem') },
          { value: 'light', label: t('themeLight') },
          { value: 'dark', label: t('themeDark') },
        ]}
        selectedValue={themeMode}
        onSelect={handleThemeChange}
        onClose={() => setShowThemeModal(false)}
      />

      {/* Language Selection Modal */}
      <SelectionModal
        visible={showLanguageModal}
        title={t('language')}
        options={[
          { value: 'en', label: t('languageEnglish') },
          { value: 'ru', label: t('languageRussian') },
        ]}
        selectedValue={i18n.language}
        onSelect={handleLanguageChange}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title={t('logout')}
        message={t('areYouSureLogout')}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        confirmText={t('logout')}
        cancelText={t('cancel')}
        confirmDestructive
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

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={handleSubscriptionSuccess}
      />

      {/* Subscription Management Modal */}
      {subscriptionStatus?.subscription && (
        <SubscriptionManagementModal
          visible={showSubscriptionManagement}
          subscription={subscriptionStatus.subscription}
          onClose={() => setShowSubscriptionManagement(false)}
          onUpdated={() => {
            loadSubscriptionStatus();
            setShowSubscriptionManagement(false);
          }}
        />
      )}
    </ScrollView>
  );
}
