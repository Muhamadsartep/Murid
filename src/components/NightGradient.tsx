import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

type NightGradientProps = {
  /** SVG gradient ids must be unique while several screens stay mounted. */
  id: string;
  /** Vertical center of the green glow, as a percentage string. */
  centerY?: string;
  /** Adds a faint gold halo behind the focal point. */
  halo?: boolean;
};

export function NightGradient({ id, centerY = "40%", halo = false }: NightGradientProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={`${id}-base`} cx="50%" cy={centerY} r="80%" fx="50%" fy={centerY}>
            <Stop offset="0" stopColor="#102A20" />
            <Stop offset="0.55" stopColor="#07140E" />
            <Stop offset="1" stopColor="#000000" />
          </RadialGradient>
          {halo ? (
            <RadialGradient id={`${id}-halo`} cx="50%" cy={centerY} r="38%" fx="50%" fy={centerY}>
              <Stop offset="0" stopColor="#D4AF37" stopOpacity="0.10" />
              <Stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
            </RadialGradient>
          ) : null}
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id}-base)`} />
        {halo ? <Rect width="100%" height="100%" fill={`url(#${id}-halo)`} /> : null}
      </Svg>
    </View>
  );
}
