import { todayKey } from "./dates";
import type { Zikr } from "../types/zikr";

export type DayMark = "none" | "partial" | "complete";
export type DayLog = Record<string, number>;
export type DaysMap = Record<string, DayLog>;

export function dayMark(dateKey: string, zikrs: readonly Zikr[], days: DaysMap): DayMark {
  const log = days[dateKey];
  if (!log || zikrs.length === 0) return "none";
  const practiced = zikrs.filter((zikr) => (log[zikr.id] ?? 0) > 0).length;
  if (practiced === 0) return "none";
  if (practiced >= zikrs.length) return "complete";
  return "partial";
}

export function practicedCount(dateKey: string, zikrs: readonly Zikr[], days: DaysMap): number {
  const log = days[dateKey];
  if (!log) return 0;
  return zikrs.filter((zikr) => (log[zikr.id] ?? 0) > 0).length;
}

export function computeStreak(zikrs: readonly Zikr[], days: DaysMap, from = new Date()): number {
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (dayMark(todayKey(cursor), zikrs, days) === "none") {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (streak < 400) {
    if (dayMark(todayKey(cursor), zikrs, days) === "none") break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function bumpDayLog(days: DaysMap, zikrId: string, dateKey: string): DaysMap {
  const log = days[dateKey] ?? {};
  return {
    ...days,
    [dateKey]: { ...log, [zikrId]: (log[zikrId] ?? 0) + 1 },
  };
}

export function monthMarks(
  year: number,
  month: number,
  zikrs: readonly Zikr[],
  days: DaysMap,
): Record<number, DayMark> {
  const last = new Date(year, month + 1, 0).getDate();
  const marks: Record<number, DayMark> = {};
  for (let day = 1; day <= last; day += 1) {
    const key = todayKey(new Date(year, month, day));
    marks[day] = dayMark(key, zikrs, days);
  }
  return marks;
}

export function isSameDay(left: Date, right: Date): boolean {
  return todayKey(left) === todayKey(right);
}
