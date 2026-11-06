import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useMemo } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { useArabicText, useStrings } from "../hooks/usePreferences";
import { splitBasmala } from "../lib/basmala";
import { completionRatio, formatCount } from "../lib/formatCount";
import type { AwradEntry, AwradScript } from "../lib/unifiedAwrad";
import { colors } from "../theme/colors";
import { AppText } from "./AppText";

const cardShadow: ViewStyle = {
  shadowColor: colors.forestDeep,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};

const VARIANT: Record<AwradScript, "mushaf" | "serif" | "arabic"> = {
  quran: "mushaf",
  dua: "serif",
  text: "arabic",
};

type AwradEntryCardProps = {
  entry: AwradEntry;
  count: number;
  onStep: (entry: AwradEntry, delta: 1 | -1) => void;
  onEdit: (entry: AwradEntry) => void;
  onOpen?: (entry: AwradEntry) => void;
};

/** The one row design shared by every daily wird: text, progress, then the stepper. */
export const AwradEntryCard = memo(function AwradEntryCard({
  entry,
  count,
  onStep,
  onEdit,
  onOpen,
}: AwradEntryCardProps) {
  const t = useStrings();
  const arabic = useArabicText();
  const { basmala, rest } = useMemo(
    () => (entry.script === "text" ? { basmala: null, rest: entry.text } : splitBasmala(entry.text)),
    [entry.script, entry.text],
  );
  const done = count >= entry.target;
  const textStyle =
    entry.script === "quran" ? arabic(20, 2) : entry.script === "dua" ? arabic(18, 1.9) : undefined;

  return (
    <View
      className={`mb-3 rounded-xl border bg-ivory px-4 pb-3 pt-4 ${done ? "border-forest/25" : "border-forest/[0.08]"}`}
      style={cardShadow}
    >
      {basmala ? (
        <AppText variant={VARIANT[entry.script]} className="text-center text-gold-deep" style={textStyle}>
          {basmala}
        </AppText>
      ) : null}
      <AppText
        variant={VARIANT[entry.script]}
        weight={entry.script === "text" ? "semibold" : undefined}
        className={`text-right ${entry.script === "text" ? "text-base leading-7" : ""} ${
          done ? "text-forest/60" : "text-forest"
        }`}
        style={textStyle}
      >
        {rest}
      </AppText>
      {entry.note ? (
        <AppText variant="arabic" className="mt-1.5 text-right text-xs leading-5 text-forest/50">
          {entry.note}
        </AppText>
      ) : null}

      <View className="mt-3 h-1 overflow-hidden rounded-full bg-forest/10">
        <View
          className="h-full rounded-full bg-forest"
          style={{ width: `${Math.round(completionRatio(count, entry.target) * 100)}%` }}
        />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => onStep(entry, -1)}
            disabled={count <= 0}
            hitSlop={6}
            className={`h-9 w-9 items-center justify-center rounded-full border border-forest/15 bg-cream ${
              count <= 0 ? "opacity-30" : "active:bg-forest/10"
            }`}
            accessibilityRole="button"
            accessibilityLabel={t.daily.decrease}
            accessibilityState={{ disabled: count <= 0 }}
          >
            <Ionicons name="remove" size={17} color={colors.forest} />
          </Pressable>
          <Pressable
            onPress={() => onStep(entry, 1)}
            disabled={done}
            className={`ml-2 h-9 min-w-[76px] flex-row items-center justify-center gap-1 rounded-full px-3 ${
              done ? "bg-forest" : "bg-forest/[0.08] active:opacity-80"
            }`}
            accessibilityRole="button"
            accessibilityLabel={t.daily.counterA11y(count, entry.target)}
            accessibilityState={{ disabled: done }}
          >
            {done ? <Ionicons name="checkmark" size={14} color={colors.ivory} /> : null}
            <AppText
              weight="semibold"
              className={`text-sm ${done ? "text-ivory" : "text-forest"}`}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatCount(count)}/{formatCount(entry.target)}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => onEdit(entry)}
            hitSlop={6}
            className="ml-1.5 h-9 w-9 items-center justify-center rounded-full active:bg-forest/10"
            accessibilityRole="button"
            accessibilityLabel={t.daily.editCountA11y(count)}
          >
            <Ionicons name="pencil" size={15} color={colors.forest} style={{ opacity: 0.6 }} />
          </Pressable>
        </View>

        {onOpen ? (
          <Pressable
            onPress={() => onOpen(entry)}
            hitSlop={8}
            className="flex-row items-center gap-1 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={t.daily.read}
          >
            <Ionicons name="chevron-back" size={13} color={colors.goldDeep} />
            <AppText variant="arabic" className="text-xs text-gold-deep">
              {t.daily.read}
            </AppText>
          </Pressable>
        ) : done ? (
          <AppText variant="arabic" weight="semibold" className="text-xs text-forest/70">
            {t.daily.completed}
          </AppText>
        ) : null}
      </View>
    </View>
  );
});
