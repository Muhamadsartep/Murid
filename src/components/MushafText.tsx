import { Platform, Text, type TextProps, type TextStyle } from "react-native";

import type { MushafMetrics } from "../lib/mushaf";
import { colors } from "../theme/colors";
import { fonts } from "./AppText";

const mushafStyle: TextStyle = {
  width: "100%",
  fontFamily: fonts.mushaf,
  textAlign: "justify",
  writingDirection: "rtl",
  color: colors.forest,
  ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
};

/** Page text and the pagination measurer must lay out identically, so both render through this. */
export function MushafText({
  children,
  onTextLayout,
  metrics,
}: Pick<TextProps, "children" | "onTextLayout"> & { metrics: MushafMetrics }) {
  return (
    <Text
      style={[mushafStyle, { fontSize: metrics.font, lineHeight: metrics.line }]}
      selectable={false}
      allowFontScaling={false}
      textBreakStrategy="simple"
      android_hyphenationFrequency="none"
      onTextLayout={onTextLayout}
    >
      {children}
    </Text>
  );
}
