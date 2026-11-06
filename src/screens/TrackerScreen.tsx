import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AppText } from "../components/AppText";
import { CalendarMonth } from "../components/CalendarMonth";
import { useFloatingTabBarInset } from "../components/FloatingTabBar";
import { Screen } from "../components/Screen";
import { usePreferences } from "../hooks/usePreferences";
import { useUnifiedAwrad } from "../hooks/useUnifiedAwrad";
import { useZikrStore } from "../hooks/useZikrStore";
import { formatMonthTitle, shiftMonth, todayKey } from "../lib/dates";
import { formatCount } from "../lib/formatCount";
import { dayMark, monthMarks, type DayMark } from "../lib/streaks";
import { colors } from "../theme/colors";

export function TrackerScreen() {
  const { t, language } = usePreferences();
  const bottomInset = useFloatingTabBarInset();
  const { zikrs, days, streak } = useZikrStore();
  const { summary, groups, countOf } = useUnifiedAwrad();
  const now = useMemo(() => new Date(), []);
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();
  const [{ year, month }, setCursor] = useState({ year: todayYear, month: todayMonth });
  const [selectedDay, setSelectedDay] = useState(todayDate);

  const todayStr = todayKey(now);
  const selectedKey = todayKey(new Date(year, month, selectedDay));
  const isToday = selectedKey === todayStr;

  // Flatten all daily awrad entries from the exact same store powering the top counter
  const allEntries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);

  const todayActiveEntries = useMemo(
    () => allEntries.filter((entry) => countOf(entry) > 0),
    [allEntries, countOf],
  );

  const todayMark: DayMark = useMemo(() => {
    if (summary.total > 0 && summary.done >= summary.total) return "complete";
    if (summary.done > 0 || todayActiveEntries.length > 0) return "partial";
    return dayMark(todayStr, zikrs, days);
  }, [days, summary.done, summary.total, todayActiveEntries.length, todayStr, zikrs]);

  const marks = useMemo(() => {
    const computed = monthMarks(year, month, zikrs, days);
    if (year === todayYear && month === todayMonth) {
      computed[todayDate] = todayMark;
    }
    return computed;
  }, [days, month, todayDate, todayMark, todayMonth, todayYear, year, zikrs]);

  const selectedMark: DayMark = isToday ? todayMark : (marks[selectedDay] ?? dayMark(selectedKey, zikrs, days));

  const effectiveStreak = useMemo(() => {
    const todayZikrActive = dayMark(todayStr, zikrs, days) !== "none";
    const todayAwradActive = summary.done > 0 || todayActiveEntries.length > 0;
    if (todayAwradActive && !todayZikrActive) {
      return streak + 1;
    }
    return streak;
  }, [days, streak, summary.done, todayActiveEntries.length, todayStr, zikrs]);

  const dailyRecords = useMemo(() => {
    if (isToday) {
      return todayActiveEntries
        .map((entry) => ({
          id: entry.key,
          text: entry.text,
          note: entry.note,
          count: countOf(entry),
          target: entry.target,
          completed: countOf(entry) >= entry.target,
          script: entry.script,
        }))
        .sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0));
    }
    const log = days[selectedKey];
    if (!log) return [];
    return zikrs
      .filter((z) => (log[z.id] ?? 0) > 0)
      .map((z) => ({
        id: z.id,
        text: z.title,
        note: undefined,
        count: log[z.id] ?? 0,
        target: z.target,
        completed: (log[z.id] ?? 0) >= z.target,
        script: "dua" as const,
      }));
  }, [countOf, days, isToday, selectedKey, todayActiveEntries, zikrs]);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4">
          <AppText variant="arabic" weight="bold" className="text-center text-3xl text-forest">
            {t.tracker.title}
          </AppText>
          <AppText variant="arabic" className="mt-1 text-center text-sm text-gold-deep">
            {t.tracker.subtitle}
          </AppText>
        </View>

        <View className="mt-5 flex-row gap-3">
          <StatCard label={t.tracker.streak} value={`${effectiveStreak}`} unit={t.common.day} />
          <StatCard label={t.tracker.today} value={`${summary.done}/${summary.total}`} unit={t.common.awradUnit} />
        </View>

        <View className="mt-5 rounded-3xl border border-gold/25 bg-ivory px-3 py-4">
          <View className="mb-2 flex-row items-center justify-between px-2">
            <Pressable
              onPress={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
              className="min-h-10 min-w-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={t.tracker.prevMonth}
            >
              <AppText className="text-lg text-forest">‹</AppText>
            </Pressable>
            <AppText variant="arabic" className="text-lg text-forest">
              {formatMonthTitle(year, month, language)}
            </AppText>
            <Pressable
              onPress={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
              className="min-h-10 min-w-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={t.tracker.nextMonth}
            >
              <AppText className="text-lg text-forest">›</AppText>
            </Pressable>
          </View>
          <CalendarMonth
            year={year}
            month={month}
            marks={marks}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
          <View className="mt-3 flex-row justify-center gap-4">
            <Legend colorClass="bg-gold" label={t.tracker.legendComplete} />
            <Legend colorClass="bg-gold/30" label={t.tracker.legendPartial} />
          </View>
        </View>

        <View className="mt-5 rounded-3xl bg-forest px-5 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <AppText variant="arabic" className="text-lg text-cream">
                {selectedMark === "complete"
                  ? t.tracker.dayComplete
                  : selectedMark === "partial"
                    ? t.tracker.dayPartial
                    : t.tracker.dayNone}
              </AppText>
              <AppText className="mt-1 text-sm text-cream/70">{selectedKey}</AppText>
            </View>
            {isToday && summary.total > 0 && (summary.done > 0 || dailyRecords.length > 0) ? (
              <View className="rounded-full bg-gold/20 px-3 py-1">
                <AppText className="text-xs font-semibold text-gold" style={{ fontVariant: ["tabular-nums"] }}>
                  {summary.done}/{summary.total} {t.common.awradUnit}
                </AppText>
              </View>
            ) : null}
          </View>

          {dailyRecords.length > 0 ? (
            <View className="mt-4 gap-2 border-t border-cream/15 pt-3">
              {dailyRecords.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between rounded-2xl bg-black/15 px-3.5 py-2.5"
                >
                  <View className="flex-row items-center gap-1.5">
                    {item.completed ? (
                      <Ionicons name="checkmark-circle" size={17} color={colors.gold} />
                    ) : (
                      <View className="h-4 w-4 rounded-full border border-gold/40" />
                    )}
                    <AppText
                      className="text-xs text-gold-soft"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatCount(item.count)}/{formatCount(item.target)}
                    </AppText>
                  </View>
                  <View className="flex-1 pl-3">
                    <AppText
                      variant={item.script === "quran" ? "mushaf" : "arabic"}
                      numberOfLines={1}
                      className="text-right text-sm text-cream"
                    >
                      {item.text}
                    </AppText>
                    {item.note ? (
                      <AppText
                        variant="arabic"
                        numberOfLines={1}
                        className="text-right text-[11px] text-cream/60"
                      >
                        {item.note}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View className="flex-1 rounded-3xl border border-gold/25 bg-ivory px-4 py-4">
      <AppText variant="arabic" className="text-xs text-forest/50">
        {label}
      </AppText>
      <AppText className="mt-1 text-2xl text-forest">{value}</AppText>
      <AppText variant="arabic" className="text-xs text-gold-deep">
        {unit}
      </AppText>
    </View>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-3 w-3 rounded-full ${colorClass}`} />
      <AppText variant="arabic" className="text-xs text-forest/60">
        {label}
      </AppText>
    </View>
  );
}
