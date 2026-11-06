import raw from "../data/daily_azkar.json";

export type AzkarPeriod = "morning" | "evening" | "afterPrayer";

export type DailyZikr = {
  id: string;
  periods: AzkarPeriod[];
  target: number;
  quran: boolean;
  arabic: string;
  kurdish: string;
};

type RawZikr = {
  id: string;
  periods: string[];
  target: number;
  quran: boolean;
  arabic: string;
  kurdish: string;
};

const periods = new Set<AzkarPeriod>(["morning", "evening", "afterPrayer"]);

function toZikr(item: RawZikr): DailyZikr | null {
  if (!item.id || !item.arabic || !item.kurdish) return null;
  if (!Number.isFinite(item.target) || item.target < 1) return null;
  const next = item.periods.filter((period): period is AzkarPeriod => periods.has(period as AzkarPeriod));
  if (next.length === 0) return null;
  return { ...item, periods: next, target: Math.floor(item.target) };
}

export const dailyAzkar: DailyZikr[] = (raw as RawZikr[]).flatMap((item) => {
  const parsed = toZikr(item);
  return parsed ? [parsed] : [];
});

export function azkarFor(period: AzkarPeriod): DailyZikr[] {
  return dailyAzkar.filter((item) => item.periods.includes(period));
}

export function azkarCountKey(period: AzkarPeriod, id: string): string {
  return `${period}:${id}`;
}

export function azkarTarget(key: string): number | undefined {
  const split = key.indexOf(":");
  if (split < 1) return undefined;
  const period = key.slice(0, split);
  const id = key.slice(split + 1);
  if (period !== "morning" && period !== "evening" && period !== "afterPrayer") return undefined;
  return dailyAzkar.find((item) => item.id === id && item.periods.includes(period as AzkarPeriod))?.target;
}
