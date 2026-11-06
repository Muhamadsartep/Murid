import data from "../data/quran.json";

import type { Strings } from "./i18n";

export type RevelationType = "meccan" | "medinan";

export type Surah = {
  id: number;
  name: string;
  transliteration: string;
  type: RevelationType;
  ayahCount: number;
  verses: string[];
};

export const surahs = data as Surah[];

export function getSurah(id: number): Surah | undefined {
  return surahs.find((surah) => surah.id === id);
}

/** Kurdish surah origin labels: Makkan (مەککی) and Madani (مەدەنی). */
export function revelationLabel(type: RevelationType, t: Strings): string {
  return type === "medinan" ? t.revelation.medinan : t.revelation.meccan;
}

const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g;

/**
 * Fold hamza/ta marbuta variants so search ignores spelling differences. Kurdish letters are
 * folded too, since the tafsir source writes ک as ك and ە as ه + ZWNJ.
 */
export function normalizeArabic(value: string): string {
  return value
    .replace(ARABIC_DIACRITICS, "")
    .replace(/\u200C/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ةە]/g, "ه")
    .replace(/ک/g, "ك")
    .replace(/[ىئی]/g, "ي")
    .replace(/ؤ/g, "و")
    .toLowerCase()
    .trim();
}

function parseSurahId(query: string): number | null {
  let western = "";
  for (const char of query) {
    const indic = "٠١٢٣٤٥٦٧٨٩".indexOf(char);
    if (indic >= 0) western += String(indic);
    else if (char >= "0" && char <= "9") western += char;
    else return null;
  }
  if (!western) return null;
  const id = Number(western);
  return id >= 1 && id <= 114 ? id : null;
}

/** Match a surah by Arabic name, Latin transliteration, or surah number. */
export function filterSurahsByName(list: readonly Surah[], query: string): readonly Surah[] {
  const trimmed = query.trim();
  if (!trimmed) return list;

  const nameQuery = normalizeArabic(trimmed);
  const latinQuery = trimmed.toLowerCase();
  const number = parseSurahId(trimmed);

  return list.filter((surah) => {
    if (number != null && surah.id === number) return true;
    if (nameQuery.length > 0 && normalizeArabic(surah.name).includes(nameQuery)) return true;
    return surah.transliteration.toLowerCase().includes(latinQuery);
  });
}
