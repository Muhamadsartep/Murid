import { awradSubtitle, awradSurahs, type AwradSurah } from "./awradSurahs";
import { azkarCountKey, azkarFor, type AzkarPeriod } from "./dailyAzkar";
import type { Language, Strings } from "./i18n";
import { MURID_DAILY, muridTitle } from "./muridDaily";

export type AwradGroupId = "murid" | "afterPrayer" | "morning" | "evening" | "surahs";

/** Which day-scoped store holds the entry's count. */
export type AwradSource = "murid" | "azkar" | "surah";

/** Typeface for the entry text: Quran in the mushaf font, du'a in naskh, plain UI text otherwise. */
export type AwradScript = "quran" | "dua" | "text";

export type AwradEntry = {
  kind: "entry";
  key: string;
  source: AwradSource;
  /** Id of the count in its source store. */
  storeId: string;
  target: number;
  text: string;
  script: AwradScript;
  note?: string;
  /** Set for surah passages, which open in the reader. */
  surah?: AwradSurah;
};

export type AwradHeading = { kind: "heading"; key: string; title: string };

export type AwradRow = AwradEntry | AwradHeading;

export type AwradGroup = {
  id: AwradGroupId;
  title: string;
  rows: AwradRow[];
  entries: AwradEntry[];
};

export const AWRAD_GROUP_IDS: readonly AwradGroupId[] = [
  "murid",
  "afterPrayer",
  "morning",
  "evening",
  "surahs",
];

function muridRows(language: Language): AwradRow[] {
  return MURID_DAILY.map((item): AwradRow => {
    const title = muridTitle(item, language);
    const key = `murid:${item.id}`;
    if (item.kind === "section") return { kind: "heading", key, title };
    if (item.kind === "check") {
      return { kind: "entry", key, source: "murid", storeId: item.id, target: 1, text: title, script: "text" };
    }
    return {
      kind: "entry",
      key,
      source: "murid",
      storeId: item.id,
      target: item.target,
      text: item.arabic ?? title,
      script: item.arabic ? "dua" : "text",
      // Only Kurdish titles add information; the others restate the Arabic.
      note: item.arabic && item.titleAr ? title : undefined,
    };
  });
}

function azkarRows(period: AzkarPeriod): AwradRow[] {
  return azkarFor(period).map((item) => ({
    kind: "entry",
    key: `${period}:${item.id}`,
    source: "azkar",
    storeId: azkarCountKey(period, item.id),
    target: item.target,
    text: item.arabic,
    script: item.quran ? "quran" : "dua",
    note: item.kurdish,
  }));
}

function surahRows(t: Strings): AwradRow[] {
  return awradSurahs.map((item) => ({
    kind: "entry",
    key: `surah:${item.id}`,
    source: "surah",
    storeId: item.id,
    target: item.target,
    text: item.title,
    script: "dua",
    note: awradSubtitle(item, t),
    surah: item,
  }));
}

export function buildAwradGroups(t: Strings, language: Language): AwradGroup[] {
  return AWRAD_GROUP_IDS.map((id) => {
    const rows =
      id === "murid" ? muridRows(language) : id === "surahs" ? surahRows(t) : azkarRows(id);
    return {
      id,
      title: t.daily.groups[id],
      rows,
      entries: rows.filter((row): row is AwradEntry => row.kind === "entry"),
    };
  });
}
