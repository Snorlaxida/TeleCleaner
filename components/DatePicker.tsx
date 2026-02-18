import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}

export default function DatePicker({ visible, onClose, onConfirm, initialDate }: DatePickerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      const initial = initialDate || new Date();
      setSelectedDate(initial);
      setCurrentMonth(initial);
    }
  }, [visible, initialDate]);

  // Generate calendar days for current month - always return 42 cells (6 weeks)
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Always fill to 42 cells (6 weeks)
    const totalCells = 42;
    while (days.length < totalCells) {
      days.push(null);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays(currentMonth);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  const previousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Don't allow going to past months
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prevMonth);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const monthNames = [
    t('january'), t('february'), t('march'), t('april'),
    t('may'), t('june'), t('july'), t('august'),
    t('september'), t('october'), t('november'), t('december')
  ];
  
  const dayNames = [
    t('sun'), t('mon'), t('tue'), t('wed'), 
    t('thu'), t('fri'), t('sat')
  ];

  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                         currentMonth.getFullYear() === today.getFullYear();
  const canGoPrevious = !isCurrentMonth;

  return (
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
          className="rounded-t-3xl pb-6" 
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
              {t('selectDate')}
            </Text>
          </View>

          {/* Selected Date Display */}
          <View 
            className="px-6 py-3"
            style={{ backgroundColor: colors.secondaryBackground }}
          >
            <Text 
              className="text-xs mb-1"
              style={{ color: colors.secondaryText }}
            >
              {t('selectedDate')}
            </Text>
            <Text 
              className="text-base font-semibold"
              style={{ color: colors.text }}
            >
              {selectedDate.toLocaleDateString()}
            </Text>
          </View>

          {/* Month Navigation */}
          <View className="px-6 py-4 flex-row justify-between items-center">
            <TouchableOpacity 
              onPress={previousMonth} 
              className="p-2"
              disabled={!canGoPrevious}
            >
              <Text 
                className="text-2xl" 
                style={{ color: canGoPrevious ? colors.primary : colors.border }}
              >
                ←
              </Text>
            </TouchableOpacity>
            <Text 
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} className="p-2">
              <Text className="text-2xl" style={{ color: colors.primary }}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          <View className="px-6">
            {/* Day names */}
            <View className="flex-row mb-2">
              {dayNames.map(day => (
                <View key={day} className="flex-1 items-center">
                  <Text 
                    className="text-xs font-semibold"
                    style={{ color: colors.secondaryText }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((date, index) => {
                const disabled = isDateDisabled(date);
                return (
                  <View key={index} className="w-[14.28%] aspect-square p-1">
                    {date ? (
                      <TouchableOpacity
                        onPress={() => !disabled && handleDateSelect(date)}
                        className="flex-1 items-center justify-center rounded-lg"
                        disabled={disabled}
                        style={{
                          backgroundColor: isDateSelected(date)
                            ? colors.primary
                            : 'transparent',
                          opacity: disabled ? 0.3 : 1
                        }}
                      >
                        <Text 
                          className="text-sm"
                          style={{
                            color: isDateSelected(date)
                              ? '#ffffff'
                              : colors.text,
                            fontWeight: isDateSelected(date) ? 'bold' : 'normal'
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="flex-1" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-6 pt-4 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 rounded-lg"
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
            <TouchableOpacity
              className="flex-1 py-3 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={handleConfirm}
            >
              <Text className="text-center text-base font-semibold text-white">
                {t('confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
