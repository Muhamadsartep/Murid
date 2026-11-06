import { Stack } from "expo-router";

import { colors } from "../../src/theme/colors";

export default function DailyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: "slide_from_left",
      }}
    />
  );
}
