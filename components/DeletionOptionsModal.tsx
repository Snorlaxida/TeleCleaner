import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { DeletionOption } from '@/app/(tabs)/chats';

interface DeletionOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: DeletionOption) => void;
}

export default function DeletionOptionsModal({ 
  visible, 
  onClose, 
  onSelectOption 
}: DeletionOptionsModalProps) {
  const options: { value: DeletionOption; label: string; description: string }[] = [
    {
      value: 'last_day',
      label: 'Last 24 Hours',
      description: 'Delete messages from the last day'
    },
    {
      value: 'last_week',
      label: 'Last 7 Days',
      description: 'Delete messages from the last week'
    },
    {
      value: 'all',
      label: 'All Messages',
      description: 'Delete all your messages in selected chats'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-white rounded-t-3xl" onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View className="px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900 text-center">
              Select Time Range
            </Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              Choose which messages to delete
            </Text>
          </View>

          {/* Options */}
          <View className="px-4 py-2">
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                className={`py-4 px-4 ${
                  index < options.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={() => onSelectOption(option.value)}
              >
                <Text className="text-lg font-semibold text-gray-900 mb-1">
                  {option.label}
                </Text>
                <Text className="text-sm text-gray-500">
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <View className="px-4 pb-6 pt-2">
            <TouchableOpacity
              className="py-4 bg-gray-100 rounded-lg"
              onPress={onClose}
            >
              <Text className="text-center text-base font-semibold text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
