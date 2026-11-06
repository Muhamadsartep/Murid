import { type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  paddedTop?: boolean;
};

export function Screen({ children, className = "", paddedTop = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 bg-cream ${className}`} style={paddedTop ? { paddingTop: insets.top } : undefined}>
      <View className="mx-auto w-full max-w-md flex-1 flex-col">{children}</View>
    </View>
  );
}
