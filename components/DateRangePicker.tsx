import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { CustomDateRange } from '@/app/(tabs)/chats';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (range: CustomDateRange) => void;
}

export default function DateRangePicker({ visible, onClose, onConfirm }: DateRangePickerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
      setSelectingStart(true);
    }
  }, [visible]);

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
    
    // Always fill to 42 cells (6 weeks) to prevent calendar height from jumping
    const totalCells = 42;
    while (days.length < totalCells) {
      days.push(null);
    }
    
    return days;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarDays = generateCalendarDays(currentMonth);

  const handleDateSelect = (date: Date) => {
    if (selectingStart) {
      setStartDate(date);
      setEndDate(date); // Set end date same as start initially
      setSelectingStart(false);
    } else {
      if (date < startDate) {
        // If end date is before start, swap them
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const resetSelection = () => {
    setSelectingStart(true);
  };

  const handleConfirm = () => {
    onConfirm({ startDate, endDate });
    onClose(); // Explicitly close the modal
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateInRange = (date: Date | null) => {
    if (!date) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === startDate.toDateString() || 
           date.toDateString() === endDate.toDateString();
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

  const isSingleDate = startDate.toDateString() === endDate.toDateString();

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
              {t('selectDateRange')}
            </Text>
            <Text 
              className="text-sm text-center mt-1"
              style={{ color: colors.secondaryText }}
            >
              {selectingStart 
                ? t('selectStartDate') 
                : isSingleDate 
                  ? t('selectEndDateOrConfirm')
                  : t('selectEndDate')
              }
            </Text>
          </View>

          {/* Selected Range Display */}
          <View 
            className="px-6 py-3"
            style={{ backgroundColor: colors.secondaryBackground }}
          >
            <View className="flex-row justify-between mb-2">
              <View className="flex-1">
                <Text 
                  className="text-xs mb-1"
                  style={{ color: colors.secondaryText }}
                >
                  {t('startDate')}
                </Text>
                <Text 
                  className="text-base font-semibold"
                  style={{ color: colors.text }}
                >
                  {startDate.toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-1">
                <Text 
                  className="text-xs mb-1"
                  style={{ color: colors.secondaryText }}
                >
                  {t('endDate')}
                </Text>
                <Text 
                  className="text-base font-semibold"
                  style={{ color: colors.text }}
                >
                  {endDate.toLocaleDateString()}
                </Text>
              </View>
            </View>
            {!selectingStart && (
              <TouchableOpacity 
                onPress={resetSelection}
                className="py-2 px-3 rounded-lg"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <Text 
                  className="text-center text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  {t('changeStartDate')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Month Navigation */}
          <View className="px-6 py-4 flex-row justify-between items-center">
            <TouchableOpacity onPress={previousMonth} className="p-2">
              <Text className="text-2xl" style={{ color: colors.primary }}>←</Text>
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
              {calendarDays.map((date, index) => (
                <View key={index} className="w-[14.28%] aspect-square p-1">
                  {date ? (
                    <TouchableOpacity
                      onPress={() => handleDateSelect(date)}
                      className="flex-1 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: isDateSelected(date)
                          ? colors.primary
                          : isDateInRange(date)
                          ? colors.secondaryBackground
                          : 'transparent'
                      }}
                    >
                      <Text 
                        className="text-sm"
                        style={{
                          color: isDateSelected(date)
                            ? '#ffffff'
                            : isDateInRange(date)
                            ? colors.primary
                            : colors.text,
                          fontWeight: isDateSelected(date) ? 'bold' : isDateInRange(date) ? '600' : 'normal'
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-1" />
                  )}
                </View>
              ))}
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
