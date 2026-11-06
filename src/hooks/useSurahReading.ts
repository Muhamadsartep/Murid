import { useCallback, useEffect, useState } from "react";

import { fetchSurahEditions, type SurahEditions } from "../lib/quranTafsir";

export type SurahReadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; arabic: readonly string[]; tafsir: readonly string[] };

/** Surahs already fetched this session, so reopening one does not hit the network again. */
const cache = new Map<number, SurahEditions>();

type Result = { key: string; editions: SurahEditions | null };

export function useSurahReading(surahId: number): { state: SurahReadingState; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${surahId}:${attempt}`;

  useEffect(() => {
    if (surahId <= 0 || cache.has(surahId)) return;
    const controller = new AbortController();
    fetchSurahEditions(surahId, controller.signal)
      .then((editions) => {
        if (controller.signal.aborted) return;
        cache.set(surahId, editions);
        setResult({ key, editions });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, editions: null });
      });
    return () => controller.abort();
  }, [attempt, key, surahId]);

  const retry = useCallback(() => {
    cache.delete(surahId);
    setResult(null);
    setAttempt((count) => count + 1);
  }, [surahId]);

  const cached = cache.get(surahId);
  let state: SurahReadingState;
  if (surahId <= 0) state = { status: "idle" };
  else if (cached) state = { status: "ready", arabic: cached.arabic, tafsir: cached.tafsir };
  else if (result?.key !== key) state = { status: "loading" };
  else if (result.editions) state = { status: "ready", arabic: result.editions.arabic, tafsir: result.editions.tafsir };
  else state = { status: "error" };

  return { state, retry };
}
