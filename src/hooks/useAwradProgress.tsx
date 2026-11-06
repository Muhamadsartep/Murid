import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import {
  AWRAD_PROGRESS_KEY,
  awradTarget,
  emptyAwradDay,
  normalizeAwradDay,
  type AwradDayProgress,
} from "../lib/awradProgress";
import { todayKey } from "../lib/dates";
import type { IncrementResult } from "./useZikrStore";

type AwradProgressValue = {
  ready: boolean;
  counts: Record<string, number>;
  increment: (id: string) => IncrementResult;
  decrement: (id: string) => void;
  /** Sets today's count directly, clamped to 0…target. */
  setCount: (id: string, value: number) => void;
};

const AwradProgressContext = createContext<AwradProgressValue | null>(null);

export function AwradProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<AwradDayProgress>(emptyAwradDay);
  const [ready, setReady] = useState(false);
  const progressRef = useRef(progress);
  const pendingRef = useRef<AwradDayProgress | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next = pendingRef.current;
    pendingRef.current = null;
    if (!next) return;
    chainRef.current = chainRef.current
      .then(() => AsyncStorage.setItem(AWRAD_PROGRESS_KEY, JSON.stringify(next)))
      .catch(() => undefined);
  }, []);

  const commit = useCallback(
    (next: AwradDayProgress) => {
      progressRef.current = next;
      setProgress(next);
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 250);
    },
    [flush],
  );

  const currentDay = useCallback((): AwradDayProgress => {
    const today = todayKey();
    if (progressRef.current.date === today) return progressRef.current;
    const next = emptyAwradDay(today);
    progressRef.current = next;
    setProgress(next);
    pendingRef.current = next;
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(AWRAD_PROGRESS_KEY)
      .then((raw) => {
        if (cancelled) return;
        let parsed: unknown = null;
        if (raw) {
          try {
            parsed = JSON.parse(raw) as unknown;
          } catch {
            parsed = null;
          }
        }
        const loaded = normalizeAwradDay(parsed);
        progressRef.current = loaded;
        setProgress(loaded);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") currentDay();
      if (next === "background" || next === "inactive") flush();
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [currentDay, flush]);

  const increment = useCallback(
    (id: string): IncrementResult => {
      const target = awradTarget(id);
      if (target == null) return "finished";
      const day = currentDay();
      const count = day.counts[id] ?? 0;
      if (count >= target) return "finished";
      const completed = count + 1;
      commit({ date: day.date, counts: { ...day.counts, [id]: completed } });
      return completed >= target ? "completed" : "counted";
    },
    [commit, currentDay],
  );

  const decrement = useCallback(
    (id: string) => {
      const target = awradTarget(id);
      if (target == null) return;
      const day = currentDay();
      const count = day.counts[id] ?? 0;
      if (count <= 0) return;
      const counts = { ...day.counts };
      if (count === 1) delete counts[id];
      else counts[id] = count - 1;
      commit({ date: day.date, counts });
    },
    [commit, currentDay],
  );

  const setCount = useCallback(
    (id: string, value: number) => {
      const target = awradTarget(id);
      if (target == null || !Number.isFinite(value)) return;
      const day = currentDay();
      const next = Math.min(target, Math.max(0, Math.floor(value)));
      if ((day.counts[id] ?? 0) === next) return;
      const counts = { ...day.counts };
      if (next === 0) delete counts[id];
      else counts[id] = next;
      commit({ date: day.date, counts });
    },
    [commit, currentDay],
  );

  const value = useMemo<AwradProgressValue>(
    () => ({ ready, counts: progress.counts, increment, decrement, setCount }),
    [decrement, increment, progress.counts, ready, setCount],
  );

  return <AwradProgressContext.Provider value={value}>{children}</AwradProgressContext.Provider>;
}

export function useAwradProgress(): AwradProgressValue {
  const store = useContext(AwradProgressContext);
  if (!store) throw new Error("useAwradProgress must be used within AwradProgressProvider");
  return store;
}
