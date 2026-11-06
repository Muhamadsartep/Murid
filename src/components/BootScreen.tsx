import { useEffect, useState, type ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useStrings } from "../hooks/usePreferences";
import { colors } from "../theme/colors";
import { AppText } from "./AppText";

const REVEAL_MS = 520;

/** Pulsing boot mark shown while fonts and stores load. */
export function BootScreen() {
  const t = useStrings();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [pulse]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.get() * 0.03 }],
    opacity: 0.92 + pulse.get() * 0.08,
  }));
  const barStyle = useAnimatedStyle(() => ({ opacity: 0.45 + pulse.get() * 0.4 }));

  return (
    <View className="flex-1 items-center justify-center bg-navy-deep px-6">
      <View className="items-center justify-center">
        <Animated.View style={logoStyle} className="items-center justify-center">
          <Image
            source={require("../../assets/logo.png")}
            className="h-44 w-44 rounded-3xl"
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={t.boot.title}
          />
        </Animated.View>
      </View>
      <AppText variant="arabic" weight="semibold" className="mt-6 text-3xl text-cream">
        {t.boot.title}
      </AppText>
      <AppText variant="arabic" className="mt-1 text-sm tracking-[2px] text-gold">
        {t.boot.brand}
      </AppText>
      <Animated.View style={barStyle} className="mt-8 h-1 w-24 overflow-hidden rounded-full bg-gold/25">
        <View className="h-full w-1/2 rounded-full bg-gold" />
      </Animated.View>
    </View>
  );
}

/**
 * Shows the boot screen until `ready`, then fades it out over the mounted app so the first
 * screen is in place before the overlay lifts.
 */
export function BootReveal({ ready, children }: { ready: boolean; children: ReactNode }) {
  // Once ready flips, the app stays mounted; only the overlay's lifetime is tracked.
  const [overlay, setOverlay] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!ready) return;
    opacity.set(
      withTiming(0, { duration: REVEAL_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setOverlay)(false);
      }),
    );
  }, [opacity, ready]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <View style={{ flex: 1, backgroundColor: overlay ? colors.navyDeep : colors.cream }}>
      {ready ? children : null}
      {overlay ? (
        <Animated.View pointerEvents={ready ? "none" : "auto"} style={[StyleSheet.absoluteFill, overlayStyle]}>
          <BootScreen />
        </Animated.View>
      ) : null}
    </View>
  );
}
