import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSurah } from "./quran";

export const QURAN_BOOKMARK_KEY = "zikr-tasbih.quran.bookmark.v1";

export type QuranBookmark = {
  surahId: number;
  ayah: number;
  offsetY: number;
  /** Text width when the offset was captured. Pixel restore is skipped when it changes. */
  width: number;
  /** Pixel offset matches the full surah. Range reads resume by ayah instead. */
  full: boolean;
};

export async function readQuranBookmark(): Promise<QuranBookmark | null> {
  try {
    const raw = await AsyncStorage.getItem(QURAN_BOOKMARK_KEY);
    if (!raw) return null;
    return parseQuranBookmark(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export async function writeQuranBookmark(bookmark: QuranBookmark): Promise<void> {
  await AsyncStorage.setItem(QURAN_BOOKMARK_KEY, JSON.stringify(bookmark));
}

export function parseQuranBookmark(value: unknown): QuranBookmark | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const surahId = record.surahId;
  const ayah = record.ayah;
  const offsetY = record.offsetY;
  const width = record.width;
  const full = record.full;

  if (typeof surahId !== "number" || !Number.isInteger(surahId)) return null;
  const surah = getSurah(surahId);
  if (!surah) return null;
  if (typeof ayah !== "number" || !Number.isInteger(ayah) || ayah < 1 || ayah > surah.ayahCount) return null;
  if (typeof offsetY !== "number" || !Number.isFinite(offsetY) || offsetY < 0) return null;
  if (typeof width !== "number" || !Number.isFinite(width) || width < 0) return null;
  if (typeof full !== "boolean") return null;

  return { surahId, ayah, offsetY, width, full };
}
