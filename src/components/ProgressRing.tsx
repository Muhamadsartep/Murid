import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { colors } from "../theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = {
  value: number;
  size: number;
  stroke?: number;
  children?: ReactNode;
};

export function ProgressRing({ value, size, stroke = 14, children }: ProgressRingProps) {
  const ratio = Math.min(1, Math.max(0, value));
  const center = size / 2;
  const radius = center - stroke * 1.4;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(ratio);
  useEffect(() => {
    progress.set(withTiming(ratio, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [progress, ratio]);

  // A round cap on a zero-length arc still paints a dot, so hide the arc at 0.
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.get()),
    strokeOpacity: progress.get() > 0 ? 1 : 0,
  }));
  const glowProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.get()),
    strokeOpacity: progress.get() > 0 ? 0.16 : 0,
  }));

  return (
    <View pointerEvents="box-none" style={{ width: size, height: size }} className="items-center justify-center">
      <View
        pointerEvents="none"
        style={{ position: "absolute", width: size, height: size, transform: [{ rotate: "-90deg" }] }}
      >
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.goldSoft} />
              <Stop offset="0.5" stopColor={colors.gold} />
              <Stop offset="1" stopColor={colors.goldDeep} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={radius + stroke * 1.15}
            stroke={colors.gold}
            strokeOpacity={0.22}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.gold}
            strokeOpacity={0.1}
            strokeWidth={stroke}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.gold}
            strokeWidth={stroke * 2.4}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            fill="none"
            animatedProps={glowProps}
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#ring-gold)"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            fill="none"
            animatedProps={arcProps}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius - stroke * 1.3}
            stroke={colors.cream}
            strokeOpacity={0.07}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>
      {children}
    </View>
  );
}
