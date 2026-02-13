import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/lib/theme';

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
  const { colors } = useTheme();
  
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
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View 
          className="rounded-2xl w-full max-w-sm" 
          style={{ backgroundColor: colors.cardBackground }}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <Text 
              className="text-xl font-bold text-center mb-3"
              style={{ color: colors.text }}
            >
              {title}
            </Text>
            <Text 
              className="text-base text-center"
              style={{ color: colors.secondaryText }}
            >
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View className="border-t" style={{ borderTopColor: colors.border }}>
            {cancelText ? (
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 py-4 border-r"
                  style={{ borderRightColor: colors.border }}
                  onPress={onClose}
                >
                  <Text 
                    className="text-center text-base font-semibold"
                    style={{ color: colors.text }}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-4"
                  onPress={handleConfirm}
                >
                  <Text 
                    className="text-center text-base font-semibold"
                    style={{ color: confirmDestructive ? colors.destructive : colors.primary }}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="py-4"
                onPress={handleConfirm}
              >
                <Text 
                  className="text-center text-base font-semibold"
                  style={{ color: confirmDestructive ? colors.destructive : colors.primary }}
                >
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
