import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, fonts } from "../components/AppText";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NightGradient } from "../components/NightGradient";
import { ProgressRing } from "../components/ProgressRing";
import { useZikrStore } from "../hooks/useZikrStore";
import {
  completionRatio,
  digitsOnly,
  formatCount,
  formatPercent,
  parseCount,
  remainingCount,
} from "../lib/formatCount";
import { hapticTap } from "../lib/haptics";
import { usePreferences } from "../hooks/usePreferences";
import { colors } from "../theme/colors";
import { ZIKR_SECTIONS, type ZikrType } from "../types/zikr";

const TAB_BAR_HEIGHT = 68;
/** Header, type tabs, zikr chips, the stats strip and the tasbeeh button around the ring. */
const CHROME_HEIGHT = 356;
const MACRO_STEP = 101;
const MAX_CONTENT_WIDTH = 448;

const tapProps = (onTap: () => void) => (Platform.OS === "web" ? { onPress: onTap } : { onPressIn: onTap });
export function ZikrScreen() {
  const { t, language, arabicScale } = usePreferences();
  const router = useRouter();
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);
  const params = useLocalSearchParams<{ id?: string }>();
  const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { zikrs, selectedId, setSelectedId, increment, setCompleted, resetZikr, flush } = useZikrStore();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const chipsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (paramId && zikrs.some((item) => item.id === paramId)) {
      setSelectedId(paramId);
    }
  }, [paramId, setSelectedId, zikrs]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        flush();
      };
    }, [flush]),
  );

  const zikr = zikrs.find((item) => item.id === selectedId) ?? zikrs[0];
  const count = zikr?.completed ?? 0;

  // The active tab is always the selected zikr's JSON `type`, never a label.
  const activeType = zikr?.type;
  const sections = useMemo(
    () => ZIKR_SECTIONS.filter((section) => zikrs.some((item) => item.type === section.type)),
    [zikrs],
  );
  const visibleZikrs = useMemo(() => zikrs.filter((item) => item.type === activeType), [activeType, zikrs]);

  const lastByType = useRef<Partial<Record<ZikrType, string>>>({});
  useEffect(() => {
    if (zikr) lastByType.current[zikr.type] = zikr.id;
  }, [zikr]);

  const selectType = useCallback(
    (type: ZikrType) => {
      if (type === activeType) return;
      const remembered = lastByType.current[type];
      const target =
        zikrs.find((item) => item.id === remembered && item.type === type) ??
        zikrs.find((item) => item.type === type);
      if (!target) return;
      hapticTap("light");
      setSelectedId(target.id);
    },
    [activeType, setSelectedId, zikrs],
  );

  const ringScale = useSharedValue(1);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.get() }] }));

  const countShift = useSharedValue(0);
  const countStyle = useAnimatedStyle(() => {
    const shift = countShift.get();
    const amount = Math.abs(shift);
    return {
      opacity: 1 - amount * 0.65,
      transform: [{ translateY: shift * 18 }, { scale: 1 - amount * 0.08 }],
    };
  });

  const lastShown = useRef({ id: zikr?.id, count });
  useEffect(() => {
    const previous = lastShown.current;
    lastShown.current = { id: zikr?.id, count };
    if (previous.id !== zikr?.id || previous.count === count) return;
    countShift.set(
      withSequence(
        withTiming(count > previous.count ? 1 : -1, { duration: 0 }),
        withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }),
      ),
    );
  }, [count, countShift, zikr?.id]);

  const openEditor = useCallback(() => {
    if (!zikr) return;
    hapticTap("light");
    setDraft(String(count));
    setEditing(true);
  }, [count, zikr]);

  const closeEditor = useCallback(() => setEditing(false), []);

  const commitDraft = useCallback(() => {
    if (!zikr) return;
    const parsed = parseCount(draft);
    setEditing(false);
    if (parsed == null || parsed === count) return;
    setCompleted(zikr.id, parsed);
    hapticTap(parsed >= zikr.target ? "heavy" : "light");
  }, [count, draft, setCompleted, zikr]);

  const onTasbeeh = useCallback(() => {
    if (!zikr || count >= zikr.target) return;
    const next = count + MACRO_STEP;
    setCompleted(zikr.id, next);
    hapticTap(next >= zikr.target ? "heavy" : "light");
    ringScale.set(withSequence(withTiming(0.975, { duration: 50 }), withTiming(1, { duration: 160 })));
  }, [count, ringScale, setCompleted, zikr]);

  const onTap = useCallback(() => {
    if (editing || !zikr) return;
    const result = increment(zikr.id);
    if (result === "finished") return;
    hapticTap(result === "completed" ? "heavy" : "light");
    ringScale.set(withSequence(withTiming(0.975, { duration: 50 }), withTiming(1, { duration: 160 })));
  }, [editing, increment, ringScale, zikr]);

  if (!zikr) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <NightGradient id="zikr-empty-bg" />
        <AppText variant="arabic" className="text-xl text-cream">
          {t.zikr.empty}
        </AppText>
      </View>
    );
  }

  const done = count >= zikr.target;
  const ratio = completionRatio(count, zikr.target);
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const ringSize = Math.round(
    Math.max(220, Math.min(contentWidth - 40, 420, height - insets.top - TAB_BAR_HEIGHT - CHROME_HEIGHT)),
  );
  const countText = formatCount(count);
  const countSize = Math.round(Math.min(ringSize * 0.24, (ringSize * 0.6) / (countText.length * 0.58)));
  const titleSize = Math.round(ringSize * 0.085 * arabicScale);

  return (
    <View className="flex-1 select-none bg-black">
      {focused ? <StatusBar style="light" /> : null}
      <NightGradient id="zikr-bg" centerY="52%" halo />

      <Pressable
        {...tapProps(onTap)}
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel={
          done
            ? t.zikr.a11yDone(zikr.title)
            : t.zikr.a11yTap(zikr.title, countText, formatCount(zikr.target))
        }
        accessibilityState={{ disabled: done }}
      />

      <View
        className="mx-auto w-full max-w-md flex-1 px-5"
        style={[styles.boxNone, { paddingTop: insets.top + 8 }]}
      >
        <View className="flex-row items-center justify-between" style={styles.boxNone}>
          <View className="flex-row items-center gap-3" style={styles.boxNone}>
            <Pressable
              onPress={goBack}
              hitSlop={6}
              className="h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-white/5 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <Ionicons name="chevron-back" size={20} color={colors.gold} />
            </Pressable>
            <View style={styles.none}>
              <AppText variant="arabic" className="text-[11px] tracking-[1px] text-gold/70">
                {t.zikr.brand}
              </AppText>
              <AppText variant="arabic" className="text-2xl text-cream" style={{ lineHeight: 40 }}>
                {t.zikr.title}
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={() => setConfirmingReset(true)}
            className="min-h-11 flex-row items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-4 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={t.zikr.resetCounter}
          >
            <Ionicons name="refresh" size={16} color={colors.gold} />
            <AppText variant="arabic" className="text-sm text-gold-soft">
              {t.common.reset}
            </AppText>
          </Pressable>
        </View>

        {sections.length > 1 ? (
          <View
            className="mt-4 flex-row-reverse rounded-full border border-white/10 bg-white/5 p-1"
            accessibilityRole="tablist"
          >
            {sections.map((section) => {
              const active = section.type === activeType;
              return (
                <Pressable
                  key={section.type}
                  onPress={() => selectType(section.type)}
                  className={`min-h-10 flex-1 items-center justify-center rounded-full ${
                    active ? "bg-gold/15" : "active:bg-white/5"
                  }`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <AppText
                    variant="arabic"
                    weight={active ? "bold" : "medium"}
                    className={active ? "text-sm text-gold" : "text-sm text-cream/60"}
                  >
                    {language === "ar" ? section.titleAr : section.title}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <ScrollView
          ref={chipsScrollRef}
          key={activeType}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 mt-3 grow-0"
          contentContainerStyle={{ flexDirection: "row-reverse", gap: 8, paddingHorizontal: 20 }}
          onContentSizeChange={() => {
            if (!I18nManager.isRTL) {
              chipsScrollRef.current?.scrollToEnd({ animated: false });
            }
          }}
        >
          {visibleZikrs.map((item) => {
            const active = item.id === zikr.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (active) return;
                  hapticTap("light");
                  setSelectedId(item.id);
                }}
                className={`shrink-0 min-h-11 justify-center rounded-full px-5 py-2 ${
                  active ? "bg-gold" : "border border-white/15 bg-white/5 active:bg-white/10"
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <AppText
                  variant="serif"
                  numberOfLines={1}
                  className={`whitespace-nowrap ${
                    active ? "text-base text-forest-deep" : "text-base text-cream/75"
                  }`}
                  style={styles.chipLabel}
                >
                  {item.title}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="flex-1 items-center justify-center" style={styles.boxNone}>
          <Animated.View style={ringStyle} pointerEvents="box-none">
            <ProgressRing value={ratio} size={ringSize} stroke={Math.max(10, Math.round(ringSize * 0.035))}>
              <View className="items-center" pointerEvents="box-none" style={{ width: ringSize * 0.66 }}>
                <View pointerEvents="none">
                  <AppText
                    variant="serif"
                    className="text-center text-gold-soft"
                    style={{ fontSize: titleSize, lineHeight: Math.round(titleSize * 1.6) }}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {zikr.title}
                  </AppText>
                </View>

                <Pressable
                  onPress={openEditor}
                  className="items-center active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel={t.zikr.editCountA11y(zikr.title, countText)}
                >
                  <Animated.View style={countStyle}>
                    <AppText
                      weight="regular"
                      className="text-center text-gold"
                      style={[styles.countGlow, { fontSize: countSize, lineHeight: Math.round(countSize * 1.2) }]}
                      maxFontSizeMultiplier={1}
                      accessibilityLiveRegion="polite"
                    >
                      {countText}
                    </AppText>
                  </Animated.View>
                  <Ionicons name="pencil" size={14} color={colors.goldSoft} style={{ opacity: 0.75 }} />
                </Pressable>

                <View className="my-2 h-px w-10 bg-gold/40" pointerEvents="none" />
                <View pointerEvents="none">
                  {done ? (
                    <AppText variant="serif" className="text-lg text-gold" style={{ lineHeight: 30 }}>
                      {t.zikr.completed}
                    </AppText>
                  ) : (
                    <AppText variant="arabic" className="text-xs text-cream/50">
                      {t.zikr.ofTarget(formatCount(zikr.target))}
                    </AppText>
                  )}
                </View>
              </View>
            </ProgressRing>
          </Animated.View>
        </View>

        <View
          className="mb-3 flex-row items-center rounded-3xl border border-white/10 bg-white/5 py-3"
          style={styles.none}
        >
          <Stat label={t.zikr.statDone} value={countText} />
          <View className="h-8 w-px bg-white/10" />
          <Stat label={t.zikr.statLeft} value={formatCount(remainingCount(count, zikr.target))} />
          <View className="h-8 w-px bg-white/10" />
          <Stat label={t.zikr.statRate} value={formatPercent(ratio)} />
        </View>

        <Pressable
          onPress={onTasbeeh}
          disabled={done}
          className={`mb-4 min-h-12 flex-row items-center justify-center gap-2 self-center rounded-full border px-6 ${done ? "border-white/10 opacity-40" : "border-gold/50 bg-gold/10 active:opacity-70"}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: done }}
          accessibilityLabel={t.zikr.tasbeehA11y}
        >
          <AppText className="text-base text-gold" style={styles.tabular}>
            +{MACRO_STEP}
          </AppText>
          <AppText variant="arabic" className="text-sm text-gold-soft">
            {t.zikr.brand}
          </AppText>
        </Pressable>
      </View>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={closeEditor}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
        >
          <Pressable className="absolute inset-0" onPress={closeEditor} accessible={false} />
          <View className="w-full max-w-sm rounded-3xl border border-gold/30 bg-black px-6 py-6">
            <AppText variant="arabic" className="text-center text-sm text-gold/70">
              {t.zikr.editCount}
            </AppText>
            <AppText variant="serif" className="mt-1 text-center text-xl text-cream" numberOfLines={1}>
              {zikr.title}
            </AppText>
            <TextInput
              value={draft}
              onChangeText={(text) => setDraft(digitsOnly(text))}
              keyboardType="number-pad"
              inputMode="numeric"
              autoFocus
              selectTextOnFocus
              maxLength={Math.max(3, String(zikr.target).length)}
              onSubmitEditing={commitDraft}
              returnKeyType="done"
              className="mt-4 h-16 rounded-2xl border border-gold/40 bg-white/5 text-center text-3xl text-gold"
              style={[styles.tabular, { color: colors.gold, fontFamily: fonts.sans.medium }]}
              accessibilityLabel={t.zikr.editCount}
            />
            <AppText variant="arabic" className="mt-2 text-center text-xs text-cream/50">
              {t.zikr.ofTarget(formatCount(zikr.target))}
            </AppText>
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={closeEditor}
                className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 active:opacity-70"
                accessibilityRole="button"
              >
                <AppText variant="arabic" className="text-base text-cream">
                  {t.common.cancel}
                </AppText>
              </Pressable>
              <Pressable
                onPress={commitDraft}
                className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-gold active:opacity-80"
                accessibilityRole="button"
              >
                <AppText variant="arabic" className="text-base text-forest-deep">
                  {t.common.save}
                </AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={confirmingReset}
        title={t.zikr.resetTitle}
        message={t.zikr.resetMessage(zikr.title)}
        onConfirm={() => {
          resetZikr(zikr.id);
          setConfirmingReset(false);
        }}
        onCancel={() => setConfirmingReset(false)}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <AppText variant="arabic" className="text-[11px] text-cream/45">
        {label}
      </AppText>
      <AppText className="mt-1 text-base text-cream" style={styles.tabular}>
        {value}
      </AppText>
    </View>
  );
}

// Kept in StyleSheet.create: react-native-web drops `box-none` from inline styles.
const styles = StyleSheet.create({
  boxNone: { pointerEvents: "box-none" },
  none: { pointerEvents: "none" },
  chipLabel: { flexShrink: 0, lineHeight: 26 },
  tabular: { fontVariant: ["tabular-nums"] },
  countGlow: {
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(212, 175, 55, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
});
