import { View } from "react-native";

type ProgressBarProps = {
  value: number;
  trackClassName?: string;
};

export function ProgressBar({ value, trackClassName = "bg-cream/25" }: ProgressBarProps) {
  const ratio = Math.min(1, Math.max(0, value));
  const percent = Math.round(ratio * 100);

  return (
    <View
      className={`h-2 overflow-hidden rounded-full ${trackClassName}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
    </View>
  );
}
