import Ionicons from "@expo/vector-icons/Ionicons";
import { type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AppText } from "../components/AppText";
import { useFloatingTabBarInset } from "../components/FloatingTabBar";
import { Screen } from "../components/Screen";
import {
  ARABIC_SCALE_MAX,
  ARABIC_SCALE_MIN,
  useArabicText,
  usePreferences,
} from "../hooks/usePreferences";
import { toKurdishDigits } from "../lib/dates";
import { hapticTap } from "../lib/haptics";
import type { Language } from "../lib/i18n";
import { colors } from "../theme/colors";

const PREVIEW_TEXT = "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ";

const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: "ku", label: "کوردی" },
  { id: "ar", label: "العربية" },
];

export function SettingsScreen() {
  const bottomInset = useFloatingTabBarInset();
  const { t, language, setLanguage, arabicScale, stepArabicScale } = usePreferences();
  const arabic = useArabicText();

  const canShrink = arabicScale > ARABIC_SCALE_MIN + 0.001;
  const canGrow = arabicScale < ARABIC_SCALE_MAX - 0.001;
  const step = (direction: 1 | -1) => {
    hapticTap("light");
    stepArabicScale(direction);
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-6 items-end">
          <AppText variant="arabic" weight="bold" className="text-3xl text-forest">
            {t.settings.title}
          </AppText>
        </View>

        <Section title={t.settings.display}>
          <AppText variant="arabic" className="text-right text-sm text-forest/70">
            {t.settings.arabicFontSize}
          </AppText>
          <View className="mt-3 flex-row items-center justify-between">
            <StepButton icon="remove" label={t.settings.fontSmaller} disabled={!canShrink} onPress={() => step(-1)} />
            <AppText weight="semibold" className="text-lg text-forest" style={{ fontVariant: ["tabular-nums"] }}>
              {toKurdishDigits(Math.round(arabicScale * 100))}٪
            </AppText>
            <StepButton icon="add" label={t.settings.fontLarger} disabled={!canGrow} onPress={() => step(1)} />
          </View>
          <View className="mt-4 rounded-2xl border border-gold/25 bg-cream px-4 py-3">
            <AppText variant="serif" className="text-center text-forest" style={arabic(18, 1.9)}>
              {PREVIEW_TEXT}
            </AppText>
          </View>

          <AppText variant="arabic" className="mt-5 text-right text-sm text-forest/70">
            {t.settings.language}
          </AppText>
          <View className="mt-3 flex-row gap-1 rounded-2xl bg-forest/[0.07] p-1" accessibilityRole="radiogroup">
            {LANGUAGE_OPTIONS.map((option) => {
              const active = option.id === language;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    if (active) return;
                    hapticTap("light");
                    setLanguage(option.id);
                  }}
                  className={`min-h-11 flex-1 items-center justify-center rounded-xl ${active ? "bg-forest" : "active:bg-forest/10"}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                >
                  <AppText
                    variant="arabic"
                    weight="semibold"
                    className={`text-base ${active ? "text-gold-soft" : "text-forest"}`}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6 rounded-3xl border border-gold/30 bg-ivory px-4 py-4">
      <AppText variant="arabic" weight="semibold" className="mb-3 text-right text-lg text-forest">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      className={`h-11 w-11 items-center justify-center rounded-full ${
        icon === "add" ? "bg-forest" : "border border-forest/15 bg-cream"
      } ${disabled ? "opacity-35" : "active:opacity-70"}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icon} size={20} color={icon === "add" ? colors.ivory : colors.forest} />
    </Pressable>
  );
}
