import { Text, type TextProps, type TextStyle } from "react-native";

/**
 * Single text entry point for the app.
 * `body` and `arabic` use Vazirmatn, a modern sans with full Sorani Kurdish coverage, in the
 * weight picked by `weight`. `serif` is Amiri and `mushaf` is KFGQPC HAFS Uthmanic Script,
 * the King Fahd Complex font used by Quran.com. All are loaded in the root layout.
 */
export type TextWeight = "regular" | "medium" | "semibold" | "bold";

export const fonts = {
  sans: {
    regular: "Vazirmatn_400Regular",
    medium: "Vazirmatn_500Medium",
    semibold: "Vazirmatn_600SemiBold",
    bold: "Vazirmatn_700Bold",
  },
  serif: "Amiri_400Regular",
  serifBold: "Amiri_700Bold",
  mushaf: "UthmanicHafs",
} as const;

type AppTextProps = TextProps & {
  variant?: "body" | "arabic" | "serif" | "mushaf";
  /** Only `body` and `arabic` have weight files; `serif` maps `bold` to Amiri Bold. */
  weight?: TextWeight;
  className?: string;
};

const rtl: TextStyle = { writingDirection: "rtl" };
/** Each weight ships as its own file, so the platform must not synthesize a bold on top. */
const normal: TextStyle = { fontWeight: "normal" };

function familyFor(variant: NonNullable<AppTextProps["variant"]>, weight: TextWeight): string {
  if (variant === "mushaf") return fonts.mushaf;
  if (variant === "serif") return weight === "bold" || weight === "semibold" ? fonts.serifBold : fonts.serif;
  return fonts.sans[weight];
}

export function AppText({ variant = "body", weight = "medium", className, style, ...props }: AppTextProps) {
  return (
    <Text
      className={className}
      style={[variant === "body" ? null : rtl, { fontFamily: familyFor(variant, weight) }, normal, style]}
      {...props}
    />
  );
}
