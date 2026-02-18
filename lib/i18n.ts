import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      loading: 'Loading...',
      cancel: 'Cancel',
      confirm: 'Confirm',
      ok: 'OK',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      
      // Auth screens
      phoneAuth: 'Phone Authentication',
      enterPhoneNumber: 'Enter your phone number',
      phoneNumberPlaceholder: '+1234567890',
      sendCode: 'Send Code',
      verifyCode: 'Verify Code',
      enterVerificationCode: 'Enter the verification code sent to your phone',
      verificationCodePlaceholder: 'Code',
      verify: 'Verify',
      enterPassword: 'Enter Password',
      twoFactorAuth: 'Two-Factor Authentication is enabled',
      passwordPlaceholder: 'Password',
      submit: 'Submit',
      
      // Tabs
      chats: 'Chats',
      timer: 'Timers',
      settings: 'Settings',
      
      // Chats screen
      loadingChats: 'Loading chats...',
      selectChats: 'Select all chats',
      noChatsAvailable: 'No chats available',
      selected: 'Selected',
      next: 'Next',
      selectAtLeastOneChat: 'Please select at least one chat',
      
      // Deletion options (old - can be removed if not used)
      deletionOptions: 'Deletion Options',
      selectDeletionOptions: 'Select deletion options for your messages',
      deleteFromBothSides: 'Delete for Both Sides',
      deleteOnlyMyMessages: 'Delete only messages sent by me',
      deleteOnlyFromMe: 'Delete only from my side',
      dateRange: 'Date Range',
      from: 'From',
      to: 'To',
      
      // Confirm deletion
      confirmDeletion: 'Confirm Deletion',
      selectedChats: 'Selected Chats',
      timePeriod: 'Time Period',
      aboutToDelete: 'You are about to delete messages from {{count}} chat(s)',
      aboutToDelete_plural: 'You are about to delete messages from {{count}} chat(s)',
      deletionSettings: 'Deletion Settings',
      allMessages: 'All Messages',
      onlyMyMessages: 'Only my messages',
      bothSides: 'For both sides',
      onlyMyAccount: 'Only from my account',
      dateRangeLabel: 'Date range',
      allTime: 'All time',
      thisMayTakeSomeTime: 'This operation may take some time',
      startDeletion: 'Start Deletion',
      deleting: 'Deleting...',
      deleteMessages: 'Delete Messages',
      deletedMessages: 'Deleted {{count}} message(s)',
      deletionComplete: 'Deletion complete!',
      deletionCompleteMessage: 'Messages successfully deleted from {{count}} chat(s)!',
      deletionError: 'Error during deletion',
      deletionErrorMessage: 'Failed to delete messages. Please try again.',
      deletionWarning: 'This action cannot be undone. Messages will be permanently deleted from Telegram.',
      timerDeletionWarning: 'All your existing messages in selected chats and all future messages will be automatically deleted.',
      deletionConfirmMessage: 'Are you sure you want to delete messages from {{count}} chat(s) for {{timeRange}}? This action cannot be undone.',
      yourMessages: 'Your messages',
      
      // Time periods
      last24Hours: 'Last 24 Hours',
      last7Days: 'Last 7 Days',
      customDateRange: 'Custom Date Range',
      customRange: 'Custom Range',
      
      // Date picker
      selectDateRange: 'Select Date Range',
      selectStartDate: 'Select start date',
      selectEndDate: 'Select end date',
      selectEndDateOrConfirm: 'Select end date or confirm for single date',
      startDate: 'Start Date',
      endDate: 'End Date',
      changeStartDate: '↻ Change Start Date',
      
      // Month names
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
      
      // Day names
      sun: 'Sun',
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      
      // Deletion options
      selectTimeRange: 'Select Time Range',
      chooseWhichMessages: 'Choose which messages to delete',
      deleteFromLastDay: 'Delete messages from the last day',
      deleteFromLastWeek: 'Delete messages from the last week',
      chooseSpecificDates: 'Choose specific start and end dates',
      deleteAllYourMessages: 'Delete all your messages in selected chats',
      success: 'Success',
      warning: 'Warning',
      
      // Settings screen
      loadingSettings: 'Loading settings...',
      account: 'ACCOUNT',
      phoneNumber: 'Phone Number',
      username: 'Username',
      notAvailable: 'Not available',
      noUsername: 'No username',
      appearance: 'APPEARANCE',
      theme: 'Theme',
      language: 'Language',
      about: 'ABOUT',
      version: 'Version',
      logout: 'Logout',
      areYouSureLogout: 'Are you sure you want to logout?',
      madeWithLove: 'Made with ❤️ for Telegram users',
      
      // Theme options
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      
      // Language options
      languageEnglish: 'English',
      languageRussian: 'Русский',
      
      // Subscription
      subscription: 'Subscription',
      subscriptionStatus: 'Subscription Status',
      subscriptionActive: 'Active',
      subscriptionExpired: 'Expired',
      noSubscription: 'No subscription',
      subscriptionUntil: 'Active until {{date}}',
      purchaseSubscription: 'Purchase Subscription',
      monthlySubscription: 'Monthly Subscription',
      subscriptionPrice: '{{amount}} Telegram Stars per month',
      subscriptionBenefits: 'With subscription you get access to:',
      benefitCustomDates: '• Delete messages by custom date range',
      benefitAllMessages: '• Delete all messages',
      benefitUnlimited: '• Unlimited access to all features',
      subscribeToContinue: 'Subscribe to continue',
      featureRequiresSubscription: 'This feature requires an active subscription',
      purchaseNow: 'Purchase Now',
      subscriptionError: 'Failed to process subscription',
      subscriptionSuccess: 'Subscription activated successfully!',
      autoRenew: 'Auto-renewal',
      autoRenewDescription: 'Your subscription will automatically renew each month',
      autoRenewIncluded: 'Auto-renewal included',
      autoRenewIncludedDescription: 'Your subscription will automatically renew each month. You can disable auto-renewal anytime in settings.',
      activeSubscription: 'Active Subscription',
      daysRemaining: 'days remaining',
      expiryDate: 'Expiry Date',
      price: 'Price',
      perMonth: 'per month',
      autoRenewalEnabled: 'Auto-renewal enabled',
      autoRenewalDisabled: 'Auto-renewal disabled',
      autoRenewalInfo: 'Your subscription will automatically renew on {{date}}',
      autoRenewalDisabledInfo: 'Your subscription will expire on {{date}}. Enable auto-renewal to continue using premium features.',
      cancelAutoRenewal: 'Cancel Auto-Renewal',
      enableAutoRenewal: 'Enable Auto-Renewal',
      cancelAutoRenewalNote: 'Your subscription will remain active until the end of the current period.',
      enableAutoRenewalNote: 'Your subscription will automatically renew each month.',
      cancelAutoRenewalConfirm: 'Are you sure you want to cancel auto-renewal? Your subscription will remain active until the end of the current period, but will not renew automatically.',
      enableAutoRenewalConfirm: 'Enable auto-renewal? Your subscription will automatically renew on {{date}} for {{amount}} Stars.',
      autoRenewalCancelled: 'Auto-renewal has been cancelled. Your subscription will remain active until expiry date.',
      autoRenewalEnabled: 'Auto-renewal has been enabled. Your subscription will automatically renew.',
      cancelAutoRenewalError: 'Failed to cancel auto-renewal. Please try again.',
      enableAutoRenewalError: 'Failed to enable auto-renewal. Please try again.',
      enableAutoRenewalNotSupported: 'This subscription does not support auto-renewal. Please purchase a new subscription with auto-renewal enabled.',
      close: 'Close',
      
      // Timer
      timers: 'Timers',
      addTimer: 'Add Timer',
      noTimers: 'No timers yet',
      noTimersDescription: 'Create automatic deletion timers for your chats',
      selectChatsForTimer: 'Select Chats for Timer',
      confirmTimerDeletion: 'Configure Timer',
      timerFrequency: 'Deletion Frequency',
      everyMinute: 'Every Minute (Test)',
      everyDay: 'Every Day',
      everyWeek: 'Every Week',
      everyMonth: 'Every Month',
      customDays: 'Custom (Days)',
      enterDays: 'Enter number of days',
      daysPlaceholder: 'e.g., 15',
      createTimer: 'Create Timer',
      editTimer: 'Edit Timer',
      updateTimer: 'Update Timer',
      startTime: 'Start Time',
      time: 'Time',
      firstRunDate: 'First Run Date',
      today: 'Today',
      tomorrow: 'Tomorrow',
      firstRunWillBe: 'First run will be',
      startsAt: 'Starts at',
      selectDate: 'Select Date',
      selectedDate: 'Selected Date',
      nextRunAt: 'Next run at',
      deleteTimer: 'Delete Timer',
      timerCreated: 'Timer created successfully!',
      timerUpdated: 'Timer updated successfully!',
      timerDeleted: 'Timer deleted successfully!',
      timerError: 'Error managing timer',
      chatsCount: '{{count}} Chat',
      deletesEvery: 'Deletes every {{frequency}}',
      minute: 'minute',
      day: 'day',
      days: '{{count}} day',
      week: 'week',
      month: 'month',
      months: 'months',
      confirmDeleteTimer: 'Are you sure you want to delete this timer?',
      timerDetails: 'Timer Details',
      
      // Errors
      error: 'Error',
      failedToLoadUserInfo: 'Failed to load user info',
      logoutError: 'Failed to logout properly, but local session was cleared.',
    }
  },
  ru: {
    translation: {
      // Common
      loading: 'Загрузка...',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      ok: 'ОК',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Изменить',
      search: 'Поиск',
      
      // Auth screens
      phoneAuth: 'Авторизация по телефону',
      enterPhoneNumber: 'Введите ваш номер телефона',
      phoneNumberPlaceholder: '+79001234567',
      sendCode: 'Отправить код',
      verifyCode: 'Проверка кода',
      enterVerificationCode: 'Введите код подтверждения, отправленный на ваш телефон',
      verificationCodePlaceholder: 'Код',
      verify: 'Проверить',
      enterPassword: 'Введите пароль',
      twoFactorAuth: 'Двухфакторная аутентификация включена',
      passwordPlaceholder: 'Пароль',
      submit: 'Отправить',
      
      // Tabs
      chats: 'Чаты',
      timer: 'Таймеры',
      settings: 'Настройки',
      
      // Chats screen
      loadingChats: 'Загрузка чатов...',
      selectChats: 'Все чаты',
      noChatsAvailable: 'Нет доступных чатов',
      selected: 'Выбрано',
      next: 'Далее',
      selectAtLeastOneChat: 'Пожалуйста, выберите хотя бы один чат',
      
      // Deletion options (old - can be removed if not used)
      deletionOptions: 'Параметры удаления',
      selectDeletionOptions: 'Выберите параметры удаления для ваших сообщений',
      deleteFromBothSides: 'Удалить с обеих сторон',
      deleteOnlyMyMessages: 'Удалить только мои сообщения',
      deleteOnlyFromMe: 'Удалить только у меня',
      dateRange: 'Диапазон дат',
      from: 'От',
      to: 'До',
      
      // Confirm deletion
      confirmDeletion: 'Подтверждение удаления',
      selectedChats: 'Выбранные чаты',
      timePeriod: 'Период времени',
      aboutToDelete: 'Вы собираетесь удалить сообщения из {{count}} чата',
      aboutToDelete_plural: 'Вы собираетесь удалить сообщения из {{count}} чатов',
      deletionSettings: 'Настройки удаления',
      allMessages: 'Все сообщения',
      onlyMyMessages: 'Только мои сообщения',
      bothSides: 'С обеих сторон',
      onlyMyAccount: 'Только у меня',
      dateRangeLabel: 'Диапазон дат',
      allTime: 'За всё время',
      thisMayTakeSomeTime: 'Эта операция может занять некоторое время',
      startDeletion: 'Начать удаление',
      deleting: 'Удаление...',
      deleteMessages: 'Удалить сообщения',
      deletedMessages: 'Удалено {{count}} сообщение',
      deletedMessages_plural: 'Удалено {{count}} сообщений',
      deletionComplete: 'Удаление завершено!',
      deletionCompleteMessage: 'Сообщения успешно удалены из {{count}} чата!',
      deletionCompleteMessage_plural: 'Сообщения успешно удалены из {{count}} чатов!',
      deletionError: 'Ошибка при удалении',
      deletionErrorMessage: 'Не удалось удалить сообщения. Пожалуйста, попробуйте снова.',
      deletionWarning: 'Это действие нельзя отменить. Сообщения будут удалены из Telegram навсегда.',
      timerDeletionWarning: 'Будут удалены все существующие ваши сообщения в выбранных чатах и все последующие.',
      deletionConfirmMessage: 'Вы уверены, что хотите удалить сообщения из {{count}} чата за {{timeRange}}? Это действие нельзя отменить.',
      deletionConfirmMessage_plural: 'Вы уверены, что хотите удалить сообщения из {{count}} чатов за {{timeRange}}? Это действие нельзя отменить.',
      yourMessages: 'Ваши сообщения',
      
      // Time periods
      last24Hours: 'Последние 24 часа',
      last7Days: 'Последние 7 дней',
      customDateRange: 'Выбрать период',
      customRange: 'Выбранный период',
      
      // Date picker
      selectDateRange: 'Выберите период',
      selectStartDate: 'Выберите начальную дату',
      selectEndDate: 'Выберите конечную дату',
      selectEndDateOrConfirm: 'Выберите конечную дату или подтвердите для одной даты',
      startDate: 'Начало',
      endDate: 'Конец',
      changeStartDate: '↻ Изменить начало',
      
      // Month names
      january: 'Январь',
      february: 'Февраль',
      march: 'Март',
      april: 'Апрель',
      may: 'Май',
      june: 'Июнь',
      july: 'Июль',
      august: 'Август',
      september: 'Сентябрь',
      october: 'Октябрь',
      november: 'Ноябрь',
      december: 'Декабрь',
      
      // Day names
      sun: 'Вс',
      mon: 'Пн',
      tue: 'Вт',
      wed: 'Ср',
      thu: 'Чт',
      fri: 'Пт',
      sat: 'Сб',
      
      // Deletion options
      selectTimeRange: 'Выберите период',
      chooseWhichMessages: 'Выберите какие сообщения удалить',
      deleteFromLastDay: 'Удалить сообщения за последний день',
      deleteFromLastWeek: 'Удалить сообщения за последнюю неделю',
      chooseSpecificDates: 'Выберите конкретные даты начала и конца',
      deleteAllYourMessages: 'Удалить все ваши сообщения в выбранных чатах',
      success: 'Успешно',
      warning: 'Внимание',
      
      // Settings screen
      loadingSettings: 'Загрузка настроек...',
      account: 'АККАУНТ',
      phoneNumber: 'Номер телефона',
      username: 'Имя пользователя',
      notAvailable: 'Недоступно',
      noUsername: 'Нет имени пользователя',
      appearance: 'ОФОРМЛЕНИЕ',
      theme: 'Тема',
      language: 'Язык',
      about: 'О ПРИЛОЖЕНИИ',
      version: 'Версия',
      logout: 'Выйти',
      areYouSureLogout: 'Вы уверены, что хотите выйти?',
      madeWithLove: 'Сделано с ❤️ для пользователей Telegram',
      
      // Theme options
      themeSystem: 'Системная',
      themeLight: 'Светлая',
      themeDark: 'Тёмная',
      
      // Language options
      languageEnglish: 'English',
      languageRussian: 'Русский',
      
      // Subscription
      subscription: 'Подписка',
      subscriptionStatus: 'Статус подписки',
      subscriptionActive: 'Активна',
      subscriptionExpired: 'Истекла',
      noSubscription: 'Нет подписки',
      subscriptionUntil: 'Активна до {{date}}',
      purchaseSubscription: 'Приобрести подписку',
      monthlySubscription: 'Месячная подписка',
      subscriptionPrice: '{{amount}} звёздочек Telegram в месяц',
      subscriptionBenefits: 'С подпиской вы получаете доступ к:',
      benefitCustomDates: '• Удаление сообщений по выбранным датам',
      benefitAllMessages: '• Удаление всех сообщений',
      benefitUnlimited: '• Неограниченный доступ ко всем функциям',
      subscribeToContinue: 'Подпишитесь, чтобы продолжить',
      featureRequiresSubscription: 'Для этой функции требуется активная подписка',
      purchaseNow: 'Купить сейчас',
      subscriptionError: 'Не удалось обработать подписку',
      subscriptionSuccess: 'Подписка успешно активирована!',
      autoRenew: 'Автопродление',
      autoRenewDescription: 'Подписка будет автоматически продлеваться каждый месяц',
      autoRenewIncluded: 'Автопродление включено',
      autoRenewIncludedDescription: 'Ваша подписка будет автоматически продлеваться каждый месяц. Вы можете отключить автопродление в любое время в настройках.',
      activeSubscription: 'Активная подписка',
      daysRemaining: 'дней осталось',
      expiryDate: 'Дата окончания',
      price: 'Цена',
      perMonth: 'в месяц',
      autoRenewalEnabled: 'Автопродление включено',
      autoRenewalDisabled: 'Автопродление отключено',
      autoRenewalInfo: 'Ваша подписка автоматически продлится {{date}}',
      autoRenewalDisabledInfo: 'Ваша подписка истечёт {{date}}. Включите автопродление чтобы продолжить использовать премиум функции.',
      cancelAutoRenewal: 'Отменить автопродление',
      enableAutoRenewal: 'Включить автопродление',
      cancelAutoRenewalNote: 'Ваша подписка останется активной до конца текущего периода.',
      enableAutoRenewalNote: 'Ваша подписка будет автоматически продлеваться каждый месяц.',
      cancelAutoRenewalConfirm: 'Вы уверены, что хотите отменить автопродление? Ваша подписка останется активной до конца текущего периода, но не будет автоматически продлеваться.',
      enableAutoRenewalConfirm: 'Включить автопродление? Ваша подписка автоматически продлится {{date}} за {{amount}} звёздочек.',
      autoRenewalCancelled: 'Автопродление отменено. Ваша подписка останется активной до даты окончания.',
      autoRenewalEnabled: 'Автопродление включено. Ваша подписка будет автоматически продлеваться.',
      cancelAutoRenewalError: 'Не удалось отменить автопродление. Попробуйте снова.',
      enableAutoRenewalError: 'Не удалось включить автопродление. Попробуйте снова.',
      enableAutoRenewalNotSupported: 'Эта подписка не поддерживает автопродление. Пожалуйста, купите новую подписку с включённым автопродлением.',
      close: 'Закрыть',
      
      // Timer
      timers: 'Таймеры',
      addTimer: 'Добавить таймер',
      noTimers: 'Нет таймеров',
      noTimersDescription: 'Создайте таймеры автоматического удаления для ваших чатов',
      selectChatsForTimer: 'Выберите чаты для таймера',
      confirmTimerDeletion: 'Настройка таймера',
      timerFrequency: 'Частота удаления',
      everyMinute: 'Каждую минуту (Тест)',
      everyDay: 'Каждый день',
      everyWeek: 'Каждую неделю',
      everyMonth: 'Каждый месяц',
      customDays: 'Свой период (в днях)',
      enterDays: 'Введите количество дней',
      daysPlaceholder: 'например, 15',
      createTimer: 'Создать таймер',
      editTimer: 'Редактировать таймер',
      updateTimer: 'Обновить таймер',
      startTime: 'Время запуска',
      time: 'Время',
      firstRunDate: 'Дата первого запуска',
      today: 'Сегодня',
      tomorrow: 'Завтра',
      firstRunWillBe: 'Первый запуск',
      startsAt: 'Запуск в',
      selectDate: 'Выберите дату',
      selectedDate: 'Выбранная дата',
      nextRunAt: 'Следующий запуск',
      deleteTimer: 'Удалить таймер',
      timerCreated: 'Таймер успешно создан!',
      timerUpdated: 'Таймер успешно обновлён!',
      timerDeleted: 'Таймер успешно удалён!',
      timerError: 'Ошибка управления таймером',
      chatsCount: '{{count}} Чат',
      deletesEvery: 'Удаляет каждый {{frequency}}',
      minute: 'минуту',
      day: 'день',
      days: '{{count}} день',
      week: 'неделю',
      month: 'месяц',
      months: 'месяцы',
      confirmDeleteTimer: 'Вы уверены, что хотите удалить этот таймер?',
      timerDetails: 'Детали таймера',
      
      // Errors
      error: 'Ошибка',
      failedToLoadUserInfo: 'Не удалось загрузить информацию о пользователе',
      logoutError: 'Не удалось выйти корректно, но локальная сессия была очищена.',
    }
  }
};

// Storage key for saving language preference
const LANGUAGE_STORAGE_KEY = '@app_language';

// Get saved language or detect system language
export const getInitialLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  
  // Default to system language
  const systemLanguage = Localization.getLocales()[0]?.languageCode || 'en';
  return systemLanguage === 'ru' ? 'ru' : 'en';
};

// Save language preference
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialize i18n - must be called before app renders
export const initI18n = async () => {
  const language = await getInitialLanguage();
  
  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: language,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        compatibilityJSON: 'v4',
      });
  }
  
  return i18n;
};

// Start initialization immediately
initI18n();

export default i18n;
