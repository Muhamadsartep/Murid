import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function hapticTap(kind: "light" | "heavy"): void {
  if (Platform.OS === "web") return;

  const style =
    kind === "heavy" ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light;

  void Haptics.impactAsync(style).catch(() => undefined);
}
