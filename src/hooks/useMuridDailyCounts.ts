import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { todayKey } from "../lib/dates";
import { muridDailyTarget } from "../lib/muridDaily";
import type { IncrementResult } from "./useZikrStore";

const STORAGE_KEY = "zikr-tasbih.murid-daily.v1";

type DayCounts = { date: string; counts: Record<string, number> };

function emptyDay(date = todayKey()): DayCounts {
  return { date, counts: {} };
}

function normalize(stored: unknown, date = todayKey()): DayCounts {
  if (!stored || typeof stored !== "object") return emptyDay(date);
  const record = stored as Record<string, unknown>;
  if (record.date !== date || !record.counts || typeof record.counts !== "object") return emptyDay(date);
  const counts: Record<string, number> = {};
  for (const [key, value] of Object.entries(record.counts as Record<string, unknown>)) {
    const target = muridDailyTarget(key);
    if (target == null || typeof value !== "number" || !Number.isFinite(value)) continue;
    const count = Math.floor(value);
    if (count > 0) counts[key] = Math.min(target, count);
  }
  return { date, counts };
}

export function useMuridDailyCounts() {
  const [day, setDay] = useState<DayCounts>(emptyDay);
  const [ready, setReady] = useState(false);
  const dayRef = useRef(day);
  const pendingRef = useRef<DayCounts | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next = pendingRef.current;
    pendingRef.current = null;
    if (!next) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const commit = useCallback(
    (next: DayCounts) => {
      dayRef.current = next;
      setDay(next);
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 250);
    },
    [flush],
  );

  const currentDay = useCallback((): DayCounts => {
    const today = todayKey();
    if (dayRef.current.date === today) return dayRef.current;
    const next = emptyDay(today);
    dayRef.current = next;
    setDay(next);
    pendingRef.current = next;
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
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
        const loaded = normalize(parsed);
        dayRef.current = loaded;
        setDay(loaded);
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
      const target = muridDailyTarget(id);
      if (target == null) return "finished";
      const current = currentDay();
      const count = current.counts[id] ?? 0;
      if (count >= target) return "finished";
      const completed = count + 1;
      commit({ date: current.date, counts: { ...current.counts, [id]: completed } });
      return completed >= target ? "completed" : "counted";
    },
    [commit, currentDay],
  );

  const decrement = useCallback(
    (id: string) => {
      if (muridDailyTarget(id) == null) return;
      const current = currentDay();
      const count = current.counts[id] ?? 0;
      if (count <= 0) return;
      const counts = { ...current.counts };
      if (count === 1) delete counts[id];
      else counts[id] = count - 1;
      commit({ date: current.date, counts });
    },
    [commit, currentDay],
  );

  const toggle = useCallback(
    (id: string) => {
      const target = muridDailyTarget(id);
      if (target == null) return;
      const current = currentDay();
      const count = current.counts[id] ?? 0;
      if (count >= target) {
        const counts = { ...current.counts };
        delete counts[id];
        commit({ date: current.date, counts });
        return;
      }
      commit({ date: current.date, counts: { ...current.counts, [id]: target } });
    },
    [commit, currentDay],
  );

  const setCount = useCallback(
    (id: string, value: number) => {
      const target = muridDailyTarget(id);
      if (target == null || !Number.isFinite(value)) return;
      const current = currentDay();
      const next = Math.min(target, Math.max(0, Math.floor(value)));
      if ((current.counts[id] ?? 0) === next) return;
      const counts = { ...current.counts };
      if (next === 0) delete counts[id];
      else counts[id] = next;
      commit({ date: current.date, counts });
    },
    [commit, currentDay],
  );

  return { ready, counts: day.counts, increment, decrement, toggle, setCount };
}
