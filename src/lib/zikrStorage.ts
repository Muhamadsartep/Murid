import type { Zikr } from "../types/zikr";

export const STORAGE_KEY = "zikr-tasbih.awrad.v1";

export function mergeWithSeed(seed: readonly Zikr[], stored: unknown): Zikr[] {
  const completedById = readCompleted(stored);

  return seed.map((zikr) => {
    const storedCount = completedById?.get(zikr.id);
    const raw = storedCount ?? zikr.completed;
    const completed = clampCompleted(raw, zikr.target);
    return { ...zikr, completed };
  });
}

export function parseStored(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readCompleted(stored: unknown): Map<string, number> | null {
  if (!Array.isArray(stored)) return null;

  const completedById = new Map<string, number>();
  for (const item of stored) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string") continue;
    if (typeof record.completed !== "number" || !Number.isFinite(record.completed)) continue;
    completedById.set(record.id, record.completed);
  }
  return completedById;
}

export function clampCompleted(value: number, target: number): number {
  const whole = Math.floor(value);
  if (whole <= 0) return 0;
  if (whole >= target) return target;
  return whole;
}
