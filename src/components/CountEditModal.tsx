import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from "react-native";

import { useStrings } from "../hooks/usePreferences";
import { digitsOnly, formatCount, parseCount } from "../lib/formatCount";
import { colors } from "../theme/colors";
import { AppText, fonts } from "./AppText";

type CountEditModalProps = {
  title: string;
  count: number;
  target: number;
  onSave: (value: number) => void;
  onClose: () => void;
};

/** Mount only while editing (keyed per entry) so the draft starts from the current count. */
export function CountEditModal({ title, count, target, onSave, onClose }: CountEditModalProps) {
  const t = useStrings();
  const [draft, setDraft] = useState(String(count));
  const parsed = parseCount(draft);
  const tooHigh = parsed != null && parsed > target;
  const canSave = parsed != null && !tooHigh;

  const save = () => {
    if (!canSave) return;
    onSave(parsed);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(18, 56, 34, 0.55)" }}
      >
        <Pressable className="absolute inset-0" onPress={onClose} accessible={false} />
        <View className="w-full max-w-sm rounded-3xl bg-ivory px-6 py-6" style={{ backgroundColor: colors.ivory }}>
          <AppText variant="arabic" weight="semibold" className="text-center text-base text-forest">
            {t.daily.editCount}
          </AppText>
          <AppText variant="serif" className="mt-1 text-center text-base text-forest/70" numberOfLines={2}>
            {title}
          </AppText>

          <TextInput
            value={draft}
            onChangeText={(text) => setDraft(digitsOnly(text))}
            keyboardType="number-pad"
            inputMode="numeric"
            autoFocus
            selectTextOnFocus
            maxLength={String(target).length}
            onSubmitEditing={save}
            returnKeyType="done"
            className={`mt-4 h-16 rounded-2xl border bg-cream text-center text-3xl ${
              tooHigh ? "border-red-700/60" : "border-forest/20"
            }`}
            style={{ color: colors.forest, fontFamily: fonts.sans.medium, fontVariant: ["tabular-nums"] }}
            accessibilityLabel={t.daily.editCount}
          />
          <AppText
            variant="arabic"
            className={`mt-2 text-center text-xs ${tooHigh ? "text-red-700" : "text-forest/50"}`}
            accessibilityLiveRegion="polite"
          >
            {tooHigh ? t.daily.countTooHigh(formatCount(target)) : t.zikr.ofTarget(formatCount(target))}
          </AppText>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-forest/15 active:opacity-70"
              accessibilityRole="button"
            >
              <AppText variant="arabic" className="text-base text-forest">
                {t.common.cancel}
              </AppText>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={!canSave}
              className={`min-h-12 flex-1 items-center justify-center rounded-2xl bg-forest ${
                canSave ? "active:opacity-80" : "opacity-40"
              }`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave }}
            >
              <AppText variant="arabic" weight="semibold" className="text-base text-ivory">
                {t.common.save}
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
