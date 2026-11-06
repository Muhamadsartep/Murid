import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { completionRatio, formatPercent } from "../lib/formatCount";
import { useStrings } from "../hooks/usePreferences";
import { colors } from "../theme/colors";
import { AppText } from "./AppText";
import { LinearGradient } from "./Gradient";
import { ProgressRing } from "./ProgressRing";

type HeroCardProps = {
  weekday: string;
  gregorian?: string;
  hijri?: string;
  practiced: number;
  total: number;
  streak: number;
  onPress?: () => void;
};

export function HeroCard({
  weekday,
  practiced,
  total,
  streak,
  onPress,
}: HeroCardProps) {
  const t = useStrings();
  const ratio = completionRatio(practiced, total);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mt-5 active:opacity-95"
      style={{
        shadowColor: colors.forestDeep,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
        elevation: 8,
      }}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${t.hero.todayAwrad} ${practiced} / ${total}`}
    >
      <LinearGradient
        colors={[colors.forestDeep, colors.forest]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, overflow: "hidden" }}
      >
        <View className="absolute -left-10 -top-10 h-32 w-32 rounded-full border border-gold/15" />

        <View className="flex-row items-center px-4 pb-3 pt-4">
          <ProgressRing value={ratio} size={68} stroke={5}>
            <AppText weight="bold" className="text-sm text-cream" style={{ fontVariant: ["tabular-nums"] }}>
              {formatPercent(ratio)}
            </AppText>
          </ProgressRing>

          <View className="ml-3 flex-1 items-end">
            <AppText variant="arabic" className="text-[11px] text-gold">
              {t.common.today}
            </AppText>
            <AppText variant="arabic" weight="bold" className="text-2xl leading-9 text-cream">
              {weekday}
            </AppText>
          </View>
        </View>

        <View className="mx-4 h-px bg-cream/10" />

        <View className="flex-row items-center justify-between px-4 py-2.5">
          <View className="flex-row items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1">
            <Ionicons name="flame" size={12} color={colors.gold} />
            <AppText variant="arabic" className="text-[11px] text-gold-soft">
              {streak} {t.hero.streakDays}
            </AppText>
          </View>
          <View className="flex-row items-center gap-1.5">
            {onPress ? <Ionicons name="chevron-back" size={13} color={colors.goldSoft} /> : null}
            <AppText className="text-xs text-cream" style={{ fontVariant: ["tabular-nums"] }}>
              {practiced} / {total}
            </AppText>
            <AppText variant="arabic" className="text-xs text-cream/70">
              {t.hero.todayAwrad}
            </AppText>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
