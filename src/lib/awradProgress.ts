import { awradSurahs } from "./awradSurahs";
import { todayKey } from "./dates";

export const AWRAD_PROGRESS_KEY = "zikr-tasbih.awrad-surahs.v1";

const targets = new Map(awradSurahs.map((item) => [item.id, item.target]));

export type AwradDayProgress = {
  date: string;
  counts: Record<string, number>;
};

export function awradTarget(id: string): number | undefined {
  return targets.get(id);
}

export function emptyAwradDay(date = todayKey()): AwradDayProgress {
  return { date, counts: {} };
}

/** Keep only today's counts, clamped to each item's target. Any other day starts over. */
export function normalizeAwradDay(stored: unknown, date = todayKey()): AwradDayProgress {
  if (!stored || typeof stored !== "object") return emptyAwradDay(date);
  const record = stored as Record<string, unknown>;
  if (record.date !== date || !record.counts || typeof record.counts !== "object") return emptyAwradDay(date);

  const counts: Record<string, number> = {};
  for (const [id, value] of Object.entries(record.counts as Record<string, unknown>)) {
    const target = targets.get(id);
    if (target == null || typeof value !== "number" || !Number.isFinite(value)) continue;
    const count = Math.floor(value);
    if (count > 0) counts[id] = Math.min(target, count);
  }
  return { date, counts };
}
