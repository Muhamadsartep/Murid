import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import seedData from "../data/zikrs.json";
import { todayKey } from "../lib/dates";
import { bumpDayLog, computeStreak, practicedCount, type DaysMap } from "../lib/streaks";
import { STORAGE_KEY, clampCompleted, mergeWithSeed, parseStored } from "../lib/zikrStorage";
import type { Zikr, ZikrType } from "../types/zikr";

export type IncrementResult = "counted" | "completed" | "finished";

type ZikrStoreValue = {
  zikrs: Zikr[];
  ready: boolean;
  selectedId: string;
  setSelectedId: (id: string) => void;
  increment: (id: string) => IncrementResult;
  setCompleted: (id: string, value: number) => void;
  resetZikr: (id: string) => void;
  resetAll: () => void;
  flush: () => void;
  days: DaysMap;
  practicedToday: number;
  streak: number;
};

const TRACKER_KEY = "zikr-tasbih.days.v1";
const SELECTED_KEY = "zikr-tasbih.selected.v1";
const ZIKR_TYPES = new Set<ZikrType>(["asli", "fari", "asran"]);

const SEED_ZIKRS: Zikr[] = seedData.map((item) => {
  if (!ZIKR_TYPES.has(item.type as ZikrType)) {
    throw new Error(`Unknown zikr type: ${item.type}`);
  }
  return {
    id: item.id,
    type: item.type as ZikrType,
    title: item.title,
    target: item.target,
    completed: 0,
  };
});

const ZikrStoreContext = createContext<ZikrStoreValue | null>(null);

function parseDays(raw: unknown): DaysMap {
  if (!raw || typeof raw !== "object") return {};
  const days: DaysMap = {};
  for (const [date, log] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !log || typeof log !== "object") continue;
    const next: Record<string, number> = {};
    for (const [id, count] of Object.entries(log as Record<string, unknown>)) {
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        next[id] = Math.floor(count);
      }
    }
    days[date] = next;
  }
  return days;
}

async function loadState(): Promise<{ zikrs: Zikr[]; days: DaysMap; selectedId: string }> {
  try {
    const [zikrRaw, daysRaw, selectedRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(TRACKER_KEY),
      AsyncStorage.getItem(SELECTED_KEY),
    ]);
    const zikrs = mergeWithSeed(SEED_ZIKRS, parseStored(zikrRaw));
    const days = parseDays(parseStored(daysRaw));
    const selectedId =
      typeof selectedRaw === "string" && zikrs.some((item) => item.id === selectedRaw)
        ? selectedRaw
        : (zikrs[0]?.id ?? "1");
    if (zikrRaw == null) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(zikrs));
    }
    return { zikrs, days, selectedId };
  } catch {
    return { zikrs: mergeWithSeed(SEED_ZIKRS, null), days: {}, selectedId: SEED_ZIKRS[0]?.id ?? "1" };
  }
}

