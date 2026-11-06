import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { buildAwradGroups, type AwradEntry, type AwradGroup, type AwradGroupId } from "../lib/unifiedAwrad";
import { useAwradProgress } from "./useAwradProgress";
import { useDailyAzkarCounts } from "./useDailyAzkarCounts";
import { useMuridDailyCounts } from "./useMuridDailyCounts";
import { usePreferences } from "./usePreferences";
import type { IncrementResult } from "./useZikrStore";

export type AwradGroupProgress = { id: AwradGroupId; done: number; total: number };

export type AwradSummary = {
  /** Entries at or past their target, across every group. */
  done: number;
  /** Every tracked entry across every group. */
  total: number;
  groups: AwradGroupProgress[];
};

type UnifiedAwradValue = {
  ready: boolean;
  groups: AwradGroup[];
  summary: AwradSummary;
  countOf: (entry: AwradEntry) => number;
  increment: (entry: AwradEntry) => IncrementResult;
  decrement: (entry: AwradEntry) => void;
  /** Sets the entry's count directly, clamped to 0…target by its store. */
  setCount: (entry: AwradEntry, value: number) => void;
};

const UnifiedAwradContext = createContext<UnifiedAwradValue | null>(null);

/**
 * Single owner of today's wird progress: murid wird, morning/evening azkar and surah passages.
 * Each source keeps its own storage key; every screen reads the counts through this one context.
 */
export function UnifiedAwradProvider({ children }: { children: ReactNode }) {
  const { t, language } = usePreferences();
  const murid = useMuridDailyCounts();
  const azkar = useDailyAzkarCounts();
  const surahs = useAwradProgress();

  const groups = useMemo(() => buildAwradGroups(t, language), [t, language]);

  const countOf = useCallback(
    (entry: AwradEntry): number => {
      const counts = entry.source === "murid" ? murid.counts : entry.source === "azkar" ? azkar.counts : surahs.counts;
      return counts[entry.storeId] ?? 0;
    },
    [azkar.counts, murid.counts, surahs.counts],
  );

  const summary = useMemo<AwradSummary>(() => {
    const perGroup = groups.map((group) => ({
      id: group.id,
      done: group.entries.filter((entry) => countOf(entry) >= entry.target).length,
      total: group.entries.length,
    }));
    return {
      done: perGroup.reduce((sum, group) => sum + group.done, 0),
      total: perGroup.reduce((sum, group) => sum + group.total, 0),
      groups: perGroup,
    };
  }, [countOf, groups]);

  const { increment: muridIncrement, decrement: muridDecrement } = murid;
  const { increment: azkarIncrement, decrement: azkarDecrement } = azkar;
  const { increment: surahIncrement, decrement: surahDecrement } = surahs;

  const increment = useCallback(
    (entry: AwradEntry): IncrementResult => {
      if (entry.source === "murid") return muridIncrement(entry.storeId);
      if (entry.source === "azkar") return azkarIncrement(entry.storeId);
      return surahIncrement(entry.storeId);
    },
    [azkarIncrement, muridIncrement, surahIncrement],
  );

  const decrement = useCallback(
    (entry: AwradEntry) => {
      if (entry.source === "murid") muridDecrement(entry.storeId);
      else if (entry.source === "azkar") azkarDecrement(entry.storeId);
      else surahDecrement(entry.storeId);
    },
    [azkarDecrement, muridDecrement, surahDecrement],
  );

  const { setCount: muridSetCount } = murid;
  const { setCount: azkarSetCount } = azkar;
  const { setCount: surahSetCount } = surahs;

  const setCount = useCallback(
    (entry: AwradEntry, value: number) => {
      if (entry.source === "murid") muridSetCount(entry.storeId, value);
      else if (entry.source === "azkar") azkarSetCount(entry.storeId, value);
      else surahSetCount(entry.storeId, value);
    },
    [azkarSetCount, muridSetCount, surahSetCount],
  );

  const ready = murid.ready && azkar.ready && surahs.ready;

  const value = useMemo<UnifiedAwradValue>(
    () => ({ ready, groups, summary, countOf, increment, decrement, setCount }),
    [countOf, decrement, groups, increment, ready, setCount, summary],
  );

  return <UnifiedAwradContext.Provider value={value}>{children}</UnifiedAwradContext.Provider>;
}

export function useUnifiedAwrad(): UnifiedAwradValue {
  const ctx = useContext(UnifiedAwradContext);
  if (!ctx) throw new Error("useUnifiedAwrad must be used within UnifiedAwradProvider");
  return ctx;
}
