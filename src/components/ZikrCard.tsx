import { memo } from "react";
import { Pressable, View } from "react-native";

import { completionRatio, formatCount, formatPercent } from "../lib/formatCount";
import type { Zikr } from "../types/zikr";
import { AppText } from "./AppText";
import { ProgressBar } from "./ProgressBar";

type ZikrCardProps = {
  zikr: Zikr;
  onPress: (zikr: Zikr) => void;
};

export const ZikrCard = memo(function ZikrCard({ zikr, onPress }: ZikrCardProps) {
  const ratio = completionRatio(zikr.completed, zikr.target);

  return (
    <Pressable
      onPress={() => onPress(zikr)}
      className="mt-3 min-h-[112px] justify-center rounded-3xl bg-forest px-5 py-5 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${zikr.title}. ${formatCount(zikr.completed)} من ${formatCount(zikr.target)}`}
    >
      <AppText variant="arabic" className="text-right text-3xl leading-normal text-cream">
        {zikr.title}
      </AppText>
      <View className="mt-4">
        <ProgressBar value={ratio} />
      </View>
      <View className="mt-3 flex-row items-center justify-between">
        <AppText className="text-base text-gold">{formatPercent(ratio)}</AppText>
        <AppText className="text-base text-cream/80">
          {formatCount(zikr.completed)} / {formatCount(zikr.target)}
        </AppText>
      </View>
    </Pressable>
  );
});
