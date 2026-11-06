import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "../components/AppText";
import { Screen } from "../components/Screen";
import { useStrings } from "../hooks/usePreferences";
import { getBiography } from "../lib/biographies";
import { colors } from "../theme/colors";

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const KNOWN_HEADINGS = new Set([
  "ناوی",
  "ناوی و لەدایکبوونی",
  "نازناوەکانی",
  "لەدایکبوونی",
  "لەدایکبوون و ڕەچەڵەک",
  "پایە و پلەی",
  "سیما و شێوەی",
  "پێگەی لە ئیسلام و تەریقەتدا",
  "پێگە لە تەریقەت و ئیرشاد",
  "تایبەتمەندییە دیارەکانی",
  "دەستکەوت و خزمەتە دیارەکانی",
  "ڕەوشت و شێوازی سلووک",
  "هۆنراوەیەکی عیرفانی دەربارەی تەریقەت",
  "هۆنراوە",
  "وتە و ئامۆژگارییەکانی",
  "ڕوانگەی بۆ دونیا",
  "شێخ حەسەنی بەسری لەگەڵ دەسەڵاتداران",
  "هەڵوێستی بەرامبەر حەجاجی کوڕی یووسف",
  "ژیانی ئیمام حوسێن و ڕۆژی شەهادەت",
  "پێشبینیی پێغەمبەر (ﷺ) دەربارەی شەهادەتی ئیمام حوسێن",
  "شەهادەت و کۆچی دوایی",
  "کۆچی دوایی و شەهادەت",
  "کۆچی دوایی",
  "لەدایکبوون",
]);

/** Short single-line labels such as "کۆچی دوایی:" or known sections read as titles. */
function isSectionHeading(paragraph: string): boolean {
  const line = paragraph.trim();
  if (line.includes("\n")) return false;
  if (line.endsWith(":") || line.endsWith("：")) return line.length <= 80;
  if (KNOWN_HEADINGS.has(line)) return true;
  return (
    line.length <= 55 &&
    !line.includes("،") &&
    !line.includes("؛") &&
    !line.includes("؟") &&
    !line.endsWith(".") &&
    (
      line.startsWith("ناوی") ||
      line.startsWith("نازناو") ||
      line.startsWith("لەدایکبوون") ||
      line.startsWith("پایە") ||
      line.startsWith("سیما") ||
      line.startsWith("ژیانی") ||
      line.startsWith("پێشبینی") ||
      line.startsWith("کۆچی دوایی") ||
      line.startsWith("شەهادەت") ||
      line.startsWith("تایبەتمەندی") ||
      line.startsWith("دەستکەوت") ||
      line.startsWith("هۆنراوە") ||
      line.startsWith("ڕەچەڵەک") ||
      line.startsWith("سەرەتا") ||
      line.startsWith("پەروەردە") ||
      line.startsWith("تێڕوانین") ||
      line.startsWith("شێوازی") ||
      line.startsWith("پێگە") ||
      line.startsWith("ڕەوشت") ||
      line.startsWith("بەرهەم") ||
      line.startsWith("ڕۆڵی") ||
      line.startsWith("سەردەمی") ||
      line.startsWith("شوێن") ||
      line.startsWith("نیشتمان") ||
      line.startsWith("مەزار") ||
      line.startsWith("نهێنی") ||
      line.startsWith("خوێندن") ||
      line.startsWith("کۆڕەکانی")
    )
  );
}

function parseParagraphs(text: string): string[] {
  const rawBlocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const result: string[] = [];

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    let currentBody: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;

      if (isSectionHeading(line)) {
        if (currentBody.length > 0) {
          result.push(currentBody.join("\n"));
          currentBody = [];
        }
        result.push(line);
      } else {
        currentBody.push(line);
      }
    }
    if (currentBody.length > 0) {
      result.push(currentBody.join("\n"));
    }
  }

  return result;
}

export function BiographyDetailScreen() {
  const t = useStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Number(firstParam(params.id));
  const master = Number.isFinite(id) ? getBiography(id) : undefined;

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/biography");
  }, [router]);

  const paragraphs = useMemo(
    () => (master ? parseParagraphs(master.biography) : []),
    [master],
  );

  if (!master) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <AppText variant="arabic" className="text-center text-lg leading-8 text-forest/70">
            {t.biography.notFound}
          </AppText>
          <Pressable onPress={goBack} className="mt-6 rounded-full bg-forest px-6 py-3 active:opacity-80">
            <AppText variant="arabic" className="text-cream">
              {t.common.back}
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center px-5 pb-3 pt-3">
        <Pressable
          onPress={goBack}
          className="h-11 w-11 items-center justify-center rounded-full border border-gold/70 bg-ivory active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <Ionicons name="chevron-back" size={20} color={colors.forest} />
        </Pressable>
        <AppText variant="arabic" weight="bold" className="flex-1 pl-3 text-right text-xl leading-8 text-forest">
          {master.name}
        </AppText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-stretch rounded-[22px] border border-forest/[0.08] bg-ivory px-5 py-6">
          {paragraphs.length === 0 ? (
            <View className="items-center justify-center py-12">
              <AppText variant="arabic" className="text-center text-base text-forest/40">
                بەردەست دەبێت...
              </AppText>
            </View>
          ) : (
            paragraphs.map((paragraph, index) => {
            const heading = isSectionHeading(paragraph);
            const followsHeading = index > 0 && isSectionHeading(paragraphs[index - 1] ?? "");
            const gap = index === 0 ? "mt-0" : heading ? "mt-7" : followsHeading ? "mt-2.5" : "mt-4";

            if (heading) {
              return (
                <View key={`${master.id}-${index}`} className={`${gap} items-end`}>
                  <AppText
                    variant="arabic"
                    weight="bold"
                    className="text-right text-lg text-gold-deep"
                    style={{ textAlign: "right", writingDirection: "rtl" }}
                  >
                    {paragraph}
                  </AppText>
                </View>
              );
            }

            return (
              <AppText
                key={`${master.id}-${index}`}
                variant="arabic"
                weight="regular"
                className={`text-right text-justify ${gap} text-base leading-8 text-forest/90`}
                style={{ textAlign: "justify", writingDirection: "rtl" }}
              >
                {paragraph}
              </AppText>
            );
          }))}
        </View>
      </ScrollView>
    </Screen>
  );
}
