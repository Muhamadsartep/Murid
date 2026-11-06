import { Modal, Pressable, View } from "react-native";

import { useStrings } from "../hooks/usePreferences";
import { colors } from "../theme/colors";
import { AppText } from "./AppText";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useStrings();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(18, 56, 34, 0.72)" }}>
        <Pressable className="absolute inset-0" onPress={onCancel} accessible={false} />
        <View className="w-full max-w-sm rounded-3xl bg-cream px-6 py-6" style={{ backgroundColor: colors.cream }}>
          <AppText variant="arabic" className="text-center text-2xl text-forest">
            {title}
          </AppText>
          <AppText className="mt-3 text-center text-base leading-6 text-forest/80">{message}</AppText>
          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-forest/20"
              accessibilityRole="button"
            >
              <AppText variant="arabic" className="text-base text-forest">
                {t.common.cancel}
              </AppText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-forest"
              accessibilityRole="button"
            >
              <AppText className="text-base text-gold">{confirmLabel ?? t.common.reset}</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
