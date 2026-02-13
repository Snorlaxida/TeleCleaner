import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { DeletionOption, CustomDateRange } from '@/app/(tabs)/chats';
import DateRangePicker from './DateRangePicker';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface DeletionOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: DeletionOption, customRange?: CustomDateRange) => void;
}

export default function DeletionOptionsModal({ 
  visible, 
  onClose, 
  onSelectOption 
}: DeletionOptionsModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Don't reset date picker when parent closes - it manages its own state
  const handleOptionSelect = (option: DeletionOption) => {
    if (option === 'custom') {
      // First close the parent modal
      onClose();
      // Then show date picker with a small delay to ensure parent is closed
      setTimeout(() => {
        setShowDatePicker(true);
      }, 200);
    } else {
      onSelectOption(option);
    }
  };

  const handleCustomDateConfirm = (range: CustomDateRange) => {
    setShowDatePicker(false);
    onSelectOption('custom', range);
  };

  const handleDatePickerClose = () => {
    setShowDatePicker(false);
  };

  const options: { value: DeletionOption; label: string; description: string }[] = [
    {
      value: 'last_day',
      label: t('last24Hours'),
      description: t('deleteFromLastDay')
    },
    {
      value: 'last_week',
      label: t('last7Days'),
      description: t('deleteFromLastWeek')
    },
    {
      value: 'custom',
      label: t('customDateRange'),
      description: t('chooseSpecificDates')
    },
    {
      value: 'all',
      label: t('allMessages'),
      description: t('deleteAllYourMessages')
    }
  ];

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        >
          <View 
            className="rounded-t-3xl" 
            style={{ backgroundColor: colors.cardBackground }}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View 
              className="px-6 py-4 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <Text 
                className="text-xl font-bold text-center"
                style={{ color: colors.text }}
              >
                {t('selectTimeRange')}
              </Text>
              <Text 
                className="text-sm text-center mt-1"
                style={{ color: colors.secondaryText }}
              >
                {t('chooseWhichMessages')}
              </Text>
            </View>

            {/* Options */}
            <View className="px-4 py-2">
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  className="py-4 px-4"
                  style={{
                    borderBottomWidth: index < options.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border
                  }}
                  onPress={() => handleOptionSelect(option.value)}
                >
                  <Text 
                    className="text-lg font-semibold mb-1"
                    style={{ color: colors.text }}
                  >
                    {option.label}
                  </Text>
                  <Text 
                    className="text-sm"
                    style={{ color: colors.secondaryText }}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel Button */}
            <View className="px-4 pb-6 pt-2">
              <TouchableOpacity
                className="py-4 rounded-lg"
                style={{ backgroundColor: colors.secondaryBackground }}
                onPress={onClose}
              >
                <Text 
                  className="text-center text-base font-semibold"
                  style={{ color: colors.text }}
                >
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Range Picker Modal - Rendered separately outside parent modal */}
      <DateRangePicker
        visible={showDatePicker}
        onClose={handleDatePickerClose}
        onConfirm={handleCustomDateConfirm}
      />
    </>
  );
}