export function ZikrStoreProvider({ children }: { children: ReactNode }) {
  const [zikrs, setZikrs] = useState<Zikr[]>([]);
  const [days, setDays] = useState<DaysMap>({});
  const [selectedId, setSelectedIdState] = useState("1");
  const [ready, setReady] = useState(false);

  const zikrsRef = useRef<Zikr[]>([]);
  const daysRef = useRef<DaysMap>({});
  const pendingZikrs = useRef<Zikr[] | null>(null);
  const pendingDays = useRef<DaysMap | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const enqueueWrite = useCallback(() => {
    const nextZikrs = pendingZikrs.current;
    const nextDays = pendingDays.current;
    pendingZikrs.current = null;
    pendingDays.current = null;
    chainRef.current = chainRef.current
      .then(async () => {
        if (nextZikrs) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextZikrs));
        if (nextDays) await AsyncStorage.setItem(TRACKER_KEY, JSON.stringify(nextDays));
      })
      .catch(() => undefined);
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingZikrs.current || pendingDays.current) enqueueWrite();
  }, [enqueueWrite]);

  const scheduleSave = useCallback(
    (nextZikrs: Zikr[] | null, nextDays: DaysMap | null, immediate: boolean) => {
      if (nextZikrs) pendingZikrs.current = nextZikrs;
      if (nextDays) pendingDays.current = nextDays;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (immediate) {
        timerRef.current = null;
        flush();
      } else {
        timerRef.current = setTimeout(flush, 250);
      }
    },
    [flush],
  );

  useEffect(() => {
    let cancelled = false;
    loadState()
      .then((loaded) => {
        if (cancelled) return;
        zikrsRef.current = loaded.zikrs;
        daysRef.current = loaded.days;
        setZikrs(loaded.zikrs);
        setDays(loaded.days);
        setSelectedIdState(loaded.selectedId);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = mergeWithSeed(SEED_ZIKRS, null);
        zikrsRef.current = fallback;
        setZikrs(fallback);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "background" || next === "inactive") flush();
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);

  const commitZikrs = useCallback(
    (next: Zikr[], immediate: boolean) => {
      zikrsRef.current = next;
      setZikrs(next);
      scheduleSave(next, null, immediate);
    },
    [scheduleSave],
  );

  const increment = useCallback(
    (id: string): IncrementResult => {
      const current = zikrsRef.current.find((item) => item.id === id);
      if (!current || current.completed >= current.target) return "finished";

      const completed = current.completed + 1;
      const next = zikrsRef.current.map((item) => (item.id === id ? { ...item, completed } : item));
      const nextDays = bumpDayLog(daysRef.current, id, todayKey());
      daysRef.current = nextDays;
      setDays(nextDays);
      commitZikrs(next, false);
      scheduleSave(null, nextDays, false);
      return completed >= current.target ? "completed" : "counted";
    },
    [commitZikrs, scheduleSave],
  );

  const setCompleted = useCallback(
    (id: string, value: number) => {
      const current = zikrsRef.current.find((item) => item.id === id);
      if (!current) return;
      const completed = clampCompleted(value, current.target);
      if (completed === current.completed) return;

      const next = zikrsRef.current.map((item) => (item.id === id ? { ...item, completed } : item));
      if (completed > 0) {
        const today = todayKey();
        const logged = daysRef.current[today]?.[id] ?? 0;
        if (logged <= 0) {
          const nextDays = bumpDayLog(daysRef.current, id, today);
          daysRef.current = nextDays;
          setDays(nextDays);
          scheduleSave(null, nextDays, true);
        }
      }
      commitZikrs(next, true);
    },
    [commitZikrs, scheduleSave],
  );

  const resetZikr = useCallback(
    (id: string) => {
      const next = zikrsRef.current.map((item) => (item.id === id ? { ...item, completed: 0 } : item));
      commitZikrs(next, true);
    },
    [commitZikrs],
  );

  const resetAll = useCallback(() => {
    const next = zikrsRef.current.map((item) => ({ ...item, completed: 0 }));
    commitZikrs(next, true);
  }, [commitZikrs]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    void AsyncStorage.setItem(SELECTED_KEY, id).catch(() => undefined);
  }, []);

  const practicedToday = useMemo(
    () => practicedCount(todayKey(), zikrs, days),
    [days, zikrs],
  );
  const streak = useMemo(() => computeStreak(zikrs, days), [days, zikrs]);

  const value = useMemo<ZikrStoreValue>(
    () => ({
      zikrs,
      ready,
      selectedId,
      setSelectedId,
      increment,
      setCompleted,
      resetZikr,
      resetAll,
      flush,
      days,
      practicedToday,
      streak,
    }),
    [
      zikrs,
      ready,
      selectedId,
      setSelectedId,
      increment,
      setCompleted,
      resetZikr,
      resetAll,
      flush,
      days,
      practicedToday,
      streak,
    ],
  );

  return <ZikrStoreContext.Provider value={value}>{children}</ZikrStoreContext.Provider>;
}

export function useZikrStore(): ZikrStoreValue {
  const store = useContext(ZikrStoreContext);
  if (!store) {
    throw new Error("useZikrStore must be used within ZikrStoreProvider");
  }
  return store;
}
