import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface SelectionOption {
  value: string;
  label: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function SelectionModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectionModalProps) {
  const { colors, colorScheme } = useTheme();
  const { t } = useTranslation();

  const handleSelect = (value: string) => {
    onSelect(value);
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
            <Text
              className="text-xl font-bold mb-4"
              style={{ color: colors.text }}
            >
              {title}
            </Text>
            
            <ScrollView className="max-h-96">
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className="py-4 border-b"
                  style={{ borderBottomColor: colors.border }}
                  onPress={() => handleSelect(option.value)}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base"
                      style={{ 
                        color: selectedValue === option.value ? colors.primary : colors.text,
                        fontWeight: selectedValue === option.value ? '600' : '400'
                      }}
                    >
                      {option.label}
                    </Text>
                    {selectedValue === option.value && (
                      <Text
                        className="text-lg font-bold"
                        style={{ color: colors.primary }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              className="mt-4 py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.secondaryBackground }}
              onPress={onClose}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.text }}
              >
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
