import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View, type ViewStyle } from "react-native";
import { AppText, fonts } from "../components/AppText";
import { useFloatingTabBarInset } from "../components/FloatingTabBar";
import { LinearGradient } from "../components/Gradient";
import { Screen } from "../components/Screen";
import { useQuranBookmark } from "../hooks/useQuranBookmark";
import { hapticTap } from "../lib/haptics";
import { useStrings } from "../hooks/usePreferences";
import { filterSurahsByName, getSurah, revelationLabel, surahs, type Surah } from "../lib/quran";
import type { QuranBookmark } from "../lib/quranBookmark";
import { colors } from "../theme/colors";

const glassShadow: ViewStyle = {
  shadowColor: colors.forestDeep,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 18,
  elevation: 5,
};

export function QuranScreen() {
  const t = useStrings();
  const router = useRouter();
  const bottomInset = useFloatingTabBarInset();
  const bookmark = useQuranBookmark();
  const [query, setQuery] = useState("");

  const results = useMemo(() => filterSurahsByName(surahs, query), [query]);

  const openSurah = useCallback(
    (surah: Surah) => {
      router.push({ pathname: "/quran/[id]", params: { id: String(surah.id) } });
    },
    [router],
  );

  const openBookmark = useCallback(() => {
    if (!bookmark) return;
    hapticTap("light");
    router.push({
      pathname: "/quran/[id]",
      params: {
        id: String(bookmark.surahId),
        ayah: String(bookmark.ayah),
        y: String(Math.round(bookmark.offsetY)),
        w: String(Math.round(bookmark.width)),
        full: bookmark.full ? "1" : "0",
      },
    });
  }, [bookmark, router]);

  const renderSurah = useCallback(
    ({ item }: { item: Surah }) => <SurahRow surah={item} onPress={openSurah} />,
    [openSurah],
  );

  const searching = query.trim().length > 0;

  return (
    <Screen>
      <LinearGradient
        colors={[colors.ivory, "#EEF3EE", colors.goldSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View className="px-5 pb-3 pt-4">
        <AppText variant="arabic" weight="bold" className="text-center text-3xl text-forest">
          {t.quran.title}
        </AppText>

        {bookmark ? <ContinueReadingCard bookmark={bookmark} onPress={openBookmark} /> : null}

        <View
          className="mt-4 h-12 flex-row items-center rounded-2xl border border-white/80 bg-ivory/70 px-3"
          style={glassShadow}
        >
          <Ionicons name="search" size={18} color={colors.goldDeep} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.quran.searchPlaceholder}
            placeholderTextColor="rgba(26,77,46,0.45)"
            selectionColor={colors.gold}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityRole="search"
            accessibilityLabel={t.quran.searchPlaceholder}
            className="mx-2 h-12 flex-1 text-right text-base text-forest"
            style={{ writingDirection: "rtl", textAlign: "right", fontFamily: fonts.sans.medium }}
          />
          {searching ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.quran.clearSearch}
            >
              <Ionicons name="close-circle" size={18} color={colors.goldDeep} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSurah}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={18}
        windowSize={8}
        ListEmptyComponent={
          searching ? (
            <AppText variant="arabic" className="px-4 py-10 text-center text-base text-forest/50">
              {t.quran.searchEmpty}
            </AppText>
          ) : null
        }
      />
    </Screen>
  );
}

const ContinueReadingCard = memo(function ContinueReadingCard({
  bookmark,
  onPress,
}: {
  bookmark: QuranBookmark;
  onPress: () => void;
}) {
  const t = useStrings();
  const surah = getSurah(bookmark.surahId);
  if (!surah) return null;

  return (
    <Pressable
      onPress={onPress}
      className="mt-4 active:opacity-90"
      style={glassShadow}
      accessibilityRole="button"
      accessibilityLabel={t.quran.continueA11y(surah.name)}
    >
      <LinearGradient
        colors={[colors.forestDeep, colors.forest, colors.forestMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 26 }}
        className="overflow-hidden border border-gold/40 px-4 py-4"
      >
        <View className="flex-row items-center">
          <Ionicons name="chevron-back" size={20} color={colors.goldSoft} />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center justify-end gap-2">
              <AppText variant="arabic" className="text-sm text-gold">
                {t.quran.continueReading}
              </AppText>
              <Ionicons name="bookmark" size={15} color={colors.gold} />
            </View>
            <AppText variant="mushaf" className="mt-1 text-right font-mushaf text-3xl leading-[56px] text-cream">
              {surah.name}
            </AppText>
            <AppText variant="arabic" className="text-right text-sm text-gold-soft">
              {t.ayah.single(bookmark.ayah)}
            </AppText>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const SurahRow = memo(function SurahRow({
  surah,
  onPress,
}: {
  surah: Surah;
  onPress: (surah: Surah) => void;
}) {
  const t = useStrings();
  return (
    <Pressable
      onPress={() => onPress(surah)}
      className="mb-2.5 min-h-16 flex-row items-center rounded-2xl border border-forest/10 bg-cream px-4 py-3 active:bg-gold-soft"
      style={{ borderWidth: StyleSheet.hairlineWidth }}
      accessibilityRole="button"
      accessibilityLabel={`${surah.name}، ${revelationLabel(surah.type, t)}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-ivory">
        <AppText className="text-sm text-forest">{surah.id}</AppText>
      </View>
      <View className="ml-3 flex-1">
        <AppText variant="arabic" className="text-right text-xl text-forest">
          {surah.name}
        </AppText>
        <View className="mt-1 flex-row items-center justify-end gap-2">
          <AppText variant="arabic" className="text-right text-xs text-forest/55">
            {surah.transliteration} · {t.quran.ayahCount(surah.ayahCount)}
          </AppText>
          <View className="rounded-full bg-forest/5 px-2 py-0.5">
            <AppText variant="arabic" className="text-[11px] text-forest/70">
              {revelationLabel(surah.type, t)}
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
