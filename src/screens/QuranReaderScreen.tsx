import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, fonts } from "../components/AppText";
import { Screen } from "../components/Screen";
import { useAwradProgress } from "../hooks/useAwradProgress";
import { usePreferences, useStrings } from "../hooks/usePreferences";
import { useSurahReading } from "../hooks/useSurahReading";
import { awradSurahs, ayahRangeLabel } from "../lib/awradSurahs";
import { formatCount, parseCount } from "../lib/formatCount";
import { hapticTap } from "../lib/haptics";
import { mushafMetrics, toArabicIndic } from "../lib/mushaf";
import { getSurah, normalizeArabic, revelationLabel, type Surah } from "../lib/quran";
import { readQuranBookmark, writeQuranBookmark, type QuranBookmark } from "../lib/quranBookmark";
import { colors } from "../theme/colors";

type ReaderParams = {
  id: string;
  from?: string;
  to?: string;
  ayah?: string;
  awrad?: string;
  target?: string;
  count?: string;
};

type AyahRow = {
  n: number;
  arabic: string;
  tafsir: string;
};

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const cardShadow = {
  shadowColor: colors.forestDeep,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};

const viewabilityConfig = { itemVisiblePercentThreshold: 10, minimumViewTime: 50 };

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function ayahNumber(query: string): number | null {
  const number = parseCount(query);
  return number != null && number >= 1 ? number : null;
}

function buildRows(
  surah: Surah,
  from: number,
  to: number,
  tafsir?: readonly string[] | null,
): AyahRow[] {
  const rows: AyahRow[] = [];
  const safeFrom = Math.max(1, Math.min(from, surah.ayahCount));
  const safeTo = Math.max(safeFrom, Math.min(to, surah.ayahCount));
  for (let n = safeFrom; n <= safeTo; n++) {
    const rawArabic = (surah.verses[n - 1] ?? "").trim();
    let arabic = rawArabic;
    // Ensure no prepended Bismillah on Ayah 1 for surahs other than 1 and 9
    // as Bismillah is already presented in the dedicated header component
    if (n === 1 && surah.id !== 1 && surah.id !== 9) {
      arabic = arabic
        .replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/u, "")
        .replace(/^بِسۡمِ ٱللَّهِ ٱلرۡحۡمَٰنِ ٱلرَّحِيمِ\s*/u, "")
        .trim();
      if (!arabic) arabic = rawArabic;
    }
    const tafsirText = (tafsir?.[n - 1] ?? "").trim();
    rows.push({
      n,
      arabic,
      tafsir: tafsirText,
    });
  }
  return rows;
}

function filterRows(rows: readonly AyahRow[], query: string): readonly AyahRow[] {
  const trimmed = query.trim();
  if (!trimmed) return rows;
  const number = ayahNumber(trimmed);
  if (number != null) return rows.filter((row) => row.n === number);
  const needle = normalizeArabic(trimmed);
  if (!needle) return rows;
  return rows.filter(
    (row) => normalizeArabic(row.arabic).includes(needle) || normalizeArabic(row.tafsir).includes(needle),
  );
}

