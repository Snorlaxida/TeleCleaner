import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmDestructive = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl w-full max-w-sm" onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-xl font-bold text-gray-900 text-center mb-3">
              {title}
            </Text>
            <Text className="text-base text-gray-600 text-center">
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View className="border-t border-gray-200">
            {cancelText ? (
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 py-4 border-r border-gray-200"
                  onPress={onClose}
                >
                  <Text className="text-center text-base font-semibold text-gray-700">
                    {cancelText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-4"
                  onPress={handleConfirm}
                >
                  <Text className={`text-center text-base font-semibold ${
                    confirmDestructive ? 'text-red-500' : 'text-telegram-blue'
                  }`}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="py-4"
                onPress={handleConfirm}
              >
                <Text className={`text-center text-base font-semibold ${
                  confirmDestructive ? 'text-red-500' : 'text-telegram-blue'
                }`}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
