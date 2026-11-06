import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, View, type ListRenderItem } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "../components/AppText";
import { AwradEntryCard } from "../components/AwradEntryCard";
import { CountEditModal } from "../components/CountEditModal";
import { Screen } from "../components/Screen";
import { useStrings } from "../hooks/usePreferences";
import { useUnifiedAwrad } from "../hooks/useUnifiedAwrad";
import { hapticTap } from "../lib/haptics";
import type { AwradEntry, AwradGroupId, AwradRow } from "../lib/unifiedAwrad";
import { colors } from "../theme/colors";

export function DailyZikrScreen() {
  const t = useStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, groups, summary, countOf, increment, decrement, setCount } = useUnifiedAwrad();
  const [groupId, setGroupId] = useState<AwradGroupId>("murid");
  const [editing, setEditing] = useState<AwradEntry | null>(null);

  const onEdit = useCallback((entry: AwradEntry) => {
    hapticTap("light");
    setEditing(entry);
  }, []);

  const onSaveEdit = useCallback(
    (value: number) => {
      if (!editing) return;
      const reached = value >= editing.target && countOf(editing) < editing.target;
      setCount(editing, value);
      hapticTap(reached ? "heavy" : "light");
      setEditing(null);
    },
    [countOf, editing, setCount],
  );

  const group = groups.find((item) => item.id === groupId) ?? groups[0]!;
  const progress = summary.groups;
  const doneAll = summary.done;
  const totalAll = summary.total;
  const ratioAll = totalAll > 0 ? doneAll / totalAll : 0;

  const onStep = useCallback(
    (entry: AwradEntry, delta: 1 | -1) => {
      if (delta < 0) {
        decrement(entry);
        hapticTap("light");
        return;
      }
      const result = increment(entry);
      if (result === "finished") return;
      hapticTap(result === "completed" ? "heavy" : "light");
    },
    [decrement, increment],
  );

  const onOpen = useCallback(
    (entry: AwradEntry) => {
      const surah = entry.surah;
      if (!surah) return;
      hapticTap("light");
      router.push({
        pathname: "/quran/[id]",
        params: {
          id: String(surah.surahId),
          awrad: surah.id,
          target: String(surah.target),
          count: String(countOf(entry)),
          ...(surah.range ? { from: String(surah.range.from), to: String(surah.range.to) } : null),
        },
      });
    },
    [countOf, router],
  );

  const renderRow = useCallback<ListRenderItem<AwradRow>>(
    ({ item }) => {
      if (item.kind === "heading") {
        return (
          <AppText variant="arabic" weight="semibold" className="mb-2.5 mt-3 text-right text-sm text-forest/65">
            {item.title}
          </AppText>
        );
      }
      return (
        <AwradEntryCard
          entry={item}
          count={countOf(item)}
          onStep={onStep}
          onEdit={onEdit}
          onOpen={item.surah ? onOpen : undefined}
        />
      );
    },
    [countOf, onEdit, onOpen, onStep],
  );

  return (
    <Screen>
      <View className="px-5 pb-3">
        <View className="mt-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="h-11 w-11 items-center justify-center rounded-full border border-gold/70 bg-ivory active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <Ionicons name="chevron-back" size={20} color={colors.forest} />
          </Pressable>
          <AppText variant="arabic" weight="bold" className="flex-1 pl-3 text-right text-2xl text-forest">
            {t.home.dailyTitle}
          </AppText>
        </View>

        <View className="mt-4 rounded-xl border border-forest/[0.08] bg-ivory px-4 py-3 shadow-sm">
          <View className="flex-row items-center justify-between">
            <AppText weight="semibold" className="text-sm text-forest" style={{ fontVariant: ["tabular-nums"] }}>
              {Math.round(ratioAll * 100)}%
            </AppText>
            <AppText variant="arabic" className="text-sm text-forest/70">
              {ready ? t.daily.doneCount(doneAll, totalAll) : " "}
            </AppText>
          </View>
          <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest/10">
            <View className="h-full rounded-full bg-forest" style={{ width: `${ratioAll * 100}%` }} />
          </View>
        </View>

        <View className="mt-3 flex-row-reverse gap-1 rounded-xl bg-forest/[0.07] p-1" accessibilityRole="tablist">
          {groups.map((item) => {
            const active = item.id === group.id;
            const stats = progress.find((entry) => entry.id === item.id);
            const complete = stats != null && stats.total > 0 && stats.done >= stats.total;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (active) return;
                  hapticTap("light");
                  setGroupId(item.id);
                }}
                className={`min-h-12 flex-1 items-center justify-center rounded-lg px-1 py-1.5 ${
                  active ? "bg-forest" : "active:bg-forest/10"
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.title}
              >
                <AppText
                  variant="arabic"
                  weight="semibold"
                  numberOfLines={1}
                  className={`text-xs ${active ? "text-ivory" : "text-forest"}`}
                >
                  {item.title}
                </AppText>
                <AppText
                  className={`text-[10px] ${active ? "text-gold-soft" : complete ? "text-forest" : "text-forest/50"}`}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {stats ? `${stats.done}/${stats.total}` : ""}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        key={group.id}
        data={ready ? group.rows : []}
        keyExtractor={(item) => item.key}
        renderItem={renderRow}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
      />

      {editing ? (
        <CountEditModal
          key={editing.key}
          title={editing.text}
          count={countOf(editing)}
          target={editing.target}
          onSave={onSaveEdit}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Screen>
  );
}