export function QuranReaderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ReaderParams>();
  const { t, arabicScale } = usePreferences();
  const metrics = useMemo(() => mushafMetrics(arabicScale), [arabicScale]);

  const surah = getSurah(Number(firstParam(params.id)));
  const surahId = surah?.id ?? 0;
  const { state: reading, retry } = useSurahReading(surahId);

  const awradItem = awradSurahs.find((item) => item.id === firstParam(params.awrad));
  const { counts, increment: incrementAwrad } = useAwradProgress();
  const awradCount = awradItem ? (counts[awradItem.id] ?? 0) : 0;
  const awradDone = awradItem != null && awradCount >= awradItem.target;

  const range = useMemo(() => {
    if (!surah) return null;
    const from = Number(firstParam(params.from));
    if (!Number.isInteger(from) || from < 1 || from > surah.ayahCount) return null;
    const rawTo = Number(firstParam(params.to));
    const to = Number.isInteger(rawTo) ? Math.min(Math.max(rawTo, from), surah.ayahCount) : from;
    if (from === 1 && to === surah.ayahCount) return null;
    return { from, to };
  }, [params.from, params.to, surah]);

  const [showFull, setShowFull] = useState(false);
  // Requirement 1: Kurdish Tafsir is collapsed (hidden) by default
  const [showTafsir, setShowTafsir] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleAyah, setVisibleAyah] = useState(1);
  const [savedAyah, setSavedAyah] = useState<number | null>(null);
  const [resumeAyah, setResumeAyah] = useState<number | null>(null);
  const [resumeReady, setResumeReady] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [seenSurahId, setSeenSurahId] = useState(surahId);

  const listRef = useRef<FlatList<AyahRow>>(null);
  const rowsRef = useRef<AyahRow[]>([]);
  const visibleRowsRef = useRef<readonly AyahRow[]>([]);
  const resumeAyahRef = useRef<number | null>(null);
  const visibleRef = useRef(1);
  const surahIdRef = useRef(surahId);
  const fullRef = useRef(true);
  const searchingRef = useRef(false);
  const placedRef = useRef(false);
  const didReadRef = useRef(false);
  const dragSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRetries = useRef(0);
  const queryRef = useRef("");
  const anchorRef = useRef(1);
  const placeGen = useRef(0);
  const isReanchoringRef = useRef(false);

  if (seenSurahId !== surahId) {
    setSeenSurahId(surahId);
    setShowFull(false);
    setShowTafsir(false);
    setQuery("");
    setVisibleAyah(1);
    setSavedAyah(null);
    setResumeAyah(null);
    setResumeReady(false);
    setPlaced(false);
  }

  useLayoutEffect(() => {
    placedRef.current = false;
    placeGen.current += 1;
  }, [surahId]);

  const activeRange = showFull ? null : range;
  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length > 0;
  const fullReading = activeRange == null;

  const tafsir = reading.status === "ready" ? reading.tafsir : null;
  const rows = useMemo(() => {
    if (!surah) return [];
    const from = activeRange?.from ?? 1;
    const to = activeRange?.to ?? surah.ayahCount;
    return buildRows(surah, from, to, tafsir);
  }, [activeRange, surah, tafsir]);
  const visibleRows = useMemo(() => filterRows(rows, trimmedQuery), [rows, trimmedQuery]);

  const showBismillah =
    !searching && visibleRows.length > 0 && visibleRows[0]!.n === 1 && surahId !== 1 && surahId !== 9;

  useLayoutEffect(() => {
    rowsRef.current = rows;
    visibleRowsRef.current = visibleRows;
    resumeAyahRef.current = resumeAyah;
    surahIdRef.current = surahId;
    fullRef.current = fullReading;
    searchingRef.current = searching;
  }, [fullReading, resumeAyah, rows, searching, surahId, visibleRows]);

  const paramAyah = Number(firstParam(params.ayah));

  useEffect(() => {
    let active = true;
    void readQuranBookmark().then((bookmark) => {
      if (!active) return;
      const fromRoute =
        Number.isInteger(paramAyah) && surah != null && paramAyah >= 1 && paramAyah <= surah.ayahCount
          ? paramAyah
          : null;
      const fromStore = bookmark?.surahId === surahId ? bookmark.ayah : null;
      const next = fromRoute ?? (range ? null : fromStore);
      setSavedAyah(fromStore);
      setResumeAyah(next);
      if (next != null) {
        visibleRef.current = next;
        setVisibleAyah(next);
      }
      setResumeReady(true);
    });
    return () => {
      active = false;
    };
  }, [paramAyah, range, surah, surahId]);

  useEffect(() => {
    const id = surahId;
    const full = fullReading;
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      dragSaveRef.current = false;
      if (!didReadRef.current || !full || id <= 0) return;
      const ayah = visibleRef.current;
      didReadRef.current = false;
      if (ayah < 1) return;
      void writeQuranBookmark({ surahId: id, ayah, offsetY: 0, width: 0, full: true }).catch(() => undefined);
    };
  }, [fullReading, surahId]);

  const persist = useCallback((ayah: number, full: boolean) => {
    const id = surahIdRef.current;
    if (!id || ayah < 1) return;
    const bookmark: QuranBookmark = { surahId: id, ayah, offsetY: 0, width: 0, full };
    void writeQuranBookmark(bookmark)
      .then(() => {
        if (surahIdRef.current !== id) return;
        setSavedAyah(ayah);
      })
      .catch(() => undefined);
  }, []);

  const finishPlace = useCallback((ayah: number | null) => {
    if (placedRef.current) return;
    placedRef.current = true;
    setPlaced(true);
    if (ayah != null && ayah > 0) {
      visibleRef.current = ayah;
      setVisibleAyah(ayah);
    }
  }, []);

  const scrollToRow = useCallback(
    (index: number) => {
      if (index <= 0) {
        finishPlace(rowsRef.current[0]?.n ?? 1);
        return;
      }
      const gen = placeGen.current;
      scrollRetries.current = 0;
      requestAnimationFrame(() => {
        if (placeGen.current !== gen) return;
        try {
          listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
        } catch {
          // Handled by onScrollToIndexFailed
        }
      });
      // Safety delay for off-screen items to measure and finish place
      const delay = index < 8 ? 60 : 420;
      setTimeout(() => {
        if (placeGen.current !== gen) return;
        finishPlace(rowsRef.current[index]?.n ?? resumeAyahRef.current);
      }, delay);
    },
    [finishPlace],
  );

  useLayoutEffect(() => {
    if (!resumeReady || placedRef.current || rows.length === 0) return;
    const index = resumeAyah == null ? -1 : rows.findIndex((row) => row.n === resumeAyah);
    scrollToRow(index);
  }, [resumeAyah, resumeReady, rows, scrollToRow]);

  // Requirement 3: Smooth Search handling and position restoration
  useEffect(() => {
    if (queryRef.current === trimmedQuery) return;
    const previous = queryRef.current;
    queryRef.current = trimmedQuery;
    if (!placedRef.current) return;

    if (trimmedQuery && !previous) {
      // Starting search: anchor the currently visible ayah
      anchorRef.current = visibleRef.current;
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else if (!trimmedQuery && previous) {
      // Exiting search: smoothly restore to the ayah user was viewing
      const targetAyah = visibleRef.current > 0 ? visibleRef.current : anchorRef.current;
      const index = rowsRef.current.findIndex((row) => row.n === targetAyah);
      scrollRetries.current = 0;
      if (index > 0) {
        requestAnimationFrame(() => {
          try {
            listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
          } catch {
            // onScrollToIndexFailed handles any unmeasured offset
          }
        });
      }
    }
  }, [trimmedQuery]);

  const clearSearch = useCallback(() => {
    const targetAyah = visibleRef.current > 0 ? visibleRef.current : anchorRef.current;
    setQuery("");
    requestAnimationFrame(() => {
      const index = rowsRef.current.findIndex((r) => r.n === targetAyah);
      if (index >= 0) {
        scrollRetries.current = 0;
        try {
          listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
        } catch {
          // Handled by onScrollToIndexFailed
        }
      }
    });
  }, []);

  const onCardPress = useCallback((ayahNum: number) => {
    if (queryRef.current) {
      // Tapping a search result selects it and returns to full view pinned at that ayah
      visibleRef.current = ayahNum;
      setVisibleAyah(ayahNum);
      setQuery("");
      requestAnimationFrame(() => {
        const index = rowsRef.current.findIndex((r) => r.n === ayahNum);
        if (index >= 0) {
          scrollRetries.current = 0;
          try {
            listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
          } catch {
            // Handled by onScrollToIndexFailed
          }
        }
      });
    }
  }, []);

  // Requirement 2: Handling off-screen items for long surahs (e.g. Al-Baqarah)
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      const gen = placeGen.current;
      if (scrollRetries.current >= 8) {
        if (gen === placeGen.current) {
          finishPlace(visibleRowsRef.current[info.index]?.n ?? resumeAyahRef.current);
          isReanchoringRef.current = false;
        }
        return;
      }
      scrollRetries.current += 1;
      const estLength = info.averageItemLength > 0 ? info.averageItemLength : showTafsir ? 320 : 130;
      listRef.current?.scrollToOffset({
        offset: Math.max(0, estLength * info.index),
        animated: false,
      });
      setTimeout(() => {
        if (placeGen.current !== gen) return;
        try {
          listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
          if (!placedRef.current) {
            finishPlace(visibleRowsRef.current[info.index]?.n ?? resumeAyahRef.current);
          }
        } catch {
          // React Native fires onScrollToIndexFailed again if still unmeasured
        }
      }, 50);
    },
    [finishPlace, showTafsir],
  );

  const onViewableItemsChanged = useCallback((info: { viewableItems: ViewToken<AyahRow>[] }) => {
    if (isReanchoringRef.current) return;
    const first = info.viewableItems
      .filter((token) => token.isViewable && token.index != null)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
    if (!first?.item) return;
    visibleRef.current = first.item.n;
    setVisibleAyah(first.item.n);
  }, []);

  const commitScrollSave = useCallback(() => {
    if (!dragSaveRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      dragSaveRef.current = false;
      if (!fullRef.current || searchingRef.current || !placedRef.current) return;
      persist(visibleRef.current, true);
    }, 120);
  }, [persist]);

  const onScrollBeginDrag = useCallback(() => {
    if (!fullRef.current || searchingRef.current || !placedRef.current) return;
    dragSaveRef.current = true;
    didReadRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocity = event.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocity) > 0.05) return;
      commitScrollSave();
    },
    [commitScrollSave],
  );

  // Requirement 1 & 3: Delicate eye/book toggle in header that globally toggles Tafsir
  // while preserving the user's active reading position seamlessly.
  const onToggleTafsir = useCallback(() => {
    hapticTap("light");
    const currentAyah = visibleRef.current;
    isReanchoringRef.current = true;

    setShowTafsir((value) => {
      const nextValue = !value;
      requestAnimationFrame(() => {
        const currentRows = visibleRowsRef.current;
        const index = currentRows.findIndex((row) => row.n === currentAyah);
        if (index >= 0) {
          scrollRetries.current = 0;
          try {
            listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
          } catch {
            // Handled by onScrollToIndexFailed
          }
        }
        setTimeout(() => {
          isReanchoringRef.current = false;
        }, 250);
      });
      return nextValue;
    });
  }, []);

  const onToggleFull = useCallback(() => {
    setQuery("");
    setShowFull((value) => !value);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, []);

  // Requirement 3: Save Bookmark ("پاشەکەوتکردنی شوێن")
  const onSave = useCallback(() => {
    if (!placedRef.current || surahIdRef.current <= 0) return;
    hapticTap("light");
    didReadRef.current = true;
    persist(visibleRef.current, fullRef.current);
  }, [persist]);

  const onAwradCount = useCallback(() => {
    if (!awradItem || awradDone) return;
    const result = incrementAwrad(awradItem.id);
    if (result === "finished") return;
    hapticTap(result === "completed" ? "heavy" : "light");
  }, [awradDone, awradItem, incrementAwrad]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/quran");
  }, [router]);

  const renderItem = useCallback<ListRenderItem<AyahRow>>(
    ({ item }) => (
      <AyahCard
        row={item}
        showTafsir={showTafsir}
        fontSize={metrics.font}
        lineHeight={metrics.line}
        onPress={searching ? onCardPress : undefined}
      />
    ),
    [metrics.font, metrics.line, onCardPress, searching, showTafsir],
  );

  const listHeader = useMemo(
    () =>
      showBismillah ? (
        <AppText variant="mushaf" className="mb-4 text-center text-3xl leading-[60px] text-gold-deep">
          {BISMILLAH}
        </AppText>
      ) : null,
    [showBismillah],
  );

  if (!surah) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <AppText variant="arabic" className="text-2xl text-forest">
            {t.quran.notFound}
          </AppText>
          <Pressable onPress={goBack} className="mt-6 rounded-full bg-forest px-6 py-3">
            <AppText variant="arabic" className="text-cream">
              {t.common.back}
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const saved = placed && savedAyah === visibleAyah;
  const listReady = resumeReady;

  return (
    <Screen>
      {/* Header */}
      <View className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-3">
        <Pressable
          onPress={goBack}
          className="h-11 shrink-0 flex-row items-center gap-1 rounded-full border border-gold/80 bg-ivory/90 px-3.5 active:opacity-70"
          style={cardShadow}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <Ionicons name="chevron-back" size={16} color={colors.forest} />
          <AppText variant="arabic" className="text-sm text-forest">
            {t.common.back}
          </AppText>
        </Pressable>

        <View className="min-w-0 flex-1 items-end">
          <View className="flex-row items-center justify-end gap-2">
            {/* Requirement 1: Delicate eye/book icon globally toggling Kurdish Tafsir */}
            <Pressable
              onPress={onToggleTafsir}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className={`h-9 w-9 items-center justify-center rounded-full border ${
                showTafsir
                  ? "border-gold bg-gold-soft/90 shadow-sm"
                  : "border-gold/40 bg-ivory/90"
              } active:scale-95`}
              style={cardShadow}
              accessibilityRole="switch"
              accessibilityLabel={showTafsir ? t.quran.hideTafsir : t.quran.showTafsir}
              accessibilityState={{ checked: showTafsir }}
            >
              <Feather
                name={showTafsir ? "eye" : "book"}
                size={18}
                color={showTafsir ? colors.goldDeep : colors.forest}
              />
            </Pressable>

            <AppText variant="arabic" className="shrink text-2xl text-forest" numberOfLines={1}>
              {surah.name}
            </AppText>
          </View>

          <View className="mt-1 flex-row items-center justify-end gap-2">
            <AppText variant="arabic" className="text-xs text-gold-deep" numberOfLines={1}>
              {activeRange ? ayahRangeLabel(activeRange.from, activeRange.to, t) : t.quran.ayahCount(surah.ayahCount)}
            </AppText>
            <View className="rounded-full border border-gold/50 bg-gold-soft/80 px-2 py-0.5">
              <AppText variant="arabic" className="text-[11px] text-forest">
                {revelationLabel(surah.type, t)}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      {/* Requirement 3: Save Bookmark ("پاشەکەوتکردنی شوێن") */}
      <Pressable
        onPress={onSave}
        disabled={!placed}
        className={`mx-5 mb-3 min-h-11 flex-row items-center justify-center gap-2 rounded-full border px-4 ${
          placed ? "active:opacity-70" : "opacity-40"
        } ${saved ? "border-gold bg-gold-soft" : "border-gold/70 bg-ivory/90"}`}
        style={placed ? cardShadow : undefined}
        accessibilityRole="button"
        accessibilityState={{ disabled: !placed }}
        accessibilityLabel={saved ? t.quran.progressSaved : t.quran.saveProgress}
      >
        <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={16} color={colors.forest} />
        <AppText variant="arabic" className="text-sm text-forest">
          {saved ? t.quran.progressSaved : t.quran.saveProgress}
        </AppText>
        {placed && visibleAyah > 0 ? (
          <View className={`rounded-full px-2 py-0.5 ${saved ? "bg-forest/15" : "bg-forest/10"}`}>
            <AppText weight="semibold" className="text-xs text-forest">
              {toArabicIndic(visibleAyah)}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {/* Requirement 3: Ayah Search */}
      <View
        className="mx-5 mb-3 h-12 flex-row items-center rounded-2xl border border-white/80 bg-ivory/75 px-3"
        style={cardShadow}
      >
        <Ionicons name="search" size={18} color={colors.goldDeep} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.quran.ayahSearchPlaceholder}
          placeholderTextColor="rgba(26,77,46,0.45)"
          selectionColor={colors.gold}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          editable={placed}
          accessibilityRole="search"
          accessibilityLabel={t.quran.ayahSearchPlaceholder}
          className="mx-2 h-12 flex-1 text-right text-base text-forest"
          style={{ writingDirection: "rtl", textAlign: "right", fontFamily: fonts.sans.medium }}
        />
        {searching ? (
          <Pressable
            onPress={clearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t.quran.clearSearch}
          >
            <Ionicons name="close-circle" size={18} color={colors.goldDeep} />
          </Pressable>
        ) : null}
      </View>

      {range && !searching ? (
        <Pressable
          onPress={onToggleFull}
          className="mx-5 mb-3 min-h-10 items-center justify-center self-center rounded-full border border-gold/70 bg-ivory/80 px-5 active:opacity-70"
          accessibilityRole="button"
        >
          <AppText variant="arabic" className="text-sm text-forest">
            {showFull ? t.quran.showAwradOnly : t.quran.showFullSurah}
          </AppText>
        </Pressable>
      ) : null}

      {searching && visibleRows.length > 0 ? (
        <AppText variant="arabic" className="mb-1 px-5 text-right text-xs text-gold-deep">
          {t.quran.ayahCount(visibleRows.length)}
        </AppText>
      ) : null}

      {showTafsir && reading.status === "error" ? (
        <View className="mx-5 mb-2 flex-row items-center justify-between rounded-xl border border-forest/15 bg-ivory/90 px-4 py-2.5">
          <AppText variant="arabic" className="shrink text-xs text-forest/70" numberOfLines={1}>
            {t.quran.loadError}
          </AppText>
          <Pressable onPress={retry} className="ml-3 rounded-full bg-forest px-3 py-1 active:opacity-80">
            <AppText variant="arabic" className="text-xs text-cream">
              {t.quran.retry}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {showTafsir && reading.status === "loading" ? (
        <View className="mx-5 mb-2 flex-row items-center justify-center py-1">
          <ActivityIndicator size="small" color={colors.forest} />
        </View>
      ) : null}

      {/* Requirement 2: Highly Optimized FlatList for Long Surahs (e.g. Al-Baqarah) */}
      <View className="min-h-0 flex-1">
        {!listReady ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.forest} />
          </View>
        ) : (
          <View className="flex-1">
            <FlatList<AyahRow>
              key={String(surah.id)}
              ref={listRef}
              data={visibleRows}
              keyExtractor={ayahKey}
              renderItem={renderItem}
              extraData={showTafsir}
              ListHeaderComponent={listHeader}
              ListEmptyComponent={
                <AppText variant="arabic" className="px-6 py-10 text-center text-base text-forest/50">
                  {t.quran.ayahSearchEmpty}
                </AppText>
              }
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              onScrollToIndexFailed={onScrollToIndexFailed}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onScrollBeginDrag={onScrollBeginDrag}
              onScrollEndDrag={onScrollEndDrag}
              onMomentumScrollEnd={commitScrollSave}
              style={{ opacity: placed ? 1 : 0 }}
            />
            {placed ? null : (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="large" color={colors.forest} />
              </View>
            )}
          </View>
        )}
      </View>

      <View className="items-center" style={{ paddingBottom: insets.bottom }}>
        {awradItem ? (
          <AwradTasbeeh count={awradCount} target={awradItem.target} done={awradDone} onPress={onAwradCount} />
        ) : null}
      </View>
    </Screen>
  );
}

