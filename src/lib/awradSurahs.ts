import raw from "../data/awrad_surahs.json";
import type { Strings } from "./i18n";
import { getSurah } from "./quran";

export type AwradSurah = {
  id: string;
  title: string;
  target: number;
  surahId: number;
  surahName: string;
  ayahCount: number;
  /** Present only for partial passages. */
  range?: { from: number; to: number };
};

type RawAwradSurah = {
  id: string;
  title: string;
  target: number;
  is_full_surah: boolean;
  surah_id: number;
  ayah_from?: number;
  ayah_to?: number;
};

function toAwradSurah(item: RawAwradSurah): AwradSurah | null {
  const surah = getSurah(item.surah_id);
  if (!surah || !Number.isFinite(item.target) || item.target < 1) return null;

  const base = {
    id: item.id,
    title: item.title,
    target: Math.floor(item.target),
    surahId: surah.id,
    surahName: surah.name,
    ayahCount: surah.ayahCount,
  };
  if (item.is_full_surah) return base;

  const from = item.ayah_from ?? 1;
  const to = item.ayah_to ?? from;
  if (from < 1 || to < from || to > surah.ayahCount) return null;
  return { ...base, range: { from, to } };
}

export const awradSurahs: AwradSurah[] = (raw as RawAwradSurah[]).flatMap((item) => {
  const parsed = toAwradSurah(item);
  if (!parsed && __DEV__) {
    console.warn(`awrad_surahs.json: skipped invalid entry "${item.id}"`);
  }
  return parsed ? [parsed] : [];
});

export function awradSubtitle(item: AwradSurah, t: Strings): string {
  if (!item.range) return t.awradSurahs.fullSurah(item.ayahCount);
  const { from, to } = item.range;
  return `${item.surahName} · ${ayahRangeLabel(from, to, t)}`;
}

/** Worded range so bidi reordering can't flip the numbers. */
export function ayahRangeLabel(from: number, to: number, t: Strings): string {
  return from === to ? t.ayah.single(from) : t.ayah.range(from, to);
}