function ayahKey(row: AyahRow): string {
  return String(row.n);
}

// Clean traditional Mushaf Ayah Card: verse number rendered inline at the end with ﴿...﴾
const AyahCard = memo(function AyahCard({
  row,
  showTafsir,
  fontSize,
  lineHeight,
  onPress,
}: {
  row: AyahRow;
  showTafsir: boolean;
  fontSize: number;
  lineHeight: number;
  onPress?: (ayahNum: number) => void;
}) {
  return (
    <Pressable
      onPress={onPress ? () => onPress(row.n) : undefined}
      disabled={!onPress}
      className="mb-3.5 rounded-2xl border border-white/80 bg-white/95 p-5 active:bg-white/85"
      style={cardShadow}
    >
      <AppText
        variant="mushaf"
        className="text-right text-forest"
        style={{ fontSize, lineHeight }}
      >
        {row.arabic}
        {"\u00A0"}
        <Text
          style={{
            fontFamily: fonts.serif,
            color: colors.goldDeep,
            fontSize: Math.round(fontSize * 0.95),
          }}
        >
          {`﴿${toArabicIndic(row.n)}﴾`}
        </Text>
      </AppText>

      {showTafsir && row.tafsir ? (
        <View className="mt-4 border-t border-forest/10 pt-3.5">
          <AppText
            variant="arabic"
            weight="regular"
            className="text-right text-base leading-8 text-forestDeep/90"
          >
            {row.tafsir}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
});

function AwradTasbeeh({
  count,
  target,
  done,
  onPress,
}: {
  count: number;
  target: number;
  done: boolean;
  onPress: () => void;
}) {
  const t = useStrings();
  return (
    <Pressable
      onPress={onPress}
      disabled={done}
      className={`mb-1 mt-1 h-16 min-w-[76px] items-center justify-center rounded-full border px-4 ${
        done ? "border-gold bg-gold-soft" : "border-gold/80 bg-ivory active:opacity-80"
      }`}
      style={cardShadow}
      accessibilityRole="button"
      accessibilityState={{ disabled: done }}
      accessibilityLabel={done ? t.awradSurahs.tasbeehDone : t.awradSurahs.tasbeehA11y(count, target)}
    >
      {done ? (
        <Ionicons name="checkmark" size={22} color={colors.forest} />
      ) : (
        <AppText className="text-xl text-forest" style={{ fontVariant: ["tabular-nums"] }}>
          {formatCount(count)}
        </AppText>
      )}
      <AppText variant="arabic" className="text-[11px] text-gold-deep">
        {t.awradSurahs.progress(done ? target : count, target)}
      </AppText>
    </Pressable>
  );
}